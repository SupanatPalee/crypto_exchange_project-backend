import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaidOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Payment proof reference (e.g. slip id / url)', example: 'slip-123' })
  paymentProof?: string;
}
