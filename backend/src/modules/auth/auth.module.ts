import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { WalletsModule } from '../wallets/wallets.module.js';
import { CurrenciesModule } from '../currencies/currencies.module.js';
import { RefreshToken } from '../../database/entities/refresh-token.entity.js';

@Module({
  imports: [
    UsersModule,
    WalletsModule,
    CurrenciesModule,
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '15m') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
