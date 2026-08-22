import pg from 'pg';
import { config } from './config.js';
import { logger } from './shared/logger.js';
import { ServiceUnavailableError } from './shared/errors.js';
import { currentTenantScope } from './tenant-context.js';

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

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

// Las políticas de aislamiento leen la empresa desde la conexión. Se declara
// con SET LOCAL para que muera al terminar la transacción y no se filtre a la
// siguiente petición que reciba esta conexión del pool.
function scopeStatement(scope) {
  if (scope?.bypassIsolation) {
    return "SET LOCAL app.bypass_tenant_isolation = 'on'";
  }
  const tenantId = scope?.tenantId;
  if (!tenantId) return null;
  if (!UUID_PATTERN.test(tenantId)) {
    // Un identificador con otra forma nunca debe llegar a la sentencia: sin
    // empresa declarada las políticas no devuelven filas, que es el lado
    // seguro del error.
    return null;
  }
  return `SET LOCAL app.tenant_id = '${tenantId}'`;
}

async function applyScope(client, scope) {
  const statement = scopeStatement(scope);
  if (statement) await client.query(statement);
}

export async function query(text, params = []) {
  const scope = currentTenantScope();
  const statement = scopeStatement(scope);
  // Sin empresa que declarar no hace falta transacción: la consulta va directa.
  if (!statement) return getPool().query(text, params);
  const client = await getPool().connect();
  try {
    await client.query(`BEGIN; ${statement}`);
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function withTransaction(work) {
  const scope = currentTenantScope();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await applyScope(client, scope);
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

// PostgreSQL nunca aplica las políticas de aislamiento a un superusuario ni a un
// rol con BYPASSRLS, ni siquiera con FORCE ROW LEVEL SECURITY. La imagen oficial
// crea al usuario principal como superusuario, así que es fácil quedarse con las
// políticas puestas y sin efecto: esto lo hace visible en vez de silencioso.
export async function checkTenantIsolationEnforcement() {
  if (!pool) return { enforced: false, reason: 'DATABASE_NOT_CONFIGURED' };
  const result = await query(
    'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
  );
  const role = result.rows[0];
  if (!role) return { enforced: false, reason: 'ROLE_NOT_FOUND' };
  if (role.rolsuper) return { enforced: false, reason: 'ROLE_IS_SUPERUSER' };
  if (role.rolbypassrls) return { enforced: false, reason: 'ROLE_BYPASSES_RLS' };
  return { enforced: true, reason: null };
}
