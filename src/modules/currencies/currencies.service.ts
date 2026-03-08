import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../../database/entities/currency.entity.js';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  async findAll(): Promise<Currency[]> {
    return this.currencyRepository.find({ where: { isActive: true } });
  }

  async findByCode(code: string): Promise<Currency | null> {
    return this.currencyRepository.findOne({ where: { code, isActive: true } });
  }

  async findById(id: string): Promise<Currency | null> {
    return this.currencyRepository.findOne({ where: { id } });
  }
}
