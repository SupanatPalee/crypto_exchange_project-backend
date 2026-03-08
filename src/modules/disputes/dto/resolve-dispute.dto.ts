import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveDisputeDto {
  @IsString()
  @ApiProperty({ example: 'Force release to buyer after review' })
  resolution!: string;

  @IsOptional()
  @IsIn(['buyer', 'seller'])
  @ApiPropertyOptional({ enum: ['buyer', 'seller'], example: 'buyer' })
  winner?: 'buyer' | 'seller';
}
