import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ad, AdType, AdStatus } from '../../database/entities/ad.entity.js';
import { WalletsService } from '../wallets/wallets.service.js';
import { CreateAdDto } from './dto/create-ad.dto.js';
import { UpdateAdDto } from './dto/update-ad.dto.js';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Ad)
    private readonly adRepository: Repository<Ad>,
    private readonly walletsService: WalletsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters?: { type?: string; crypto?: string }): Promise<Ad[]> {
    const qb = this.adRepository
      .createQueryBuilder('ad')
      .leftJoinAndSelect('ad.user', 'user')
      .leftJoinAndSelect('ad.crypto', 'crypto')
      .leftJoinAndSelect('ad.fiat', 'fiat')
      .where('ad.status = :status', { status: AdStatus.ACTIVE });
    if (filters?.type) {
      qb.andWhere('ad.type = :type', { type: filters.type });
    }
    if (filters?.crypto) {
      qb.andWhere('crypto.code = :crypto', { crypto: filters.crypto });
    }
    return qb.getMany();
  }

  async findOne(id: string, userId?: string): Promise<Ad | null> {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;
    return this.adRepository.findOne({
      where,
      relations: ['user', 'crypto', 'fiat'],
    });
  }

  /**
   * สร้าง Ad (type SELL = ล็อค balance ใน Escrow ทันที)
   */
  async create(userId: string, dto: CreateAdDto): Promise<Ad> {
    if (dto.type !== AdType.SELL) {
      throw new BadRequestException('Only SELL ads are supported for now');
    }
    const wallet = await this.walletsService.findWalletByUserAndCurrency(
      userId,
      dto.cryptoId,
    );
    if (!wallet) {
      throw new BadRequestException('Wallet not found for this crypto');
    }
    const balanceNum = parseFloat(wallet.balance);
    const amountNum = parseFloat(dto.totalAmount);
    if (balanceNum < amountNum) {
      throw new BadRequestException('Insufficient balance');
    }
    const newBalance = (balanceNum - amountNum).toFixed(8);
    const newLocked = (parseFloat(wallet.lockedBalance) + amountNum).toFixed(8);

    return this.dataSource.transaction(async (em) => {
      const ad = this.adRepository.create({
        userId,
        cryptoId: dto.cryptoId,
        fiatId: dto.fiatId,
        type: dto.type,
        pricePerUnit: dto.pricePerUnit,
        totalAmount: dto.totalAmount,
        availableAmount: dto.totalAmount,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxOrderAmount: dto.maxOrderAmount ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        paymentTimeLimit: dto.paymentTimeLimit ?? null,
        terms: dto.terms ?? null,
        status: AdStatus.ACTIVE,
      });
      const saved = await em.getRepository(Ad).save(ad);
      await this.walletsService.updateBalances(
        wallet.id,
        { balance: newBalance, lockedBalance: newLocked },
        em,
      );
      return saved;
    });
  }

  async update(id: string, userId: string, dto: UpdateAdDto): Promise<Ad> {
    const ad = await this.findOne(id, userId);
    if (!ad) throw new NotFoundException('Ad not found');
    if (ad.status !== AdStatus.ACTIVE) {
      throw new BadRequestException('Can only update ACTIVE ad');
    }
    if (dto.pricePerUnit !== undefined) ad.pricePerUnit = dto.pricePerUnit;
    if (dto.availableAmount !== undefined) ad.availableAmount = dto.availableAmount;
    if (dto.minOrderAmount !== undefined) ad.minOrderAmount = dto.minOrderAmount;
    if (dto.maxOrderAmount !== undefined) ad.maxOrderAmount = dto.maxOrderAmount;
    if (dto.paymentMethod !== undefined) ad.paymentMethod = dto.paymentMethod;
    if (dto.paymentTimeLimit !== undefined) ad.paymentTimeLimit = dto.paymentTimeLimit;
    if (dto.terms !== undefined) ad.terms = dto.terms;
    return this.adRepository.save(ad);
  }

  /**
   * ยกเลิก Ad — อัพเดท status เป็น INACTIVE และคืน locked_balance กลับเป็น balance
   */
  async cancel(id: string, userId: string): Promise<Ad> {
    const ad = await this.adRepository.findOne({
      where: { id, userId },
      relations: ['crypto'],
    });
    if (!ad) throw new NotFoundException('Ad not found');
    if (ad.status !== AdStatus.ACTIVE) {
      throw new BadRequestException('Ad is not active');
    }
    const wallet = await this.walletsService.findWalletByUserAndCurrency(
      userId,
      ad.cryptoId,
    );
    if (!wallet) throw new BadRequestException('Wallet not found');

    const lockedNum = parseFloat(ad.availableAmount);
    const walletBalance = parseFloat(wallet.balance);
    const walletLocked = parseFloat(wallet.lockedBalance);
    const newBalance = (walletBalance + lockedNum).toFixed(8);
    const newLocked = (walletLocked - lockedNum).toFixed(8);
    if (parseFloat(newLocked) < 0) {
      throw new BadRequestException('Locked balance mismatch');
    }

    return this.dataSource.transaction(async (em) => {
      ad.status = AdStatus.INACTIVE;
      ad.availableAmount = '0';
      await em.getRepository(Ad).save(ad);
      await this.walletsService.updateBalances(
        wallet.id,
        { balance: newBalance, lockedBalance: newLocked },
        em,
      );
      return ad;
    });
  }
}
