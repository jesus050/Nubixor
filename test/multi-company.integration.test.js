import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { applyInventoryBalanceDelta } from '../src/modules/inventory.js';

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
           '023_checkout_payment_scope_guards.sql'
         )`,
      );
      assert.equal(migrations.rowCount, 3);

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
