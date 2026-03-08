import { Module } from '@nestjs/common';
import { WalletsModule } from '../wallets/wallets.module.js';
import { UsersModule } from '../users/users.module.js';
import { CurrenciesModule } from '../currencies/currencies.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { TransfersService } from './transfers.service.js';
import { TransfersController } from './transfers.controller.js';

@Module({
  imports: [
    WalletsModule,
    UsersModule,
    CurrenciesModule,
    TransactionsModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
