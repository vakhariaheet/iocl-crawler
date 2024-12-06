import { db } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import * as initialSchema from './001_initial_schema.js';

const migrations = [
  initialSchema
];

async function createMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations() {
  const result = await db.execute('SELECT name FROM migrations');
  return result.rows.map(row => row.name);
}

export async function runMigrations() {
  try {
    await createMigrationsTable();
    const executedMigrations = await getExecutedMigrations();
    
    for (const migration of migrations) {
      const migrationName = '001_initial_schema';
      
      if (!executedMigrations.includes(migrationName)) {
        logger.info(`Running migration: ${migrationName}`);
        await migration.up();
        await db.execute({
          sql: 'INSERT INTO migrations (name) VALUES (?)',
          args: [migrationName]
        })
        logger.info(`Completed migration: ${migrationName}`);
      }
    }
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  }
}
