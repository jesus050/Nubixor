import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './db.js';
import { logger } from './shared/logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../database/migrations');
const files = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith('.sql') && !name.startsWith('._'))
  .sort();

async function runMigrations() {
  const pool = getPool();
  let client;
  let lockAcquired = false;
  try {
    client = await pool.connect();
    await client.query(`SELECT pg_advisory_lock(hashtext('megasuite:migrations'))`);
    lockAcquired = true;
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    for (const name of files) {
      const exists = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (exists.rowCount) {
        logger.info('migration.skipped', { name });
        continue;
      }
      const sql = await fs.readFile(path.join(migrationsDir, name), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        logger.info('migration.applied', { name });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    logger.info('migration.completed', { count: files.length });
  } finally {
    if (client && lockAcquired) {
      await client.query(`SELECT pg_advisory_unlock(hashtext('megasuite:migrations'))`).catch(() => {});
    }
    client?.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  logger.error('migration.failed', {
    errorName: error.name,
    errorCode: error.code,
    message: error.message,
  });
  process.exitCode = 1;
});
