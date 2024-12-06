import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { Transaction } from '../types/Transaction.js';

export class TransactionRepository {
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const tx = await db.transaction('write');
      const alreadyInserted = await tx.execute({
        sql:`
        SELECT order_no FROM transactions
        WHERE order_no IN (${transactions.map(() => '?').join(',')})
      `, args: transactions.map(transaction => transaction.orderNo)
      });
      const alreadyInsertedOrderNos = new Set(alreadyInserted.rows.map(row => row.order_no));
      transactions = transactions.filter(transaction => !alreadyInsertedOrderNos.has(transaction.orderNo));
      logger.info('Number of transactions to be saved', { count: transactions.length });
      for (const transaction of transactions) {
        logger.info('Saving transaction', { transaction: transaction });
        
          await tx.execute({sql:`
            INSERT INTO transactions (
              order_no, doc_no, transaction_date, transaction_time,
              tt_no, material, material_name, bill_qty, unit,
              bill_amt, db_cr, comp, doc_type, plant, cca,
              sold_to_party, ship_to_party, company_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, args: [
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
          ]});
        }
      await tx.commit();
      logger.info('Successfully saved transactions', { count: transactions.length });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') { 
        logger.warn('Skipping duplicate transaction', { error });
        return;
      }
      logger.error('Failed to save transactions', { error });
      throw error;
    }
  }

  async getDailyTransactions(date: string): Promise<Transaction[]> {
    try {
      const result = await db.execute({sql:`
        SELECT * FROM transactions 
        WHERE transaction_date = ? 
        AND material_name LIKE '%BENZENE%'
      `,args:[date]});
      
      return result.rows.map(this.mapRowToTransaction);
    } catch (error) {
      logger.error('Failed to get daily transactions', { error, date });
      throw error;
    }
  }

  async getMonthToDateTransactions(startDate: string, endDate: string): Promise<Transaction[]> {
    try {
      const result = await db.execute({
        sql:`
        SELECT * FROM transactions 
        WHERE transaction_date BETWEEN ? AND ?
        AND material_name LIKE '%BENZENE%'
      `,args:[startDate, endDate]});
      
      
      return result.rows.map(this.mapRowToTransaction);
    } catch (error) {
      logger.error('Failed to get month-to-date transactions', { error, startDate, endDate });
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