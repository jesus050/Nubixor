import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import express from 'express';
import pg from 'pg';
import request from 'supertest';
import secureAssetsRouter from '../src/modules/secure-assets.js';
import { errorHandler } from '../src/middleware.js';
import { createApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function cleanupTenant(pool, tenantId) {
  await pool.query('DELETE FROM tenant_users WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM roles WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM company_tax_profiles WHERE company_id = $1', [tenantId]);
  await pool.query('DELETE FROM expense_categories WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM cost_centers WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM accounting_periods WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM accounting_account_mappings WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM accounting_entry_counters WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM accounting_accounts WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM units_of_measure WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM tenant_modules WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_opportunity_actions WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_marketing_expenses WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_campaign_categories WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_campaign_products WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_campaigns WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_marketing_budgets WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_plan_initiatives WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_plans WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_rotation_snapshots WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_product_seasons WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_product_profiles WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_seasons WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM commercial_rotation_settings WHERE tenant_id = $1', [tenantId]);
  await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
}

test(
  'IDOR: el contexto activo A no puede descargar un documento conocido de B',
  { skip: !connectionString },
  async () => {
    const pool = new pg.Pool({ connectionString });
    const ids = {
      user: randomUUID(), companyA: randomUUID(), companyB: randomUUID(), documentB: randomUUID(),
    };
    try {
      await pool.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Usuario multiempresa','ACTIVE')`,
        [ids.user, `isolation-${ids.user}@example.test`],
      );
      await pool.query(
        `INSERT INTO tenants(id, legal_name, status)
         VALUES($1,'Empresa A','ACTIVE'),($2,'Empresa B','ACTIVE')`,
        [ids.companyA, ids.companyB],
      );
      await pool.query(
        `INSERT INTO tenant_users(tenant_id, user_id, role_code, status)
         VALUES($1,$3,'OWNER','ACTIVE'),($2,$3,'OWNER','ACTIVE')`,
        [ids.companyA, ids.companyB, ids.user],
      );
      await pool.query(
        `INSERT INTO secure_documents(
           id, tenant_id, category, original_name, storage_key, content_type,
           byte_size, sha256, uploaded_by
         ) VALUES($1,$2,'OTHER','secreto.pdf',$3,'application/pdf',1,$4,$5)`,
        [ids.documentB, ids.companyB, `documents/${ids.companyB}/${ids.documentB}.pdf`, 'a'.repeat(64), ids.user],
      );

      const application = express();
      application.use((req, _res, next) => {
        req.context = { tenantId: ids.companyA, userId: ids.user };
        next();
      });
      application.use('/api/assets', secureAssetsRouter);
      application.use(errorHandler);
      const response = await request(application)
        .get(`/api/assets/documents/${ids.documentB}`)
        .expect(404);
      assert.equal(response.body.code, 'ASSET_NOT_FOUND');
    } finally {
      await pool.query('DELETE FROM secure_documents WHERE id = $1', [ids.documentB]);
      await cleanupTenant(pool, ids.companyA);
      await cleanupTenant(pool, ids.companyB);
      await pool.query('DELETE FROM users WHERE id = $1', [ids.user]);
      await pool.end();
    }
  },
);

test(
  'la sesión fija la empresa activa y conserva el rol propio de cada empresa',
  { skip: !connectionString },
  async () => {
    const pool = new pg.Pool({ connectionString });
    const ids = {
      user: randomUUID(),
      companyA: randomUUID(),
      companyB: randomUUID(),
      ownerRole: randomUUID(),
      warehouseRole: randomUUID(),
    };
    const token = `test-session-${randomUUID()}`;
    const csrfToken = `test-csrf-${randomUUID()}`;
    try {
      await pool.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Usuario de contexto','ACTIVE')`,
        [ids.user, `context-${ids.user}@example.test`],
      );
      await pool.query(
        `INSERT INTO tenants(id, legal_name, status)
         VALUES($1,'Empresa A','ACTIVE'),($2,'Empresa B','ACTIVE')`,
        [ids.companyA, ids.companyB],
      );
      await pool.query(
        `INSERT INTO roles(id, tenant_id, code, name, active)
         VALUES($1,$3,'OWNER','Propietario',TRUE),($2,$4,'WAREHOUSE','Bodega',TRUE)`,
        [ids.ownerRole, ids.warehouseRole, ids.companyA, ids.companyB],
      );
      await pool.query(
        `INSERT INTO role_permissions(tenant_id, role_id, permission_code)
         VALUES($1,$2,'warehouse.view'),($3,$4,'warehouse.view')`,
        [ids.companyA, ids.ownerRole, ids.companyB, ids.warehouseRole],
      );
      await pool.query(
        `INSERT INTO tenant_users(tenant_id, user_id, role_code, role_id, status, joined_at)
         VALUES($1,$3,'OWNER',$4,'ACTIVE',now()),($2,$3,'WAREHOUSE',$5,'ACTIVE',now())`,
        [ids.companyA, ids.companyB, ids.user, ids.ownerRole, ids.warehouseRole],
      );
      await pool.query(
        `INSERT INTO auth_sessions(
           user_id, token_hash, csrf_token_hash, expires_at, active_tenant_id
         ) VALUES($1,$2,$3,now() + interval '1 hour',$4)`,
        [ids.user, digest(token), digest(csrfToken), ids.companyA],
      );

      const application = createApp();
      const client = request(application);
      const sessionCookie = `megasuite_session=${token}`;

      const switched = await client
        .post('/api/session/company')
        .set('Cookie', sessionCookie)
        .set('x-csrf-token', csrfToken)
        .send({ tenantId: ids.companyB })
        .expect(200);
      assert.equal(switched.body.tenantId, ids.companyB);
      assert.equal(switched.body.roleCode, 'WAREHOUSE');

      const session = await pool.query(
        'SELECT active_tenant_id FROM auth_sessions WHERE token_hash = $1',
        [digest(token)],
      );
      assert.equal(session.rows[0].active_tenant_id, ids.companyB);

      const forcedCompany = await client
        .get('/api/warehouses')
        .set('Cookie', sessionCookie)
        .set('x-tenant-id', ids.companyA)
        .expect(409);
      assert.equal(forcedCompany.body.code, 'TENANT_CONTEXT_MISMATCH');

      await client
        .get('/api/warehouses')
        .set('Cookie', sessionCookie)
        .expect(200);
    } finally {
      await cleanupTenant(pool, ids.companyA);
      await cleanupTenant(pool, ids.companyB);
      await pool.query('DELETE FROM users WHERE id = $1', [ids.user]);
      await pool.end();
    }
  },
);
