import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WalletsService } from './wallets.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../database/entities/user.entity.js';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiTags('Wallets')
@ApiBearerAuth('access-token')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my wallets (with currency)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyWallets(@CurrentUser() user: User) {
    return this.walletsService.getWalletsWithCurrency(user.id);
  }

  @Get('by-currency/:currency')
  @ApiOperation({ summary: 'Get my wallet by currency code' })
  @ApiParam({ name: 'currency', example: 'BTC', description: 'Currency code' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Wallet not found for this currency' })
  async getWalletByCurrency(
    @CurrentUser() user: User,
    @Param('currency') currencyCode: string,
  ) {
    const wallet = await this.walletsService.findWalletByUserAndCurrencyCode(
      user.id,
      currencyCode.toUpperCase(),
    );
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this currency');
    }
    return wallet;
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'List transactions for a wallet' })
  @ApiParam({ name: 'id', description: 'Wallet id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWalletTransactions(
    @CurrentUser() user: User,
    @Param('id') walletId: string,
  ) {
    const wallet = await this.walletsService.findOneById(walletId, user.id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return this.transactionsService.findByWalletId(walletId);
  }
}
