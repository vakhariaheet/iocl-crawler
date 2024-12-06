import { db } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function up() {
  try {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS transactions (
        order_no INTEGER PRIMARY KEY,
        doc_no INTEGER NOT NULL,
        transaction_date TEXT NOT NULL,
        transaction_time TEXT NOT NULL,
        tt_no TEXT NOT NULL,
        material INTEGER NOT NULL,
        material_name TEXT NOT NULL,
        bill_qty REAL NOT NULL,
        unit TEXT NOT NULL,
        bill_amt REAL NOT NULL,
        db_cr TEXT NOT NULL,
        comp INTEGER NOT NULL,
        doc_type TEXT NOT NULL,
        plant INTEGER NOT NULL,
        cca TEXT NOT NULL,
        sold_to_party INTEGER NOT NULL,
        ship_to_party INTEGER NOT NULL,
        company_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_transaction_date 
       ON transactions(transaction_date)`,
       
      `CREATE INDEX IF NOT EXISTS idx_material_name 
       ON transactions(material_name)`
    ]);
    
    logger.info('Successfully ran migration: 001_initial_schema');
  } catch (error) {
    logger.error('Failed to run migration: 001_initial_schema', { error });
    throw error;
  }
}

export async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS transactions');
    logger.info('Successfully reverted migration: 001_initial_schema');
  } catch (error) {
    logger.error('Failed to revert migration: 001_initial_schema', { error });
    throw error;
  }
}