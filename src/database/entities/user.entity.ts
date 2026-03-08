import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Wallet } from './wallet.entity.js';
import { Ad } from './ad.entity.js';
import { Order } from './order.entity.js';
import { Dispute } from './dispute.entity.js';
import { UserRating } from './user-rating.entity.js';

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 20, default: KycStatus.PENDING, name: 'kyc_status' })
  kycStatus!: KycStatus;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @OneToMany(() => Wallet, (w) => w.user)
  wallets!: Wallet[];

  @OneToMany(() => Ad, (a) => a.user)
  ads!: Ad[];

  @OneToMany(() => Order, (o) => o.buyer)
  ordersAsBuyer!: Order[];

  @OneToMany(() => Order, (o) => o.seller)
  ordersAsSeller!: Order[];

  @OneToMany(() => Dispute, (d) => d.raisedBy)
  disputesRaised!: Dispute[];

  @OneToMany(() => Dispute, (d) => d.resolvedBy)
  disputesResolved!: Dispute[];

  @OneToMany(() => UserRating, (r) => r.ratedBy)
  ratingsGiven!: UserRating[];

  @OneToMany(() => UserRating, (r) => r.ratedUser)
  ratingsReceived!: UserRating[];
}
