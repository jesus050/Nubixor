// Segunda tanda de políticas por empresa (migración 079). La prueba mira lo
// mismo que la de la primera tanda: que una consulta a la que se le olvidó el
// filtro no alcance las filas de otra empresa, y que el rol de la aplicación no
// pueda saltarse la política.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;
const TABLAS_DE_APOYO = ['tenants', 'suppliers', 'purchases'];

function conexionPara(base, rol, clave) {
  const url = new URL(base);
  url.username = rol;
  url.password = clave;
  return url.toString();
}

async function conAlcance(client, tenantId, work) {
  await client.query('BEGIN');
  try {
    if (tenantId) await client.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
    const result = await work();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

test('PostgreSQL aísla las compras entre empresas aunque falte el filtro', {
  skip: !connectionString,
}, async (t) => {
  const admin = new pg.Pool({ connectionString });
  const rol = `ops_probe_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const clave = randomUUID();
  const propia = randomUUID();
  const ajena = randomUUID();
  const proveedor = randomUUID();
  const sucursal = randomUUID();
  const compra = randomUUID();
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
    for (const tabla of TABLAS_DE_APOYO) {
      await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${tabla} TO ${rol}`);
    }
    await admin.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${rol}`);

    await admin.query(
      'INSERT INTO tenants(id, legal_name) VALUES($1,$2),($3,$4)',
      [propia, 'Empresa propia OPS', ajena, 'Empresa ajena OPS'],
    );
    await admin.query(
      'INSERT INTO suppliers(id, tenant_id, name) VALUES($1,$2,$3)',
      [proveedor, ajena, 'Proveedor ajeno'],
    );
    await admin.query(
      'INSERT INTO branches(id, tenant_id, name, code) VALUES($1,$2,$3,$4)',
      [sucursal, ajena, 'Sucursal ajena', 'AJENA-1'],
    );
    await admin.query(
      `INSERT INTO purchases(id, tenant_id, supplier_id, branch_id, document_type, status)
       VALUES($1,$2,$3,$4,'INVOICE','DRAFT')`,
      [compra, ajena, proveedor, sucursal],
    );

    restringido = new pg.Pool({ connectionString: conexionPara(connectionString, rol, clave) });
    sonda = await restringido.connect();

    await t.test('el rol de la aplicación no puede saltarse las políticas', async () => {
      const permisos = await sonda.query(
        'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
      );
      assert.equal(permisos.rows[0].rolsuper, false);
      assert.equal(permisos.rows[0].rolbypassrls, false);
    });

    await t.test('una consulta sin filtro no ve la compra ajena', async () => {
      const visibles = await conAlcance(sonda, propia, () =>
        sonda.query('SELECT id FROM purchases'));
      assert.equal(visibles.rowCount, 0);
    });

    await t.test('sin empresa declarada no se ve nada', async () => {
      const visibles = await conAlcance(sonda, null, () =>
        sonda.query('SELECT id FROM purchases'));
      assert.equal(visibles.rowCount, 0);
    });

    await t.test('la empresa dueña sí ve su compra', async () => {
      const visibles = await conAlcance(sonda, ajena, () =>
        sonda.query('SELECT id FROM purchases'));
      assert.equal(visibles.rowCount, 1);
      assert.equal(visibles.rows[0].id, compra);
    });

    await t.test('no se puede registrar una compra a nombre de otra empresa', async () => {
      await assert.rejects(
        conAlcance(sonda, propia, () => sonda.query(
          `INSERT INTO purchases(tenant_id, supplier_id, branch_id, document_type, status)
           VALUES($1,$2,$3,'INVOICE','DRAFT')`,
          [ajena, proveedor, sucursal],
        )),
        (error) => error.code === '42501',
      );
    });

    await t.test('un UPDATE sin filtro no alcanza la compra ajena', async () => {
      const afectadas = await conAlcance(sonda, propia, () =>
        sonda.query("UPDATE purchases SET status = 'CANCELLED'"));
      assert.equal(afectadas.rowCount, 0);
      const intacta = await admin.query('SELECT status FROM purchases WHERE id = $1', [compra]);
      assert.equal(intacta.rows[0].status, 'DRAFT');
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
      for (const empresa of [propia, ajena]) {
        for (const fila of propias.rows) {
          await limpieza.query(
            `DELETE FROM "${fila.table_name}" WHERE "${fila.column_name}" = $1`,
            [empresa],
          );
        }
      }
      await limpieza.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [[propia, ajena]]);
    } finally {
      await limpieza.query("SET session_replication_role = 'origin'").catch(() => {});
      limpieza.release();
    }
    for (const tabla of TABLAS_DE_APOYO) {
      await admin.query(`REVOKE ALL ON ${tabla} FROM ${rol}`).catch(() => {});
    }
    await admin.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ${rol}`).catch(() => {});
    await admin.query(`REVOKE USAGE ON SCHEMA public FROM ${rol}`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS ${rol}`).catch(() => {});
    await admin.end();
  }
});
