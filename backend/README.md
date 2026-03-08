# Crypto Exchange Backend

Backend สำหรับระบบแลกเปลี่ยน Cryptocurrency แบบ P2P (C2C) — โปรเจกต์ข้อสอบ Backend

## Tech Stack

- **NestJS** (TypeScript) — Web Framework
- **TypeORM** — ORM
- **PostgreSQL** — Database
- **Docker** — รัน PostgreSQL
- **JWT + Passport** — Authentication
- **bcrypt** — Password hashing
- **class-validator** — Request validation

## โครงสร้าง (Clean Architecture)

```
src/
├── config/           # Database & app config
├── common/           # Guards, decorators, constants
├── database/
│   ├── entities/     # TypeORM entities (8 ตาราง)
│   ├── migrations/   # SQL migrations
│   └── seeds/        # Seed data
└── modules/
    ├── auth/         # Register, Login, JWT
    ├── users/
    ├── currencies/
    ├── wallets/      # พร้อม relations (getWalletsWithCurrency)
    ├── transactions/
    ├── ads/
    ├── orders/       # findOrderWithDetails (relations)
    └── disputes/
```

## ขั้นตอนการ Run

### 1. Clone และติดตั้ง

```bash
git clone <repo-url>
cd backend
npm install
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
# แก้ .env ให้ตรงกับ PostgreSQL ที่ใช้ (ดูหัวข้อ "DB User/Password มาจากไหน" ด้านล่าง)
```

#### DB User / Password มาจากไหน (Local vs Production)

| คำถาม | คำตอบ |
|--------|--------|
| **สร้าง DB_USERNAME / DB_PASSWORD ที่ไหน?** | เราไม่ได้สร้างในโปรเจกต์ backend — มันเป็น **user ของ PostgreSQL ตัวนั้น** ถูกสร้างตอน **เริ่มรัน PostgreSQL** (เช่น ตอนรัน Docker container ด้วย `POSTGRES_USER` / `POSTGRES_PASSWORD`) |
| **ขั้นตอนไหน?** | ถ้าใช้ **pgvector (หรือ container เดิม)** = ใช้ user/password ที่ตั้งไว้ตอนรัน container นั้น. ถ้าใช้ **docker-compose ของ backend** = ตั้งใน docker-compose หรือ .env แล้วรัน `docker-compose up -d` (ตัว PostgreSQL จะสร้าง user ตามนั้น) |
| **ทำไมบน local ถึง user เดียวกันทุก DB?** | เพราะใช้ **PostgreSQL ตัวเดียว** (หนึ่ง container) — user หนึ่ง (เช่น `postgres`) เข้าถึงได้ทุก database. แยกกันแค่ **DB_NAME** ต่อโปรเจกต์ (crypto_exchange, langchain_db ฯลฯ). ถ้าอยากแยก user ต่อโปรเจกต์ ต้องสร้าง user ใน PostgreSQL แล้วให้แต่ละโปรเจกต์ใช้คนละ user (ดูด้านล่าง) |
| **Production ใช้ user / รหัสอะไร?** | **ไม่ใช้ `postgres` / รหัสเดียวกับ local.** ควรสร้าง **user เฉพาะแอป** (เช่น `crypto_app`) ให้สิทธิ์แค่ database ที่ใช้ แล้วใช้ **รหัสแข็งแรง (random)** เก็บใน secret (.env ที่ไม่ commit หรือ secrets manager). Host ใช้ของ server จริง (หรือ managed DB เช่น RDS, Cloud SQL) |

**ตัวอย่างสร้าง user เฉพาะสำหรับแอป (ถ้าต้องการแยกจาก postgres):**

```bash
# ใน PostgreSQL (เช่น docker exec -it pgvector psql -U postgres)
CREATE USER crypto_app WITH PASSWORD 'รหัสที่แข็งแรง';
GRANT ALL PRIVILEGES ON DATABASE crypto_exchange TO crypto_app;
\c crypto_exchange
GRANT ALL ON SCHEMA public TO crypto_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO crypto_app;
```

จากนั้นใน `.env` ใช้ `DB_USERNAME=crypto_app` และ `DB_PASSWORD=รหัสที่ตั้งไว้`

#### เมื่อคนอื่น clone โปรเจกต์แล้วรัน docker-compose

| สิ่งที่เกิดขึ้น | รายละเอียด |
|-----------------|------------|
| **สร้าง container ใหม่หรือไม่?** | **ใช่** — รัน `docker-compose up -d` แล้วจะได้ **container ใหม่** ชื่อ `crypto_exchange_db` (image postgres:15-alpine) |
| **User / รหัสใน container ใหม่เป็นอะไร?** | มาจากค่าใน `docker-compose.yml`: ถ้าไม่ใส่ใน .env จะใช้ **default** คือ **user = `crypto`**, **password = `crypto_secret`**, **database = `crypto_exchange`** |
| **เขาต้องตั้ง .env ยังไง?** | ใช้ให้ตรงกับ container ที่เพิ่งรัน: `DB_USERNAME=crypto`, `DB_PASSWORD=crypto_secret`, `DB_NAME=crypto_exchange`, `DB_PORT=5432` (หรือ 5433 ถ้า 5432 ถูกใช้อยู่) — ค่า default ใน `.env.example` สำหรับกรณีรัน docker-compose อยู่แล้ว |
| **อยากเปลี่ยน user/รหัส?** | ใส่ใน `.env` ก่อนรัน docker-compose: `POSTGRES_USER=ชื่อที่ต้องการ`, `POSTGRES_PASSWORD=รหัสที่ต้องการ`, `POSTGRES_DB=crypto_exchange` แล้วใช้ค่าเดียวกันกับ `DB_USERNAME`, `DB_PASSWORD` ใน .env ด้วย |

สรุป: **clone → cp .env.example .env (ไม่ต้องแก้ถ้ารัน docker-compose ตาม default) → docker-compose up -d → npm run migration:run → npm run seed → npm run start:dev**

### 3. รัน PostgreSQL ด้วย Docker

```bash
docker-compose up -d
```

> **หมายเหตุ:** ถ้าพอร์ต 5432 ถูกใช้อยู่แล้ว ให้แก้ `.env` ใช้ `DB_PORT=5433` และใน `docker-compose.yml` กำหนด `ports: ["5433:5432"]` หรือปิดโปรแกรมที่ใช้พอร์ต 5432 ก่อน

### 4. รัน Migration (สร้างตาราง)

```bash
npm run migration:run
```

### 5. ใส่ข้อมูลทดสอบ (Seed)

```bash
npm run seed
```

### 6. รัน Server

```bash
npm run start:dev
```

Server จะรันที่ **http://localhost:3000**

## Auth & Refresh Token

- **Access token** — อายุสั้น (จาก `JWT_EXPIRES_IN` เช่น 15m) ใช้แนบใน Header `Authorization: Bearer <access_token>` เรียก API ที่ต้อง login
- **Refresh token** — อายุยาว (จาก `JWT_REFRESH_EXPIRES_IN` เช่น 7d) เก็บไว้ฝั่ง client ใช้ขอ access token ใหม่เมื่อหมดอายุ
- **Flow:** Login/Register ได้ทั้ง `access_token` และ `refresh_token` → เรียก API ใช้ access_token → หมดอายุแล้วส่ง `refresh_token` ไป `POST /auth/refresh` รับคู่ token ใหม่ (rotation) → Logout ส่ง `refresh_token` ไป `POST /auth/logout` เพื่อเพิกถอน

## API หลัก

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| POST | /auth/register | สมัครสมาชิก (ได้ access_token + refresh_token) |
| POST | /auth/login | Login (ได้ access_token + refresh_token) |
| POST | /auth/refresh | ใช้ refresh_token ขอ access_token + refresh_token ใหม่ (body: `{ "refreshToken": "..." }`) |
| POST | /auth/logout | เพิกถอน refresh_token (body: `{ "refreshToken": "..." }`) |
| GET | /auth/me | ดูข้อมูลตัวเอง (ต้องส่ง Header `Authorization: Bearer <access_token>`) |
| GET | /wallets | ดู Wallet ทั้งหมด (พร้อม currency relation) |
| GET | /wallets/by-currency/:currency | ดู Wallet ตามสกุลเงิน (BTC, THB, ...) |
| GET | /wallets/:id/transactions | ประวัติ Transaction ของ Wallet |
| GET | /ads | ดู Ad ทั้งหมด (public), ?type=SELL&crypto=BTC |
| GET | /orders/:id | ดู Order พร้อม relations (ad, buyer, seller, transactions) |
| GET | /disputes/:id | ดู Dispute |

## ข้อมูล Seed

หลังรัน `npm run seed` จะมี:

- **Currencies:** BTC, ETH, XRP, DOGE, THB, USD
- **Users:** alice@example.com (Seller), bob@example.com (Buyer), admin@example.com — รหัสตามชื่อ: alice123, bob123, admin123
- **Wallets:** 18 ใบ (3 users × 6 currencies)
- **Ads:** Alice ตั้งขาย BTC และ ETH
- **Orders & Transactions:** ตัวอย่าง Order ที่ Bob ซื้อ BTC จาก Alice (COMPLETED)

## ER Diagram

รูปแบบ Entity-Relationship ของฐานข้อมูล (Mermaid — GitHub แสดง diagram ให้อัตโนมัติ):

```mermaid
erDiagram
    users ||--o{ wallets : "has"
    users ||--o{ ads : "creates"
    users ||--o{ orders : "buyer"
    users ||--o{ orders : "seller"
    users ||--o{ disputes : "raised_by"
    users ||--o{ disputes : "resolved_by"
    users ||--o{ user_ratings : "rated_by"
    users ||--o{ user_ratings : "rated_user"

    currencies ||--o{ wallets : "currency"
    currencies ||--o{ ads : "crypto"
    currencies ||--o{ ads : "fiat"

    ads ||--o{ orders : "ad"
    orders ||--o{ transactions : "order"
    orders ||--o| disputes : "order"
    orders ||--o{ user_ratings : "order"

    wallets ||--o{ transactions : "wallet"

    users {
        uuid id PK
        varchar email UK "not null"
        varchar password_hash "not null"
        varchar full_name "not null"
        varchar phone UK
        varchar kyc_status "PENDING,VERIFIED,REJECTED"
        boolean is_active "default true"
        timestamp created_at
        timestamp updated_at
    }

    currencies {
        uuid id PK
        varchar code UK "BTC,ETH,XRP,DOGE,THB,USD"
        varchar name "not null"
        varchar type "CRYPTO,FIAT"
        int decimal_places
        boolean is_active "default true"
    }

    wallets {
        uuid id PK
        uuid user_id FK "not null"
        uuid currency_id FK "not null"
        decimal balance "default 0"
        decimal locked_balance "Escrow, default 0"
        varchar address
        timestamp created_at
        timestamp updated_at
    }

    ads {
        uuid id PK
        uuid user_id FK "not null"
        uuid crypto_id FK "not null"
        uuid fiat_id FK "not null"
        varchar type "BUY,SELL"
        decimal price_per_unit "not null"
        decimal total_amount "not null"
        decimal available_amount "not null"
        decimal min_order_amount
        decimal max_order_amount
        varchar payment_method
        int payment_time_limit
        text terms
        varchar status "ACTIVE,INACTIVE,COMPLETED"
        timestamp created_at
        timestamp updated_at
    }

    orders {
        uuid id PK
        uuid ad_id FK "not null"
        uuid buyer_id FK "not null"
        uuid seller_id FK "not null"
        decimal crypto_amount "not null"
        decimal fiat_amount "not null"
        decimal price_per_unit "not null"
        varchar payment_method
        varchar payment_proof
        varchar status "PENDING,PAID,COMPLETED,CANCELLED,DISPUTED"
        timestamp paid_at
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        uuid id PK
        uuid wallet_id FK "not null"
        uuid order_id FK "nullable"
        varchar type "DEPOSIT,WITHDRAW,BUY,SELL,TRANSFER_IN,OUT"
        decimal amount "not null"
        decimal fee "default 0"
        decimal balance_before
        decimal balance_after
        varchar status "PENDING,COMPLETED,FAILED"
        varchar tx_hash
        varchar external_address
        text note
        timestamp created_at
        timestamp updated_at
    }

    disputes {
        uuid id PK
        uuid order_id FK "not null"
        uuid raised_by FK "not null"
        uuid resolved_by FK "nullable"
        text reason "not null"
        varchar evidence_url
        varchar status "OPEN,UNDER_REVIEW,RESOLVED"
        text resolution
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    user_ratings {
        uuid id PK
        uuid order_id FK "not null"
        uuid rated_by FK "not null"
        uuid rated_user FK "not null"
        int score "1-5"
        text comment
        timestamp created_at
    }
```

## ทดสอบแบบ Flow / Use Case

- **ทดสอบด้วยมือ (Swagger/Postman):** ดูลำดับ flow ใน `docs/test-flows.md` (Flow 1–5 เช่น Login → Me → Wallets, ดู Ads → สร้าง Order → Paid → Release)
- **รัน flow อัตโนมัติ (สั้น):** หลังรัน server แล้วรัน `npm run test:flow` จะยิง Register → Login → Me → Wallets ให้ (ต้องรัน migration + seed ก่อน)

## Scripts

| Script | คำอธิบาย |
|--------|----------|
| npm run start:dev | รันแบบ watch |
| npm run test:flow | รัน flow ทดสอบอัตโนมัติ (Register → Login → Me → Wallets) |
| npm run build | Build โปรเจกต์ |
| npm run migration:run | รัน migrations |
| npm run migration:revert | ยกเลิก migration ล่าสุด |
| npm run seed | ใส่ข้อมูลทดสอบ |
