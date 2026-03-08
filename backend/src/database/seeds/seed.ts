import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import AppDataSource from '../../config/data-source';
import { Currency, CurrencyType } from '../entities/currency.entity';
import { User, KycStatus } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Ad, AdType, AdStatus } from '../entities/ad.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', type: CurrencyType.CRYPTO, decimalPlaces: 8 },
  { code: 'ETH', name: 'Ethereum', type: CurrencyType.CRYPTO, decimalPlaces: 8 },
  { code: 'XRP', name: 'Ripple', type: CurrencyType.CRYPTO, decimalPlaces: 8 },
  { code: 'DOGE', name: 'Dogecoin', type: CurrencyType.CRYPTO, decimalPlaces: 8 },
  { code: 'THB', name: 'Thai Baht', type: CurrencyType.FIAT, decimalPlaces: 2 },
  { code: 'USD', name: 'US Dollar', type: CurrencyType.FIAT, decimalPlaces: 2 },
];

async function runSeed() {
  const ds = await AppDataSource.initialize();
  try {
    const currencyRepo = ds.getRepository(Currency);
    const userRepo = ds.getRepository(User);
    const walletRepo = ds.getRepository(Wallet);
    const adRepo = ds.getRepository(Ad);
    const orderRepo = ds.getRepository(Order);
    const txRepo = ds.getRepository(Transaction);

    console.log('Seeding currencies...');
    for (const c of CURRENCIES) {
      const existing = await currencyRepo.findOne({ where: { code: c.code } });
      if (!existing) {
        await currencyRepo.save(currencyRepo.create(c));
      }
    }
    const currencies = await currencyRepo.find();
    const btc = currencies.find((c) => c.code === 'BTC')!;
    const eth = currencies.find((c) => c.code === 'ETH')!;
    const thb = currencies.find((c) => c.code === 'THB')!;
    const usd = currencies.find((c) => c.code === 'USD')!;

    console.log('Seeding users...');
    const aliceHash = await bcrypt.hash('alice123', SALT_ROUNDS);
    const bobHash = await bcrypt.hash('bob123', SALT_ROUNDS);
    const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);

    let alice = await userRepo.findOne({ where: { email: 'alice@example.com' } });
    if (!alice) {
      alice = await userRepo.save(
        userRepo.create({
          email: 'alice@example.com',
          passwordHash: aliceHash,
          fullName: 'Alice (Seller)',
          phone: '0811111111',
          kycStatus: KycStatus.VERIFIED,
        }),
      );
    }
    let bob = await userRepo.findOne({ where: { email: 'bob@example.com' } });
    if (!bob) {
      bob = await userRepo.save(
        userRepo.create({
          email: 'bob@example.com',
          passwordHash: bobHash,
          fullName: 'Bob (Buyer)',
          phone: '0822222222',
          kycStatus: KycStatus.VERIFIED,
        }),
      );
    }
    let admin = await userRepo.findOne({ where: { email: 'admin@example.com' } });
    if (!admin) {
      admin = await userRepo.save(
        userRepo.create({
          email: 'admin@example.com',
          passwordHash: adminHash,
          fullName: 'Admin',
          phone: '0833333333',
          kycStatus: KycStatus.VERIFIED,
        }),
      );
    }

    console.log('Seeding wallets (18 = 3 users x 6 currencies)...');
    for (const user of [alice, bob, admin]) {
      for (const curr of currencies) {
        const exists = await walletRepo.findOne({
          where: { userId: user.id, currencyId: curr.id },
        });
        if (!exists) {
          await walletRepo.save(
            walletRepo.create({
              userId: user.id,
              currencyId: curr.id,
              balance: '0',
              lockedBalance: '0',
            }),
          );
        }
      }
    }

    const aliceWallets = await walletRepo.find({
      where: { userId: alice.id },
      relations: ['currency'],
    });
    const bobWallets = await walletRepo.find({
      where: { userId: bob.id },
      relations: ['currency'],
    });
    const aliceBtcWallet = aliceWallets.find((w) => w.currency.code === 'BTC')!;
    const aliceEthWallet = aliceWallets.find((w) => w.currency.code === 'ETH')!;
    const aliceThbWallet = aliceWallets.find((w) => w.currency.code === 'THB')!;
    const bobBtcWallet = bobWallets.find((w) => w.currency.code === 'BTC')!;
    const bobThbWallet = bobWallets.find((w) => w.currency.code === 'THB')!;

    console.log('Seeding ads (Alice sells BTC and ETH)...');
    let adBtc = await adRepo.findOne({
      where: { userId: alice.id, cryptoId: btc.id, type: AdType.SELL },
    });
    if (!adBtc) {
      adBtc = await adRepo.save(
        adRepo.create({
          userId: alice.id,
          cryptoId: btc.id,
          fiatId: thb.id,
          type: AdType.SELL,
          pricePerUnit: '2000000',
          totalAmount: '0.5',
          availableAmount: '0.3',
          minOrderAmount: '0.01',
          maxOrderAmount: '0.2',
          paymentMethod: 'PromptPay',
          paymentTimeLimit: 15,
          terms: 'โอนภายใน 15 นาที',
          status: AdStatus.ACTIVE,
        }),
      );
    }
    let adEth = await adRepo.findOne({
      where: { userId: alice.id, cryptoId: eth.id, type: AdType.SELL },
    });
    if (!adEth) {
      adEth = await adRepo.save(
        adRepo.create({
          userId: alice.id,
          cryptoId: eth.id,
          fiatId: thb.id,
          type: AdType.SELL,
          pricePerUnit: '100000',
          totalAmount: '2',
          availableAmount: '2',
          minOrderAmount: '0.01',
          maxOrderAmount: '1',
          paymentMethod: 'Bank Transfer',
          paymentTimeLimit: 15,
          status: AdStatus.ACTIVE,
        }),
      );
    }

    console.log('Seeding orders and transactions...');
    let order = await orderRepo.findOne({
      where: { buyerId: bob.id, sellerId: alice.id },
    });
    if (!order) {
      order = await orderRepo.save(
        orderRepo.create({
          adId: adBtc.id,
          buyerId: bob.id,
          sellerId: alice.id,
          cryptoAmount: '0.1',
          fiatAmount: '200000',
          pricePerUnit: '2000000',
          paymentMethod: 'PromptPay',
          status: OrderStatus.COMPLETED,
          paidAt: new Date(),
          completedAt: new Date(),
        }),
      );

      await txRepo.save(
        txRepo.create({
          walletId: bobBtcWallet.id,
          orderId: order.id,
          type: TransactionType.BUY,
          amount: '0.1',
          fee: '0',
          balanceBefore: '0',
          balanceAfter: '0.1',
          status: TransactionStatus.COMPLETED,
        }),
      );
      await txRepo.save(
        txRepo.create({
          walletId: aliceBtcWallet.id,
          orderId: order.id,
          type: TransactionType.SELL,
          amount: '0.1',
          fee: '0',
          balanceBefore: '0.5',
          balanceAfter: '0.4',
          status: TransactionStatus.COMPLETED,
        }),
      );
    }

    const depositTx = await txRepo.findOne({
      where: { walletId: aliceThbWallet.id, type: TransactionType.DEPOSIT },
    });
    if (!depositTx) {
      await txRepo.save(
        txRepo.create({
          walletId: aliceThbWallet.id,
          orderId: null,
          type: TransactionType.DEPOSIT,
          amount: '10000',
          fee: '0',
          balanceBefore: '0',
          balanceAfter: '10000',
          status: TransactionStatus.COMPLETED,
          note: 'Seed deposit',
        }),
      );
    }
    const depositTxBob = await txRepo.findOne({
      where: { walletId: bobThbWallet.id, type: TransactionType.DEPOSIT },
    });
    if (!depositTxBob) {
      await txRepo.save(
        txRepo.create({
          walletId: bobThbWallet.id,
          orderId: null,
          type: TransactionType.DEPOSIT,
          amount: '500000',
          fee: '0',
          balanceBefore: '0',
          balanceAfter: '500000',
          status: TransactionStatus.COMPLETED,
          note: 'Seed deposit',
        }),
      );
    }

    console.log('Seed completed.');
  } finally {
    await ds.destroy();
  }
}

runSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
