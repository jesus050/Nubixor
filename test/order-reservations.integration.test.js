import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

test('dos confirmaciones concurrentes no pueden sobre-reservar el mismo saldo', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(), first: randomUUID(), second: randomUUID(),
  };
  try {
    await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1, $2)', [ids.tenant, 'Reserva concurrente']);
    await pool.query('INSERT INTO branches(id, tenant_id, name, code) VALUES($1,$2,$3,$4)', [ids.branch, ids.tenant, 'Principal', 'MAIN']);
    await pool.query('INSERT INTO warehouses(id, tenant_id, branch_id, name, code) VALUES($1,$2,$3,$4,$5)', [ids.warehouse, ids.tenant, ids.branch, 'Bodega', 'MAIN-WH']);
    await pool.query(
      `INSERT INTO tax_categories(id, tenant_id, code, name, treatment, rate)
       VALUES($1,$2,'IVA0','IVA 0','EXEMPT',0)`,
      [ids.tax, ids.tenant],
    );
    await pool.query(
      `INSERT INTO products(id, tenant_id, sku, name, sale_price, sales_tax_category_id,
                            tax_category_id, tax_review_status, active)
       VALUES($1,$2,'RES-CONCURRENT','Producto de reserva',100,$3,$3,'REVIEWED',TRUE)`,
      [ids.product, ids.tenant, ids.tax],
    );
    await pool.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand, reserved)
       VALUES($1,$2,$3,10,0)`,
      [ids.tenant, ids.product, ids.warehouse],
    );
    for (const id of [ids.first, ids.second]) {
      await pool.query(
        `INSERT INTO commercial_sales_documents(
           id, company_id, branch_id, document_type, document_number, status,
           expected_date, subtotal, tax_total, total
         ) VALUES($1,$2,$3,'ORDER',$4,'DRAFT',CURRENT_DATE,800,0,800)`,
        [id, ids.tenant, ids.branch, `TEST-${id}`],
      );
      await pool.query(
        `INSERT INTO commercial_sales_document_items(
           company_id, commercial_document_id, product_id, sku_snapshot,
           name_snapshot, quantity, unit_price, tax_rate, tax_amount, line_total
         ) VALUES($1,$2,$3,'RES-CONCURRENT','Producto de reserva',8,100,0,0,800)`,
        [ids.tenant, id, ids.product],
      );
    }
    const app = createApp({ security: false, moduleGates: false });
    const responses = await Promise.all([
      request(app).post(`/api/billing-workflow/orders/${ids.first}/confirm`).set('x-tenant-id', ids.tenant),
      request(app).post(`/api/billing-workflow/orders/${ids.second}/confirm`).set('x-tenant-id', ids.tenant),
    ]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
    const failed = responses.find((response) => response.status === 409);
    assert.equal(failed.body.code, 'INSUFFICIENT_AVAILABLE_STOCK');
    const balance = await pool.query(
      'SELECT reserved FROM inventory_balances WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3',
      [ids.tenant, ids.product, ids.warehouse],
    );
    assert.equal(Number(balance.rows[0].reserved), 8);
  } finally {
    // Varios disparadores siembran filas al crear un tenant (perfil tributario,
    // cuentas contables, unidades, módulos...), así que enumerar tablas a mano
    // se rompe cada vez que se agrega una. Deducimos el conjunto del esquema y
    // borramos con los disparadores de integridad desactivados, de modo que el
    // orden entre tablas deje de importar.
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
