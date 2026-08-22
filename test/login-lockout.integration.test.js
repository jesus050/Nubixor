// El bloqueo por intentos fallidos existía en el código pero no llegaba a
// ocurrir: el contador se incrementaba dentro de la transacción que después
// revertía el error, y el parámetro que decidía el bloqueo se ponía en cero
// justo cuando debía dispararlo. Esta prueba fija que ahora sí bloquea.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/db.js';
import { hashPassword } from '../src/authentication.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;
const CLAVE_BUENA = 'ClaveSegura2026';
const CLAVE_MALA = 'ClaveEquivocada2026';

test('cinco intentos fallidos bloquean la cuenta', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const usuario = randomUUID();
  const empresa = randomUUID();
  const correo = `bloqueo-${usuario.slice(0, 8)}@nubixor.test`;

  try {
    await pool.query(
      'INSERT INTO users(id, email, full_name, password_hash, status) VALUES($1,$2,$3,$4,$5)',
      [usuario, correo, 'Persona de prueba', await hashPassword(CLAVE_BUENA), 'ACTIVE'],
    );
    await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [empresa, 'Empresa del bloqueo']);
    await pool.query(
      "INSERT INTO tenant_users(tenant_id, user_id, role_code, status) VALUES($1,$2,'OWNER','ACTIVE')",
      [empresa, usuario],
    );

    const app = createApp();
    const intentar = (password) => request(app)
      .post('/api/auth/login')
      .send({ email: correo, password });

    await t.test('el primer fallo queda registrado y no se pierde', async () => {
      const respuesta = await intentar(CLAVE_MALA);
      assert.equal(respuesta.status, 401);
      assert.equal(respuesta.body.code, 'INVALID_CREDENTIALS');
      const usuarios = await pool.query(
        'SELECT failed_login_attempts FROM users WHERE id = $1',
        [usuario],
      );
      assert.equal(Number(usuarios.rows[0].failed_login_attempts), 1);
    });

    await t.test('al quinto fallo la cuenta queda bloqueada', async () => {
      for (let intento = 2; intento <= 5; intento += 1) {
        const respuesta = await intentar(CLAVE_MALA);
        assert.equal(respuesta.status, 401);
      }
      const usuarios = await pool.query(
        'SELECT failed_login_attempts, locked_until FROM users WHERE id = $1',
        [usuario],
      );
      assert.ok(usuarios.rows[0].locked_until, 'debe quedar una fecha de desbloqueo');
      assert.ok(new Date(usuarios.rows[0].locked_until) > new Date());
      // El contador vuelve a cero para que, pasado el bloqueo, la cuenta
      // recupere sus cinco oportunidades.
      assert.equal(Number(usuarios.rows[0].failed_login_attempts), 0);
    });

    await t.test('con la cuenta bloqueada, ni la contraseña correcta entra', async () => {
      const respuesta = await intentar(CLAVE_BUENA);
      assert.equal(respuesta.status, 401);
      assert.equal(respuesta.body.code, 'ACCOUNT_TEMPORARILY_LOCKED');
    });

    await t.test('cada intento quedó auditado en la empresa de la persona', async () => {
      const eventos = await pool.query(
        `SELECT action, metadata FROM audit_events
         WHERE tenant_id = $1 AND entity_id = $2
         ORDER BY id`,
        [empresa, usuario],
      );
      const acciones = eventos.rows.map((fila) => fila.action);
      assert.equal(acciones.filter((accion) => accion === 'auth.login_failed').length, 4);
      assert.equal(acciones.filter((accion) => accion === 'auth.account_locked').length, 1);
      assert.equal(acciones.at(-1), 'auth.login_failed', 'el intento sobre la cuenta bloqueada también se registra');
    });

    await t.test('desbloqueada, la contraseña correcta vuelve a entrar', async () => {
      await pool.query('UPDATE users SET locked_until = NULL WHERE id = $1', [usuario]);
      const respuesta = await intentar(CLAVE_BUENA);
      assert.equal(respuesta.status, 200);
      const eventos = await pool.query(
        `SELECT COUNT(*)::integer total FROM audit_events
         WHERE tenant_id = $1 AND entity_id = $2 AND action = 'auth.login'`,
        [empresa, usuario],
      );
      assert.equal(eventos.rows[0].total, 1);
    });
  } finally {
    const limpieza = await pool.connect();
    try {
      await limpieza.query("SET session_replication_role = 'replica'");
      await limpieza.query('DELETE FROM audit_events WHERE tenant_id = $1', [empresa]);
      await limpieza.query('DELETE FROM audit_chain_heads WHERE tenant_id = $1', [empresa]);
      await limpieza.query('DELETE FROM tenant_users WHERE user_id = $1', [usuario]);
      await limpieza.query('DELETE FROM auth_sessions WHERE user_id = $1', [usuario]);
      const propias = await limpieza.query(`
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
      for (const fila of propias.rows) {
        await limpieza.query(
          `DELETE FROM "${fila.table_name}" WHERE "${fila.column_name}" = $1`,
          [empresa],
        );
      }
      await limpieza.query('DELETE FROM tenants WHERE id = $1', [empresa]);
      await limpieza.query('DELETE FROM users WHERE id = $1', [usuario]);
    } finally {
      await limpieza.query("SET session_replication_role = 'origin'").catch(() => {});
      limpieza.release();
    }
    await pool.end();
    await closeDatabase();
  }
});
