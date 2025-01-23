import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { DateTime } from 'luxon';
import { CloudinaryService } from './CloudinaryService.js';
import { ReportRepository } from '../repositories/ReportRepository.js';

export class WhatsAppService {
    private readonly phoneId = config.WHATSAPP_PHONE_ID;
    private readonly apiKey = config.WHATSAPP_API_KEY;
    private readonly recipientNumber = config.WHATSAPP_RECIPIENT;
    private readonly cloudinaryService: CloudinaryService;
    private readonly reportRepo: ReportRepository;

    constructor() {
        this.cloudinaryService = new CloudinaryService();
        this.reportRepo = new ReportRepository();
    }

    async sendTransactionReport(aggregatedData: any, excelBuffer: Buffer): Promise<void> {
        try {
            const now = DateTime.now();
            const formattedDateTime = `${now.toFormat('dd LLL yyyy')} ${now.toFormat('hh:mm a')}`;
            const filename = `IOCL_Report_${now.toFormat('dd_MM_yyyy')}`;
            
            // Upload Excel to Cloudinary and save to database
            const excelUrl = await this.cloudinaryService.uploadExcel(excelBuffer, filename);
            const reportId = await this.reportRepo.createReport(excelUrl);
            
            // Calculate totals and percentages
            const total = aggregatedData.reduce((acc, curr) => {
                if (curr.Name !== 'Total') {
                    acc.daily += curr.DAILY;
                    acc.mtd += curr.MTD;
                }
                return acc;
            }, { daily: 0, mtd: 0 });

            // Format daily data
            const dailyText = aggregatedData
                .filter(d => d.Name !== 'Total' && d.DAILY > 0)
                .map(d => {
                    const percentage = ((d.DAILY / total.daily) * 100).toFixed(1);
                    return `${d.Name} ${d.DAILY.toFixed(3)} (${percentage}%)`;
                })
                .join(', ');

            // Format MTD data
            const mtdText = aggregatedData
                .filter(d => d.Name !== 'Total')
                .map(d => {
                    const percentage = ((d.MTD / total.mtd) * 100).toFixed(1);
                    return `${d.Name} ${d.MTD.toFixed(3)} (${percentage}%)`;
                })
                .join(', ');

            const data = {
                to: this.recipientNumber,
                phoneId: this.phoneId,
                templateName: "iocl_v5",
                language: "en",
                variables: {
                    body_1: "Heet Vakharia",
                    body_2: formattedDateTime,
                    body_3: `${dailyText}. Total: ${total.daily.toFixed(3)}`,
                    body_4: `${mtdText}. Total: ${total.mtd.toFixed(3)}`,
                    button_1: reportId
                },
                submissionStatus: true
            };

            const response = await fetch("https://api.zixflow.com/api/v1/campaign/whatsapp/send", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`WhatsApp API responded with status: ${response.status}`);
            }

            const result = await response.json();
            logger.success('WhatsApp notification sent successfully', { result });
        } catch (error) {
            logger.error('Failed to send WhatsApp notification', { error });
        }
    }
}