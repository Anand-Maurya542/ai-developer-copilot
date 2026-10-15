import fs from 'node:fs';
import path from 'node:path';
import { createDbPool } from './client';

export async function runMigrations(): Promise<void> {
  const pool = createDbPool();
  const client = await pool.connect();
  try {
    console.log('[DB] Connecting to database to apply migrations...');
    const migrationsDir = path.resolve(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`[DB] Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`[DB] Successfully applied: ${file}`);
    }
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  runMigrations();
}
