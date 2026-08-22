import pg from 'pg';
import { config } from './config.js';
import { logger } from './shared/logger.js';
import { ServiceUnavailableError } from './shared/errors.js';
import { currentTenantScope, tenantScopeIds } from './tenant-context.js';

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
  // La empresa activa manda en las tablas de una sola empresa. La lista añade
  // las que comparten la caja, y solo la leen las tablas del catálogo
  // compartido. Todos los identificadores están validados como UUID, así que
  // ninguno puede cerrar la comilla de la sentencia.
  const scopeIds = tenantScopeIds(scope);
  return `SET LOCAL app.tenant_id = '${tenantId}'; `
    + `SET LOCAL app.tenant_ids = '${scopeIds.join(',')}'`;
}

async function applyScope(client, scope) {
  const statement = scopeStatement(scope);
  if (statement) await client.query(statement);
}

export async function query(text, params = []) {
  const scope = currentTenantScope();
  const statement = scopeStatement(scope);
  if (!statement) return getPool().query(text, params);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await applyScope(client, scope);
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

// Una venta de caja compartida contabiliza a nombre de cada empresa vendedora,
// que no siempre es la empresa activa de la petición. Las políticas leen la
// empresa de la conexión, así que hay que declarar la que corresponde mientras
// dura ese tramo y devolverla como estaba: sin esto, PostgreSQL rechaza el
// asiento de la empresa ajena y la venta entera se cae.
export async function withDeclaredTenant(client, tenantId, work) {
  if (!UUID_PATTERN.test(tenantId || '')) {
    throw new Error('withDeclaredTenant requiere el identificador de una empresa.');
  }
  const scope = currentTenantScope();
  const previous = scope?.tenantId || null;
  const previousIds = tenantScopeIds(scope);
  // Durante el tramo, la empresa declarada es la única con alcance: aunque el
  // trabajo tocara una tabla del catálogo compartido, no vería más que lo suyo.
  await client.query(
    `SET LOCAL app.tenant_id = '${tenantId}'; SET LOCAL app.tenant_ids = '${tenantId}'`,
  );
  try {
    return await work();
  } finally {
    // La cadena vacía deja app_tenant_scope() en NULL, que es el estado sin
    // empresa declarada: ninguna política devuelve filas.
    await client.query(
      previous
        ? `SET LOCAL app.tenant_id = '${previous}'; `
          + `SET LOCAL app.tenant_ids = '${previousIds.join(',')}'`
        : "SET LOCAL app.tenant_id = ''; SET LOCAL app.tenant_ids = ''",
    );
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

// Un trabajo periódico que corre dentro del servidor web se ejecuta una vez por
// instancia. Para el que puede correr en paralelo sin daño —la cola de
// facturación, que reparte trabajo con SKIP LOCKED— eso es rendimiento. Para el
// respaldo o la sincronización de rangos con el proveedor es duplicar trabajo
// caro, así que estos piden turno: quien no lo obtiene, no hace nada.
//
// El cerrojo vive en la sesión, no en la transacción, así que hay que sostener
// la misma conexión mientras dure el trabajo.
export async function withAdvisoryLock(name, work) {
  const client = await getPool().connect();
  try {
    const lock = await client.query(
      'SELECT pg_try_advisory_lock(hashtext($1)) acquired',
      [name],
    );
    if (!lock.rows[0]?.acquired) return { acquired: false, result: null };
    try {
      return { acquired: true, result: await work() };
    } finally {
      await client
        .query('SELECT pg_advisory_unlock(hashtext($1))', [name])
        .catch(() => {});
    }
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
