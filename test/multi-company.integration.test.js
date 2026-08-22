import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import express from 'express';
import request from 'supertest';
import { applyInventoryBalanceDelta } from '../src/modules/inventory.js';
import companiesRouter from '../src/modules/companies.js';
import posRouter from '../src/modules/pos.js';
import returnsRouter from '../src/modules/returns.js';
import expensesRouter from '../src/modules/expenses.js';
import thirdPartiesRouter from '../src/modules/third-parties.js';
import inventoryRouter from '../src/modules/inventory.js';
import moduleSettingsRouter from '../src/modules/module-settings.js';
import logisticsRouter from '../src/modules/logistics.js';
import productStructuresRouter from '../src/modules/product-structures.js';
import pricingRouter from '../src/modules/pricing.js';
import { closeDatabase, withTransaction } from '../src/db.js';
import { reverseJournalEntry } from '../src/accounting.js';
import { requireTenantModule } from '../src/module-gates.js';
import { errorHandler } from '../src/middleware.js';

const connectionString =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

async function expectConstraintFailure(client, name, work) {
  await client.query(`SAVEPOINT ${name}`);
  try {
    await work();
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    assert.fail('La base de datos aceptó una relación multiempresa inválida.');
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    assert.ok(
      ['23503', '23514'].includes(error.code),
      `Se esperaba una violación de FK o CHECK y se recibió ${error.code}.`,
    );
  } finally {
    await client.query('SET CONSTRAINTS ALL DEFERRED');
  }
}

test(
  'PostgreSQL aísla caja, productos, documentos y pagos por empresa',
  { skip: !connectionString },
  async () => {
    const pool = new pg.Pool({ connectionString });
    const client = await pool.connect();
    const ids = {
      user: randomUUID(),
      companyA: randomUUID(),
      companyB: randomUUID(),
      companyC: randomUUID(),
      branchA: randomUUID(),
      branchB: randomUUID(),
      branchC: randomUUID(),
      warehouseA: randomUUID(),
      warehouseB: randomUUID(),
      warehouseC: randomUUID(),
      taxA: randomUUID(),
      taxB: randomUUID(),
      taxC: randomUUID(),
      productA: randomUUID(),
      productB: randomUUID(),
      register: randomUUID(),
      checkoutSession: randomUUID(),
      cart: randomUUID(),
      otherCart: randomUUID(),
      legacyCashSession: randomUUID(),
      saleA: randomUUID(),
      saleB: randomUUID(),
      legacySale: randomUUID(),
      resolutionA: randomUUID(),
      resolutionB: randomUUID(),
      payment: randomUUID(),
      otherPayment: randomUUID(),
    };

    try {
      await client.query('BEGIN');
      await client.query('SET CONSTRAINTS ALL DEFERRED');

      const migrations = await client.query(
        `SELECT name
         FROM schema_migrations
         WHERE name IN (
           '021_multi_company_pos_foundation.sql',
           '022_checkout_membership_guards.sql',
           '023_checkout_payment_scope_guards.sql',
           '024_local_two_company_demo.sql',
           '025_crative_internal_receipt_no_vat.sql',
           '026_shared_demo_cash_register.sql',
           '027_sale_payment_records.sql',
           '028_display_inventory_locations.sql',
           '029_display_replenishment_rules.sql',
           '030_electronic_billing_connector.sql',
           '031_demo_billing_sandbox.sql'
         )`,
      );
      assert.equal(migrations.rowCount, 11);

      const crativeFiscalSetup = await client.query(
        `SELECT ctp.electronic_invoicing_required,
                ctp.default_document_type,
                ctp.vat_responsibility
         FROM company_tax_profiles ctp
         WHERE ctp.company_id = '21935393-1ae3-48f2-9467-13fa37620fe2'`,
      );
      assert.equal(crativeFiscalSetup.rows[0].electronic_invoicing_required, false);
      assert.equal(crativeFiscalSetup.rows[0].default_document_type, 'INTERNAL_RECEIPT');
      assert.equal(crativeFiscalSetup.rows[0].vat_responsibility, 'NOT_RESPONSIBLE_FOR_VAT');

      await client.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Cajero integración','ACTIVE')`,
        [ids.user, `cashier-${ids.user}@example.test`],
      );
      await client.query(
        `INSERT INTO tenants(id, legal_name, tax_id)
         VALUES
           ($1,'Empresa A',$4),
           ($2,'Empresa B',$5),
           ($3,'Empresa C',$6)`,
        [
          ids.companyA,
          ids.companyB,
          ids.companyC,
          `NIT-A-${ids.companyA}`,
          `NIT-B-${ids.companyB}`,
          `NIT-C-${ids.companyC}`,
        ],
      );
      const taxProfiles = await client.query(
        `SELECT company_id
         FROM company_tax_profiles
         WHERE company_id = ANY($1::uuid[])`,
        [[ids.companyA, ids.companyB, ids.companyC]],
      );
      assert.equal(taxProfiles.rowCount, 3);
      await client.query(
        `INSERT INTO branches(id, tenant_id, name, code)
         VALUES
           ($1,$4,'Sucursal A','A'),
           ($2,$5,'Sucursal B','B'),
           ($3,$6,'Sucursal C','C')`,
        [
          ids.branchA,
          ids.branchB,
          ids.branchC,
          ids.companyA,
          ids.companyB,
          ids.companyC,
        ],
      );
      await client.query(
        `INSERT INTO warehouses(id, tenant_id, branch_id, name, code)
         VALUES
           ($1,$7,$4,'Bodega A','A'),
           ($2,$8,$5,'Bodega B','B'),
           ($3,$9,$6,'Bodega C','C')`,
        [
          ids.warehouseA,
          ids.warehouseB,
          ids.warehouseC,
          ids.branchA,
          ids.branchB,
          ids.branchC,
          ids.companyA,
          ids.companyB,
          ids.companyC,
        ],
      );
      await client.query(
        `INSERT INTO tax_categories(
           id, tenant_id, code, name, treatment, rate
         )
         VALUES
           ($1,$4,'IVA-A','IVA A','TAXED',19),
           ($2,$5,'IVA-B','IVA B','TAXED',5),
           ($3,$6,'IVA-C','IVA C','EXCLUDED',0)`,
        [
          ids.taxA,
          ids.taxB,
          ids.taxC,
          ids.companyA,
          ids.companyB,
          ids.companyC,
        ],
      );
      await client.query(
        `INSERT INTO tenant_users(
           tenant_id, user_id, role_code, status, joined_at
         )
         VALUES
           ($1,$3,'CASHIER','ACTIVE',now()),
           ($2,$3,'CASHIER','ACTIVE',now())`,
        [ids.companyA, ids.companyB, ids.user],
      );
      await client.query(
        `INSERT INTO products(
           id, tenant_id, sku, name, cost, sale_price,
           sales_tax_category_id, tax_review_status,
           owner_company_id, seller_company_id, default_warehouse_id,
           tax_category_id, active
         )
         VALUES
           ($1,$3,'PROD-A','Producto A',40,100,$5,'REVIEWED',$3,$3,$7,$5,TRUE),
           ($2,$4,'PROD-B','Producto B',80,200,$6,'REVIEWED',$4,$4,$8,$6,TRUE)`,
        [
          ids.productA,
          ids.productB,
          ids.companyA,
          ids.companyB,
          ids.taxA,
          ids.taxB,
          ids.warehouseA,
          ids.warehouseB,
        ],
      );
      const initialBalance = await applyInventoryBalanceDelta(client, {
        tenantId: ids.companyA,
        productId: ids.productA,
        warehouseId: ids.warehouseA,
        quantity: 20,
      });
      assert.equal(Number(initialBalance.rows[0].on_hand), 20);

      const correctedBalance = await applyInventoryBalanceDelta(client, {
        tenantId: ids.companyA,
        productId: ids.productA,
        warehouseId: ids.warehouseA,
        quantity: -5,
      });
      assert.equal(Number(correctedBalance.rows[0].on_hand), 15);
      await client.query(
        `INSERT INTO cash_registers(
           id, tenant_id, branch_id, name, code
         )
         VALUES($1,$2,$3,'Caja física compartida',$4)`,
        [
          ids.register,
          ids.companyA,
          ids.branchA,
          `REG-${ids.register.slice(0, 8)}`,
        ],
      );
      await client.query(
        `INSERT INTO cash_register_companies(
           cash_register_id, company_id, default_warehouse_id
         )
         VALUES($1,$2,$4),($1,$3,$5)`,
        [
          ids.register,
          ids.companyA,
          ids.companyB,
          ids.warehouseA,
          ids.warehouseB,
        ],
      );
      await client.query(
        `INSERT INTO checkout_sessions(
           id, cash_register_id, branch_id, cashier_id
         )
         VALUES($1,$2,$3,$4)`,
        [ids.checkoutSession, ids.register, ids.branchA, ids.user],
      );
      await client.query(
        `INSERT INTO cash_session_company_balances(
           checkout_session_id, company_id, opening_amount
         )
         VALUES($1,$2,100000),($1,$3,50000)`,
        [ids.checkoutSession, ids.companyA, ids.companyB],
      );

      await expectConstraintFailure(
        client,
        'unauthorized_company_balance',
        () => client.query(
          `INSERT INTO cash_session_company_balances(
             checkout_session_id, company_id, opening_amount
           )
           VALUES($1,$2,0)`,
          [ids.checkoutSession, ids.companyC],
        ),
      );

      await client.query(
        `INSERT INTO checkout_carts(
           id, checkout_session_id, idempotency_key
         )
         VALUES($1,$3,$4),($2,$3,$5)`,
        [
          ids.cart,
          ids.otherCart,
          ids.checkoutSession,
          `cart-${ids.cart}`,
          `cart-${ids.otherCart}`,
        ],
      );
      await client.query(
        `INSERT INTO checkout_items(
           checkout_cart_id, product_id, owner_company_id, seller_company_id,
           warehouse_id, quantity, unit_price, tax_category_id,
           tax_rate_snapshot, tax_amount, subtotal, total
         )
         VALUES
           ($1,$2,$4,$4,$6,1,100,$8,19,15.97,84.03,100),
           ($1,$3,$5,$5,$7,1,200,$9,5,9.52,190.48,200)`,
        [
          ids.cart,
          ids.productA,
          ids.productB,
          ids.companyA,
          ids.companyB,
          ids.warehouseA,
          ids.warehouseB,
          ids.taxA,
          ids.taxB,
        ],
      );
      const sellerGroups = await client.query(
        `SELECT seller_company_id, SUM(total) total
         FROM checkout_items
         WHERE checkout_cart_id = $1
         GROUP BY seller_company_id
         ORDER BY seller_company_id`,
        [ids.cart],
      );
      assert.equal(sellerGroups.rowCount, 2);
      assert.deepEqual(
        sellerGroups.rows.map((row) => Number(row.total)).sort((a, b) => a - b),
        [100, 200],
      );

      await expectConstraintFailure(
        client,
        'tampered_seller',
        () => client.query(
          `INSERT INTO checkout_items(
             checkout_cart_id, product_id, owner_company_id, seller_company_id,
             warehouse_id, quantity, unit_price, tax_category_id,
             tax_rate_snapshot, tax_amount, subtotal, total
           )
           VALUES($1,$2,$3,$4,$5,1,100,$6,5,4.76,95.24,100)`,
          [
            ids.cart,
            ids.productA,
            ids.companyA,
            ids.companyB,
            ids.warehouseA,
            ids.taxB,
          ],
        ),
      );

      await expectConstraintFailure(
        client,
        'wrong_owner_warehouse',
        () => client.query(
          `UPDATE products
           SET default_warehouse_id = $1
           WHERE id = $2`,
          [ids.warehouseB, ids.productA],
        ),
      );

      await client.query(
        `INSERT INTO cash_sessions(
           id, tenant_id, cash_register_id, opening_amount, opened_by
         )
         VALUES($1,$2,$3,0,$4)`,
        [ids.legacyCashSession, ids.companyA, ids.register, ids.user],
      );
      await client.query(
        `INSERT INTO sales(
           id, tenant_id, company_id, seller_company_id, checkout_cart_id,
           idempotency_key, cash_session_id, warehouse_id, payment_method,
           subtotal, tax_total, total, created_by
         )
         VALUES
           ($1,$3,$3,$3,$5,'sale-a',$6,$7,'CASH',84.03,15.97,100,$9),
           ($2,$4,$4,$4,$5,'sale-b',$6,$8,'CASH',190.48,9.52,200,$9)`,
        [
          ids.saleA,
          ids.saleB,
          ids.companyA,
          ids.companyB,
          ids.cart,
          ids.legacyCashSession,
          ids.warehouseA,
          ids.warehouseB,
          ids.user,
        ],
      );

      const legacySale = await client.query(
        `INSERT INTO sales(
           id, tenant_id, cash_session_id, warehouse_id, payment_method,
           subtotal, tax_total, total, created_by
         )
         VALUES($1,$2,$3,$4,'CARD',84.03,15.97,100,$5)
         RETURNING company_id, seller_company_id, document_type`,
        [
          ids.legacySale,
          ids.companyA,
          ids.legacyCashSession,
          ids.warehouseA,
          ids.user,
        ],
      );
      assert.equal(legacySale.rows[0].company_id, ids.companyA);
      assert.equal(legacySale.rows[0].seller_company_id, ids.companyA);
      assert.equal(legacySale.rows[0].document_type, 'INTERNAL_RECEIPT');

      const legacyItem = await client.query(
        `INSERT INTO sale_items(
           tenant_id, sale_id, product_id, sku_snapshot, name_snapshot,
           quantity, unit_price, unit_cost, tax_rate, tax_amount, line_total
         )
         VALUES($1,$2,$3,'PROD-A','Producto A',1,100,40,19,15.97,100)
         RETURNING owner_company_id, seller_company_id, warehouse_id`,
        [ids.companyA, ids.legacySale, ids.productA],
      );
      assert.equal(legacyItem.rows[0].owner_company_id, ids.companyA);
      assert.equal(legacyItem.rows[0].seller_company_id, ids.companyA);
      assert.equal(legacyItem.rows[0].warehouse_id, ids.warehouseA);

      const legacyMovement = await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, product_id, warehouse_id, movement_type, quantity,
           unit_cost, reason, created_by
         )
         VALUES($1,$2,$3,'TEST_COMPATIBILITY',-1,40,'Prueba rollback',$4)
         RETURNING company_id`,
        [ids.companyA, ids.productA, ids.warehouseA, ids.user],
      );
      assert.equal(legacyMovement.rows[0].company_id, ids.companyA);

      const legacyAudit = await client.query(
        `INSERT INTO audit_events(
           tenant_id, actor_user_id, action, entity_type, entity_id
         )
         VALUES($1,$2,'test.compatibility','sale',$3)
         RETURNING company_id`,
        [ids.companyA, ids.user, ids.legacySale],
      );
      assert.equal(legacyAudit.rows[0].company_id, ids.companyA);

      await client.query(
        `INSERT INTO billing_resolutions(
           id, company_id, branch_id, prefix, number_from, number_to,
           current_number, valid_from, valid_until
         )
         VALUES
           ($1,$3,$5,'A',1,1000,1,CURRENT_DATE,CURRENT_DATE + 365),
           ($2,$4,$6,'B',1,1000,1,CURRENT_DATE,CURRENT_DATE + 365)`,
        [
          ids.resolutionA,
          ids.resolutionB,
          ids.companyA,
          ids.companyB,
          ids.branchA,
          ids.branchB,
        ],
      );
      await client.query(
        `INSERT INTO electronic_documents(
           company_id, sale_id, billing_resolution_id, document_type,
           prefix, document_number
         )
         VALUES
           ($1,$3,$5,'ELECTRONIC_INVOICE','A',1),
           ($2,$4,$6,'ELECTRONIC_INVOICE','B',1)`,
        [
          ids.companyA,
          ids.companyB,
          ids.saleA,
          ids.saleB,
          ids.resolutionA,
          ids.resolutionB,
        ],
      );

      await expectConstraintFailure(
        client,
        'wrong_resolution_company',
        () => client.query(
          `INSERT INTO electronic_documents(
             company_id, sale_id, billing_resolution_id, document_type,
             prefix, document_number
           )
           VALUES($1,$2,$3,'INTERNAL_RECEIPT','X',99)`,
          [ids.companyA, ids.saleA, ids.resolutionB],
        ),
      );

      await client.query(
        `INSERT INTO payments(
           id, checkout_cart_id, receiving_company_id, payment_mode,
           method, amount, idempotency_key, created_by
         )
         VALUES($1,$2,$3,'GLOBAL','CASH',300,$4,$5)`,
        [
          ids.payment,
          ids.cart,
          ids.companyA,
          `payment-${ids.payment}`,
          ids.user,
        ],
      );

      await expectConstraintFailure(
        client,
        'unauthorized_payment_receiver',
        () => client.query(
          `INSERT INTO payments(
             checkout_cart_id, receiving_company_id, payment_mode,
             method, amount, idempotency_key, created_by
           )
           VALUES($1,$2,'GLOBAL','CASH',10,$3,$4)`,
          [
            ids.cart,
            ids.companyC,
            `unauthorized-${ids.payment}`,
            ids.user,
          ],
        ),
      );

      await expectConstraintFailure(
        client,
        'cross_cart_allocation',
        async () => {
          await client.query(
            `INSERT INTO payments(
               id, checkout_cart_id, receiving_company_id, payment_mode,
               method, amount, idempotency_key, created_by
             )
             VALUES($1,$2,$3,'GLOBAL','CASH',100,$4,$5)`,
            [
              ids.otherPayment,
              ids.otherCart,
              ids.companyA,
              `other-payment-${ids.otherPayment}`,
              ids.user,
            ],
          );
          await client.query(
            `INSERT INTO payment_allocations(
               payment_id, sale_id, company_id, allocated_amount
             )
             VALUES($1,$2,$3,100)`,
            [ids.otherPayment, ids.saleA, ids.companyA],
          );
        },
      );
      await client.query(
        `INSERT INTO payment_allocations(
           payment_id, sale_id, company_id, allocated_amount
         )
         VALUES($1,$2,$4,100),($1,$3,$5,200)`,
        [
          ids.payment,
          ids.saleA,
          ids.saleB,
          ids.companyA,
          ids.companyB,
        ],
      );
      await client.query('SET CONSTRAINTS ALL IMMEDIATE');
      await client.query('SET CONSTRAINTS ALL DEFERRED');

      await client.query(
        `INSERT INTO intercompany_settlements(
           checkout_cart_id, from_company_id, to_company_id, amount
         )
         VALUES($1,$2,$3,200)`,
        [ids.cart, ids.companyA, ids.companyB],
      );
      const settlement = await client.query(
        `SELECT amount, status
         FROM intercompany_settlements
         WHERE checkout_cart_id = $1`,
        [ids.cart],
      );
      assert.equal(Number(settlement.rows[0].amount), 200);
      assert.equal(settlement.rows[0].status, 'PENDING');

      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  },
);

test(
  'el alta guiada crea empresa, acceso, sucursal, bodega, caja e impuestos',
  { skip: !connectionString },
  async () => {
    const pool = new pg.Pool({ connectionString });
    const ownerId = randomUUID();
    const approverId = randomUUID();
    const cashierId = randomUUID();
    const email = `owner-${ownerId}@example.test`;
    let companyId = null;
    try {
      await pool.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Propietario de prueba','ACTIVE')`,
        [ownerId, email],
      );
      const application = express();
      application.use(express.json());
      application.use((req, _res, next) => {
        req.context = {
          tenantId: req.header('x-tenant-id') || null,
          userId: req.header('x-user-id') || ownerId,
          authenticated: true,
          requestId: randomUUID(),
          branchId: null,
        };
        next();
      });
      application.use('/api/companies', companiesRouter);
      application.use('/api/pos', returnsRouter);
      application.use('/api/pos', posRouter);
      application.use('/api/expenses', expensesRouter);
      application.use('/api/third-parties', thirdPartiesRouter);
      application.use('/api/module-settings', moduleSettingsRouter);
      application.use('/api/product-structures', productStructuresRouter);
      application.use('/api/pricing', pricingRouter);
      application.use(
        '/api/inventory',
        (req, res, next) => {
          if (/^\/(replenishments|incidents|transfer-orders|transfers)(?:\/|$)/.test(req.path)) {
            return requireTenantModule('LOGISTICS')(req, res, next);
          }
          return next();
        },
        inventoryRouter,
      );
      application.use(
        '/api/logistics',
        requireTenantModule('LOGISTICS'),
        logisticsRouter,
      );
      application.use(errorHandler);

      const response = await request(application)
        .post('/api/companies')
        .send({
          legalName: 'Empresa temporal integración',
          tradeName: 'Temporal',
          taxId: `TEST-${ownerId.slice(0, 18)}`,
          billingMode: 'ELECTRONIC_INVOICE',
        })
        .expect(201);
      companyId = response.body.id;
      assert.equal(response.body.default_document_type, 'ELECTRONIC_INVOICE');
      assert.equal(response.body.electronic_invoicing_required, true);
      assert.equal(response.body.setup.standardTaxes, 3);

      const setup = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM tenant_users WHERE tenant_id = $1) memberships,
           (SELECT COUNT(*) FROM branches WHERE tenant_id = $1) branches,
           (SELECT COUNT(*) FROM warehouses WHERE tenant_id = $1) warehouses,
           (SELECT COUNT(*) FROM cash_registers WHERE tenant_id = $1) registers,
           (SELECT COUNT(*) FROM tax_categories WHERE tenant_id = $1) taxes`,
        [companyId],
      );
      assert.deepEqual(
        {
          memberships: Number(setup.rows[0].memberships),
          branches: Number(setup.rows[0].branches),
          warehouses: Number(setup.rows[0].warehouses),
          registers: Number(setup.rows[0].registers),
          taxes: Number(setup.rows[0].taxes),
        },
        { memberships: 1, branches: 1, warehouses: 2, registers: 1, taxes: 3 },
      );
      // La recepción la opera el propietario, pero la aprobación debe hacerla
      // una segunda persona autorizada. Así la prueba conserva la segregación
      // de funciones que exige el flujo real de logística.
      await pool.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Aprobador de prueba','ACTIVE')`,
        [approverId, `approver-${approverId}@example.test`],
      );
      await pool.query(
        `INSERT INTO tenant_users(tenant_id, user_id, role_code, role_id, status, joined_at)
         SELECT $1,$2,'OWNER',id,'ACTIVE',now()
         FROM roles
         WHERE tenant_id = $1 AND code = 'OWNER'`,
        [companyId, approverId],
      );
      assert.equal(response.body.setup.warehouse.warehouse_type, 'AVAILABLE');
      assert.equal(response.body.setup.displayWarehouse.warehouse_type, 'DISPLAY');

      const initialModules = await request(application)
        .get('/api/module-settings')
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.equal(initialModules.body[0].code, 'LOGISTICS');
      assert.equal(initialModules.body[0].enabled, true);

      await request(application)
        .patch('/api/module-settings/LOGISTICS')
        .set('x-tenant-id', companyId)
        .send({ enabled: false })
        .expect(200);
      const blockedLogistics = await request(application)
        .get('/api/inventory/replenishments')
        .set('x-tenant-id', companyId)
        .expect(403);
      assert.equal(blockedLogistics.body.code, 'TENANT_MODULE_DISABLED');
      await request(application)
        .get('/api/logistics/overview')
        .set('x-tenant-id', companyId)
        .expect(403);
      await request(application)
        .get('/api/inventory/summary')
        .set('x-tenant-id', companyId)
        .expect(200);
      await request(application)
        .patch('/api/module-settings/LOGISTICS')
        .set('x-tenant-id', companyId)
        .send({ enabled: true })
        .expect(200);

      const tax = await pool.query(
        `SELECT id FROM tax_categories WHERE tenant_id = $1 AND code = 'IVA19'`,
        [companyId],
      );
      const product = await pool.query(
        `INSERT INTO products(
           tenant_id, sku, name, sales_tax_category_id, cost, sale_price,
           tax_review_status, active
         )
         VALUES($1,'TEST-001','Producto de integración',$2,1000,2000,'REVIEWED',TRUE)
         RETURNING id`,
        [companyId, tax.rows[0].id],
      );
      await pool.query(
        `INSERT INTO inventory_balances(
           tenant_id, product_id, warehouse_id, on_hand, reserved
         )
         VALUES($1,$2,$3,5,0),($1,$2,$4,3,0)`,
        [
          companyId,
          product.rows[0].id,
          response.body.setup.warehouse.id,
          response.body.setup.displayWarehouse.id,
        ],
      );

      const structuredProducts = await pool.query(
        `INSERT INTO products(
           tenant_id,sku,name,sales_tax_category_id,cost,sale_price,
           tax_review_status,active
         )
         VALUES
           ($1,'CAM-BASE','Camiseta deportiva',$2,12000,25000,'REVIEWED',TRUE),
           ($1,'BOLSA-KIT','Bolsa para kit',$2,1500,3000,'REVIEWED',TRUE),
           ($1,'KIT-DEMO','Kit de demostración',$2,0,40000,'REVIEWED',TRUE)
         RETURNING id,sku`,
        [companyId, tax.rows[0].id],
      );
      const structuredBySku = Object.fromEntries(
        structuredProducts.rows.map((item) => [item.sku, item.id]),
      );
      await pool.query(
        `INSERT INTO inventory_balances(
           tenant_id,product_id,warehouse_id,on_hand,reserved
         )
         VALUES($1,$2,$4,5,0),($1,$3,$4,6,0)`,
        [
          companyId,
          structuredBySku['CAM-BASE'],
          structuredBySku['BOLSA-KIT'],
          response.body.setup.displayWarehouse.id,
        ],
      );
      const redVariant = await request(application)
        .post(`/api/product-structures/${structuredBySku['CAM-BASE']}/variants`)
        .set('x-tenant-id', companyId)
        .send({
          optionName: 'Color',
          optionValue: 'Rojo',
          sku: 'CAM-ROJA',
          salePrice: 27000,
          warehouseId: response.body.setup.displayWarehouse.id,
          initialQuantity: 3,
        })
        .expect(201);
      assert.deepEqual(redVariant.body.variant_attributes, { Color: 'Rojo' });
      const parentAfterSplit = await pool.query(
        `SELECT product_kind,active FROM products
         WHERE tenant_id=$1 AND id=$2`,
        [companyId, structuredBySku['CAM-BASE']],
      );
      assert.equal(parentAfterSplit.rows[0].product_kind, 'VARIANT_PARENT');
      // El padre sigue activo para que Caja pueda abrir el selector de color;
      // las existencias se controlan únicamente en las variantes.
      assert.equal(parentAfterSplit.rows[0].active, true);
      const variantStock = await pool.query(
        `SELECT on_hand FROM inventory_balances
         WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
        [
          companyId,
          redVariant.body.id,
          response.body.setup.displayWarehouse.id,
        ],
      );
      assert.equal(Number(variantStock.rows[0].on_hand), 3);

      await request(application)
        .put(`/api/product-structures/${structuredBySku['KIT-DEMO']}/combo`)
        .set('x-tenant-id', companyId)
        .send({
          components: [
            { productId: redVariant.body.id, quantity: 1 },
            { productId: structuredBySku['BOLSA-KIT'], quantity: 2 },
          ],
        })
        .expect(200);
      const comboAssembly = await request(application)
        .post(
          `/api/product-structures/${structuredBySku['KIT-DEMO']}/combo/assemble`,
        )
        .set('x-tenant-id', companyId)
        .send({
          warehouseId: response.body.setup.displayWarehouse.id,
          quantity: 2,
        })
        .expect(201);
      assert.equal(Number(comboAssembly.body.quantity), 2);
      assert.equal(Number(comboAssembly.body.unitCost), 15000);
      const structure = await request(application)
        .get(`/api/product-structures/${structuredBySku['KIT-DEMO']}`)
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.equal(structure.body.components.length, 2);
      assert.equal(structure.body.assemblies.length, 1);
      const comboCatalog = await request(application)
        .get('/api/product-structures/combos')
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.equal(comboCatalog.body.length, 1);
      assert.equal(Number(comboCatalog.body[0].display_stock), 2);
      assert.equal(comboCatalog.body[0].cashier_ready, true);
      const assembledBalances = await pool.query(
        `SELECT product_id,on_hand FROM inventory_balances
         WHERE tenant_id=$1 AND warehouse_id=$2
           AND product_id=ANY($3::uuid[])`,
        [
          companyId,
          response.body.setup.displayWarehouse.id,
          [
            redVariant.body.id,
            structuredBySku['BOLSA-KIT'],
            structuredBySku['KIT-DEMO'],
          ],
        ],
      );
      const stockByProduct = Object.fromEntries(
        assembledBalances.rows.map((item) => [
          item.product_id,
          Number(item.on_hand),
        ]),
      );
      assert.equal(stockByProduct[redVariant.body.id], 1);
      assert.equal(stockByProduct[structuredBySku['BOLSA-KIT']], 2);
      assert.equal(stockByProduct[structuredBySku['KIT-DEMO']], 2);
      const wholesaleList = await pool.query(
        `SELECT id FROM sales_price_lists
         WHERE tenant_id=$1 AND code='WHOLESALE'`,
        [companyId],
      );
      await request(application)
        .put('/api/pricing/product-prices')
        .set('x-tenant-id', companyId)
        .send({
          productId: structuredBySku['KIT-DEMO'],
          priceListId: wholesaleList.rows[0].id,
          minQuantity: 12,
          unitPrice: 32000,
        })
        .expect(200);
      await request(application)
        .post('/api/pricing/promotions')
        .set('x-tenant-id', companyId)
        .send({
          productId: structuredBySku['KIT-DEMO'],
          name: 'Promoción de integración',
          discountType: 'PERCENT',
          discountValue: 10,
          minQuantity: 1,
          startsAt: new Date(Date.now() - 60000).toISOString(),
          endsAt: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(201);
      const pricingOverview = await request(application)
        .get('/api/pricing/overview')
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.equal(pricingOverview.body.lists.length, 3);
      assert.equal(pricingOverview.body.prices.length, 1);
      assert.equal(pricingOverview.body.promotions.length, 1);

      const cashSession = await pool.query(
        `INSERT INTO cash_sessions(
           tenant_id, cash_register_id, opening_amount, opened_by
         )
         VALUES($1,$2,0,$3)
         RETURNING id`,
        [companyId, response.body.setup.register.id, ownerId],
      );
      const supplier = await pool.query(
        `INSERT INTO suppliers(tenant_id, name, tax_id)
         VALUES($1,'Servicios de integración','900999001-1')
         RETURNING id`,
        [companyId],
      );
      const logisticsBatch = await request(application)
        .post('/api/logistics/batches')
        .set('x-tenant-id', companyId)
        .send({
          title: 'Recepción controlada de integración',
          branchId: response.body.setup.branch.id,
          warehouseId: response.body.setup.warehouse.id,
          supplierId: supplier.rows[0].id,
          supplierInvoiceNumber: 'FV-LOG-001',
          receivedOn: new Date().toISOString().slice(0, 10),
        })
        .expect(201);
      assert.equal(logisticsBatch.body.status, 'COUNTING');
      const logisticsItem = await request(application)
        .post(`/api/logistics/batches/${logisticsBatch.body.id}/scan`)
        .set('x-tenant-id', companyId)
        .send({ sku: 'TEST-001', quantity: 2, expectedQuantity: 2 })
        .expect(201);
      assert.equal(Number(logisticsItem.body.counted_quantity), 2);
      await request(application)
        .post(`/api/logistics/batches/${logisticsBatch.body.id}/finish-count`)
        .set('x-tenant-id', companyId)
        .send({})
        .expect(200);
      await request(application)
        .patch(
          `/api/logistics/batches/${logisticsBatch.body.id}/items/${logisticsItem.body.id}/pricing`,
        )
        .set('x-tenant-id', companyId)
        .send({ unitCost: 1000, proposedPrice: 2000, movementMode: 'ADD' })
        .expect(200);
      await request(application)
        .post(`/api/logistics/batches/${logisticsBatch.body.id}/submit-approval`)
        .set('x-tenant-id', companyId)
        .send({})
        .expect(200);
      const completedLogisticsBatch = await request(application)
        .post(`/api/logistics/batches/${logisticsBatch.body.id}/approve`)
        .set('x-tenant-id', companyId)
        .set('x-user-id', approverId)
        .send({ reason: 'Aprobación de integración' })
        .expect(200);
      assert.equal(completedLogisticsBatch.body.status, 'COMPLETED');
      await request(application)
        .post(
          `/api/logistics/batches/${logisticsBatch.body.id}/items/${logisticsItem.body.id}/label-printed`,
        )
        .set('x-tenant-id', companyId)
        .send({ quantity: 2 })
        .expect(200);
      const labelTracking = await pool.query(
        `SELECT print_count,label_quantity_printed
         FROM logistics_intake_items
         WHERE tenant_id=$1 AND id=$2`,
        [companyId, logisticsItem.body.id],
      );
      assert.equal(Number(labelTracking.rows[0].print_count), 1);
      assert.equal(Number(labelTracking.rows[0].label_quantity_printed), 2);
      const savedLabelSettings = await request(application)
        .patch('/api/logistics/labels/settings')
        .set('x-tenant-id', companyId)
        .send({
          widthMm: 50,
          heightMm: 30,
          showCompany: true,
          showProduct: true,
          showPrice: true,
          showSku: true,
          showBarcode: true,
          footerText: 'Calidad garantizada',
        })
        .expect(200);
      assert.equal(Number(savedLabelSettings.body.barcodeMarginMm), 1);
      assert.equal(savedLabelSettings.body.textAlign, 'center');
      const logisticsStock = await pool.query(
        `SELECT on_hand
         FROM inventory_balances
         WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
        [
          companyId,
          product.rows[0].id,
          response.body.setup.warehouse.id,
        ],
      );
      assert.equal(Number(logisticsStock.rows[0].on_hand), 7);
      const logisticsOverview = await request(application)
        .get('/api/logistics/overview')
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.equal(Number(logisticsOverview.body.summary.completed_month), 1);
      assert.equal(Number(logisticsOverview.body.summary.labels_pending), 0);
      assert.equal(Number(logisticsOverview.body.labelSettings.heightMm), 30);
      await request(application)
        .get(`/api/logistics/batches/${logisticsBatch.body.id}/export.csv`)
        .set('x-tenant-id', companyId)
        .expect(200)
        .expect('Content-Type', /text\/csv/);
      const partyDirectory = await request(application)
        .get('/api/third-parties')
        .set('x-tenant-id', companyId)
        .expect(200);
      const supplierParty = partyDirectory.body.find(
        (party) => party.supplier_id === supplier.rows[0].id,
      );
      assert.ok(supplierParty);
      assert.equal(supplierParty.is_supplier, true);
      assert.equal(supplierParty.is_customer, false);
      const dualParty = await request(application)
        .patch(`/api/third-parties/${supplierParty.id}`)
        .set('x-tenant-id', companyId)
        .send({
          partyType: 'ORGANIZATION',
          name: 'Servicios de integración',
          documentType: 'NIT',
          documentNumber: '900999001-1',
          isCustomer: true,
          isSupplier: true,
          paymentTermsDays: 30,
          reason: 'Validación de tercero con doble relación',
        })
        .expect(200);
      assert.equal(dualParty.body.is_customer, true);
      assert.equal(dualParty.body.is_supplier, true);
      assert.ok(dualParty.body.customer_id);
      const expenseSetup = await request(application)
        .get('/api/expenses/setup')
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.ok(expenseSetup.body.categories.length >= 7);
      assert.ok(expenseSetup.body.costCenters.length >= 1);
      const expense = await request(application)
        .post('/api/expenses')
        .set('x-tenant-id', companyId)
        .send({
          branchId: response.body.setup.branch.id,
          costCenterId: expenseSetup.body.costCenters[0].id,
          categoryId: expenseSetup.body.categories[0].id,
          supplierId: supplier.rows[0].id,
          supplierDocumentNumber: 'FV-EXP-001',
          description: 'Servicio operativo de integración',
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date().toISOString().slice(0, 10),
          subtotal: 100000,
          taxTotal: 19000,
          recurring: false,
        })
        .expect(201);
      assert.equal(expense.body.status, 'SUBMITTED');
      const approvedExpense = await request(application)
        .post(`/api/expenses/${expense.body.id}/approve`)
        .set('x-tenant-id', companyId)
        .send({ notes: 'Aprobado en prueba de integración' })
        .expect(200);
      assert.equal(approvedExpense.body.status, 'APPROVED');
      const paidExpense = await request(application)
        .post(`/api/expenses/${expense.body.id}/payments`)
        .set('x-tenant-id', companyId)
        .send({
          paymentDate: new Date().toISOString().slice(0, 10),
          amount: 119000,
          paymentMethod: 'CASH',
          cashSessionId: cashSession.rows[0].id,
          reference: 'EGRESO-EXP-001',
          notes: 'Pago controlado de integración',
        })
        .expect(201);
      assert.equal(paidExpense.body.expense.status, 'PAID');
      const expenseAccounting = await pool.query(
        `SELECT source_type, status, total_debit, total_credit
         FROM journal_entries
         WHERE tenant_id = $1
           AND source_type IN ('BUSINESS_EXPENSE','EXPENSE_PAYMENT')
           AND source_id IN ($2,$3)
         ORDER BY source_type`,
        [companyId, expense.body.id, paidExpense.body.payment.id],
      );
      assert.equal(expenseAccounting.rowCount, 2);
      expenseAccounting.rows.forEach((entry) => {
        assert.equal(entry.status, 'POSTED');
        assert.equal(Number(entry.total_debit), Number(entry.total_credit));
      });
      const cashExpense = await pool.query(
        `SELECT amount, movement_type
         FROM cash_movements
         WHERE tenant_id = $1 AND cash_session_id = $2
           AND reference = 'EGRESO-EXP-001'`,
        [companyId, cashSession.rows[0].id],
      );
      assert.equal(cashExpense.rows[0].movement_type, 'EXPENSE');
      assert.equal(Number(cashExpense.rows[0].amount), 119000);
      const sale = await request(application)
        .post('/api/pos/sales')
        .set('x-tenant-id', companyId)
        .send({
          cashSessionId: cashSession.rows[0].id,
          warehouseId: response.body.setup.warehouse.id,
          paymentMethod: 'CARD',
          saleTerms: 'IMMEDIATE',
          items: [{ productId: product.rows[0].id, quantity: 1 }],
        })
        .expect(409);
      assert.equal(sale.body.code, 'BILLING_RESOLUTION_REQUIRED');

      const advancedCatalog = await request(application)
        .get('/api/pos/shared-catalog')
        .query({
          cashSessionId: cashSession.rows[0].id,
          stockSource: 'AVAILABLE',
        })
        .set('x-tenant-id', companyId)
        .expect(200);
      const availableCatalogProduct = advancedCatalog.body.find(
        (item) => item.id === product.rows[0].id,
      );
      assert.ok(availableCatalogProduct);
      assert.equal(availableCatalogProduct.warehouse_type, 'AVAILABLE');

      await pool.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Cajero restringido','ACTIVE')`,
        [cashierId, `cashier-${cashierId}@example.test`],
      );
      await pool.query(
        `INSERT INTO tenant_users(
           tenant_id, user_id, role_code, role_id, status, joined_at
         )
         SELECT $1,$2,'CASHIER',id,'ACTIVE',now()
         FROM roles
         WHERE tenant_id = $1 AND code = 'CASHIER'`,
        [companyId, cashierId],
      );
      const cashierApplication = express();
      cashierApplication.use(express.json());
      cashierApplication.use((req, _res, next) => {
        req.context = {
          tenantId: req.header('x-tenant-id') || null,
          userId: cashierId,
          authenticated: true,
          requestId: randomUUID(),
          branchId: null,
          user: { role_code: 'CASHIER' },
        };
        next();
      });
      cashierApplication.use('/api/pos', returnsRouter);
      cashierApplication.use('/api/pos', posRouter);
      cashierApplication.use(errorHandler);

      const cashierDisplayCatalog = await request(cashierApplication)
        .get('/api/pos/shared-catalog')
        .query({
          cashSessionId: cashSession.rows[0].id,
          stockSource: 'DISPLAY',
        })
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.ok(cashierDisplayCatalog.body.length >= 1);
      assert.ok(
        cashierDisplayCatalog.body.every(
          (item) => item.warehouse_type === 'DISPLAY',
        ),
      );

      const cashierWarehouseCatalog = await request(cashierApplication)
        .get('/api/pos/shared-catalog')
        .query({
          cashSessionId: cashSession.rows[0].id,
          stockSource: 'AVAILABLE',
        })
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.deepEqual(cashierWarehouseCatalog.body, []);

      await request(cashierApplication)
        .post('/api/pos/sales/grouped')
        .set('x-tenant-id', companyId)
        .send({
          cashSessionId: cashSession.rows[0].id,
          stockSource: 'AVAILABLE',
          paymentMethod: 'CARD',
          saleTerms: 'IMMEDIATE',
          items: [{
            productId: product.rows[0].id,
            warehouseId: response.body.setup.warehouse.id,
            quantity: 1,
          }],
        })
        .expect(403);

      const cashierDisplayPayload = {
        cashSessionId: cashSession.rows[0].id,
        stockSource: 'DISPLAY',
        paymentMethod: 'CARD',
        saleTerms: 'IMMEDIATE',
        items: [{
          productId: product.rows[0].id,
          warehouseId: response.body.setup.displayWarehouse.id,
          quantity: 1,
        }],
      };
      const missingResolution = await request(cashierApplication)
        .post('/api/pos/sales/grouped')
        .set('x-tenant-id', companyId)
        .send(cashierDisplayPayload)
        .expect(409);
      assert.equal(missingResolution.body.code, 'BILLING_RESOLUTION_REQUIRED');

      // El flujo operativo siguiente usa comprobante interno, por lo que no
      // depende de una resolución DIAN para continuar validando Caja.
      await pool.query(
        `UPDATE company_tax_profiles
         SET electronic_invoicing_required = FALSE,
             default_document_type = 'INTERNAL_RECEIPT'
         WHERE company_id = $1`,
        [companyId],
      );
      await pool.query(
        `UPDATE products
         SET billing_policy = 'INTERNAL_RECEIPT'
         WHERE tenant_id = $1 AND id = $2`,
        [companyId, product.rows[0].id],
      );
      const cashierDisplaySale = await request(cashierApplication)
        .post('/api/pos/sales/grouped')
        .set('x-tenant-id', companyId)
        .send(cashierDisplayPayload)
        .expect(201);
      assert.equal(cashierDisplaySale.body.receipts.length, 1);
      assert.equal(cashierDisplaySale.body.receipts[0].companyId, companyId);
      const displayStock = await pool.query(
        `SELECT on_hand
         FROM inventory_balances
         WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3`,
        [
          companyId,
          product.rows[0].id,
          response.body.setup.displayWarehouse.id,
        ],
      );
      assert.equal(Number(displayStock.rows[0].on_hand), 2);

      const returnableSale = await request(cashierApplication)
        .get(`/api/pos/sales/${cashierDisplaySale.body.receipts[0].id}`)
        .set('x-tenant-id', companyId)
        .expect(200);
      assert.equal(Number(returnableSale.body.items[0].returnableQuantity), 1);

      const saleReturn = await request(cashierApplication)
        .post(`/api/pos/sales/${cashierDisplaySale.body.receipts[0].id}/returns`)
        .set('x-tenant-id', companyId)
        .send({
          cashSessionId: cashSession.rows[0].id,
          refundMethod: 'CARD',
          refundReference: 'REVERSO-TEST-001',
          correctionConceptCode: 'TEST-CONCEPT',
          reason: 'Devolución controlada de integración',
          idempotencyKey: `return-${cashierDisplaySale.body.receipts[0].id}`,
          items: [{
            saleItemId: returnableSale.body.items[0].id,
            quantity: 1,
          }],
        })
        .expect(201);
      assert.equal(saleReturn.body.return_status, 'FULL');
      assert.equal(Number(saleReturn.body.total), 2000);
      assert.equal(
        saleReturn.body.electronic_adjustment_note_id,
        null,
        'Los comprobantes internos se devuelven sin generar nota electrónica.',
      );

      const restoredDisplayStock = await pool.query(
        `SELECT on_hand
         FROM inventory_balances
         WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3`,
        [
          companyId,
          product.rows[0].id,
          response.body.setup.displayWarehouse.id,
        ],
      );
      assert.equal(Number(restoredDisplayStock.rows[0].on_hand), 3);

      const returnAccounting = await pool.query(
        `SELECT status, total_debit, total_credit, entry_hash
         FROM journal_entries
         WHERE tenant_id = $1 AND source_type = 'SALE_RETURN' AND source_id = $2`,
        [companyId, saleReturn.body.id],
      );
      assert.equal(returnAccounting.rowCount, 1);
      assert.equal(returnAccounting.rows[0].status, 'POSTED');
      assert.equal(
        Number(returnAccounting.rows[0].total_debit),
        Number(returnAccounting.rows[0].total_credit),
      );
      assert.match(returnAccounting.rows[0].entry_hash, /^[0-9a-f]{64}$/);

      await request(cashierApplication)
        .post(`/api/pos/sales/${cashierDisplaySale.body.receipts[0].id}/returns`)
        .set('x-tenant-id', companyId)
        .send({
          cashSessionId: cashSession.rows[0].id,
          refundMethod: 'CARD',
          refundReference: 'REVERSO-TEST-002',
          correctionConceptCode: 'TEST-CONCEPT',
          reason: 'Intento duplicado por cantidad',
          idempotencyKey: `return-excess-${cashierDisplaySale.body.receipts[0].id}`,
          items: [{
            saleItemId: returnableSale.body.items[0].id,
            quantity: 1,
          }],
        })
        .expect(409);

      const accounting = await pool.query(
        `SELECT entry.id, entry.status, entry.total_debit, entry.total_credit,
                entry.entry_hash, COUNT(line.id)::integer line_count
         FROM journal_entries entry
         JOIN journal_entry_lines line
           ON line.journal_entry_id = entry.id
          AND line.tenant_id = entry.tenant_id
         WHERE entry.tenant_id = $1
           AND entry.source_type = 'SALE'
           AND entry.source_id = $2
         GROUP BY entry.id`,
        [companyId, cashierDisplaySale.body.receipts[0].id],
      );
      assert.equal(accounting.rowCount, 1);
      assert.equal(accounting.rows[0].status, 'POSTED');
      assert.equal(
        Number(accounting.rows[0].total_debit),
        Number(accounting.rows[0].total_credit),
      );
      assert.ok(accounting.rows[0].line_count >= 4);
      assert.match(accounting.rows[0].entry_hash, /^[0-9a-f]{64}$/);
      const reversal = await withTransaction((client) => reverseJournalEntry(client, {
        tenantId: companyId,
        entryId: accounting.rows[0].id,
        entryDate: new Date().toISOString().slice(0, 10),
        reason: 'Prueba de reversión controlada',
        userId: ownerId,
      }));
      assert.equal(reversal.status, 'POSTED');
      assert.equal(reversal.reversal_of, accounting.rows[0].id);
      assert.equal(Number(reversal.total_debit), Number(reversal.total_credit));
      await assert.rejects(
        () => withTransaction((client) => reverseJournalEntry(client, {
          tenantId: companyId,
          entryId: accounting.rows[0].id,
          entryDate: new Date().toISOString().slice(0, 10),
          reason: 'Segundo intento no permitido',
          userId: ownerId,
        })),
        (error) => error.code === 'JOURNAL_ENTRY_ALREADY_REVERSED',
      );
    } finally {
      if (companyId) {
        // La bitácora productiva es append-only. El aislamiento de la prueba
        // desactiva sus triggers únicamente en esta sesión de limpieza.
        const cleanupClient = await pool.connect();
        try {
          await cleanupClient.query(`SET session_replication_role = 'replica'`);
          await cleanupClient.query(
            'DELETE FROM audit_chain_heads WHERE tenant_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM audit_events WHERE tenant_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM sale_return_items WHERE company_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM sale_returns WHERE company_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM electronic_note_transmissions WHERE company_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM electronic_adjustment_notes WHERE company_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM journal_entry_lines WHERE tenant_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM journal_entries WHERE tenant_id = $1',
            [companyId],
          );
          await cleanupClient.query(
            'DELETE FROM sale_payment_tenders WHERE seller_company_id = $1',
            [companyId],
          );
        } finally {
          await cleanupClient.query(`SET session_replication_role = 'origin'`);
          cleanupClient.release();
        }
        await pool.query('DELETE FROM electronic_documents WHERE company_id = $1', [companyId]);
        await pool.query('DELETE FROM expense_payments WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM business_expenses WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM cash_movements WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM sale_items WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_movements WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM sales WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM sale_groups WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM cash_sessions WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM logistics_intake_comments WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM logistics_intake_items WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM logistics_intake_batches WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_valuation_lines WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_valuation_closures WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_label_jobs WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_reservations WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_serial_numbers WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_lots WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM product_unit_conversions WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM product_variants WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM product_combo_assemblies WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM product_combo_components WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM sales_promotions WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM sales_product_prices WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM inventory_balances WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM products WHERE tenant_id = $1', [companyId]);
        await pool.query(
          `DELETE FROM cash_register_companies WHERE company_id = $1`,
          [companyId],
        );
        await pool.query('DELETE FROM cash_registers WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM tax_categories WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM third_parties WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM customers WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM sales_price_lists WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM suppliers WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM cost_centers WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM expense_categories WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM warehouse_user_permissions WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM warehouse_locations WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM warehouses WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM branches WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM role_permissions WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM tenant_users WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM roles WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM company_tax_profiles WHERE company_id = $1', [companyId]);
        await pool.query('DELETE FROM accounting_periods WHERE tenant_id = $1', [companyId]);
        await pool.query(
          'DELETE FROM accounting_account_mappings WHERE tenant_id = $1',
          [companyId],
        );
        await pool.query(
          'DELETE FROM accounting_entry_counters WHERE tenant_id = $1',
          [companyId],
        );
        await pool.query('DELETE FROM accounting_accounts WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM units_of_measure WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM tenant_modules WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_opportunity_actions WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_marketing_expenses WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_campaign_categories WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_campaign_products WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_campaigns WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_marketing_budgets WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_plan_initiatives WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_plans WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_rotation_snapshots WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_product_seasons WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_product_profiles WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_seasons WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM commercial_rotation_settings WHERE tenant_id = $1', [companyId]);
        await pool.query('DELETE FROM tenants WHERE id = $1', [companyId]);
      }
      await pool.query('DELETE FROM users WHERE id = $1', [ownerId]);
      await pool.query('DELETE FROM users WHERE id = $1', [cashierId]);
      await pool.end();
      await closeDatabase();
    }
  },
);
