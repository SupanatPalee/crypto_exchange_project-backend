import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ad } from '../../database/entities/ad.entity.js';
import { AdsService } from './ads.service.js';
import { AdsController } from './ads.controller.js';
import { WalletsModule } from '../wallets/wallets.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ad]), WalletsModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
