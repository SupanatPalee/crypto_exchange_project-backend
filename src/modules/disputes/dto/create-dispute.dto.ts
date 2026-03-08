import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisputeDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid', description: 'Order id', example: '00000000-0000-0000-0000-000000000000' })
  orderId!: string;

  @IsString()
  @ApiProperty({ example: 'Seller not responding' })
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Evidence URL (optional)', example: 'https://example.com/evidence' })
  evidenceUrl?: string;
}
