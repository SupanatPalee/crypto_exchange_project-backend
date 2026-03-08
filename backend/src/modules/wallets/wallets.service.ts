import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity.js';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async findWalletsByUserId(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { userId },
      relations: ['currency'],
      order: { currencyId: 'ASC' },
    });
  }

  /** Get wallets for user with currency relation (for exam: method that fetches related model) */
  async getWalletsWithCurrency(userId: string): Promise<Wallet[]> {
    return this.findWalletsByUserId(userId);
  }

  async findWalletByUserAndCurrency(
    userId: string,
    currencyId: string,
  ): Promise<Wallet | null> {
    return this.walletRepository.findOne({
      where: { userId, currencyId },
      relations: ['currency'],
    });
  }

  async findWalletByUserAndCurrencyCode(
    userId: string,
    currencyCode: string,
  ): Promise<Wallet | null> {
    return this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.currency', 'currency')
      .where('wallet.userId = :userId', { userId })
      .andWhere('currency.code = :code', { code: currencyCode })
      .getOne();
  }

  async create(data: {
    userId: string;
    currencyId: string;
    balance?: string;
    lockedBalance?: string;
  }): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      ...data,
      balance: data.balance ?? '0',
      lockedBalance: data.lockedBalance ?? '0',
    });
    return this.walletRepository.save(wallet);
  }

  async createMany(wallets: Array<{ userId: string; currencyId: string }>): Promise<Wallet[]> {
    const created = this.walletRepository.create(
      wallets.map((w) => ({ ...w, balance: '0', lockedBalance: '0' })),
    );
    return this.walletRepository.save(created);
  }

  async findOneById(id: string, userId?: string): Promise<Wallet | null> {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;
    return this.walletRepository.findOne({
      where,
      relations: ['currency'],
    });
  }

  /**
   * อัปเดต balance และ/หรือ locked_balance (ใช้ใน Escrow, Order release, Transfer).
   * ถ้าใส่ em จะ run ภายใน transaction เดียวกับ caller.
   */
  async updateBalances(
    walletId: string,
    updates: { balance?: string; lockedBalance?: string },
    em?: EntityManager,
  ): Promise<Wallet> {
    const repo = em ? em.getRepository(Wallet) : this.walletRepository;
    const wallet = await repo.findOne({ where: { id: walletId } });
    if (!wallet) throw new Error(`Wallet ${walletId} not found`);
    if (updates.balance !== undefined) wallet.balance = updates.balance;
    if (updates.lockedBalance !== undefined) wallet.lockedBalance = updates.lockedBalance;
    return repo.save(wallet);
  }
}
