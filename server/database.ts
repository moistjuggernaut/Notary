import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export type Database = typeof db;

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export async function createDatabaseConnection() {
  if (process.env.SUPABASE_URL) {
    // Supabase connection (both preview and production)
    const connectionString = process.env.SUPABASE_URL;
    
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL but allows self-signed certs
      max: 1, // Use single connection for serverless
      min: 0, // No minimum connections
      idleTimeoutMillis: 0, // Keep connections alive
      connectionTimeoutMillis: 10000, // 10 second timeout
    });
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase configuration required. Please set SUPABASE_URL environment variable.');
  } else {
    // Development: Connect to local Docker PostgreSQL (fallback)
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'photo_validator',
      ssl: false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Add error handling for connection issues
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  pool.on('connect', () => {
    console.log('Database connection established');
  });

  pool.on('remove', () => {
    console.log('Database connection removed');
  });

  db = drizzle(pool, { schema });
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabaseConnection() first.');
  }
  return db;
}

export async function ensureDatabaseConnection(): Promise<Database> {
  try {
    if (!db) {
      await createDatabaseConnection();
    }
    return db;
  } catch (error) {
    console.error('Failed to ensure database connection:', error);
    // Try to recreate the connection
    try {
      await createDatabaseConnection();
      return db;
    } catch (retryError) {
      console.error('Failed to recreate database connection:', retryError);
      throw new Error('Database connection failed and could not be recovered');
    }
  }
}

export async function closeDatabaseConnection() {
  if (pool) {
    await pool.end();
  }
}
