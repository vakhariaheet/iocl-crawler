import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';

const router = Router();
const reportController = new ReportController();

router.get('/:id', (req, res) => reportController.getReport(req, res));

export default router;