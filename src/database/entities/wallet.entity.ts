import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';
import { Currency } from './currency.entity.js';
import { Transaction } from './transaction.entity.js';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'currency_id' })
  currencyId!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  balance!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0, name: 'locked_balance' })
  lockedBalance!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @ManyToOne(() => User, (u) => u.wallets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency;

  @OneToMany(() => Transaction, (t) => t.wallet)
  transactions!: Transaction[];
}
