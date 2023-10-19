import { IsNumber } from 'class-validator';

export class RedeemCouponDto {
  @IsNumber()
  playerId: number;

  @IsNumber()
  rewardId: number;
}
