import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponService } from './services/coupon.service';
import { CouponController } from './controllers/coupon.controller';
import { Player } from '../../entities/Player';
import { Reward } from '../../entities/Reward';
import { PlayerCoupon } from '../../entities/PlayerCoupon';
import { Coupon } from '../../entities/Coupon';
@Module({
  imports: [TypeOrmModule.forFeature([Player, Reward, PlayerCoupon, Coupon])],
  providers: [CouponService],
  controllers: [CouponController],
})
export class CouponModule {}
