import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity.js';

export enum CurrencyType {
  CRYPTO = 'CRYPTO',
  FIAT = 'FIAT',
}

@Entity('currencies')
export class Currency extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: CurrencyType;

  @Column({ type: 'int', default: 8 })
  decimalPlaces!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
