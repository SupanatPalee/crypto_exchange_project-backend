import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InternalTransferDto {
  @IsString()
  @ApiProperty({ example: 'BTC', description: 'Currency code' })
  currencyCode!: string;

  @IsString()
  @ApiProperty({ example: '0.01', description: 'Amount (decimal string)' })
  amount!: string;

  @IsUUID()
  @ApiProperty({ format: 'uuid', description: 'Recipient user id', example: '00000000-0000-0000-0000-000000000000' })
  recipientUserId!: string;
}
