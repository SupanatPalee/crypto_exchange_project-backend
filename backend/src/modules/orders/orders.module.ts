import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity.js';
import { Ad } from '../../database/entities/ad.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { AdsModule } from '../ads/ads.module.js';
import { WalletsModule } from '../wallets/wallets.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Ad]),
    AdsModule,
    WalletsModule,
    TransactionsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
