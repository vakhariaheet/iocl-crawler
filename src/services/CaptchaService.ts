import { logger } from '../utils/logger.js';

export class CaptchaService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000;

  async solveCaptcha(buffer: Buffer): Promise<string | null> {
    try {
      logger.info('Starting captcha solving process');
      const captchaId = await this.initiateCaptchaSolving(buffer);
      return await this.pollCaptchaSolution(captchaId);
    } catch (error) {
      logger.error('Captcha solving process encountered an error', { error });
      return null;
    }
  }

  private async initiateCaptchaSolving(buffer: Buffer): Promise<string> {
    const response = await fetch('https://api.nopecha.com/', {
      method: 'POST',
      body: JSON.stringify({
        type: 'textcaptcha',
        image_data: [buffer.toString('base64')],
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const { data: captchaId } = await response.json();
    logger.info('Captcha ID obtained', { captchaId });
    return captchaId;
  }

  private async pollCaptchaSolution(captchaId: string): Promise<string | null> {
    for (let attempt = 0; attempt < CaptchaService.MAX_ATTEMPTS; attempt++) {
      await new Promise(resolve => 
        setTimeout(resolve, CaptchaService.RETRY_DELAY * (attempt + 1))
      );

      const captchaResponse = await fetch(`https://api.nopecha.com/?id=${captchaId}`);
      const captchaData = await captchaResponse.json();

      if (captchaData.error) {
        logger.warn('Captcha solving attempt failed', { 
          attempt, 
          error: captchaData.error 
        });
        continue;
      }

      const captcha = captchaData.data?.[0];
      if (captcha) {
        logger.info('Captcha solved successfully');
        return captcha;
      }
    }

    logger.error('Failed to solve captcha after multiple attempts');
    return null;
  }
}