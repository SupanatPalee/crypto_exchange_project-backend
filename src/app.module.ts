import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {
  Currency,
  User,
  Wallet,
  Ad,
  Order,
  Transaction,
  Dispute,
  UserRating,
  RefreshToken,
} from './database/entities/index.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CurrenciesModule } from './modules/currencies/currencies.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WalletsModule } from './modules/wallets/wallets.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { AdsModule } from './modules/ads/ads.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { DisputesModule } from './modules/disputes/disputes.module.js';
import { TransfersModule } from './modules/transfers/transfers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'crypto',
        password: process.env.DB_PASSWORD || 'crypto_secret',
        database: process.env.DB_NAME || 'crypto_exchange',
        entities: [
          Currency,
          User,
          Wallet,
          Ad,
          Order,
          Transaction,
          Dispute,
          UserRating,
          RefreshToken,
        ],
        migrations: [],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    AuthModule,
    CurrenciesModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    AdsModule,
    OrdersModule,
    DisputesModule,
    TransfersModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
