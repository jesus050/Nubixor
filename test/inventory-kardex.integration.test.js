// El kardex tiene que poder reconstruir la historia de un producto: de cuánto
// venía cada movimiento y en cuánto dejó la bodega. Y tiene que ser historia de
// verdad, no un registro editable.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

test('cada movimiento guarda el saldo anterior y el resultante', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(),
  };

  const registrar = (cantidad, tipo, motivo) => pool.query(
    `INSERT INTO inventory_movements(
       tenant_id, product_id, warehouse_id, movement_type, quantity, unit_cost, reason
     )
     VALUES($1,$2,$3,$4,$5,1000,$6)
     RETURNING id, branch_id, balance_before, balance_after`,
    [ids.tenant, ids.product, ids.warehouse, tipo, cantidad, motivo],
  );

  try {
    await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [ids.tenant, 'Empresa kardex']);
    await pool.query(
      'INSERT INTO branches(id, tenant_id, name, code) VALUES($1,$2,$3,$4)',
      [ids.branch, ids.tenant, 'Principal', 'MAIN'],
    );
    await pool.query(
      `INSERT INTO warehouses(id, tenant_id, branch_id, name, code, warehouse_type)
       VALUES($1,$2,$3,'Bodega','MAIN-WH','AVAILABLE')`,
      [ids.warehouse, ids.tenant, ids.branch],
    );
    await pool.query(
      `INSERT INTO tax_categories(id, tenant_id, code, name, treatment, rate)
       VALUES($1,$2,'IVA0','IVA 0','EXEMPT',0)`,
      [ids.tax, ids.tenant],
    );
    await pool.query(
      `INSERT INTO products(id, tenant_id, sku, name, cost, sale_price,
                            sales_tax_category_id, tax_category_id, tax_review_status)
       VALUES($1,$2,'KARDEX-1','Producto del kardex',500,1000,$3,$3,'REVIEWED')`,
      [ids.product, ids.tenant, ids.tax],
    );
    await pool.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand, reserved)
       VALUES($1,$2,$3,0,0)`,
      [ids.tenant, ids.product, ids.warehouse],
    );

    await t.test('el primer movimiento parte de cero y deja la sucursal puesta', async () => {
      const entrada = await registrar(10, 'PURCHASE', 'Compra inicial');
      assert.equal(Number(entrada.rows[0].balance_before), 0);
      assert.equal(Number(entrada.rows[0].balance_after), 10);
      assert.equal(entrada.rows[0].branch_id, ids.branch);
    });

    await t.test('el siguiente movimiento encadena con el anterior', async () => {
      const salida = await registrar(-3, 'SALE', 'Venta de mostrador');
      assert.equal(Number(salida.rows[0].balance_before), 10);
      assert.equal(Number(salida.rows[0].balance_after), 7);
    });

    await t.test('un ajuste negativo sigue la cadena', async () => {
      const ajuste = await registrar(-2, 'ADJUSTMENT', 'Avería');
      assert.equal(Number(ajuste.rows[0].balance_before), 7);
      assert.equal(Number(ajuste.rows[0].balance_after), 5);
    });

    await t.test('un movimiento no se puede reescribir', async () => {
      await assert.rejects(
        pool.query(
          `UPDATE inventory_movements SET quantity = 999
           WHERE tenant_id = $1 AND product_id = $2`,
          [ids.tenant, ids.product],
        ),
        /no se modifican ni se borran/,
      );
    });

    await t.test('un movimiento no se puede borrar', async () => {
      await assert.rejects(
        pool.query(
          'DELETE FROM inventory_movements WHERE tenant_id = $1 AND product_id = $2',
          [ids.tenant, ids.product],
        ),
        /no se modifican ni se borran/,
      );
    });

    await t.test('el saldo no puede quedar en negativo', async () => {
      await assert.rejects(
        pool.query(
          `UPDATE inventory_balances SET on_hand = -1
           WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3`,
          [ids.tenant, ids.product, ids.warehouse],
        ),
        (error) => error.code === '23514',
      );
    });

    await t.test('la conciliación delata un saldo movido sin movimiento', async () => {
      // El saldo se quedó en cero mientras el kardex acumuló cinco unidades:
      // exactamente el caso que la conciliación existe para encontrar.
      const app = createApp({ security: false, moduleGates: false });
      const respuesta = await request(app)
        .get('/api/inventory/kardex/reconciliation')
        .set('x-tenant-id', ids.tenant);

      assert.equal(respuesta.status, 200);
      const diferencia = respuesta.body.differences
        .find((fila) => fila.product_id === ids.product);
      assert.ok(diferencia, 'la diferencia debe aparecer');
      assert.equal(Number(diferencia.on_hand), 0);
      assert.equal(Number(diferencia.kardex_balance), 5);
      assert.equal(Number(diferencia.difference), -5);
    });

    await t.test('el kardex expone el saldo sellado, no uno recalculado', async () => {
      const app = createApp({ security: false, moduleGates: false });
      const respuesta = await request(app)
        .get(`/api/inventory/kardex?productId=${ids.product}`)
        .set('x-tenant-id', ids.tenant);

      assert.equal(respuesta.status, 200);
      const saldos = respuesta.body.map((fila) => Number(fila.balance_after));
      // Vienen del más reciente al más antiguo.
      assert.deepEqual(saldos, [5, 7, 10]);
    });
  } finally {
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
          [ids.tenant],
        );
      }
      await cleanup.query('DELETE FROM tenants WHERE id = $1', [ids.tenant]);
    } finally {
      await cleanup.query("SET session_replication_role = 'origin'").catch(() => {});
      cleanup.release();
    }
    await pool.end();
  }
});
