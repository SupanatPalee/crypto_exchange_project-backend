import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Wallet } from './wallet.entity.js';
import { Order } from './order.entity.js';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId!: string;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId!: string | null;

  @Column({ type: 'varchar', length: 30 })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  fee!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'balance_before' })
  balanceBefore!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'balance_after' })
  balanceAfter!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'tx_hash' })
  txHash!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_address' })
  externalAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @ManyToOne(() => Wallet, (w) => w.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @ManyToOne(() => Order, (o) => o.transactions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;
}
