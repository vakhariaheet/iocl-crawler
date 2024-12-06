import { createClient } from '@libsql/client';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const db = createClient({
  url: config.TURSO_DATABASE_URL,
  authToken: config.TURSO_AUTH_TOKEN,
});

export async function initializeDatabase() {
  try {
    await db.execute('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}