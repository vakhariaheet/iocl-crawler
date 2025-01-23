import { Router } from 'express';
import transactionRoutes from './transaction.routes.js';
import crawlerRoutes from './crawler.routes.js';
import credentialRoutes from './credential.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/transactions', transactionRoutes);
router.use('/crawler', crawlerRoutes);
router.use('/credentials', credentialRoutes);
router.use('/reports', reportRoutes);

export default router;