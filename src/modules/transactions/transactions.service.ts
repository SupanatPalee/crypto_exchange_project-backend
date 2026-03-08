import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../database/entities/transaction.entity.js';

export interface CreateTransactionData {
  walletId: string;
  orderId?: string | null;
  type: TransactionType;
  amount: string;
  fee?: string;
  balanceBefore: string | null;
  balanceAfter: string | null;
  status?: TransactionStatus;
  txHash?: string | null;
  externalAddress?: string | null;
  note?: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    data: CreateTransactionData,
    em?: EntityManager,
  ): Promise<Transaction> {
    const entity = this.transactionRepository.create({
      walletId: data.walletId,
      orderId: data.orderId ?? null,
      type: data.type,
      amount: data.amount,
      fee: data.fee ?? '0',
      balanceBefore: data.balanceBefore,
      balanceAfter: data.balanceAfter,
      status: data.status ?? TransactionStatus.COMPLETED,
      txHash: data.txHash ?? null,
      externalAddress: data.externalAddress ?? null,
      note: data.note ?? null,
    });
    if (em) {
      return em.save(Transaction, entity);
    }
    return this.transactionRepository.save(entity);
  }
}
