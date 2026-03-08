import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid', description: 'Ad id', example: '00000000-0000-0000-0000-000000000000' })
  adId!: string;

  @IsString()
  @ApiProperty({ description: 'Crypto amount to buy/sell (decimal string)', example: '0.001' })
  cryptoAmount!: string;
}
