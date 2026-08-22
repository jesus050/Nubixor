// Inteligencia de inventario: capital inmovilizado, riesgo de agotamiento y
// traslados sugeridos entre sucursales. Las tres responden preguntas que un
// empresario se hace mirando su bodega, así que lo que importa es que los
// números salgan bien, no que la consulta corra.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { bootstrapTenantAccess } from '../src/authorization.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;
const digest = (value) => createHash('sha256').update(value).digest('hex');

test('la inteligencia de inventario responde con números que cuadran', {
  skip: !connectionString,
}, async (t) => {
  const pool = new pg.Pool({ connectionString });
  const ids = {
    tenant: randomUUID(),
    user: randomUUID(),
    branchA: randomUUID(), branchB: randomUUID(),
    warehouseA: randomUUID(), warehouseB: randomUUID(),
    registerB: randomUUID(), sessionB: randomUUID(),
    tax: randomUUID(), category: randomUUID(),
    product: randomUUID(), quieto: randomUUID(),
  };
  const token = randomBytes(32).toString('base64url');

  try {
    await pool.query('INSERT INTO tenants(id, legal_name) VALUES($1,$2)', [ids.tenant, 'Empresa con dos sucursales']);
    await pool.query(
      `INSERT INTO users(id, email, full_name, status)
       VALUES($1,$2,'Propietario de prueba','ACTIVE')`,
      [ids.user, `inventario-${ids.user}@example.test`],
    );
    const access = await pool.connect();
    try {
      await access.query('BEGIN');
      await bootstrapTenantAccess(access, { tenantId: ids.tenant, ownerUserId: ids.user });
      await access.query('COMMIT');
    } catch (error) {
      await access.query('ROLLBACK');
      throw error;
    } finally {
      access.release();
    }
    await pool.query(
      `INSERT INTO auth_sessions(user_id, token_hash, csrf_token_hash, expires_at, active_tenant_id)
       VALUES($1,$2,$3,now() + interval '1 hour',$4)`,
      [ids.user, digest(token), digest(randomUUID()), ids.tenant],
    );
    for (const [id, nombre, codigo] of [
      [ids.branchA, 'Norte', 'NORTE'],
      [ids.branchB, 'Centro', 'CENTRO'],
    ]) {
      await pool.query(
        'INSERT INTO branches(id, tenant_id, name, code) VALUES($1,$2,$3,$4)',
        [id, ids.tenant, nombre, codigo],
      );
    }
    for (const [id, sucursal, codigo] of [
      [ids.warehouseA, ids.branchA, 'WH-NORTE'],
      [ids.warehouseB, ids.branchB, 'WH-CENTRO'],
    ]) {
      await pool.query(
        `INSERT INTO warehouses(id, tenant_id, branch_id, name, code, warehouse_type)
         VALUES($1,$2,$3,$4,$4,'DISPLAY')`,
        [id, ids.tenant, sucursal, codigo],
      );
    }
    await pool.query(
      `INSERT INTO tax_categories(id, tenant_id, code, name, treatment, rate)
       VALUES($1,$2,'IVA0','IVA 0','EXEMPT',0)`,
      [ids.tax, ids.tenant],
    );
    await pool.query(
      'INSERT INTO categories(id, tenant_id, name, code) VALUES($1,$2,$3,$4)',
      [ids.category, ids.tenant, 'Calzado', 'CALZ'],
    );
    // Producto que se vende en Centro y está parado en Norte: el caso de
    // traslado del manual.
    await pool.query(
      `INSERT INTO products(id, tenant_id, sku, name, cost, sale_price, category_id,
                            sales_tax_category_id, tax_category_id, tax_review_status)
       VALUES($1,$2,'MOVER-1','Producto que rota en Centro',50000,90000,$3,$4,$4,'REVIEWED')`,
      [ids.product, ids.tenant, ids.category, ids.tax],
    );
    // Producto sin ninguna venta: capital detenido puro.
    await pool.query(
      `INSERT INTO products(id, tenant_id, sku, name, cost, sale_price, category_id,
                            sales_tax_category_id, tax_category_id, tax_review_status)
       VALUES($1,$2,'QUIETO-1','Producto sin movimiento',20000,40000,$3,$4,$4,'REVIEWED')`,
      [ids.quieto, ids.tenant, ids.category, ids.tax],
    );
    // Norte: 80 unidades sin vender. Centro: 2 unidades y las vende.
    await pool.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand, reserved)
       VALUES($1,$2,$3,80,0), ($1,$2,$4,2,0), ($1,$5,$3,10,0)`,
      [ids.tenant, ids.product, ids.warehouseA, ids.warehouseB, ids.quieto],
    );
    await pool.query(
      `INSERT INTO cash_registers(id, tenant_id, branch_id, name, code)
       VALUES($1,$2,$3,'Caja Centro','CAJA-C')`,
      [ids.registerB, ids.tenant, ids.branchB],
    );
    await pool.query(
      `INSERT INTO cash_sessions(id, tenant_id, cash_register_id, status, opening_amount)
       VALUES($1,$2,$3,'OPEN',0)`,
      [ids.sessionB, ids.tenant, ids.registerB],
    );
    await pool.query(
      `UPDATE company_tax_profiles
       SET default_document_type = 'INTERNAL_RECEIPT', electronic_invoicing_required = FALSE
       WHERE company_id = $1`,
      [ids.tenant],
    );

    const app = createApp();
    const tenantRequest = (path) => request(app)
      .get(path)
      .set('Cookie', `megasuite_session=${token}`)
      .set('x-tenant-id', ids.tenant);
    // Centro vende 30 unidades en el período: rota, y le quedan 2.
    await pool.query(
      `INSERT INTO sales(id, tenant_id, cash_session_id, warehouse_id, payment_method,
                         subtotal, tax_total, total, status)
       VALUES($1,$2,$3,$4,'CASH',2700000,0,2700000,'COMPLETED')`,
      [randomUUID(), ids.tenant, ids.sessionB, ids.warehouseB],
    );
    const venta = await pool.query(
      'SELECT id FROM sales WHERE tenant_id = $1 LIMIT 1',
      [ids.tenant],
    );
    await pool.query(
      `INSERT INTO sale_items(tenant_id, sale_id, product_id, warehouse_id, sku_snapshot,
                              name_snapshot, quantity, unit_price, unit_cost, tax_rate,
                              tax_amount, line_total)
       VALUES($1,$2,$3,$4,'MOVER-1','Producto que rota en Centro',30,90000,50000,0,0,2700000)`,
      [ids.tenant, venta.rows[0].id, ids.product, ids.warehouseB],
    );

    await t.test('el capital inmovilizado suma existencias por costo', async () => {
      const respuesta = await tenantRequest('/api/commercial-planning/immobilized-capital?groupBy=category');
      assert.equal(respuesta.status, 200);
      // 82 unidades a 50.000 (4.100.000) + 10 a 20.000 (200.000).
      assert.equal(Number(respuesta.body.totals.immobilizedCapital), 4300000);
      assert.equal(Number(respuesta.body.totals.units), 92);
      const calzado = respuesta.body.groups.find((g) => g.group_label === 'Calzado');
      assert.equal(Number(calzado.immobilized_capital), 4300000);
      assert.equal(calzado.product_count, 2);
    });

    await t.test('agrupar por sucursal separa el dinero de cada una', async () => {
      const respuesta = await tenantRequest('/api/commercial-planning/immobilized-capital?groupBy=branch');
      const norte = respuesta.body.groups.find((g) => g.group_label === 'Norte');
      const centro = respuesta.body.groups.find((g) => g.group_label === 'Centro');
      assert.equal(Number(norte.immobilized_capital), 4200000);
      assert.equal(Number(centro.immobilized_capital), 100000);
    });

    await t.test('rechaza agrupamientos que no existen', async () => {
      const respuesta = await tenantRequest('/api/commercial-planning/immobilized-capital?groupBy=lo-que-sea');
      assert.equal(respuesta.status, 422);
      assert.equal(respuesta.body.code, 'INVALID_CAPITAL_GROUPING');
    });

    await t.test('sugiere mover del que no rota al que se está quedando sin', async () => {
      const respuesta = await tenantRequest('/api/commercial-planning/transfer-suggestions');
      assert.equal(respuesta.status, 200);
      const sugerencia = respuesta.body.suggestions
        .find((fila) => fila.product_id === ids.product);
      assert.ok(sugerencia, 'debe proponer mover el producto que rota en Centro');
      assert.equal(sugerencia.source_branch_name, 'Norte');
      assert.equal(sugerencia.destination_branch_name, 'Centro');
      assert.ok(Number(sugerencia.suggested_quantity) > 0);
      // Norte no vende nada, así que puede ceder sus 80; Centro necesita cubrir
      // treinta días al ritmo de una unidad por día.
      assert.ok(Number(sugerencia.suggested_quantity) <= 80);
    });

    await t.test('la sugerencia no ejecuta nada por su cuenta', async () => {
      const traslados = await pool.query(
        'SELECT COUNT(*)::integer total FROM inventory_transfer_orders WHERE company_id = $1',
        [ids.tenant],
      );
      assert.equal(traslados.rows[0].total, 0);
      const movimientos = await pool.query(
        `SELECT COUNT(*)::integer total FROM inventory_movements
         WHERE tenant_id = $1 AND movement_type LIKE 'TRANSFER%'`,
        [ids.tenant],
      );
      assert.equal(movimientos.rows[0].total, 0);
    });

    await t.test('el riesgo de agotamiento mide días, no unidades', async () => {
      const respuesta = await tenantRequest('/api/commercial-planning/stockout-risk');
      assert.equal(respuesta.status, 200);
      const enRiesgo = respuesta.body.products.find((fila) => fila.product_id === ids.product);
      assert.ok(enRiesgo, 'el producto que rota y casi se acaba debe aparecer');
      assert.equal(enRiesgo.coverage_class, 'RIESGO');
      assert.match(enRiesgo.coverage_note, /días de inventario/);
      // El que no se vende nunca no tiene ritmo con el que estimar: no es riesgo.
      assert.equal(
        respuesta.body.products.find((fila) => fila.product_id === ids.quieto),
        undefined,
      );
    });

    await t.test('el período de análisis se puede cambiar por petición', async () => {
      const corta = await tenantRequest('/api/commercial-planning/rotation?periodDays=7');
      assert.equal(corta.status, 200);
      assert.equal(corta.body.products[0].analysis_period_days, 7);

      const invalida = await tenantRequest('/api/commercial-planning/rotation?periodDays=0');
      assert.equal(invalida.status, 422);
      assert.equal(invalida.body.code, 'INVALID_ANALYSIS_PERIOD');
    });

    await t.test('el panel avisa del capital detenido y de las diferencias', async () => {
      const respuesta = await tenantRequest('/api/dashboard/attention');
      assert.equal(respuesta.status, 200);
      assert.equal(respuesta.body.stagnantProducts.total, 1);
      assert.equal(Number(respuesta.body.stagnantProducts.immobilizedCapital), 200000);
      assert.equal(respuesta.body.cashDifferences.total, 0);
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
