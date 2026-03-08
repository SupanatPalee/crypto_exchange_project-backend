import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Currency,
  User,
  Wallet,
  Ad,
  Order,
  Transaction,
  Dispute,
  UserRating,
} from './entities/index.js';

const entities = [
  Currency,
  User,
  Wallet,
  Ad,
  Order,
  Transaction,
  Dispute,
  UserRating,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
