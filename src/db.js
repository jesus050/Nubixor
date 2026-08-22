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

// Una venta de caja compartida contabiliza a nombre de cada empresa vendedora,
// que no siempre es la empresa activa de la petición. Las políticas leen la
// empresa de la conexión, así que hay que declarar la que corresponde mientras
// dura ese tramo y devolverla como estaba: sin esto, PostgreSQL rechaza el
// asiento de la empresa ajena y la venta entera se cae.
export async function withDeclaredTenant(client, tenantId, work) {
  if (!UUID_PATTERN.test(tenantId || '')) {
    throw new Error('withDeclaredTenant requiere el identificador de una empresa.');
  }
  const previous = currentTenantScope()?.tenantId || null;
  await client.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
  try {
    return await work();
  } finally {
    // La cadena vacía deja app_tenant_scope() en NULL, que es el estado sin
    // empresa declarada: ninguna política devuelve filas.
    await client.query(
      previous
        ? `SET LOCAL app.tenant_id = '${previous}'`
        : "SET LOCAL app.tenant_id = ''",
    );
  }
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
