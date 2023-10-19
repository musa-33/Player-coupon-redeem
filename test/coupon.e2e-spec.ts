import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { CouponModule } from '../src/modules/coupon/coupon.module';
import { CouponService } from '../src/modules/coupon/services/coupon.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from '../src/typeorm';

describe('CouponController (e2e)', () => {
  let app: INestApplication;
  let couponService: CouponService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [typeorm],
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) =>
            configService.get('typeorm'),
        }),
        CouponModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    couponService = moduleFixture.get<CouponService>(CouponService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/coupon-redeem (POST)', () => {
    it('should return 400 if playerId is missing', async () => {
      const redeemCouponDto = {
        rewardId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);

      expect(response.body.message).toContain(
        'playerId must be a number conforming to the specified constraints',
      );
    });

    it('should return 400 if rewardId is missing', async () => {
      const redeemCouponDto = {
        playerId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);

      expect(response.body.message).toContain(
        'rewardId must be a number conforming to the specified constraints',
      );
    });

    it('should return 400 if playerId is not a number', async () => {
      const redeemCouponDto = {
        playerId: 'invalid',
        rewardId: 1,
      };

      await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);
    });

    it('should return 400 if rewardId is not a number', async () => {
      const redeemCouponDto = {
        playerId: 1,
        rewardId: 'invalid',
      };

      await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);
    });

    it('should return 404 if player is not found', async () => {
      const redeemCouponDto = {
        playerId: 999, // Non-existent player ID
        rewardId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(404);

      expect(response.body.error).toContain('Not Found');
      expect(response.body.message).toContain('Player not found');
    });

    it('should return 404 if reward is not found', async () => {
      const redeemCouponDto = {
        playerId: 1,
        rewardId: 999, // Non-existent reward ID
      };

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(404);

      expect(response.body.error).toContain('Not Found');
      expect(response.body.message).toContain('Reward not found');
    });

    it('should throw 400 if reward is not available', async () => {
      const redeemCouponDto = {
        playerId: 1,
        rewardId: 1,
      };

      jest
        .spyOn(couponService, 'validateRewardAvailability' as any)
        .mockImplementation(async () => {
          throw new BadRequestException('Reward is not available');
        });

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);

      expect(response.body.error).toContain('Bad Request');
      expect(response.body.message).toContain('Reward is not available');
    });

    it('should return 400 if daily limit is exceeded', async () => {
      const redeemCouponDto = {
        playerId: 1,
        rewardId: 1,
      };

      jest
        .spyOn(couponService, 'validateRewardAvailability' as any)
        .mockImplementation(async () => {
          // Implement the validateRewardAvailability method to not throw an exception
        });

      jest
        .spyOn(couponService, 'checkDailyLimit' as any)
        .mockImplementation(() => {
          throw new BadRequestException('Daily limit exceeded');
        });

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);

      expect(response.body.error).toContain('Bad Request');
      expect(response.body.message).toContain('Daily limit exceeded');
    });

    it('should throw 400 if total limit is exceeded', async () => {
      const redeemCouponDto = {
        playerId: 1,
        rewardId: 1,
      };

      jest
        .spyOn(couponService, 'checkDailyLimit' as any)
        .mockImplementation(() => {
          // Implement the checkDailyLimit method to not throw an exception
        });

      jest
        .spyOn(couponService, 'checkTotalLimit' as any)
        .mockImplementation(() => {
          throw new BadRequestException('Total limit exceeded');
        });

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(400);

      expect(response.body.error).toContain('Bad Request');
      expect(response.body.message).toContain('Total limit exceeded');
    });

    it('should redeem a coupon successfully', async () => {
      const redeemCouponDto = {
        playerId: 1,
        rewardId: 1,
      };
      // Mock the necessary dependencies
      jest.spyOn(couponService, 'redeemCoupon' as any).mockResolvedValue({
        id: 1,
        value: '10% off',
      });

      const response = await request(app.getHttpServer())
        .post('/coupon-redeem')
        .send(redeemCouponDto)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('value');
    });
  });
});
