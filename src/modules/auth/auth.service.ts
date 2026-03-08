import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { WalletsService } from '../wallets/wallets.service.js';
import { CurrenciesService } from '../currencies/currencies.service.js';
import { User } from '../../database/entities/user.entity.js';
import { RefreshToken } from '../../database/entities/refresh-token.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const SALT_ROUNDS = 10;
const CURRENCY_CODES = ['BTC', 'ETH', 'XRP', 'DOGE', 'THB', 'USD'];

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly currenciesService: CurrenciesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
    });

    const currencies = await this.currenciesService.findAll();
    const codes = currencies.map((c) => c.code);
    const toCreate = CURRENCY_CODES.filter((code) => codes.includes(code)).map(
      (code) => {
        const c = currencies.find((x) => x.code === code)!;
        return { userId: user.id, currencyId: c.id };
      },
    );
    if (toCreate.length > 0) {
      await this.walletsService.createMany(toCreate);
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const refresh_token = await this.createRefreshToken(user.id);
    return {
      access_token,
      refresh_token,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const refresh_token = await this.createRefreshToken(user.id);
    return {
      access_token,
      refresh_token,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub?: string; type?: string; jti?: string };
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const record = await this.refreshTokenRepo.findOne({
      where: { jti: payload.jti },
    });
    if (!record || record.revokedAt || new Date() > record.expiresAt) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    record.revokedAt = new Date();
    await this.refreshTokenRepo.save(record);

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const newRefreshToken = await this.createRefreshToken(user.id);
    return {
      access_token,
      refresh_token: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.type !== 'refresh' || !payload.jti) {
        return { message: 'Logged out' };
      }
      const record = await this.refreshTokenRepo.findOne({
        where: { jti: payload.jti },
      });
      if (record && !record.revokedAt) {
        record.revokedAt = new Date();
        await this.refreshTokenRepo.save(record);
      }
    } catch {
      // ignore
    }
    return { message: 'Logged out' };
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const jti = uuidv4();
    const expiresInRaw =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.addToNow(expiresInRaw);

    await this.refreshTokenRepo.save({
      userId,
      jti,
      expiresAt,
    });

    return this.jwtService.sign(
      { sub: userId, type: 'refresh', jti },
      { expiresIn: expiresInRaw as StringValue },
    );
  }

  private addToNow(expiresIn: string): Date {
    const match = expiresIn.trim().match(/^(\d+)([smhd])$/);
    if (!match) {
      const sec = parseInt(expiresIn, 10);
      if (!Number.isFinite(sec)) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      return new Date(Date.now() + sec * 1000);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * (multipliers[unit] ?? 86400000));
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
