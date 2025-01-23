import { db } from '../config/database.js';
import { nanoid } from 'nanoid';

export interface Report {
    id: string;
    cloudinary_url: string;
    created_at: string;
}

export class ReportRepository {
    async createReport(cloudinaryUrl: string): Promise<string> {
        const id = nanoid();
        await db.execute({
            sql: 'INSERT INTO reports (id, cloudinary_url) VALUES (?, ?)',
            args: [id, cloudinaryUrl]
        });
        return id;
    }

    async getReportById(id: string): Promise<Report | null> {
        const result = await db.execute({
            sql: 'SELECT * FROM reports WHERE id = ?',
            args: [id]
        }) as any;
        
        return result.rows[0] as Report || null;
    }
}