import { config } from '../config';
import { runMigrations as runSqliteMigrations } from './sqlite';
import { runMigrations as runPostgresMigrations } from './postgres';

async function migrate() {
  console.log(`Running migrations for ${config.database.type}...`);

  try {
    if (config.database.type === 'sqlite') {
      runSqliteMigrations();
    } else {
      await runPostgresMigrations();
    }
    console.log('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
