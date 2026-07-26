import pg from 'pg';
import { config } from './config.js';
import { logger } from './shared/logger.js';
import { ServiceUnavailableError } from './shared/errors.js';

const { Pool } = pg;
export const pool = config.databaseUrl
  ? new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl
        ? { rejectUnauthorized: config.databaseSslRejectUnauthorized }
        : false,
      max: config.databasePoolMax,
      connectionTimeoutMillis: config.databaseConnectTimeoutMs,
    })
  : null;

pool?.on('error', (error) => {
  logger.error('database.pool_error', {
    errorName: error.name,
    errorCode: error.code,
    message: error.message,
  });
});

export function getPool() {
  if (!pool) {
    throw new ServiceUnavailableError('PostgreSQL no está configurado.', 'DATABASE_NOT_CONFIGURED');
  }
  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function withTransaction(work) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabase() {
  const startedAt = performance.now();
  await query('SELECT 1');
  return { latencyMs: Math.round(performance.now() - startedAt) };
}

export async function closeDatabase() {
  if (pool) await pool.end();
}
