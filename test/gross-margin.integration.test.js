// El margen bruto no puede incluir el IVA. Los precios del punto de venta son
// impuesto incluido, así que restar el costo del total cobrado convierte el
// dinero de la DIAN en utilidad y hace parecer rentable un producto que se
// vendió justo al costo. Esta prueba fija exactamente ese caso.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

const COSTO = 100000;
const PRECIO_CON_IVA = 119000; // 100.000 + 19 % de IVA

test('el margen bruto excluye el IVA cobrado', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(), register: randomUUID(),
    session: randomUUID(),
  };
  try {
    await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [ids.tenant, 'Margen sin IVA']);
    await pool.query(
      'INSERT INTO branches(id, tenant_id, name, code) VALUES($1,$2,$3,$4)',
      [ids.branch, ids.tenant, 'Principal', 'MAIN'],
    );
    await pool.query(
      `INSERT INTO warehouses(id, tenant_id, branch_id, name, code, warehouse_type)
       VALUES($1,$2,$3,'Exhibición','MAIN-WH','DISPLAY')`,
      [ids.warehouse, ids.tenant, ids.branch],
    );
    await pool.query(
      `INSERT INTO tax_categories(id, tenant_id, code, name, treatment, rate)
       VALUES($1,$2,'IVA19','IVA 19','TAXED',19)`,
      [ids.tax, ids.tenant],
    );
    await pool.query(
      `INSERT INTO products(id, tenant_id, sku, name, cost, sale_price,
                            sales_tax_category_id, tax_category_id,
                            tax_review_status, active)
       VALUES($1,$2,'MARGEN-IVA','Producto vendido al costo',$3,$4,$5,$5,'REVIEWED',TRUE)`,
      [ids.product, ids.tenant, COSTO, PRECIO_CON_IVA, ids.tax],
    );
    await pool.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand, reserved)
       VALUES($1,$2,$3,10,0)`,
      [ids.tenant, ids.product, ids.warehouse],
    );
    await pool.query(
      `INSERT INTO cash_registers(id, tenant_id, branch_id, name, code)
       VALUES($1,$2,$3,'Caja 1','CAJA-1')`,
      [ids.register, ids.tenant, ids.branch],
    );
    await pool.query(
      `INSERT INTO cash_sessions(id, tenant_id, cash_register_id, status, opening_amount)
       VALUES($1,$2,$3,'OPEN',0)`,
      [ids.session, ids.tenant, ids.register],
    );
    await pool.query(
      `UPDATE company_tax_profiles
       SET default_document_type = 'INTERNAL_RECEIPT', electronic_invoicing_required = FALSE
       WHERE company_id = $1`,
      [ids.tenant],
    );

    const app = createApp({ security: false, moduleGates: false });
    const venta = await request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .send({
        cashSessionId: ids.session,
        warehouseId: ids.warehouse,
        paymentMethod: 'CASH',
        saleTerms: 'IMMEDIATE',
        cashReceived: PRECIO_CON_IVA,
        items: [{ productId: ids.product, quantity: 1 }],
      });
    assert.equal(venta.status, 201);

    await t.test('la venta separa el impuesto del precio', () => {
      assert.equal(Number(venta.body.total), PRECIO_CON_IVA);
      assert.equal(Number(venta.body.tax_total), 19000);
      assert.equal(Number(venta.body.subtotal), COSTO);
    });

    await t.test('el dashboard no cuenta el IVA como utilidad del mes', async () => {
      const resumen = await request(app)
        .get('/api/dashboard/executive')
        .set('x-tenant-id', ids.tenant);
      assert.equal(resumen.status, 200);
      assert.equal(Number(resumen.body.gross_margin_month), 0);
    });

    await t.test('el reporte de ventas muestra margen cero y venta sin IVA', async () => {
      const reporte = await request(app)
        .get('/api/reports/sales')
        .set('x-tenant-id', ids.tenant);
      assert.equal(reporte.status, 200);
      const fila = reporte.body.items[0];
      assert.equal(Number(fila.revenue), PRECIO_CON_IVA);
      assert.equal(Number(fila.net_revenue), COSTO);
      assert.equal(Number(fila.margin), 0);
      assert.equal(Number(fila.margin_percent), 0);
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
