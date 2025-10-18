import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default {
  schema: './api/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.SUPABASE_URL 
    ? {
        url: process.env.SUPABASE_URL,
        ssl: { rejectUnauthorized: false }, // Supabase requires SSL
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'photo_validator',
        ssl: false, // Disable SSL for local development
      },
} satisfies Config;
