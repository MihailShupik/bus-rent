import { Pool } from "pg";

/**
 * Universal Postgres connector (works with any FREE external Postgres):
 *  - Neon (neon.tech)          → DATABASE_URL
 *  - Supabase (supabase.com)   → DATABASE_URL / POSTGRES_URL
 *  - Vercel Postgres           → POSTGRES_URL / POSTGRES_URL_NON_POOLING
 *
 * Requires only a `postgresql://` connection string, so the database lives
 * OUTSIDE our server and costs nothing.
 */
let pool: Pool | null = null;

function getConnectionString(): string {
  const vars = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL,
    process.env.SUPABASE_DB_URL,
  ];
  for (const v of vars) {
    if (v && (v.startsWith("postgresql://") || v.startsWith("postgres://"))) {
      return v;
    }
  }
  return "";
}

function getPool(): Pool {
  if (!pool) {
    const connStr = getConnectionString();
    if (!connStr) {
      throw new Error(
        "Database not configured. Add DATABASE_URL (Postgres/Neon/Supabase) to environment variables."
      );
    }
    pool = new Pool({
      connectionString: connStr,
      ssl: /sslmode=require|neon\.tech|supabase/.test(connStr) ? { rejectUnauthorized: false } : false,
      max: 5,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function sql(query: string, params?: any[]): Promise<any[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(query, params || []);
    return result.rows;
  } catch (e: any) {
    console.error("DB error:", e.message);
    throw e;
  } finally {
    client.release();
  }
}

export default sql;
