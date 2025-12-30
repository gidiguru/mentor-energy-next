import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Create a Neon database connection
// Uses NETLIFY_DATABASE_URL which is automatically set by Netlify's Neon integration
let sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (sql) return sql;

  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Database URL not configured. Please set NETLIFY_DATABASE_URL or DATABASE_URL.');
  }

  sql = neon(databaseUrl);
  return sql;
}

// Helper function to run a query with tagged template literal
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const db = getDb();
  const result = await db(strings, ...values);
  return result as T[];
}

// Helper function to run a query and return a single row
export async function queryOne<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const results = await query<T>(strings, ...values);
  return results[0] || null;
}

// Export the raw SQL function for direct use
export { getDb as sql };
