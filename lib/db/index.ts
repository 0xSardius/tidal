import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

// Singleton — null if DATABASE_URL is not set (app still works, DB calls fail silently)
export const db = createDb();

export type DB = NonNullable<typeof db>;
