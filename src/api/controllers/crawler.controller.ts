import { Request, Response } from 'express';
import { BrowserService } from '../../services/BrowserService.js';
import { EmailService } from '../../services/EmailService.js';
import { TransactionRepository } from '../../repositories/TransactionRepository.js';
import { logger } from '../../utils/logger.js';
import { convertJsonToExcel } from '../../utils/excel.js';
import { WhatsAppService } from '../../services/WhatsAppService.js';

export class CrawlerController {
  private browserService: BrowserService;
  private emailService: EmailService;
  private transactionRepo: TransactionRepository;
  private whatsAppService: WhatsAppService
  constructor() {
    this.browserService = new BrowserService();
    this.emailService = new EmailService();
    this.transactionRepo = new TransactionRepository();
    this.whatsAppService = new WhatsAppService();
      
  }

  runCrawler = async (_req: Request, res: Response) => {
    try {
      res.json({ message: 'Crawling Started Successfully' });
      await this.browserService.initialize();
      const transactions = await this.browserService.scrapeTransactions();
      await this.transactionRepo.saveTransactions(transactions);

      const { buffer: excelBuffer, html,aggregatedData } = await convertJsonToExcel(transactions);
      await this.emailService.sendTransactionReport(html, excelBuffer);
      await this.whatsAppService.sendTransactionReport(aggregatedData,excelBuffer)
     
    } catch (error) {
      logger.error('Error running crawler', { error });
      res.status(500).json({ error: 'Failed to run crawler' });
    } finally {
      await this.browserService.close();
    }
  };

  getCrawlerStatus = async (_req: Request, res: Response) => {
    try {
      // Implement crawler status logic here
      res.json({ status: 'idle' });
    } catch (error) {
      logger.error('Error getting crawler status', { error });
      res.status(500).json({ error: 'Failed to get crawler status' });
    }
  };
}