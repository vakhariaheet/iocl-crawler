import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
    TURSO_DATABASE_URL: z.string(),
    TURSO_AUTH_TOKEN: z.string(),
    SENDGRID_API_KEY: z.string(),
    RECIPIENT_EMAIL: z.string().email(),
    IOCL_USERNAME: z.string(),
    IOCL_PASSWORD: z.string(),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    WHATSAPP_PHONE_ID: z.string(),
    WHATSAPP_API_KEY: z.string(),
    WHATSAPP_RECIPIENT: z.string(),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
});

export const config = configSchema.parse(process.env);