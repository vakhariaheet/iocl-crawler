import cron from 'node-cron';
import { initializeDatabase } from './config/database.js';
import { runMigrations } from './db/migrations/run.js';
import { logger } from './utils/logger.js';
import { BrowserService } from './services/BrowserService.js';
import { EmailService } from './services/EmailService.js';
import { TransactionRepository } from './repositories/TransactionRepository.js';
import { convertJsonToExcel } from './utils/excel.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000;

async function processTransactions(): Promise<void> {
    const browserService = new BrowserService();
    const emailService = new EmailService();
    const transactionRepo = new TransactionRepository();
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
        try {
            logger.info('Starting transaction processing', { attempt: retryCount + 1 });

            await browserService.initialize();
            const transactions = await browserService.scrapeTransactions();
            await transactionRepo.saveTransactions(transactions);
            logger.info('Transactions saved successfully', { count: transactions.length });

            const { buffer: excelBuffer, html } = await convertJsonToExcel(transactions);
              await emailService.sendTransactionReport(html, excelBuffer);

            break;
        } catch (error) {
            console.log(error);
            logger.error('Error in transaction processing', { error, attempt: retryCount + 1 });
              await emailService.sendErrorEmail(
                `Error in IOCL Report Process - Attempt ${retryCount + 1}`,
                `${error}`
              );

            retryCount++;
            if (retryCount < MAX_RETRIES) {
                logger.info('Retrying after delay', { delayMinutes: RETRY_DELAY_MS / 60000 });
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        } finally {
            await browserService.close();
        }
    }

    if (retryCount === MAX_RETRIES) {
        logger.error('Max retries reached. Process failed');
        await emailService.sendErrorEmail('Max retries reached', 'Process completely failed.');
    }
}

async function initialize(): Promise<void> {
    try {
        await initializeDatabase();
        await runMigrations();

        cron.schedule('0 21 * * *', async () => {
            logger.info('Cron job started');
            try {
                await processTransactions();
            } catch (error) {
                logger.error('Error in cron job', { error });
                const emailService = new EmailService();
                await emailService.sendErrorEmail('Cron job error', `${error}`);
            } finally {
                logger.success('Cron job completed');
            }
        }, {
            timezone: 'Asia/Kolkata',
        });

        logger.info('Cron job scheduled');
    } catch (error) {
        logger.error('Failed to initialize application', { error });
        process.exit(1);
    }
}

initialize();