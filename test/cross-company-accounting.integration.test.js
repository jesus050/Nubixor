// La caja compartida vende productos de varias empresas en un mismo cobro y
// contabiliza a nombre de cada vendedora. Como las políticas leen la empresa de
// la conexión, escribir el asiento de otra empresa sin declararla es un rechazo
// de PostgreSQL que tumba la venta entera. Esta prueba fija las dos mitades:
// que el rechazo existe, y que declarar la empresa correcta lo resuelve.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;
const TABLAS = ['tenants', 'accounting_periods', 'accounting_accounts', 'accounting_account_mappings'];

function conexionPara(base, rol, clave) {
  const url = new URL(base);
  url.username = rol;
  url.password = clave;
  return url.toString();
}

test('contabilizar a nombre de otra empresa exige declararla en la conexión', {
  skip: !connectionString,
}, async (t) => {
  const admin = new pg.Pool({ connectionString });
  const rol = `acc_probe_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const clave = randomUUID();
  const operadora = randomUUID();
  const vendedora = randomUUID();
  let restringido = null;
  let sonda = null;

  try {
    const superusuario = await admin.query(
      'SELECT rolsuper FROM pg_roles WHERE rolname = current_user',
    );
    assert.ok(
      superusuario.rows[0]?.rolsuper,
      'la cuenta de pruebas necesita poder crear el rol restringido',
    );

    await admin.query(`CREATE ROLE ${rol} LOGIN PASSWORD '${clave}'`);
    await admin.query(`GRANT USAGE ON SCHEMA public TO ${rol}`);
    for (const tabla of TABLAS) {
      await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${tabla} TO ${rol}`);
    }
    await admin.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${rol}`);
    await admin.query(
      'INSERT INTO tenants(id, legal_name) VALUES($1,$2),($3,$4)',
      [operadora, 'Empresa operadora', vendedora, 'Empresa vendedora'],
    );

    restringido = new pg.Pool({ connectionString: conexionPara(connectionString, rol, clave) });
    sonda = await restringido.connect();

    await t.test('sin declararla, PostgreSQL rechaza el período de la vendedora', async () => {
      await sonda.query('BEGIN');
      try {
        await sonda.query(`SET LOCAL app.tenant_id = '${operadora}'`);
        await assert.rejects(
          sonda.query(
            `INSERT INTO accounting_periods(tenant_id, period_start, period_end)
             VALUES($1, date_trunc('month', CURRENT_DATE)::date,
                    (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date)`,
            [vendedora],
          ),
          (error) => error.code === '42501',
          'la política debe rechazar la fila de la empresa ajena',
        );
      } finally {
        await sonda.query('ROLLBACK');
      }
    });

    await t.test('declarando la vendedora, el asiento entra en su empresa', async () => {
      await sonda.query('BEGIN');
      try {
        await sonda.query(`SET LOCAL app.tenant_id = '${operadora}'`);
        // Es exactamente lo que hace withDeclaredTenant durante el tramo
        // contable de la venta compartida.
        await sonda.query(`SET LOCAL app.tenant_id = '${vendedora}'`);
        await sonda.query(
          `INSERT INTO accounting_periods(tenant_id, period_start, period_end)
           VALUES($1, date_trunc('month', CURRENT_DATE)::date,
                  (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date)
           ON CONFLICT DO NOTHING`,
          [vendedora],
        );
        await sonda.query(`SET LOCAL app.tenant_id = '${operadora}'`);
        // De vuelta en la empresa activa, el período de la vendedora ya no se ve:
        // la declaración fue temporal, como debe ser.
        const visible = await sonda.query(
          'SELECT COUNT(*)::integer total FROM accounting_periods WHERE tenant_id = $1',
          [vendedora],
        );
        assert.equal(visible.rows[0].total, 0);
        await sonda.query('COMMIT');
      } catch (error) {
        await sonda.query('ROLLBACK');
        throw error;
      }
    });

    await t.test('el período quedó guardado en la empresa vendedora', async () => {
      const guardado = await admin.query(
        'SELECT COUNT(*)::integer total FROM accounting_periods WHERE tenant_id = $1',
        [vendedora],
      );
      assert.equal(guardado.rows[0].total, 1);
    });
  } finally {
    sonda?.release();
    await restringido?.end();
    const limpieza = await admin.connect();
    try {
      await limpieza.query("SET session_replication_role = 'replica'");
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
      for (const empresa of [operadora, vendedora]) {
        for (const fila of propias.rows) {
          await limpieza.query(
            `DELETE FROM "${fila.table_name}" WHERE "${fila.column_name}" = $1`,
            [empresa],
          );
        }
      }
      await limpieza.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [[operadora, vendedora]]);
    } finally {
      await limpieza.query("SET session_replication_role = 'origin'").catch(() => {});
      limpieza.release();
    }
    for (const tabla of TABLAS) {
      await admin.query(`REVOKE ALL ON ${tabla} FROM ${rol}`).catch(() => {});
    }
    await admin.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ${rol}`).catch(() => {});
    await admin.query(`REVOKE USAGE ON SCHEMA public FROM ${rol}`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS ${rol}`).catch(() => {});
    await admin.end();
  }
});
