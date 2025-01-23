import { Client } from '@libsql/client';

export async function up(db: Client): Promise<void> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            cloudinary_url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function down(db: Client): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS reports;');
}