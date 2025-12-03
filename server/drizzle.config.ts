import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@db:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'nodebook'}`;

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: dbUrl,
  },
} satisfies Config;
