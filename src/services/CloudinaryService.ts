import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: config.CLOUDINARY_CLOUD_NAME,
            api_key: config.CLOUDINARY_API_KEY,
            api_secret: config.CLOUDINARY_API_SECRET
        });
    }

    async uploadExcel(buffer: Buffer, filename: string): Promise<string> {
        try {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'raw',
                        public_id: `excel/${filename}`,
                        format: 'xlsx',
                        type: 'upload',
                        tags: ['iocl', 'excel'],
                        invalidate: true,
                        overwrite: true,
                        transformation: {
                            expires_at: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
                        }
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(buffer);
            }) as UploadApiResponse;

            logger.info('Excel file uploaded to Cloudinary', { 
                filename,
                url: result.secure_url 
            });
            return result.secure_url;
        } catch (error) {
            logger.error('Failed to upload Excel file to Cloudinary', { error });
            throw error;
        }
    }
}