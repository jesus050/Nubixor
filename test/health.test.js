import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createHealthRouter } from '../src/modules/health.js';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

test('GET / sirve la interfaz local', async () => {
  const response = await request(createApp()).get('/').expect(200);
  assert.match(response.headers['content-type'], /^text\/html/);
  assert.match(response.text, /MegaSuite/);
  assert.match(response.text, /Centro de operaciones/);
  assert.match(response.text, /Primer módulo funcional/);
  assert.match(response.text, /Nueva empresa/);
  assert.match(response.text, /Habilitar bodega/);
  assert.match(response.text, /Roles &amp; permisos/);
  assert.match(response.text, /Agregar al catálogo/);
  assert.match(response.text, /Adjuntar fotografía/);
  assert.match(response.text, /Abrir turno de caja/);
});

test('GET /styles.css sirve los estilos locales', async () => {
  const response = await request(createApp()).get('/styles.css').expect(200);
  assert.match(response.headers['content-type'], /^text\/css/);
  assert.match(response.text, /--color-ink/);
});

test('la interfaz abierta como archivo puede consultar la API en local', async () => {
  const response = await request(createApp())
    .get('/api/health')
    .set('Origin', 'null')
    .expect(200);
  assert.ok(['null', '*'].includes(response.headers['access-control-allow-origin']));
});

test('POST /api/companies valida la razón social antes de consultar PostgreSQL', async () => {
  const response = await request(createApp())
    .post('/api/companies')
    .send({ legalName: '   ' })
    .expect(422);
  assert.equal(response.body.error, 'legalName es obligatorio.');
});

test('POST /api/branches exige empresa y valida sus campos', async () => {
  await request(createApp())
    .post('/api/branches')
    .send({ name: 'Principal', code: 'MAIN' })
    .expect(400);

  const response = await request(createApp())
    .post('/api/branches')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ name: '   ', code: '' })
    .expect(422);
  assert.equal(response.body.error, 'name y code son obligatorios.');
});

test('POST /api/warehouses valida la jerarquía mínima antes de consultar PostgreSQL', async () => {
  const response = await request(createApp())
    .post('/api/warehouses')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ name: 'Disponible', code: 'DISP' })
    .expect(422);
  assert.equal(response.body.error, 'branchId, name y code son obligatorios.');

  const invalidBranch = await request(createApp())
    .post('/api/warehouses')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ branchId: 'sucursal-invalida', name: 'Disponible', code: 'DISP' })
    .expect(422);
  assert.equal(invalidBranch.body.error, 'branchId debe ser un UUID válido.');
});

test('el catálogo valida categorías, marcas y productos antes de consultar PostgreSQL', async () => {
  const app = createApp();
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };

  const category = await request(app)
    .post('/api/categories')
    .set(headers)
    .send({ name: '   ', code: '' })
    .expect(422);
  assert.equal(category.body.error, 'name y code son obligatorios.');

  const brand = await request(app)
    .post('/api/brands')
    .set(headers)
    .send({ name: '', code: '   ' })
    .expect(422);
  assert.equal(brand.body.error, 'name y code son obligatorios.');

  const product = await request(app)
    .post('/api/products')
    .set(headers)
    .send({ sku: '', name: '   ' })
    .expect(422);
  assert.equal(product.body.error, 'sku y name son obligatorios.');

  const invalidPrice = await request(app)
    .post('/api/products')
    .set(headers)
    .send({ sku: 'SKU-1', name: 'Producto', salePrice: -1 })
    .expect(422);
  assert.equal(invalidPrice.body.error, 'cost y salePrice deben ser valores positivos.');
});

test('las imágenes y la caja validan entradas antes de consultar dependencias', async () => {
  const app = createApp();
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };

  const image = await request(app)
    .post('/api/products/60000000-0000-0000-0000-000000000001/images')
    .set(headers)
    .send({})
    .expect(422);
  assert.equal(image.body.error, 'Debes seleccionar una imagen.');

  const cashSession = await request(app)
    .post('/api/pos/sessions')
    .set(headers)
    .send({ openingAmount: 0 })
    .expect(422);
  assert.equal(cashSession.body.error, 'cashRegisterId es obligatorio.');

  const closeSession = await request(app)
    .post('/api/pos/sessions/invalid/close')
    .set(headers)
    .send({ closingAmount: -1 })
    .expect(422);
  assert.equal(closeSession.body.error, 'closingAmount debe ser un valor positivo.');

  const invalidSession = await request(app)
    .post('/api/pos/sessions/invalid/close')
    .set(headers)
    .send({ closingAmount: 0 })
    .expect(422);
  assert.equal(invalidSession.body.error, 'El turno debe tener un UUID válido.');
});

test('GET /api/health funciona sin consultar dependencias', async () => {
  const failIfCalled = async () => {
    throw new Error('No debe ejecutarse');
  };
  const app = createApp({
    health: createHealthRouter({
      databaseCheck: failIfCalled,
      redisCheck: failIfCalled,
    }),
  });
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.status, 'alive');
});

test('GET /api/health/ready confirma PostgreSQL y Redis', async () => {
  const app = createApp({
    health: createHealthRouter({
      databaseCheck: async () => ({ latencyMs: 1 }),
      redisCheck: async () => ({ latencyMs: 2 }),
    }),
  });
  const response = await request(app).get('/api/health/ready').expect(200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.checks.postgres.ok, true);
  assert.equal(response.body.checks.redis.ok, true);
});

test('GET /api/health/ready responde 503 sin tumbar la API', async () => {
  const databaseError = Object.assign(new Error('database unavailable'), {
    code: 'DATABASE_UNAVAILABLE',
  });
  const app = createApp({
    health: createHealthRouter({
      databaseCheck: async () => { throw databaseError; },
      redisCheck: async () => ({ latencyMs: 2 }),
    }),
  });
  const response = await request(app).get('/api/health/ready').expect(503);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.checks.postgres.code, 'DATABASE_UNAVAILABLE');

  await request(app).get('/api/health').expect(200);
});
