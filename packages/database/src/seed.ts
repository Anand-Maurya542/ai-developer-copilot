import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDbPool } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSeeds(): Promise<void> {
  const pool = createDbPool();
  const client = await pool.connect();
  try {
    console.log('[DB] Connecting to database to apply seed data...');
    const seedFile = path.resolve(__dirname, '../seeds/dev_seed.sql');
    if (fs.existsSync(seedFile)) {
      const sql = fs.readFileSync(seedFile, 'utf-8');
      await client.query(sql);
      console.log('[DB] Successfully loaded seed data');
    }
  } catch (error) {
    console.error('[DB] Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds();
}
