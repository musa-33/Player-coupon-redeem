import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../.././../entities/Player';
import { PlayerCoupon } from '../.././../entities/PlayerCoupon';
import { Reward } from '../.././../entities/Reward';
import { Between, Repository } from 'typeorm';
import { Coupon } from '../.././../entities/Coupon';
import { RedeemCouponDto } from '../dtos/redeem-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(PlayerCoupon)
    private readonly playerCouponRepository: Repository<PlayerCoupon>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async redeemCoupon(redeemCouponDto: RedeemCouponDto): Promise<Coupon> {
    const { playerId, rewardId } = redeemCouponDto;

    const player = await this.getPlayer(playerId);
    const reward = await this.getReward(rewardId);

    await this.validateRewardAvailability(reward);

    const currentDate = this.getCurrentDate();
    const nextDay = this.getNextDay(currentDate);

    await this.checkDailyLimit(player, currentDate, nextDay, reward);
    await this.checkTotalLimit(player, reward);

    const coupon = await this.createCoupon(reward);
    await this.createPlayerCoupon(player, coupon);

    return { id: coupon.id, value: coupon.value } as Coupon;
  }

  private async getPlayer(playerId: number): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  private async getReward(rewardId: number): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({
      where: {
        id: rewardId,
      },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    return reward;
  }

  private async validateRewardAvailability(reward: Reward): Promise<void> {
    const currentDate = new Date();
    if (currentDate < reward.startDate || currentDate > reward.endDate) {
      throw new BadRequestException('Reward is not available');
    }
  }

  private getCurrentDate(): Date {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return currentDate;
  }

  private getNextDay(currentDate: Date): Date {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  }

  private async checkDailyLimit(
    player: Player,
    currentDate: Date,
    nextDay: Date,
    reward: Reward,
  ): Promise<void> {
    const redeemedCouponsToday = await this.playerCouponRepository.count({
      where: {
        player,
        redeemedAt: Between(currentDate, nextDay),
      },
    });

    if (redeemedCouponsToday >= reward.perDayLimit) {
      throw new BadRequestException('Daily limit exceeded');
    }
  }

  private async checkTotalLimit(player: Player, reward: Reward): Promise<void> {
    const redeemedCouponsTotal = await this.playerCouponRepository.count({
      where: { player },
    });

    if (redeemedCouponsTotal >= reward.totalLimit) {
      throw new BadRequestException('Total limit exceeded');
    }
  }

  private async createCoupon(reward: Reward): Promise<Coupon> {
    const coupon = new Coupon();
    coupon.value = this.generateUniqueCouponValue();
    coupon.Reward = reward;
    return await this.couponRepository.save(coupon);
  }

  private async createPlayerCoupon(
    player: Player,
    coupon: Coupon,
  ): Promise<PlayerCoupon> {
    const playerCoupon = new PlayerCoupon();
    playerCoupon.player = player;
    playerCoupon.coupon = coupon;
    playerCoupon.redeemedAt = new Date();
    return await this.playerCouponRepository.save(playerCoupon);
  }

  private generateUniqueCouponValue(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
