import pg from 'pg';

const { Pool } = pg;

export function createDbPool(connectionString?: string): pg.Pool {
  const url = connectionString || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/copilot_dev';
  return new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}
