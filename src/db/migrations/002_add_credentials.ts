import { db } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function up() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    logger.info('Successfully ran migration: 002_add_credentials');
  } catch (error) {
    logger.error('Failed to run migration: 002_add_credentials', { error });
    throw error;
  }
}

export async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS credentials');
    logger.info('Successfully reverted migration: 002_add_credentials');
  } catch (error) {
    logger.error('Failed to revert migration: 002_add_credentials', { error });
    throw error;
  }
}