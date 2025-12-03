import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@db:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'nodebook'}`;

export const pool = new Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;
