import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1730780000000 implements MigrationInterface {
  name = 'CreateInitialSchema1730780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TYPE "currencies_type_enum" AS ENUM('CRYPTO', 'FIAT');
      CREATE TYPE "users_kyc_status_enum" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');
      CREATE TYPE "ads_type_enum" AS ENUM('BUY', 'SELL');
      CREATE TYPE "ads_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'COMPLETED');
      CREATE TYPE "orders_status_enum" AS ENUM('PENDING', 'PAID', 'COMPLETED', 'CANCELLED', 'DISPUTED');
      CREATE TYPE "transactions_type_enum" AS ENUM('DEPOSIT', 'WITHDRAW', 'BUY', 'SELL', 'TRANSFER_IN', 'TRANSFER_OUT');
      CREATE TYPE "transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED');
      CREATE TYPE "disputes_status_enum" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED');
    `);

    await queryRunner.query(`
      CREATE TABLE "currencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "code" varchar(20) NOT NULL,
        "name" varchar(100) NOT NULL,
        "type" "currencies_type_enum" NOT NULL,
        "decimalPlaces" int NOT NULL DEFAULT 8,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_currencies_code" UNIQUE ("code"),
        CONSTRAINT "PK_currencies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "phone" varchar(50),
        "kyc_status" "users_kyc_status_enum" NOT NULL DEFAULT 'PENDING',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "currency_id" uuid NOT NULL,
        "balance" decimal(20,8) NOT NULL DEFAULT 0,
        "locked_balance" decimal(20,8) NOT NULL DEFAULT 0,
        "address" varchar(255),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wallets_currency" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "crypto_id" uuid NOT NULL,
        "fiat_id" uuid NOT NULL,
        "type" "ads_type_enum" NOT NULL,
        "price_per_unit" decimal(20,8) NOT NULL,
        "total_amount" decimal(20,8) NOT NULL,
        "available_amount" decimal(20,8) NOT NULL,
        "min_order_amount" decimal(20,8),
        "max_order_amount" decimal(20,8),
        "payment_method" varchar(100),
        "payment_time_limit" int,
        "terms" text,
        "status" "ads_status_enum" NOT NULL,
        CONSTRAINT "PK_ads" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ads_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ads_crypto" FOREIGN KEY ("crypto_id") REFERENCES "currencies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ads_fiat" FOREIGN KEY ("fiat_id") REFERENCES "currencies"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "ad_id" uuid NOT NULL,
        "buyer_id" uuid NOT NULL,
        "seller_id" uuid NOT NULL,
        "crypto_amount" decimal(20,8) NOT NULL,
        "fiat_amount" decimal(20,8) NOT NULL,
        "price_per_unit" decimal(20,8) NOT NULL,
        "payment_method" varchar(255),
        "payment_proof" varchar(500),
        "status" "orders_status_enum" NOT NULL,
        "paid_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        "expired_at" TIMESTAMP,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_ad" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_buyer" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "wallet_id" uuid NOT NULL,
        "order_id" uuid,
        "type" "transactions_type_enum" NOT NULL,
        "amount" decimal(20,8) NOT NULL,
        "fee" decimal(20,8) NOT NULL DEFAULT 0,
        "balance_before" decimal(20,8),
        "balance_after" decimal(20,8),
        "status" "transactions_status_enum" NOT NULL,
        "tx_hash" varchar(255),
        "external_address" varchar(255),
        "note" text,
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_wallet" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "disputes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL,
        "raised_by" uuid NOT NULL,
        "resolved_by" uuid,
        "reason" text NOT NULL,
        "evidence_url" varchar(500),
        "status" "disputes_status_enum" NOT NULL,
        "resolution" text,
        "resolved_at" TIMESTAMP,
        CONSTRAINT "UQ_disputes_order" UNIQUE ("order_id"),
        CONSTRAINT "PK_disputes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_disputes_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_disputes_raised_by" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_disputes_resolved_by" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL,
        "rated_by" uuid NOT NULL,
        "rated_user" uuid NOT NULL,
        "score" int NOT NULL,
        "comment" text,
        CONSTRAINT "PK_user_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_ratings_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_ratings_rated_by" FOREIGN KEY ("rated_by") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_ratings_rated_user" FOREIGN KEY ("rated_user") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_ratings"`);
    await queryRunner.query(`DROP TABLE "disputes"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "ads"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "currencies"`);
    await queryRunner.query(`DROP TYPE "disputes_status_enum"`);
    await queryRunner.query(`DROP TYPE "transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "ads_status_enum"`);
    await queryRunner.query(`DROP TYPE "ads_type_enum"`);
    await queryRunner.query(`DROP TYPE "users_kyc_status_enum"`);
    await queryRunner.query(`DROP TYPE "currencies_type_enum"`);
  }
}
