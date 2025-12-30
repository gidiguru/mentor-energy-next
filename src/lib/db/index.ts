import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Export schema for use in queries
export * from './schema';

// Create a Neon database connection
// Uses NETLIFY_DATABASE_URL which is automatically set by Netlify's Neon integration
let sql: NeonQueryFunction<false, false> | null = null;
let drizzleDb: NeonHttpDatabase<typeof schema> | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Database URL not configured. Please set NETLIFY_DATABASE_URL or DATABASE_URL.');
  }

  return databaseUrl;
}

/**
 * Get the raw Neon SQL function for template literal queries
 */
export function getDb(): NeonQueryFunction<false, false> {
  if (sql) return sql;
  sql = neon(getDatabaseUrl());
  return sql;
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

// ============================================================================
// LEGACY HELPERS (for backward compatibility)
// ============================================================================

/**
 * Helper function to run a raw query with tagged template literal
 * @deprecated Use db() with Drizzle ORM methods instead
 */
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const sqlFn = getDb();
  const result = await sqlFn(strings, ...values);
  return result as T[];
}

/**
 * Helper function to run a query and return a single row
 * @deprecated Use db() with Drizzle ORM methods instead
 */
export async function queryOne<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const results = await query<T>(strings, ...values);
  return results[0] || null;
}

// Export the raw SQL function for direct use
export { getDb as sql };

// Re-export Drizzle operators for convenient imports
export { eq, and, or, desc, asc, sql as sqlOperator, inArray, isNull, isNotNull, like, ilike, between, gt, gte, lt, lte, ne, notInArray } from 'drizzle-orm';
