import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { bootstrapTenantAccess, SELF_GUARDED_API_PREFIXES } from '../src/authorization.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

// El guardián de sesión sólo confía en el hash del token, así que la prueba
// crea la sesión igual que el login y manda la misma cookie.
const SESSION_COOKIE = 'megasuite_session';
const digest = (value) => createHash('sha256').update(value).digest('hex');

// Rutas montadas antes del guardián de sesión, y las que verifican membresía
// contra el dueño del recurso en lugar de la empresa activa.
const OUT_OF_SCOPE = ['/api/health', '/api/auth', ...SELF_GUARDED_API_PREFIXES];

function mountPath(layer) {
  if (layer.regexp?.fast_slash) return '';
  const match = layer.regexp?.source?.match(/^\^\\\/(.*)\\\/\?\(\?=/);
  return match ? `/${match[1].replace(/\\\//g, '/').replace(/\\\./g, '.')}` : '';
}

function collectRoutes(stack, base, found) {
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        found.push({ method: method.toUpperCase(), path: base + layer.route.path });
      }
    } else if (layer.name === 'router' && layer.handle?.stack) {
      collectRoutes(layer.handle.stack, base + mountPath(layer), found);
    }
  }
}

// Sólo lecturas sin parámetros: son las que se pueden pedir tal cual, y la
// fuga que importa aquí es leer los datos de otra empresa.
function readableRoutes(app) {
  const found = [];
  collectRoutes(app._router.stack, '', found);
  return found.filter((route) =>
    route.method === 'GET' &&
    route.path.startsWith('/api/') &&
    !route.path.includes(':') &&
    !OUT_OF_SCOPE.some((prefix) => route.path.startsWith(prefix)));
}

async function createCompany(pool, name) {
  const id = randomUUID();
  await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [id, name]);
  return id;
}

async function purgeCompany(pool, tenantId) {
  const cleanup = await pool.connect();
  try {
    await cleanup.query("SET session_replication_role = 'replica'");
    const owned = await cleanup.query(`
      SELECT columns.table_name, columns.column_name
      FROM information_schema.columns columns
      JOIN information_schema.tables tables
        ON tables.table_schema = columns.table_schema
       AND tables.table_name = columns.table_name
      WHERE columns.table_schema = 'public'
        AND tables.table_type = 'BASE TABLE'
        AND columns.column_name IN ('tenant_id', 'company_id')
        AND columns.data_type = 'uuid'
    `);
    for (const row of owned.rows) {
      await cleanup.query(
        `DELETE FROM "${row.table_name}" WHERE "${row.column_name}" = $1`,
        [tenantId],
      );
    }
    await cleanup.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
  } finally {
    await cleanup.query("SET session_replication_role = 'origin'").catch(() => {});
    cleanup.release();
  }
}

test('un usuario no puede leer los datos de una empresa a la que no pertenece', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  const userId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  let propia = null;
  let ajena = null;
  try {
    await pool.query(
      `INSERT INTO users(id, email, full_name, status)
       VALUES($1,$2,'Dueño de una sola empresa','ACTIVE')`,
      [userId, `aislamiento-${userId}@example.test`],
    );
    await pool.query(
      `INSERT INTO auth_sessions(user_id, token_hash, csrf_token_hash, expires_at)
       VALUES($1,$2,$3, now() + interval '1 hour')`,
      [userId, digest(token), digest(randomUUID())],
    );

    propia = await createCompany(pool, 'Empresa propia');
    ajena = await createCompany(pool, 'Empresa ajena');

    // El usuario queda como propietario de la suya y sin vínculo con la otra.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await bootstrapTenantAccess(client, { tenantId: propia, ownerUserId: userId });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const app = createApp();
    const rutas = readableRoutes(app);
    assert.ok(rutas.length > 20, `esperábamos muchas rutas de lectura, hay ${rutas.length}`);

    const cookie = `${SESSION_COOKIE}=${token}`;
    const filtradas = [];
    const noBloqueadas = [];
    for (const ruta of rutas) {
      const ajenaResponse = await request(app).get(ruta.path)
        .set('cookie', cookie).set('x-tenant-id', ajena);
      if (ajenaResponse.status === 403 && ajenaResponse.body.code === 'PERMISSION_DENIED') {
        filtradas.push(ruta.path);
      } else {
        noBloqueadas.push(`${ruta.path} → ${ajenaResponse.status} ${ajenaResponse.body.code || ''}`);
      }
    }
    assert.deepEqual(noBloqueadas, [], 'Estas rutas no rechazaron a la empresa ajena');

    // Sin esto la prueba pasaría aunque todo estuviera roto y siempre diera 403.
    const propiaBloqueadas = [];
    for (const ruta of rutas) {
      const propiaResponse = await request(app).get(ruta.path)
        .set('cookie', cookie).set('x-tenant-id', propia);
      if (propiaResponse.status === 403 && propiaResponse.body.code === 'PERMISSION_DENIED') {
        propiaBloqueadas.push(ruta.path);
      }
    }
    assert.deepEqual(
      propiaBloqueadas,
      [],
      'El propietario quedó bloqueado en su propia empresa: la prueba estaría pasando por la razón equivocada',
    );
    assert.equal(filtradas.length, rutas.length);
  } finally {
    await pool.query('DELETE FROM auth_sessions WHERE user_id = $1', [userId]).catch(() => {});
    if (propia) await purgeCompany(pool, propia);
    if (ajena) await purgeCompany(pool, ajena);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
    await pool.end();
  }
});
