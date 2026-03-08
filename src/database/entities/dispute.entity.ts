import { Column, Entity, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';
import { Order } from './order.entity.js';

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
}

@Entity('disputes')
export class Dispute extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @Column({ type: 'uuid', name: 'raised_by' })
  raisedById!: string;

  @Column({ type: 'uuid', name: 'resolved_by', nullable: true })
  resolvedById!: string | null;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'evidence_url' })
  evidenceUrl!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: DisputeStatus;

  @Column({ type: 'text', nullable: true })
  resolution!: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt!: Date | null;

  @OneToOne(() => Order, (o) => o.dispute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => User, (u) => u.disputesRaised, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'raised_by' })
  raisedBy!: User;

  @ManyToOne(() => User, (u) => u.disputesResolved, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by' })
  resolvedBy!: User | null;
}
