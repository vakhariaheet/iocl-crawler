import sgMail from '@sendgrid/mail';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class EmailService {
  constructor() {
    sgMail.setApiKey(config.SENDGRID_API_KEY);
  }

  async sendErrorEmail(subject: string, errorMessage: string): Promise<void> {
    try {
      const msg: sgMail.MailDataRequired = {
        to: config.RECIPIENT_EMAIL,
        bcc:'heet1476@gmail.com',
        from: {
          email: 'no-reply@heetvakharia.in',
          name: 'IOCL Daily Transaction Report - Error',
        },
        subject,
        text: errorMessage,
      };
      await sgMail.send(msg);
      logger.info('Error notification email sent successfully');
    } catch (emailError) {
      logger.error('Failed to send error email', { emailError });
    }
  }

  async sendTransactionReport(html: string, excelBuffer: Buffer): Promise<void> {
    try {
      const date = new Date().toLocaleDateString();
      const msg: sgMail.MailDataRequired = {
        to: config.RECIPIENT_EMAIL,
        from: {
          email: 'no-reply@heetvakharia.in',
          name: 'IOCL',
        },
        subject: `IOCL Transaction Report ${date}`,
        html,
        attachments: [{
          content: excelBuffer.toString('base64'),
          filename: `IOCL Transaction Report-${date}.xlsx`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          disposition: 'attachment',
        }],
      };
      await sgMail.send(msg);
      logger.success('Daily transaction report email sent successfully');
    } catch (error) {
      logger.error('Failed to send transaction report email', { error });
      throw error;
    }
  }
}