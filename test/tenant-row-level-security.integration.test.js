// La conexión de pruebas vive en .env, igual que para la aplicación. Sin esto
// el archivo se saltaría solo, en silencio, por no encontrar la variable.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

// Ejerce las políticas contra PostgreSQL directamente, con la misma mecánica que
// usa la capa de datos: SET LOCAL dentro de una transacción.
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

test('PostgreSQL oculta la contabilidad de otra empresa aunque falte el filtro', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const propia = randomUUID();
  const ajena = randomUUID();
  const clienteId = randomUUID();
  const facturaId = randomUUID();
  const client = await pool.connect();
  try {
    await sinAislamiento(client, async () => {
      await client.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2),($3,$4)',
        [propia, 'Empresa propia RLS', ajena, 'Empresa ajena RLS']);
      await client.query(
        `INSERT INTO customers(id, tenant_id, name, document_number)
         VALUES($1,$2,'Cliente de prueba','900123456')`,
        [clienteId, ajena],
      );
      await client.query(
        `INSERT INTO ar_invoices(id, tenant_id, customer_id, due_date, subtotal, total)
         VALUES($1,$2,$3, CURRENT_DATE + 30, 100000, 100000)`,
        [facturaId, ajena, clienteId],
      );
    });

    await t.test('una consulta sin filtro no devuelve las filas ajenas', async () => {
      const visto = await conAlcance(client, propia, () =>
        client.query('SELECT id FROM ar_invoices WHERE id = $1', [facturaId]));
      assert.equal(visto.rowCount, 0);
    });

    await t.test('la empresa dueña sí ve sus propias filas', async () => {
      const visto = await conAlcance(client, ajena, () =>
        client.query('SELECT id FROM ar_invoices WHERE id = $1', [facturaId]));
      assert.equal(visto.rowCount, 1, 'la política no puede esconderle los datos a su dueño');
    });

    await t.test('sin empresa declarada no se ve nada', async () => {
      const visto = await conAlcance(client, null, () =>
        client.query('SELECT id FROM ar_invoices WHERE id = $1', [facturaId]));
      assert.equal(visto.rowCount, 0, 'una conexión sin empresa debe fallar cerrada');
    });

    await t.test('no se puede escribir una fila a nombre de otra empresa', async () => {
      await assert.rejects(
        () => conAlcance(client, propia, () => client.query(
          `INSERT INTO ar_invoices(tenant_id, customer_id, due_date, subtotal, total)
           VALUES($1,$2, CURRENT_DATE + 30, 5000, 5000)`,
          [ajena, clienteId],
        )),
        /row-level security|violates/i,
      );
    });

    await t.test('un UPDATE sin filtro no alcanza las filas ajenas', async () => {
      const cambiadas = await conAlcance(client, propia, () =>
        client.query('UPDATE ar_invoices SET notes = $1 WHERE id = $2', ['tocado', facturaId]));
      assert.equal(cambiadas.rowCount, 0);
    });
  } finally {
    await sinAislamiento(client, async () => {
      await client.query('DELETE FROM ar_invoices WHERE tenant_id = ANY($1)', [[propia, ajena]]);
      await client.query('DELETE FROM customers WHERE tenant_id = ANY($1)', [[propia, ajena]]);
      await client.query('DELETE FROM tenants WHERE id = ANY($1)', [[propia, ajena]]);
    }).catch(() => {});
    client.release();
    await pool.end();
  }
});
