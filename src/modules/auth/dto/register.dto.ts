import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  @ApiProperty({ example: 'password123' })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Alice Doe' })
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({ example: '0812345678' })
  phone?: string;
}
