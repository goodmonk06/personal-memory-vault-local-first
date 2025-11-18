import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.database.postgres.host,
    port: config.database.postgres.port,
    database: config.database.postgres.database,
    user: config.database.postgres.user,
    password: config.database.postgres.password,
  });

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function runMigrations(): Promise<void> {
  const pool = getPool();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Note: Postgres schema needs some adjustments from SQLite
  // This is a simplified version - in production, use a migration tool
  const postgresSchema = schema
    .replace(/TEXT PRIMARY KEY/g, 'TEXT PRIMARY KEY')
    .replace(/IF NOT EXISTS memory_items_fts.*?END;/gs, '') // Remove SQLite FTS
    .replace(/CREATE TRIGGER.*?END;/gs, ''); // Remove SQLite triggers

  await pool.query(postgresSchema);

  console.log('✓ PostgreSQL migrations completed');
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}
