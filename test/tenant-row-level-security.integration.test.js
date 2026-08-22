// La conexión de pruebas vive en .env, igual que para la aplicación. Sin esto
// el archivo se saltaría solo, en silencio, por no encontrar la variable.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

// PostgreSQL nunca aplica las políticas a un superusuario, ni con FORCE. Como
// la imagen oficial crea al usuario principal como superusuario, comprobar el
// aislamiento con esa cuenta daría un falso verde: hay que mirarlo desde un rol
// restringido, que es como debe conectarse la aplicación.
const TABLAS_DE_PRUEBA = ['tenants', 'customers', 'ar_invoices'];

function connectionStringFor(base, role, password) {
  const url = new URL(base);
  url.username = role;
  url.password = password;
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

async function sinAislamiento(client, work) {
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL app.bypass_tenant_isolation = 'on'");
    const result = await work();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

test('PostgreSQL aísla la contabilidad entre empresas aunque falte el filtro', {
  skip: !connectionString,
}, async (t) => {
  const admin = new pg.Pool({ connectionString });
  const rol = `rls_probe_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const clave = randomUUID();
  const propia = randomUUID();
  const ajena = randomUUID();
  const clienteId = randomUUID();
  const facturaId = randomUUID();
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
    for (const tabla of TABLAS_DE_PRUEBA) {
      await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${tabla} TO ${rol}`);
    }
    await admin.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${rol}`);

    const adminClient = await admin.connect();
    try {
      await sinAislamiento(adminClient, async () => {
        await adminClient.query(
          'INSERT INTO tenants(id, legal_name) VALUES($1,$2),($3,$4)',
          [propia, 'Empresa propia RLS', ajena, 'Empresa ajena RLS'],
        );
        await adminClient.query(
          `INSERT INTO customers(id, tenant_id, name, document_number)
           VALUES($1,$2,'Cliente de prueba','900123456')`,
          [clienteId, ajena],
        );
        await adminClient.query(
          `INSERT INTO ar_invoices(id, tenant_id, customer_id, due_date, subtotal, total)
           VALUES($1,$2,$3, CURRENT_DATE + 30, 100000, 100000)`,
          [facturaId, ajena, clienteId],
        );
      });
    } finally {
      adminClient.release();
    }

    restringido = new pg.Pool({
      connectionString: connectionStringFor(connectionString, rol, clave),
    });
    sonda = await restringido.connect();

    await t.test('el rol de la aplicación no puede saltarse las políticas', async () => {
      const perfil = await sonda.query(
        'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
      );
      assert.equal(perfil.rows[0].rolsuper, false);
      assert.equal(perfil.rows[0].rolbypassrls, false);
    });

    await t.test('una consulta sin filtro no devuelve las filas ajenas', async () => {
      const visto = await conAlcance(sonda, propia, () =>
        sonda.query('SELECT id FROM ar_invoices WHERE id = $1', [facturaId]));
      assert.equal(visto.rowCount, 0);
    });

    await t.test('la empresa dueña sí ve sus propias filas', async () => {
      const visto = await conAlcance(sonda, ajena, () =>
        sonda.query('SELECT id FROM ar_invoices WHERE id = $1', [facturaId]));
      assert.equal(visto.rowCount, 1, 'la política no puede esconderle los datos a su dueño');
    });

    await t.test('sin empresa declarada no se ve nada', async () => {
      const visto = await conAlcance(sonda, null, () =>
        sonda.query('SELECT id FROM ar_invoices WHERE id = $1', [facturaId]));
      assert.equal(visto.rowCount, 0, 'una conexión sin empresa debe fallar cerrada');
    });

    await t.test('no se puede escribir una fila a nombre de otra empresa', async () => {
      await assert.rejects(
        () => conAlcance(sonda, propia, () => sonda.query(
          `INSERT INTO ar_invoices(tenant_id, customer_id, due_date, subtotal, total)
           VALUES($1,$2, CURRENT_DATE + 30, 5000, 5000)`,
          [ajena, clienteId],
        )),
        /row-level security/i,
      );
    });

    await t.test('un UPDATE sin filtro no alcanza las filas ajenas', async () => {
      const cambiadas = await conAlcance(sonda, propia, () =>
        sonda.query('UPDATE ar_invoices SET notes = $1 WHERE id = $2', ['tocado', facturaId]));
      assert.equal(cambiadas.rowCount, 0);
    });
  } finally {
    if (sonda) sonda.release();
    if (restringido) await restringido.end();
    const limpieza = await admin.connect();
    try {
      await sinAislamiento(limpieza, async () => {
        await limpieza.query('DELETE FROM ar_invoices WHERE tenant_id = ANY($1)', [[propia, ajena]]);
        await limpieza.query('DELETE FROM customers WHERE tenant_id = ANY($1)', [[propia, ajena]]);
        await limpieza.query('DELETE FROM tenants WHERE id = ANY($1)', [[propia, ajena]]);
      });
      for (const tabla of TABLAS_DE_PRUEBA) {
        await limpieza.query(`REVOKE ALL ON ${tabla} FROM ${rol}`).catch(() => {});
      }
      await limpieza.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ${rol}`).catch(() => {});
      await limpieza.query(`REVOKE USAGE ON SCHEMA public FROM ${rol}`).catch(() => {});
      await limpieza.query(`DROP ROLE IF EXISTS ${rol}`).catch(() => {});
    } finally {
      limpieza.release();
    }
    await admin.end();
  }
});
