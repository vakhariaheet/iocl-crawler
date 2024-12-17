import { Request, Response } from 'express';
import { CredentialRepository } from '../../repositories/CredentialRepository.js';
import { logger } from '../../utils/logger.js';

export class CredentialController {
  private repository: CredentialRepository;

  constructor() {
    this.repository = new CredentialRepository();
  }

  updateCredentials = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      await this.repository.updateCredentials(username, password);
      res.json({ message: 'Credentials updated successfully' });
    } catch (error) {
      logger.error('Error updating credentials', { error });
      res.status(500).json({ error: 'Failed to update credentials' });
    }
  };
}