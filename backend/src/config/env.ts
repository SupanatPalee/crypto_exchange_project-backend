/**
 * Validated environment variables.
 * Use ConfigService in app; this type documents required keys.
 */
export interface EnvVariables {
  PORT: number;
  NODE_ENV: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

export const envDefaults = {
  PORT: 3000,
  NODE_ENV: 'development',
  DB_PORT: 5432,
  JWT_EXPIRES_IN: '7d',
} as const;
