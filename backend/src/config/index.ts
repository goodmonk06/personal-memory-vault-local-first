import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  database: {
    type: (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres',
    sqlite: {
      path: process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'memory-vault.db'),
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'memory_vault',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    },
  },
};
