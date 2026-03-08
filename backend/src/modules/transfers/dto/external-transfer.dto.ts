import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExternalTransferDto {
  @IsString()
  @ApiProperty({ example: 'BTC', description: 'Currency code' })
  currencyCode!: string;

  @IsString()
  @ApiProperty({ example: '0.01', description: 'Amount (decimal string)' })
  amount!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(255)
  @ApiProperty({ example: 'bc1qexampleaddress...', description: 'External wallet address' })
  externalAddress!: string;
}
