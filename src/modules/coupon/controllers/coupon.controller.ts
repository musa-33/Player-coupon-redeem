import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RedeemCouponDto } from '../dtos/redeem-coupon.dto';
import { Coupon } from '../../../entities/Coupon';
import { CouponService } from '../services/coupon.service';

@Controller()
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('coupon-redeem')
  @HttpCode(200)
  async couponRedeem(
    @Body() redeemCouponDto: RedeemCouponDto,
  ): Promise<Coupon> {
    return await this.couponService.redeemCoupon(redeemCouponDto);
  }
}
