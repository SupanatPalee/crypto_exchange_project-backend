import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';
import { Order } from './order.entity.js';

@Entity('user_ratings')
export class UserRating extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @Column({ type: 'uuid', name: 'rated_by' })
  ratedById!: string;

  @Column({ type: 'uuid', name: 'rated_user' })
  ratedUserId!: string;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @ManyToOne(() => Order, (o) => o.userRatings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => User, (u) => u.ratingsGiven, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rated_by' })
  ratedBy!: User;

  @ManyToOne(() => User, (u) => u.ratingsReceived, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rated_user' })
  ratedUser!: User;
}
