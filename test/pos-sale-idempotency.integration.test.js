// Un cobro que se reintenta no puede convertirse en dos ventas. Es la diferencia
// entre un cajero que vuelve a pulsar tras un timeout y un inventario que se
// descuenta dos veces por la misma mercancía.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

async function sembrarEscenario(pool, ids) {
  await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [ids.tenant, 'Caja idempotente']);
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
                          sales_tax_category_id, tax_category_id,
                          tax_review_status, active)
     VALUES($1,$2,'POS-IDEM','Producto de caja',600,1000,$3,$3,'REVIEWED',TRUE)`,
    [ids.product, ids.tenant, ids.tax],
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
  // El perfil tributario lo siembra un disparador al crear la empresa; aquí solo
  // se fuerza el comprobante interno para que la prueba no dependa de tener una
  // resolución de facturación electrónica vigente.
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

function cuerpoDeVenta(ids) {
  return {
    cashSessionId: ids.session,
    warehouseId: ids.warehouse,
    paymentMethod: 'CASH',
    saleTerms: 'IMMEDIATE',
    cashReceived: 5000,
    items: [{ productId: ids.product, quantity: 2 }],
  };
}

test('un cobro reintentado con la misma clave no crea una segunda venta', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(), register: randomUUID(),
    session: randomUUID(),
  };
  try {
    await sembrarEscenario(pool, ids);
    const app = createApp({ security: false, moduleGates: false });
    const clave = randomUUID();

    const primera = await request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .set('Idempotency-Key', clave)
      .send(cuerpoDeVenta(ids));
    assert.equal(primera.status, 201);

    const reintento = await request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .set('Idempotency-Key', clave)
      .send(cuerpoDeVenta(ids));

    await t.test('el reintento devuelve el recibo original, no un error', () => {
      assert.equal(reintento.status, 200);
      assert.equal(reintento.body.id, primera.body.id);
      assert.equal(reintento.body.replayed, true);
      assert.equal(reintento.headers['idempotency-replayed'], 'true');
    });

    await t.test('solo existe una venta', async () => {
      const ventas = await pool.query(
        'SELECT COUNT(*)::integer total FROM sales WHERE company_id = $1',
        [ids.tenant],
      );
      assert.equal(ventas.rows[0].total, 1);
    });

    await t.test('el inventario se descontó una sola vez', async () => {
      const saldo = await pool.query(
        `SELECT on_hand FROM inventory_balances
         WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
        [ids.tenant, ids.product, ids.warehouse],
      );
      assert.equal(Number(saldo.rows[0].on_hand), 8);
    });

    await t.test('no se duplicó el movimiento de inventario', async () => {
      const movimientos = await pool.query(
        `SELECT COUNT(*)::integer total FROM inventory_movements
         WHERE tenant_id=$1 AND product_id=$2 AND movement_type='SALE'`,
        [ids.tenant, ids.product],
      );
      assert.equal(movimientos.rows[0].total, 1);
    });
  } finally {
    await limpiar(pool, ids.tenant);
    await pool.end();
  }
});

test('dos cobros simultáneos con la misma clave dejan una sola venta', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(), register: randomUUID(),
    session: randomUUID(),
  };
  try {
    await sembrarEscenario(pool, ids);
    const app = createApp({ security: false, moduleGates: false });
    const clave = randomUUID();

    // Las dos peticiones cruzan la comprobación previa sin ver nada: quien las
    // separa es el índice único, que es exactamente lo que se quiere probar.
    const respuestas = await Promise.all([
      request(app).post('/api/pos/sales').set('x-tenant-id', ids.tenant)
        .set('Idempotency-Key', clave).send(cuerpoDeVenta(ids)),
      request(app).post('/api/pos/sales').set('x-tenant-id', ids.tenant)
        .set('Idempotency-Key', clave).send(cuerpoDeVenta(ids)),
    ]);

    assert.deepEqual(respuestas.map((r) => r.status).sort(), [200, 201]);
    const ventas = await pool.query(
      'SELECT COUNT(*)::integer total FROM sales WHERE company_id = $1',
      [ids.tenant],
    );
    assert.equal(ventas.rows[0].total, 1);
    const saldo = await pool.query(
      `SELECT on_hand FROM inventory_balances
       WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
      [ids.tenant, ids.product, ids.warehouse],
    );
    assert.equal(Number(saldo.rows[0].on_hand), 8);
  } finally {
    await limpiar(pool, ids.tenant);
    await pool.end();
  }
});

test('sin clave de idempotencia el cobro sigue funcionando como antes', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(), branch: randomUUID(), warehouse: randomUUID(),
    tax: randomUUID(), product: randomUUID(), register: randomUUID(),
    session: randomUUID(),
  };
  try {
    await sembrarEscenario(pool, ids);
    const app = createApp({ security: false, moduleGates: false });
    const venta = await request(app)
      .post('/api/pos/sales')
      .set('x-tenant-id', ids.tenant)
      .send(cuerpoDeVenta(ids));
    assert.equal(venta.status, 201);
  } finally {
    await limpiar(pool, ids.tenant);
    await pool.end();
  }
});
