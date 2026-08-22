// Las operaciones que mueven dinero: vender la última unidad dos veces a la vez,
// devolver, y cerrar la caja con diferencia. Son las tres donde un error no se
// nota hasta que falta plata o mercancía.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

async function sembrar(pool, ids, { stock = 10, precio = 1000 } = {}) {
  await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [ids.tenant, 'Empresa de caja']);
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
     VALUES($1,$2,'IVA0','IVA 0','EXEMPT',0)`,
    [ids.tax, ids.tenant],
  );
  await pool.query(
    `INSERT INTO products(id, tenant_id, sku, name, cost, sale_price,
                          sales_tax_category_id, tax_category_id, tax_review_status)
     VALUES($1,$2,'CAJA-1','Producto de caja',600,$3,$4,$4,'REVIEWED')`,
    [ids.product, ids.tenant, precio, ids.tax],
  );
  await pool.query(
    `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand, reserved)
     VALUES($1,$2,$3,$4,0)`,
    [ids.tenant, ids.product, ids.warehouse, stock],
  );
  // El inventario inicial entra con su movimiento, como debe entrar en la vida
  // real: así el kardex y el saldo cuentan lo mismo desde el principio.
  await pool.query(
    `INSERT INTO inventory_movements(
       tenant_id, product_id, warehouse_id, movement_type, quantity, unit_cost, reason
     )
     VALUES($1,$2,$3,'PURCHASE',$4,600,'Inventario inicial')`,
    [ids.tenant, ids.product, ids.warehouse, stock],
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
}

async function limpiar(pool, tenantId) {
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

function nuevosIds() {
  return {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(), register: randomUUID(),
    session: randomUUID(),
  };
}

test('dos cajeros no pueden vender la misma última unidad', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  const ids = nuevosIds();
  try {
    await sembrar(pool, ids, { stock: 1 });
    const app = createApp({ security: false, moduleGates: false });
    const cobrar = () => request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .set('Idempotency-Key', randomUUID())
      .send({
        cashSessionId: ids.session,
        warehouseId: ids.warehouse,
        paymentMethod: 'CASH',
        saleTerms: 'IMMEDIATE',
        cashReceived: 5000,
        items: [{ productId: ids.product, quantity: 1 }],
      });

    const respuestas = await Promise.all([cobrar(), cobrar()]);
    const estados = respuestas.map((r) => r.status).sort();
    assert.deepEqual(estados, [201, 409]);
    assert.equal(
      respuestas.find((r) => r.status === 409).body.code,
      'INSUFFICIENT_STOCK',
    );

    const saldo = await pool.query(
      `SELECT on_hand FROM inventory_balances
       WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
      [ids.tenant, ids.product, ids.warehouse],
    );
    assert.equal(Number(saldo.rows[0].on_hand), 0, 'el inventario nunca queda en negativo');
  } finally {
    await limpiar(pool, ids.tenant);
    await pool.end();
  }
});

test('una devolución repone el inventario y no se duplica al reintentarla', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const ids = nuevosIds();
  try {
    await sembrar(pool, ids, { stock: 5 });
    const app = createApp({ security: false, moduleGates: false });
    const venta = await request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .send({
        cashSessionId: ids.session,
        warehouseId: ids.warehouse,
        paymentMethod: 'CASH',
        saleTerms: 'IMMEDIATE',
        cashReceived: 5000,
        items: [{ productId: ids.product, quantity: 2 }],
      });
    assert.equal(venta.status, 201);

    const clave = randomUUID();
    const devolver = () => request(app)
      .post(`/api/pos/sales/${venta.body.id}/returns`)
      .set('x-tenant-id', ids.tenant)
      .send({
        cashSessionId: ids.session,
        reason: 'El cliente se arrepintió',
        refundMethod: 'CASH',
        idempotencyKey: clave,
        items: [{ saleItemId: venta.body.items[0].id, quantity: 1 }],
      });

    await t.test('la devolución repone una unidad', async () => {
      const primera = await devolver();
      assert.equal(primera.status, 201);
      const saldo = await pool.query(
        `SELECT on_hand FROM inventory_balances
         WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
        [ids.tenant, ids.product, ids.warehouse],
      );
      assert.equal(Number(saldo.rows[0].on_hand), 4);
    });

    await t.test('reintentarla con la misma clave no repone otra vez', async () => {
      const repetida = await devolver();
      assert.equal(repetida.body.repeated, true);
      const saldo = await pool.query(
        `SELECT on_hand FROM inventory_balances
         WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
        [ids.tenant, ids.product, ids.warehouse],
      );
      assert.equal(Number(saldo.rows[0].on_hand), 4);
      const devoluciones = await pool.query(
        'SELECT COUNT(*)::integer total FROM sale_returns WHERE company_id = $1',
        [ids.tenant],
      );
      assert.equal(devoluciones.rows[0].total, 1);
    });

    await t.test('el kardex cuenta la salida y el regreso', async () => {
      const movimientos = await pool.query(
        `SELECT movement_type, quantity, balance_before, balance_after
         FROM inventory_movements
         WHERE tenant_id = $1 AND product_id = $2
         ORDER BY created_at, id`,
        [ids.tenant, ids.product],
      );
      assert.deepEqual(
        movimientos.rows.map((fila) => [
          fila.movement_type,
          Number(fila.quantity),
          Number(fila.balance_before),
          Number(fila.balance_after),
        ]),
        [
          ['PURCHASE', 5, 0, 5],
          ['SALE', -2, 5, 3],
          ['SALE_RETURN', 1, 3, 4],
        ],
      );
    });
  } finally {
    await limpiar(pool, ids.tenant);
    await pool.end();
  }
});

test('la caja no cierra con diferencia sin explicación', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const ids = nuevosIds();
  try {
    await sembrar(pool, ids, { stock: 5, precio: 10000 });
    const app = createApp({ security: false, moduleGates: false });
    await request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .send({
        cashSessionId: ids.session,
        warehouseId: ids.warehouse,
        paymentMethod: 'CASH',
        saleTerms: 'IMMEDIATE',
        cashReceived: 10000,
        items: [{ productId: ids.product, quantity: 1 }],
      });

    const cerrar = (cuerpo) => request(app)
      .post(`/api/pos/sessions/${ids.session}/close`)
      .set('x-tenant-id', ids.tenant)
      .send(cuerpo);

    await t.test('sin nota, el cierre con faltante se rechaza', async () => {
      const respuesta = await cerrar({ closingAmount: 5000 });
      assert.equal(respuesta.status, 422);
      assert.equal(respuesta.body.code, 'CASH_DIFFERENCE_REASON_REQUIRED');
      const turno = await pool.query('SELECT status FROM cash_sessions WHERE id = $1', [ids.session]);
      assert.equal(turno.rows[0].status, 'OPEN', 'el turno sigue abierto');
    });

    await t.test('con nota, el cierre guarda la diferencia', async () => {
      const respuesta = await cerrar({ closingAmount: 5000, notes: 'Faltante por revisar con el supervisor' });
      assert.equal(respuesta.status, 200);
      assert.equal(Number(respuesta.body.cash_sales), 10000);
      assert.equal(Number(respuesta.body.difference), -5000);
      const turno = await pool.query(
        'SELECT status, closing_amount FROM cash_sessions WHERE id = $1',
        [ids.session],
      );
      assert.equal(turno.rows[0].status, 'CLOSED');
      assert.equal(Number(turno.rows[0].closing_amount), 5000);
    });

    await t.test('el cierre queda auditado', async () => {
      const eventos = await pool.query(
        `SELECT COUNT(*)::integer total FROM audit_events
         WHERE tenant_id = $1 AND action = 'cash.session_closed'`,
        [ids.tenant],
      );
      assert.equal(eventos.rows[0].total, 1);
    });
  } finally {
    await limpiar(pool, ids.tenant);
    await pool.end();
  }
});
