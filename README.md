# Crypto Exchange Backend

P2P (C2C) cryptocurrency exchange API — NestJS, TypeORM, PostgreSQL.

## Tech Stack

- **NestJS** (TypeScript), **TypeORM**, **PostgreSQL**
- **JWT + Passport** — authentication
- **Docker** — run PostgreSQL

## Project Structure

```
src/
├── config/           Database and app config
├── common/           Guards, decorators
├── database/
│   ├── entities/     TypeORM entities
│   ├── migrations/
│   └── seeds/
└── modules/
    ├── auth/         Register, login, JWT
    ├── users  currencies  wallets  transactions
    ├── ads    orders      disputes
```

## Getting Started

```bash
git clone <repo-url>
cd crypto_exchange_project-backend
npm install
cp .env.example .env
docker-compose up -d
npm run migration:run
npm run seed
npm run start:dev
```

Server: **http://localhost:3000**

Use values from `.env.example` (matches docker-compose: `crypto` / `crypto_secret` / `crypto_exchange`). If port 5432 is in use, set `DB_PORT=5433` and update `ports` in `docker-compose.yml`.

## Auth

- **Access token** — send in header `Authorization: Bearer <token>` for protected endpoints.
- **Refresh token** — exchange at `POST /auth/refresh` with body `{ "refreshToken": "..." }`.

## API Overview

**Swagger:** http://localhost:3000/api

### App
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Health / hello |

### Auth (public: register, login, refresh, logout)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register (returns access_token + refresh_token) |
| POST | /auth/login | Login (returns access_token + refresh_token) |
| POST | /auth/refresh | Issue new tokens with refresh_token (body: `{ "refreshToken": "..." }`) |
| POST | /auth/logout | Revoke refresh_token |
| GET | /auth/me | Current user (Bearer required) |

### Wallets (Bearer required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallets | List my wallets with currency |
| GET | /wallets/by-currency/:currency | My wallet by currency code (e.g. BTC, THB) |
| GET | /wallets/:id/transactions | Transaction history for wallet |

### Ads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ads | List ads, public (?type=SELL&crypto=BTC) |
| GET | /ads/:id | Get ad by id, public |
| POST | /ads | Create ad (Bearer required) |
| PATCH | /ads/:id | Update ad (Bearer required) |
| DELETE | /ads/:id | Cancel ad (Bearer required) |

### Orders (Bearer required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Create order from an ad |
| GET | /orders/:id | Get order with details (ad, buyer, seller, transactions) |
| PATCH | /orders/:id/paid | Mark order as paid (buyer; body: paymentProof) |
| PATCH | /orders/:id/release | Release crypto to buyer (seller) |
| PATCH | /orders/:id/cancel | Cancel order (buyer or seller) |

### Transfers (Bearer required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /transfers/internal | Internal transfer to another user |
| POST | /transfers/external | External withdraw to address |

### Disputes (Bearer required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /disputes | Create dispute for an order |
| GET | /disputes/:id | Get dispute by id |
| PATCH | /disputes/:id/resolve | Resolve dispute (body: resolution, winner) |

## Seed Data

After `npm run seed`:

- **Currencies:** BTC, ETH, XRP, DOGE, THB, USD
- **Users:** alice@example.com, bob@example.com, admin@example.com — passwords: alice123, bob123, admin123
- **Wallets, ads, orders:** sample data for testing

## ER Diagram

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

## Scripts

| Command | Description |
|--------|-------------|
| npm run start:dev | Start dev server (watch) |
| npm run build | Build project |
| npm run migration:run | Run migrations |
| npm run migration:revert | Revert last migration |
| npm run seed | Load seed data |
