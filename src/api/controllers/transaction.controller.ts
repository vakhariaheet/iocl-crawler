import { Request, Response } from 'express';
import { TransactionRepository } from '../../repositories/TransactionRepository.js';
import { logger } from '../../utils/logger.js';

export class TransactionController {
  private repository: TransactionRepository;

  constructor() {
    this.repository = new TransactionRepository();
  }

  getTransactions = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        company,
        material,
        sortBy = 'transaction_date',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      const transactions = await this.repository.findTransactions({
        startDate: startDate as string,
        endDate: endDate as string,
        company: company?.toString().split(",") as string[],
        material: material as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: Number(page),
        limit: Number(limit)
      });

      res.json(transactions);
    } catch (error) {
      console.log(error);
      logger.error('Error fetching transactions', { error });
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  };

  getTransactionsSummary = async (req: Request, res: Response) => {
    try {
      let { startDate, endDate, company } = req.query;
      company = company?.toString().split(",") as string[];
      const summary = await this.repository.getTransactionsSummary({
        startDate: startDate as string,
        endDate: endDate as string,
        company: company as string[]
      });

      res.json(summary);
    } catch (error) {
      logger.error('Error fetching transactions summary', { error });
      res.status(500).json({ error: 'Failed to fetch transactions summary' });
    }
  };
}