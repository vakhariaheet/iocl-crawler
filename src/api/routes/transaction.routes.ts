import { Router } from 'express';
import { query } from 'express-validator';
import { TransactionController } from '../controllers/transaction.controller.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = Router();
const controller = new TransactionController();

router.get('/',
  [
    query('startDate').optional().isString(),
    query('endDate').optional().isString(),
    query('company').optional().isString(),
    query('material').optional().isString(),
    query('sortBy').optional().isIn(['transactionDate', 'billQty', 'billAmt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  controller.getTransactions
);

router.get('/summary',
  [
    query('startDate').optional().isString(),
    query('endDate').optional().isDate(),
    query('company').optional().isString()
  ],
  validateRequest,
  controller.getTransactionsSummary
);

export default router;