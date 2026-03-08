import { IsOptional, IsString, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Price per 1 unit of crypto in fiat (decimal string)', example: '950000' })
  pricePerUnit?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Available crypto amount (decimal string)', example: '0.005' })
  availableAmount?: string;

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
  @ApiPropertyOptional({ description: 'Payment time limit in minutes', example: 30 })
  paymentTimeLimit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Only accept same-bank transfers.' })
  terms?: string;
}
