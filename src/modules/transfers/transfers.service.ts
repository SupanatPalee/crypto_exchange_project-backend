import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionType, TransactionStatus } from '../../database/entities/transaction.entity.js';
import { WalletsService } from '../wallets/wallets.service.js';
import { UsersService } from '../users/users.service.js';
import { CurrenciesService } from '../currencies/currencies.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { InternalTransferDto } from './dto/internal-transfer.dto.js';
import { ExternalTransferDto } from './dto/external-transfer.dto.js';

const WITHDRAW_FEE_RATE = 0.001;

@Injectable()
export class TransfersService {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly usersService: UsersService,
    private readonly currenciesService: CurrenciesService,
    private readonly transactionsService: TransactionsService,
    private readonly dataSource: DataSource,
  ) {}

  async internalTransfer(senderId: string, dto: InternalTransferDto) {
    if (dto.recipientUserId === senderId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }
    const recipient = await this.usersService.findById(dto.recipientUserId);
    if (!recipient) throw new NotFoundException('Recipient not found');
    const currency = await this.currenciesService.findByCode(dto.currencyCode);
    if (!currency) throw new NotFoundException('Currency not found');
    const senderWallet = await this.walletsService.findWalletByUserAndCurrencyCode(
      senderId,
      dto.currencyCode,
    );
    const recipientWallet = await this.walletsService.findWalletByUserAndCurrencyCode(
      dto.recipientUserId,
      dto.currencyCode,
    );
    if (!senderWallet || !recipientWallet) {
      throw new BadRequestException('Wallet not found');
    }
    const amountNum = parseFloat(dto.amount);
    if (amountNum <= 0) throw new BadRequestException('Amount must be positive');
    const senderBalance = parseFloat(senderWallet.balance);
    if (senderBalance < amountNum) {
      throw new BadRequestException('Insufficient balance');
    }
    const senderNewBalance = (senderBalance - amountNum).toFixed(8);
    const recipientBalance = parseFloat(recipientWallet.balance);
    const recipientNewBalance = (recipientBalance + amountNum).toFixed(8);

    await this.dataSource.transaction(async (em) => {
      await this.walletsService.updateBalances(
        senderWallet.id,
        { balance: senderNewBalance },
        em,
      );
      await this.walletsService.updateBalances(
        recipientWallet.id,
        { balance: recipientNewBalance },
        em,
      );
      await this.transactionsService.create(
        {
          walletId: senderWallet.id,
          type: TransactionType.TRANSFER_OUT,
          amount: dto.amount,
          fee: '0',
          balanceBefore: senderWallet.balance,
          balanceAfter: senderNewBalance,
          status: TransactionStatus.COMPLETED,
          note: `Transfer to user ${dto.recipientUserId}`,
        },
        em,
      );
      await this.transactionsService.create(
        {
          walletId: recipientWallet.id,
          type: TransactionType.TRANSFER_IN,
          amount: dto.amount,
          fee: '0',
          balanceBefore: recipientWallet.balance,
          balanceAfter: recipientNewBalance,
          status: TransactionStatus.COMPLETED,
          note: `Transfer from user ${senderId}`,
        },
        em,
      );
    });

    return {
      message: 'Transfer completed',
      amount: dto.amount,
      currency: dto.currencyCode,
      recipientUserId: dto.recipientUserId,
    };
  }

  async externalWithdraw(userId: string, dto: ExternalTransferDto) {
    const currency = await this.currenciesService.findByCode(dto.currencyCode);
    if (!currency) throw new NotFoundException('Currency not found');
    const wallet = await this.walletsService.findWalletByUserAndCurrencyCode(
      userId,
      dto.currencyCode,
    );
    if (!wallet) throw new NotFoundException('Wallet not found');
    const amountNum = parseFloat(dto.amount);
    if (amountNum <= 0) throw new BadRequestException('Amount must be positive');
    const feeNum = amountNum * WITHDRAW_FEE_RATE;
    const total = amountNum + feeNum;
    const balance = parseFloat(wallet.balance);
    if (balance < total) {
      throw new BadRequestException(
        `Insufficient balance (need ${total.toFixed(8)} including fee ${feeNum.toFixed(8)})`,
      );
    }
    const newBalance = (balance - total).toFixed(8);
    const feeStr = feeNum.toFixed(8);
    const txHashMock = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

    await this.dataSource.transaction(async (em) => {
      await this.walletsService.updateBalances(
        wallet.id,
        { balance: newBalance },
        em,
      );
      await this.transactionsService.create(
        {
          walletId: wallet.id,
          type: TransactionType.WITHDRAW,
          amount: dto.amount,
          fee: feeStr,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: TransactionStatus.COMPLETED,
          txHash: txHashMock,
          externalAddress: dto.externalAddress,
          note: 'Withdraw to external address',
        },
        em,
      );
    });

    return {
      message: 'Withdrawal submitted',
      amount: dto.amount,
      fee: feeStr,
      currency: dto.currencyCode,
      externalAddress: dto.externalAddress,
      txHash: txHashMock,
    };
  }
}
