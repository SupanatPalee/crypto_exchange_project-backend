import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';
import { Currency } from './currency.entity.js';
import { Order } from './order.entity.js';

export enum AdType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum AdStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
}

@Entity('ads')
export class Ad extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'crypto_id' })
  cryptoId!: string;

  @Column({ type: 'uuid', name: 'fiat_id' })
  fiatId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: AdType;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'price_per_unit' })
  pricePerUnit!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'total_amount' })
  totalAmount!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'available_amount' })
  availableAmount!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'min_order_amount' })
  minOrderAmount!: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'max_order_amount' })
  maxOrderAmount!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_method' })
  paymentMethod!: string | null;

  @Column({ type: 'int', nullable: true, name: 'payment_time_limit' })
  paymentTimeLimit!: number | null;

  @Column({ type: 'text', nullable: true })
  terms!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: AdStatus;

  @ManyToOne(() => User, (u) => u.ads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'crypto_id' })
  crypto!: Currency;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fiat_id' })
  fiat!: Currency;

  @OneToMany(() => Order, (o) => o.ad)
  orders!: Order[];
}
