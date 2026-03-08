import { Column, Entity, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';
import { Ad } from './ad.entity.js';
import { Transaction } from './transaction.entity.js';
import { Dispute } from './dispute.entity.js';
import { UserRating } from './user-rating.entity.js';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'uuid', name: 'ad_id' })
  adId!: string;

  @Column({ type: 'uuid', name: 'buyer_id' })
  buyerId!: string;

  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'crypto_amount' })
  cryptoAmount!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'fiat_amount' })
  fiatAmount!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'price_per_unit' })
  pricePerUnit!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_method' })
  paymentMethod!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'payment_proof' })
  paymentProof!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: OrderStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt!: Date | null;

  @ManyToOne(() => Ad, (a) => a.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ad_id' })
  ad!: Ad;

  @ManyToOne(() => User, (u) => u.ordersAsBuyer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @ManyToOne(() => User, (u) => u.ordersAsSeller, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @OneToMany(() => Transaction, (t) => t.order)
  transactions!: Transaction[];

  @OneToOne(() => Dispute, (d) => d.order)
  dispute!: Dispute | null;

  @OneToMany(() => UserRating, (r) => r.order)
  userRatings!: UserRating[];
}
