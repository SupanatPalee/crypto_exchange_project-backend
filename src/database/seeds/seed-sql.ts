/**
 * Seed script: clears existing seed users/data then inserts currencies, users,
 * wallets, ads, orders, transactions. Run: npm run seed (or ts-node this file).
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'crypto_exchange',
});

const SEED_EMAILS = ['alice@example.com', 'bob@example.com', 'admin@example.com'] as const;
const SALT_ROUNDS = 10;

const SEED_SUMMARY = {
  alice: { btc: { balance: 1.0, locked: 0.4 }, thb: 50_000 },
  bob: { btc: 0.1, thb: 500_000 },
  ad: { total: 0.5, available: 0.4 },
  order1: { cryptoAmount: 0.1, status: 'COMPLETED' },
};

async function runSeed() {
  await ds.initialize();
  const q = ds.createQueryRunner();
  await q.connect();

  try {
    console.log('Clearing previous seed data...');
    const seedUserIds = await q.query(
      `SELECT id FROM users WHERE email = ANY($1::text[])`,
      [SEED_EMAILS as unknown as string[]],
    );
    const ids = (seedUserIds as { id: string }[]).map((r) => r.id);
    if (ids.length > 0) {
      await q.query(
        `DELETE FROM user_ratings WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ANY($1::uuid[]) OR seller_id = ANY($1::uuid[]))`,
        [ids],
      );
      await q.query(
        `DELETE FROM disputes WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ANY($1::uuid[]) OR seller_id = ANY($1::uuid[]))`,
        [ids],
      );
      await q.query(
        `DELETE FROM transactions WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ANY($1::uuid[]) OR seller_id = ANY($1::uuid[]))`,
        [ids],
      );
      await q.query(
        `DELETE FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ANY($1::uuid[]))`,
        [ids],
      );
      await q.query(`DELETE FROM orders WHERE buyer_id = ANY($1::uuid[]) OR seller_id = ANY($1::uuid[])`, [
        ids,
      ]);
      await q.query(`DELETE FROM ads WHERE user_id = ANY($1::uuid[])`, [ids]);
      await q.query(`DELETE FROM wallets WHERE user_id = ANY($1::uuid[])`, [ids]);
      await q.query(`DELETE FROM refresh_tokens WHERE user_id = ANY($1::uuid[])`, [ids]);
      await q.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [ids]);
    }
    console.log('Cleared.');

    console.log('Seeding currencies...');
    const codes = ['BTC', 'ETH', 'XRP', 'DOGE', 'THB', 'USD'];
    const names = ['Bitcoin', 'Ethereum', 'Ripple', 'Dogecoin', 'Thai Baht', 'US Dollar'];
    const types = ['CRYPTO', 'CRYPTO', 'CRYPTO', 'CRYPTO', 'FIAT', 'FIAT'];
    const decimals = [8, 8, 8, 8, 2, 2];
    const currencyIds: string[] = [];
    for (let i = 0; i < codes.length; i++) {
      const id = crypto.randomUUID();
      await q.query(
        `INSERT INTO currencies (id, "createdAt", "updatedAt", code, name, type, "decimalPlaces", "isActive")
         VALUES ($1, NOW(), NOW(), $2, $3, $4::"currencies_type_enum", $5, true)
         ON CONFLICT (code) DO NOTHING`,
        [id, codes[i], names[i], types[i], decimals[i]],
      );
      const r = await q.query(`SELECT id FROM currencies WHERE code = $1`, [codes[i]]);
      if (r[0]) currencyIds.push((r[0] as { id: string }).id);
    }
    const getCurrencyId = (code: string) => {
      const idx = codes.indexOf(code);
      return idx >= 0 ? currencyIds[idx] : null;
    };
    const btcId = getCurrencyId('BTC');
    const thbId = getCurrencyId('THB');
    if (!btcId || !thbId) throw new Error('Currencies not found');

    console.log('Seeding users...');
    const aliceId = crypto.randomUUID();
    const bobId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    await q.query(
      `INSERT INTO users (id, "createdAt", "updatedAt", email, password_hash, full_name, phone, kyc_status, is_active)
       VALUES ($1, NOW(), NOW(), $2, $3, $4, $5, 'VERIFIED', true),
              ($6, NOW(), NOW(), $7, $8, $9, $10, 'VERIFIED', true),
              ($11, NOW(), NOW(), $12, $13, $14, $15, 'VERIFIED', true)`,
      [
        aliceId,
        'alice@example.com',
        await bcrypt.hash('alice123', SALT_ROUNDS),
        'Alice (Seller)',
        '0811111111',
        bobId,
        'bob@example.com',
        await bcrypt.hash('bob123', SALT_ROUNDS),
        'Bob (Buyer)',
        '0822222222',
        adminId,
        'admin@example.com',
        await bcrypt.hash('admin123', SALT_ROUNDS),
        'Admin',
        '0833333333',
      ],
    );

    console.log('Seeding wallets...');
    const userIds = [aliceId, bobId, adminId];
    for (const uid of userIds) {
      for (const cid of currencyIds) {
        await q.query(
          `INSERT INTO wallets (id, "createdAt", "updatedAt", user_id, currency_id, balance, locked_balance)
           VALUES (gen_random_uuid(), NOW(), NOW(), $1, $2, 0, 0)`,
          [uid, cid],
        );
      }
    }

    const getWalletId = async (userId: string, code: string) => {
      const cid = getCurrencyId(code);
      const r = await q.query(
        `SELECT w.id FROM wallets w JOIN currencies c ON w.currency_id = c.id WHERE w.user_id = $1 AND c.code = $2`,
        [userId, code],
      );
      return (r[0] as { id: string } | undefined)?.id;
    };

    console.log('Seeding ads...');
    const adBtcId = crypto.randomUUID();
    await q.query(
      `INSERT INTO ads (id, "createdAt", "updatedAt", user_id, crypto_id, fiat_id, type, price_per_unit, total_amount, available_amount, min_order_amount, max_order_amount, payment_method, payment_time_limit, terms, status)
       VALUES ($1, NOW(), NOW(), $2, $3, $4, 'SELL', 2000000, $5, $6, 0.01, 0.2, 'PromptPay', 15, 'Transfer within 15 minutes', 'ACTIVE')`,
      [adBtcId, aliceId, btcId, thbId, SEED_SUMMARY.ad.total, SEED_SUMMARY.ad.available],
    );

    console.log('Seeding orders...');
    const orderId = crypto.randomUUID();
    await q.query(
      `INSERT INTO orders (id, "createdAt", "updatedAt", ad_id, buyer_id, seller_id, crypto_amount, fiat_amount, price_per_unit, payment_method, status, paid_at, completed_at)
       VALUES ($1, NOW(), NOW(), $2, $3, $4, $5, 200000, 2000000, 'PromptPay', 'COMPLETED', NOW(), NOW())`,
      [orderId, adBtcId, bobId, aliceId, SEED_SUMMARY.order1.cryptoAmount],
    );

    const aliceBtcW = await getWalletId(aliceId, 'BTC');
    const aliceThbW = await getWalletId(aliceId, 'THB');
    const bobBtcW = await getWalletId(bobId, 'BTC');
    const bobThbW = await getWalletId(bobId, 'THB');
    if (!aliceBtcW || !aliceThbW || !bobBtcW || !bobThbW) throw new Error('Wallets not found');

    console.log('Seeding transactions...');
    await q.query(
      `INSERT INTO transactions (id, "createdAt", "updatedAt", wallet_id, order_id, type, amount, fee, balance_before, balance_after, status, note)
       VALUES (gen_random_uuid(), NOW(), NOW(), $1, NULL, 'DEPOSIT', 1.5, 0, 0, 1.5, 'COMPLETED', 'Seed initial balance')`,
      [aliceBtcW],
    );
    await q.query(
      `INSERT INTO transactions (id, "createdAt", "updatedAt", wallet_id, order_id, type, amount, fee, balance_before, balance_after, status, note)
       VALUES (gen_random_uuid(), NOW(), NOW(), $1, NULL, 'DEPOSIT', $2, 0, 0, $2, 'COMPLETED', 'Seed initial balance')`,
      [aliceThbW, SEED_SUMMARY.alice.thb],
    );
    await q.query(
      `INSERT INTO transactions (id, "createdAt", "updatedAt", wallet_id, order_id, type, amount, fee, balance_before, balance_after, status, note)
       VALUES (gen_random_uuid(), NOW(), NOW(), $1, NULL, 'DEPOSIT', $2, 0, 0, $2, 'COMPLETED', 'Seed initial balance')`,
      [bobThbW, SEED_SUMMARY.bob.thb],
    );
    await q.query(
      `INSERT INTO transactions (id, "createdAt", "updatedAt", wallet_id, order_id, type, amount, fee, balance_before, balance_after, status)
       VALUES (gen_random_uuid(), NOW(), NOW(), $1, $2, 'BUY', 0.1, 0, 0, 0.1, 'COMPLETED')`,
      [bobBtcW, orderId],
    );
    await q.query(
      `INSERT INTO transactions (id, "createdAt", "updatedAt", wallet_id, order_id, type, amount, fee, balance_before, balance_after, status)
       VALUES (gen_random_uuid(), NOW(), NOW(), $1, $2, 'SELL', 0.1, 0, 0.5, 0.4, 'COMPLETED')`,
      [aliceBtcW, orderId],
    );

    await q.query(
      `UPDATE wallets SET balance = $1, locked_balance = $2, "updatedAt" = NOW() WHERE id = $3`,
      [SEED_SUMMARY.alice.btc.balance, SEED_SUMMARY.alice.btc.locked, aliceBtcW],
    );
    await q.query(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [
      SEED_SUMMARY.alice.thb,
      aliceThbW,
    ]);
    await q.query(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [
      SEED_SUMMARY.bob.btc,
      bobBtcW,
    ]);
    await q.query(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [
      SEED_SUMMARY.bob.thb,
      bobThbW,
    ]);

    console.log('Seed completed.');
  } finally {
    await q.release();
    await ds.destroy();
  }
}

runSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
