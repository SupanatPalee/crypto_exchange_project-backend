import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'crypto',
    password: process.env.DB_PASSWORD || 'crypto_secret',
    database: process.env.DB_NAME || 'crypto_exchange',
    autoLoadEntities: true,
    synchronize: false, // use migrations in production
    logging: process.env.NODE_ENV === 'development',
  }),
);
