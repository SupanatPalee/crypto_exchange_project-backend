import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({ example: 'password123' })
  password!: string;
}
