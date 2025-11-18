import Database from 'better-sqlite3';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dbPath = config.database.sqlite.path;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
  db.pragma('foreign_keys = ON');

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function runMigrations(): void {
  const db = getDatabase();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute the entire schema at once
  // SQLite can handle multiple statements in one exec call
  db.exec(schema);

  console.log('✓ SQLite migrations completed');
}
