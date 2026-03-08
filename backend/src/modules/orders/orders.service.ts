import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../../database/entities/order.entity.js';
import { Ad, AdStatus } from '../../database/entities/ad.entity.js';
import {
  TransactionType,
  TransactionStatus,
} from '../../database/entities/transaction.entity.js';
import { AdsService } from '../ads/ads.service.js';
import { WalletsService } from '../wallets/wallets.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

const PAYMENT_MINUTES = 15;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Ad)
    private readonly adRepository: Repository<Ad>,
    private readonly adsService: AdsService,
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
    private readonly dataSource: DataSource,
  ) {}

  async findOrderWithDetails(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['ad', 'ad.crypto', 'ad.fiat', 'buyer', 'seller', 'transactions'],
    });
  }

  async findOne(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['ad', 'buyer', 'seller'],
    });
  }

  async create(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    const ad = await this.adsService.findOne(dto.adId);
    if (!ad) throw new NotFoundException('Ad not found');
    if (ad.status !== AdStatus.ACTIVE) {
      throw new BadRequestException('Ad is not active');
    }
    if (ad.userId === buyerId) {
      throw new BadRequestException('Cannot buy from your own ad');
    }
    const amount = parseFloat(dto.cryptoAmount);
    const available = parseFloat(ad.availableAmount);
    if (amount <= 0 || amount > available) {
      throw new BadRequestException('Invalid or insufficient available amount');
    }
    const pricePerUnit = parseFloat(ad.pricePerUnit);
    const fiatAmount = (amount * pricePerUnit).toFixed(8);
    const expiredAt = new Date(Date.now() + PAYMENT_MINUTES * 60 * 1000);

    const order = this.orderRepository.create({
      adId: ad.id,
      buyerId,
      sellerId: ad.userId,
      cryptoAmount: dto.cryptoAmount,
      fiatAmount,
      pricePerUnit: ad.pricePerUnit,
      paymentMethod: ad.paymentMethod,
      status: OrderStatus.PENDING,
      expiredAt,
    });
    const saved = await this.orderRepository.save(order);
    ad.availableAmount = (available - amount).toFixed(8);
    await this.adRepository.save(ad);
    return saved;
  }

  async markPaid(
    orderId: string,
    buyerId: string,
    paymentProof?: string,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('Only buyer can mark as paid');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not pending');
    }
    if (order.expiredAt && new Date() > order.expiredAt) {
      throw new BadRequestException('Order has expired');
    }
    order.status = OrderStatus.PAID;
    order.paidAt = new Date();
    if (paymentProof) order.paymentProof = paymentProof;
    return this.orderRepository.save(order);
  }

  async release(orderId: string, sellerId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('Only seller can release');
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be PAID to release');
    }

    const sellerWallet = await this.walletsService.findWalletByUserAndCurrency(
      sellerId,
      order.ad.cryptoId,
    );
    const buyerWallet = await this.walletsService.findWalletByUserAndCurrency(
      order.buyerId,
      order.ad.cryptoId,
    );
    if (!sellerWallet || !buyerWallet) {
      throw new BadRequestException('Wallet not found');
    }
    const amount = order.cryptoAmount;
    const sellerLocked = parseFloat(sellerWallet.lockedBalance);
    const sellerBalance = parseFloat(sellerWallet.balance);
    const buyerBalance = parseFloat(buyerWallet.balance);
    const amountNum = parseFloat(amount);
    const sellerNewLocked = (sellerLocked - amountNum).toFixed(8);
    const sellerNewBalance = sellerBalance.toFixed(8);
    const buyerNewBalance = (buyerBalance + amountNum).toFixed(8);

    await this.dataSource.transaction(async (em) => {
      await this.walletsService.updateBalances(
        sellerWallet.id,
        { lockedBalance: sellerNewLocked },
        em,
      );
      await this.walletsService.updateBalances(
        buyerWallet.id,
        { balance: buyerNewBalance },
        em,
      );
      await this.transactionsService.create(
        {
          walletId: sellerWallet.id,
          orderId: order.id,
          type: TransactionType.SELL,
          amount,
          fee: '0',
          balanceBefore: sellerWallet.balance,
          balanceAfter: sellerNewBalance,
          status: TransactionStatus.COMPLETED,
        },
        em,
      );
      await this.transactionsService.create(
        {
          walletId: buyerWallet.id,
          orderId: order.id,
          type: TransactionType.BUY,
          amount,
          fee: '0',
          balanceBefore: buyerWallet.balance,
          balanceAfter: buyerNewBalance,
          status: TransactionStatus.COMPLETED,
        },
        em,
      );
      order.status = OrderStatus.COMPLETED;
      order.completedAt = new Date();
      await em.getRepository(Order).save(order);
    });

    const updated = await this.findOrderWithDetails(orderId);
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }

  async forceReleaseOrder(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be PAID to force release');
    }
    return this.release(orderId, order.sellerId);
  }

  async cancel(orderId: string, userId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Not your order');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only PENDING order can be cancelled');
    }
    const ad = await this.adRepository.findOne({ where: { id: order.adId } });
    if (ad) {
      const available = parseFloat(ad.availableAmount);
      const amount = parseFloat(order.cryptoAmount);
      ad.availableAmount = (available + amount).toFixed(8);
      await this.adRepository.save(ad);
    }
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    return this.orderRepository.save(order);
  }
}
