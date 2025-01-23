import { Browser, chromium } from 'playwright';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { CaptchaService } from './CaptchaService.js';
import { Transaction } from '../types/Transaction.js';
import { companies } from '../constants/companies.js';

export class BrowserService {
  private browser: Browser | null = null;
  private readonly captchaService: CaptchaService;

  constructor() {
    this.captchaService = new CaptchaService();
  }

  async initialize(): Promise<Browser> {
    this.browser = await chromium.launch({
      args: process.platform === 'linux' ? ['--no-sandbox'] : [],
    });
    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeTransactions(): Promise<Transaction[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();
    let captchaBuffer: Buffer | null = null;

    try {
      page.on('response', async (response) => {
        try {

          if (response.url() === 'https://spandan.indianoil.co.in/ioconline/CaptchImage' && response.status() === 200) {
            captchaBuffer = await response?.body();
          }
        } catch (err) {
          console.log('Errorr');
        }
      });

      await page.goto('https://spandan.indianoil.co.in/ioconline/iocExStart.jsp');
      await page.waitForSelector('#captchaImage', { timeout: 10000 });

      if (!captchaBuffer) {
        throw new Error('Captcha buffer not captured');
      }

      const captchaSolution = await this.captchaService.solveCaptcha(captchaBuffer);
      if (!captchaSolution) {
        throw new Error('Failed to solve captcha');
      }

      await this.login(page, captchaSolution);
      return await this.extractTransactions(page);
    } finally {
      await context.close();
    }
  }

  private async login(page: any, captcha: string): Promise<void> {
    await page.fill('input[name="captchaInput"]', captcha);
    await page.fill('input[name="LogId"]', config.IOCL_USERNAME);
    await page.fill('input[name="LogPwd"]', config.IOCL_PASSWORD);
    await page.click('button[type="submit"]');
  }

  private async extractTransactions(page: any): Promise<Transaction[]> {
    await page.goto('https://spandan.indianoil.co.in/ioconline/account/iocExdaily_transaction_process.jsp');
    await page.waitForSelector('table[width="1350"]', { timeout: 10000 });

    const rawTransactions = await this.parseTransactionTable(page);
    return this.processTransactions(rawTransactions);
  }

  private async parseTransactionTable(page: any): Promise<Record<string, string>[]> {
    return await page.evaluate(() => {
      const table = document.querySelector('table[width="1350"]');
      if (!table) return [];

      const headers = Array.from(table.querySelectorAll('tbody:nth-child(1) > tr > td'))
        .map(cell => cell.textContent?.trim() || '');

      return Array.from(table.querySelectorAll('tbody:nth-child(2) > tr')).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.reduce((acc, cell, index) => {
          acc[headers[index]] = cell.textContent?.trim() || '';
          return acc;
        }, {} as Record<string, string>);
      });
    });
  }

  private processTransactions(rawTransactions: Record<string, string>[]): Transaction[] {
    return rawTransactions
      .filter(row => row['Db/Cr'] === 'D')
      .map(row => ({
        orderNo: parseInt(row['Order No'], 10),
        docNo: parseInt(row['Doc. No'], 10),
        transactionDate: row['Tran. Date'],
        transactionTime: row['Tran. Time'],
        ttNo: row['TTNO'],
        material: parseInt(row['Material'], 10),
        materialName: row['Material Name'],
        billQty: parseFloat(row['Bill Qty']),
        unit: row['Unit'],
        billAmt: parseFloat(row['Bill Amt']),
        dbCr: row['Db/Cr'],
        comp: parseInt(row['Comp'], 10),
        docType: row['Doc Type'],
        plant: parseInt(row['Plant'], 10),
        cca: row['CCA'],
        soldToParty: parseInt(row['Sold to Party'], 10),
        shipToParty: parseInt(row['Ship to Party'], 10),
        companyName: companies[parseInt(row['Ship to Party']).toString()],
      }));
  }
}