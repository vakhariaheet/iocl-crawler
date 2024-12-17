import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { Transaction } from '../types/Transaction.js';

interface FindTransactionsOptions {
  startDate?: string;
  endDate?: string;
  company?: string[];
  material?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface TransactionSummary {
  totalQuantity: number;
  totalAmount: number;
  averageQuantity: number;
  averageAmount: number;
  transactionCount: number;
}

export class TransactionRepository {
  async findTransactions(options: FindTransactionsOptions): Promise<{ data: Transaction[]; total: number }> {
    try {
      let query = 'SELECT * FROM transactions WHERE 1=1';
      const args: any[] = [];

      if (options.startDate) {
        query += ' AND transaction_date >= ?';
        args.push(options.startDate);
      }

      if (options.endDate) {
        query += ' AND transaction_date <= ?';
        args.push(options.endDate);
      }

      if (options.company && options.company.length > 0) {
        query += ` AND company_name IN ("${options.company.join('","')}")`;
        
      }

      if (options.material) {
        query += ' AND material_name LIKE ?';
        args.push(`%${options.material}%`);
      }

      // Get total count
      const countResult = await db.execute({
        sql: query.replace('SELECT *', 'SELECT COUNT(*) as total'),
        args
      });
      const total = countResult.rows[0].total as number;

      // Add sorting and pagination
      query += ` ORDER BY ${options.sortBy || 'transaction_date'} ${options.sortOrder || 'desc'}`;
      query += ' LIMIT ? OFFSET ?';
      args.push(options.limit || 10);
      args.push(((options.page || 1) - 1) * (options.limit || 10));
      logger.info('Querying transactions', { query, args });
      const result = await db.execute({ sql: query, args });
      
      return {
        data: result.rows.map(this.mapRowToTransaction),
        total
      };
    } catch (error) {
      logger.error('Failed to find transactions', { error });
      throw error;
    }
  }

  async getTransactionsSummary(options: Pick<FindTransactionsOptions, 'startDate' | 'endDate' | 'company'>): Promise<TransactionSummary> {
    try {
      let query = `
        SELECT 
          COUNT(*) as count,
          SUM(bill_qty) as total_qty,
          AVG(bill_qty) as avg_qty,
          SUM(bill_amt) as total_amt,
          AVG(bill_amt) as avg_amt
        FROM transactions 
        WHERE 1=1
      `;
      const args: any[] = [];

      if (options.startDate) {
        query += ' AND transaction_date >= ?';
        args.push(options.startDate);
      }

      if (options.endDate) {
        query += ' AND transaction_date <= ?';
        args.push(options.endDate);
      }

      if (options.company) {
        query += ' AND company_name LIKE ?';
        args.push(`%${options.company}%`);
      }

      const result = await db.execute({ sql: query, args });
      const row = result.rows[0];

      return {
        totalQuantity: row.total_qty as number || 0,
        totalAmount: row.total_amt as number || 0,
        averageQuantity: row.avg_qty as number || 0,
        averageAmount: row.avg_amt as number || 0,
        transactionCount: row.count as number || 0
      };
    } catch (error) {
      logger.error('Failed to get transactions summary', { error });
      throw error;
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const tx = await db.transaction('write');
      const alreadyInserted = await tx.execute({
        sql: `
          SELECT order_no FROM transactions
          WHERE order_no IN (${transactions.map(() => '?').join(',')})
        `,
        args: transactions.map(transaction => transaction.orderNo)
      });
      
      const alreadyInsertedOrderNos = new Set(alreadyInserted.rows.map(row => row.order_no));
      transactions = transactions.filter(transaction => !alreadyInsertedOrderNos.has(transaction.orderNo));
      
      for (const transaction of transactions) {
        await tx.execute({
          sql: `
            INSERT INTO transactions (
              order_no, doc_no, transaction_date, transaction_time,
              tt_no, material, material_name, bill_qty, unit,
              bill_amt, db_cr, comp, doc_type, plant, cca,
              sold_to_party, ship_to_party, company_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            transaction.orderNo,
            transaction.docNo,
            transaction.transactionDate,
            transaction.transactionTime,
            transaction.ttNo,
            transaction.material,
            transaction.materialName,
            transaction.billQty,
            transaction.unit,
            transaction.billAmt,
            transaction.dbCr,
            transaction.comp || 0,
            transaction.docType,
            transaction.plant,
            transaction.cca,
            transaction.soldToParty,
            transaction.shipToParty,
            transaction.companyName || ''
          ]
        });
      }
      
      await tx.commit();
      logger.info('Successfully saved transactions', { count: transactions.length });
    } catch (error) {
      logger.error('Failed to save transactions', { error });
      throw error;
    }
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      orderNo: row.order_no,
      docNo: row.doc_no,
      transactionDate: row.transaction_date,
      transactionTime: row.transaction_time,
      ttNo: row.tt_no,
      material: row.material,
      materialName: row.material_name,
      billQty: row.bill_qty,
      unit: row.unit,
      billAmt: row.bill_amt,
      dbCr: row.db_cr,
      comp: row.comp,
      docType: row.doc_type,
      plant: row.plant,
      cca: row.cca,
      soldToParty: row.sold_to_party,
      shipToParty: row.ship_to_party,
      companyName: row.company_name
    };
  }
}