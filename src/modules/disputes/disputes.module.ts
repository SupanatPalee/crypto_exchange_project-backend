import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from '../../database/entities/dispute.entity.js';
import { Order } from '../../database/entities/order.entity.js';
import { DisputesService } from './disputes.service.js';
import { DisputesController } from './disputes.controller.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Dispute, Order]), OrdersModule],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
