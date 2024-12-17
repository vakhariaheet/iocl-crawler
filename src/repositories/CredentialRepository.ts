import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class CredentialRepository {
  async updateCredentials(username: string, password: string): Promise<void> {
    try {
      const tx = await db.transaction('write');
      
      // Deactivate all existing credentials
      await tx.execute(`
        UPDATE credentials 
        SET is_active = false 
        WHERE is_active = true
      `);
      
      // Insert new credentials
      await tx.execute({
        sql: `
          INSERT INTO credentials (username, password) 
          VALUES (?, ?)
        `,
        args: [username, password]
      });
      
      await tx.commit();
      logger.info('Credentials updated successfully');
    } catch (error) {
      logger.error('Failed to update credentials', { error });
      throw error;
    }
  }

  async getActiveCredentials() {
    try {
      const result = await db.execute(`
        SELECT username, password 
        FROM credentials 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get active credentials', { error });
      throw error;
    }
  }
}