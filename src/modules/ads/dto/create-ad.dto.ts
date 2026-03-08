import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdType } from '../../../database/entities/ad.entity.js';

export class CreateAdDto {
  @IsEnum(AdType)
  @ApiProperty({ enum: AdType, example: AdType.SELL })
  type!: AdType;

  @IsUUID()
  @ApiProperty({ format: 'uuid', description: 'Crypto currency id', example: '00000000-0000-0000-0000-000000000000' })
  cryptoId!: string;

  @IsUUID()
  @ApiProperty({ format: 'uuid', description: 'Fiat currency id', example: '00000000-0000-0000-0000-000000000000' })
  fiatId!: string;

  @IsString()
  @ApiProperty({ description: 'Price per 1 unit of crypto in fiat (decimal string)', example: '1000000' })
  pricePerUnit!: string;

  @IsString()
  @ApiProperty({ description: 'Total crypto amount to buy/sell (decimal string)', example: '0.01' })
  totalAmount!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Minimum crypto amount per order (decimal string)', example: '0.001' })
  minOrderAmount?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Maximum crypto amount per order (decimal string)', example: '0.01' })
  maxOrderAmount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'BANK_TRANSFER' })
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Payment time limit in minutes', example: 15 })
  paymentTimeLimit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Send payment within 15 minutes.' })
  terms?: string;
}
