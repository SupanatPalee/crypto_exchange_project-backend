import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'crypto',
  password: process.env.DB_PASSWORD || 'crypto_secret',
  database: process.env.DB_NAME || 'crypto_exchange',
  entities: [], // ไม่โหลด entities ตอนรัน migration (ใช้แค่ไฟล์ migration)
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;
