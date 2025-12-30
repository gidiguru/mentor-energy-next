import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Export schema for use in queries
export * from './schema';

// Create a Neon database connection
// Uses NETLIFY_DATABASE_URL which is automatically set by Netlify's Neon integration
let drizzleDb: NeonHttpDatabase<typeof schema> | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Database URL not configured. Please set NETLIFY_DATABASE_URL or DATABASE_URL.');
  }

  return databaseUrl;
}

/**
 * Get the Drizzle ORM instance for type-safe queries
 */
export function db(): NeonHttpDatabase<typeof schema> {
  if (drizzleDb) return drizzleDb;
  const client = neon(getDatabaseUrl());
  drizzleDb = drizzle(client, { schema });
  return drizzleDb;
}

// Re-export Drizzle operators for convenient imports
export { eq, and, or, desc, asc, sql as sqlOperator, inArray, isNull, isNotNull, like, ilike, between, gt, gte, lt, lte, ne, notInArray } from 'drizzle-orm';
