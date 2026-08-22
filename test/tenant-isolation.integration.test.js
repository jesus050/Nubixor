import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import pg from 'pg';
import request from 'supertest';
import secureAssetsRouter from '../src/modules/secure-assets.js';
import { errorHandler } from '../src/middleware.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

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
      await pool.query('DELETE FROM tenant_users WHERE user_id = $1', [ids.user]);
      await pool.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [[ids.companyA, ids.companyB]]);
      await pool.query('DELETE FROM users WHERE id = $1', [ids.user]);
      await pool.end();
    }
  },
);
