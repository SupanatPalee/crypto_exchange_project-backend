import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../../database/entities/wallet.entity.js';
import { WalletsService } from './wallets.service.js';
import { WalletsController } from './wallets.controller.js';
import { TransactionsModule } from '../transactions/transactions.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet]), TransactionsModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
