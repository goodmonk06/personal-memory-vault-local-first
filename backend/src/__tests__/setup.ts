import { beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Test database path
const testDbPath = path.join(__dirname, '../../test-data/test.db');

beforeAll(() => {
  // Create test data directory
  const testDataDir = path.dirname(testDbPath);
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_TYPE = 'sqlite';
  process.env.SQLITE_DB_PATH = testDbPath;
  process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
});

beforeEach(() => {
  // Clean up test database before each test
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  // Remove WAL and SHM files if they exist
  ['.db-wal', '.db-shm'].forEach((ext) => {
    const file = testDbPath.replace('.db', ext);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});

afterAll(() => {
  // Clean up test database after all tests
  const testDataDir = path.dirname(testDbPath);
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
});
