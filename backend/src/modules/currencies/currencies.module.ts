import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from '../../database/entities/currency.entity.js';
import { CurrenciesService } from './currencies.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  providers: [CurrenciesService],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
