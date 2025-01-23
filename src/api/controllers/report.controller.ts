import { Request, Response } from 'express';
import { ReportRepository } from '../../repositories/ReportRepository.js';
import { logger } from '../../utils/logger.js';

export class ReportController {
    private reportRepo: ReportRepository;

    constructor() {
        this.reportRepo = new ReportRepository();
    }

    async getReport(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const report = await this.reportRepo.getReportById(id);

            if (!report) {
                res.status(404).json({ error: 'Report not found' });
                return;
            }

            res.redirect(report.cloudinary_url);
        } catch (error) {
            logger.error('Error fetching report', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}