import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createHealthRouter } from '../src/modules/health.js';
import { csvCell } from '../src/shared/csv.js';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const createUnsecuredApp = (options = {}) => createApp({ ...options, security: false });

test('GET / sirve la interfaz local', async () => {
  const response = await request(createUnsecuredApp()).get('/').expect(200);
  assert.match(response.headers['content-type'], /^text\/html/);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.match(response.text, /MegaSuite/);
  assert.match(response.text, /href="\.\/styles\.css\?v=/);
  assert.match(response.text, /src="\.\/app\.js\?v=/);
  assert.doesNotMatch(
    response.headers['content-security-policy'],
    /upgrade-insecure-requests/,
  );
  assert.match(response.text, /Centro de operaciones/);
  assert.match(response.text, /Primer módulo funcional/);
  assert.match(response.text, /Nueva empresa/);
  assert.match(response.text, /Habilitar bodega/);
  assert.match(response.text, /Roles &amp; permisos/);
  assert.match(response.text, /Agregar al catálogo/);
  assert.match(response.text, /Adjuntar fotografía/);
  assert.match(response.text, /Abrir turno de caja/);
  assert.match(response.text, /Selecciona productos/);
  assert.match(response.text, /Control e historial de caja/);
  assert.match(response.text, /MegaSuite Caja/);
  assert.match(response.text, /data-payment-method="CASH"/);
  assert.match(response.text, /id="posCategoryStrip"/);
  assert.match(response.text, /Efectivo recibido/);
  assert.match(response.text, /Cambio a entregar/);
  assert.match(response.text, /Consumidor final/);
  assert.match(response.text, /data-sale-terms="CREDIT"/);
  assert.match(response.text, /La cuenta por cobrar se creará/);
  assert.match(response.text, /Ventas del turno/);
  assert.match(response.text, /id="posSalesHistoryList"/);
  assert.match(response.text, /Pestañas principales/);
  assert.match(response.text, /data-view="productos"/);
  assert.match(response.text, /Áreas del catálogo/);
  assert.match(response.text, /data-view="cartera"/);
  assert.match(response.text, /Facturas y cuentas por cobrar/);
  assert.match(response.text, /Registrar abono/);
  assert.match(response.text, /data-view="inventario"/);
  assert.match(response.text, /Existencias actuales/);
  assert.match(response.text, /Programar toma física/);
  assert.match(response.text, /Aprobar y ajustar inventario/);
  assert.match(response.text, /data-view="compras"/);
  assert.match(response.text, /Órdenes y recepciones/);
  assert.match(response.text, /Confirmar entrada a inventario/);
  assert.match(response.text, /data-view="cuentas-pagar"/);
  assert.match(response.text, /Facturas y cuentas por pagar/);
  assert.match(response.text, /Registrar pago/);
  assert.match(response.text, /Dinero e inventario/);
  assert.match(response.text, /id="dashboardPayable"/);
  assert.match(response.text, /data-view="usuarios"/);
  assert.match(response.text, /Equipo y accesos/);
  assert.match(response.text, /Invitar persona/);
  assert.match(response.text, /Roles y permisos/);
  assert.match(response.text, /Crea tu acceso principal/);
  assert.match(response.text, /Entra a MegaSuite/);
  assert.match(response.text, /Activa tu cuenta/);
  assert.match(response.text, /Enlace personal de activación/);
  assert.match(response.text, /Cerrar sesión/);
  assert.match(response.text, /data-view="auditoria"/);
  assert.match(response.text, /Auditoría consultable/);
  assert.match(response.text, /Exportar CSV/);
  assert.match(response.text, /Estado anterior/);
  assert.match(response.text, /data-view="reportes"/);
  assert.match(response.text, /Centro de reportes/);
  assert.match(response.text, /Inventario valorizado/);
  assert.match(response.text, /Descargar CSV/);
  assert.match(response.text, /Flujo estimado 30 días/);
  assert.match(response.text, /Movimientos e historial/);
  assert.match(response.text, /Registrar ingreso o salida/);
  assert.match(response.text, /Imprimir comprobante/);
  assert.match(response.text, /data-denomination="100000"/);
});

test('GET /styles.css sirve los estilos locales', async () => {
  const response = await request(createUnsecuredApp()).get('/styles.css').expect(200);
  assert.match(response.headers['content-type'], /^text\/css/);
  assert.match(response.text, /--color-ink/);
  assert.match(response.text, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('la interfaz abierta como archivo puede consultar la API en local', async () => {
  const response = await request(createUnsecuredApp())
    .get('/api/health')
    .set('Origin', 'null')
    .expect(200);
  assert.ok(['null', '*'].includes(response.headers['access-control-allow-origin']));
});

test('POST /api/companies valida la razón social antes de consultar PostgreSQL', async () => {
  const response = await request(createUnsecuredApp())
    .post('/api/companies')
    .send({ legalName: '   ' })
    .expect(422);
  assert.equal(response.body.error, 'legalName es obligatorio.');
});

test('POST /api/branches exige empresa y valida sus campos', async () => {
  await request(createUnsecuredApp())
    .post('/api/branches')
    .send({ name: 'Principal', code: 'MAIN' })
    .expect(400);

  const response = await request(createUnsecuredApp())
    .post('/api/branches')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ name: '   ', code: '' })
    .expect(422);
  assert.equal(response.body.error, 'name y code son obligatorios.');
});

test('POST /api/warehouses valida la jerarquía mínima antes de consultar PostgreSQL', async () => {
  const response = await request(createUnsecuredApp())
    .post('/api/warehouses')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ name: 'Disponible', code: 'DISP' })
    .expect(422);
  assert.equal(response.body.error, 'branchId, name y code son obligatorios.');

  const invalidBranch = await request(createUnsecuredApp())
    .post('/api/warehouses')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ branchId: 'sucursal-invalida', name: 'Disponible', code: 'DISP' })
    .expect(422);
  assert.equal(invalidBranch.body.error, 'branchId debe ser un UUID válido.');
});

test('el catálogo valida categorías, marcas y productos antes de consultar PostgreSQL', async () => {
  const app = createUnsecuredApp();
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
  const app = createUnsecuredApp();
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
  assert.equal(closeSession.body.error, 'El turno debe tener un UUID válido.');

  const invalidCount = await request(app)
    .post('/api/pos/sessions/00000000-0000-0000-0000-000000000099/close')
    .set(headers)
    .send({ counts: [{ denomination: 123, quantity: 1 }] })
    .expect(422);
  assert.match(invalidCount.body.error, /denominaciones o cantidades/i);

  const invalidMovement = await request(app)
    .post('/api/pos/sessions/invalid/movements')
    .set(headers)
    .send({})
    .expect(422);
  assert.equal(invalidMovement.body.error, 'El turno debe tener un UUID válido.');

  const invalidCatalog = await request(app)
    .get('/api/pos/catalog?warehouseId=invalid')
    .set(headers)
    .expect(422);
  assert.equal(invalidCatalog.body.error, 'warehouseId debe ser un UUID válido.');

  const emptySale = await request(app)
    .post('/api/pos/sales')
    .set(headers)
    .send({})
    .expect(422);
  assert.equal(
    emptySale.body.error,
    'cashSessionId, warehouseId, paymentMethod e items son obligatorios.',
  );

  const cashWithoutTender = await request(app)
    .post('/api/pos/sales')
    .set(headers)
    .send({
      cashSessionId: '00000000-0000-0000-0000-000000000001',
      warehouseId: '00000000-0000-0000-0000-000000000002',
      paymentMethod: 'CASH',
      items: [{ productId: '00000000-0000-0000-0000-000000000003', quantity: 1 }],
    })
    .expect(422);
  assert.match(cashWithoutTender.body.error, /efectivo recibido/i);

  const invalidPosCustomer = await request(app)
    .post('/api/pos/customers')
    .set(headers)
    .send({ name: '   ' })
    .expect(422);
  assert.match(invalidPosCustomer.body.error, /nombre del cliente/i);

  const invalidCreditSale = await request(app)
    .post('/api/pos/sales')
    .set(headers)
    .send({
      cashSessionId: '00000000-0000-0000-0000-000000000001',
      warehouseId: '00000000-0000-0000-0000-000000000002',
      saleTerms: 'CREDIT',
      items: [{ productId: '00000000-0000-0000-0000-000000000003', quantity: 1 }],
    })
    .expect(422);
  assert.match(invalidCreditSale.body.error, /requiere un cliente/i);

  const invalidSaleDetail = await request(app)
    .get('/api/pos/sales/invalid')
    .set(headers)
    .expect(422);
  assert.match(invalidSaleDetail.body.error, /UUID válido/i);
});

test('cartera valida clientes, facturas y abonos antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  await request(application)
    .get('/api/receivables/summary')
    .expect(400);
  const customer = await request(application)
    .post('/api/receivables/customers')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ name: '   ' })
    .expect(422);
  assert.equal(customer.body.error, 'El nombre del cliente es obligatorio.');
  const invoice = await request(application)
    .post('/api/receivables/invoices')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({})
    .expect(422);
  assert.match(invoice.body.error, /cliente o la sucursal/i);
  const payment = await request(application)
    .post('/api/receivables/invoices/invalid/payments')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({})
    .expect(422);
  assert.match(payment.body.error, /UUID válido/i);
});

test('conteos físicos validan jornada, producto y cierre antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  await request(application)
    .get('/api/physical-counts/summary')
    .expect(400);
  const count = await request(application)
    .post('/api/physical-counts')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ warehouseId: 'invalid', name: 'Conteo' })
    .expect(422);
  assert.match(count.body.error, /bodega debe tener un UUID/i);
  const item = await request(application)
    .put('/api/physical-counts/invalid/items/invalid')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ countedQuantity: 1 })
    .expect(422);
  assert.match(item.body.error, /UUID válidos/i);
  const close = await request(application)
    .post('/api/physical-counts/90000000-0000-0000-0000-000000000001/complete')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ reason: '   ' })
    .expect(422);
  assert.match(close.body.error, /motivo de cierre/i);
});

test('inventario valida ajustes y transferencias antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  await request(application)
    .get('/api/inventory/summary')
    .expect(400);
  const adjustment = await request(application)
    .post('/api/inventory/adjustments')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ productId: 'invalid', warehouseId: 'invalid', quantity: 1, reason: 'Novedad' })
    .expect(422);
  assert.match(adjustment.body.error, /UUID válidos/i);
  const transfer = await request(application)
    .post('/api/inventory/transfers')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({
      productId: '90000000-0000-0000-0000-000000000001',
      sourceWarehouseId: '90000000-0000-0000-0000-000000000002',
      destinationWarehouseId: '90000000-0000-0000-0000-000000000002',
      quantity: 1,
      reason: 'Redistribución',
    })
    .expect(422);
  assert.match(transfer.body.error, /deben ser diferentes/i);
});

test('compras valida proveedores, órdenes y recepciones antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  await request(application)
    .get('/api/purchases/summary')
    .expect(400);
  const supplier = await request(application)
    .post('/api/purchases/suppliers')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ name: '   ' })
    .expect(422);
  assert.match(supplier.body.error, /nombre del proveedor/i);
  const purchase = await request(application)
    .post('/api/purchases')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({})
    .expect(422);
  assert.match(purchase.body.error, /UUID válidos/i);
  const receipt = await request(application)
    .post('/api/purchases/invalid/receipts')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({})
    .expect(422);
  assert.match(receipt.body.error, /UUID válidos/i);
});

test('cuentas por pagar valida obligaciones y pagos antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  await request(application)
    .get('/api/payables/summary')
    .expect(400);
  const invoice = await request(application)
    .post('/api/payables/invoices')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({})
    .expect(422);
  assert.match(invoice.body.error, /compra recibida o un proveedor/i);
  const payment = await request(application)
    .post('/api/payables/invoices/invalid/payments')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({})
    .expect(422);
  assert.match(payment.body.error, /UUID válido/i);
});

test('usuarios exige identidad antes de consultar membresías y permisos', async () => {
  const application = createUnsecuredApp();
  const response = await request(application)
    .get('/api/users/summary')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .expect(401);
  assert.equal(response.body.code, 'USER_CONTEXT_REQUIRED');
});

test('dashboard ejecutivo exige una empresa activa', async () => {
  await request(createUnsecuredApp())
    .get('/api/dashboard/executive')
    .expect(400);
});

test('auditoría valida fechas, paginación e identificadores antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };

  const invalidDate = await request(application)
    .get('/api/audit/events?dateFrom=2026-99-99')
    .set(headers)
    .expect(422);
  assert.match(invalidDate.body.error, /AAAA-MM-DD/);

  const invalidRange = await request(application)
    .get('/api/audit/events?dateFrom=2026-08-01&dateTo=2026-07-01')
    .set(headers)
    .expect(422);
  assert.match(invalidRange.body.error, /fecha final/i);

  const invalidPage = await request(application)
    .get('/api/audit/events?pageSize=101')
    .set(headers)
    .expect(422);
  assert.match(invalidPage.body.error, /paginación/i);

  const invalidId = await request(application)
    .get('/api/audit/events/no-numerico')
    .set(headers)
    .expect(422);
  assert.match(invalidId.body.error, /identificador numérico/i);
});

test('la exportación de auditoría neutraliza fórmulas de hoja de cálculo', () => {
  assert.equal(csvCell('=HYPERLINK("https://example.test")'), '"\'=HYPERLINK(""https://example.test"")"');
  assert.equal(csvCell('texto, seguro'), '"texto, seguro"');
  assert.equal(csvCell(new Date('2026-07-26T12:00:00Z')), '"2026-07-26T12:00:00.000Z"');
});

test('reportes valida tipo, fechas, sucursal y paginación antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };

  const invalidType = await request(application)
    .get('/api/reports/desconocido')
    .set(headers)
    .expect(422);
  assert.match(invalidType.body.error, /tipo de reporte/i);

  const invalidDate = await request(application)
    .get('/api/reports/sales?dateFrom=2026-13-40')
    .set(headers)
    .expect(422);
  assert.match(invalidDate.body.error, /AAAA-MM-DD/);

  const invalidBranch = await request(application)
    .get('/api/reports/inventory?branchId=invalida')
    .set(headers)
    .expect(422);
  assert.match(invalidBranch.body.error, /UUID válido/i);

  const invalidPage = await request(application)
    .get('/api/reports/purchases?pageSize=201')
    .set(headers)
    .expect(422);
  assert.match(invalidPage.body.error, /paginación/i);
});

test('las APIs operativas rechazan identidad enviada manualmente', async () => {
  const response = await request(createApp())
    .get('/api/companies')
    .set('x-user-id', '50000000-0000-0000-0000-000000000001')
    .expect(401);
  assert.equal(response.body.code, 'AUTHENTICATION_REQUIRED');
});

test('inicio de sesión valida credenciales antes de consultar PostgreSQL', async () => {
  const response = await request(createUnsecuredApp())
    .post('/api/auth/login')
    .send({})
    .expect(422);
  assert.equal(response.body.code, 'LOGIN_FIELDS_REQUIRED');
});

test('configuración inicial exige una contraseña fuerte', async () => {
  const response = await request(createUnsecuredApp())
    .post('/api/auth/bootstrap')
    .send({ email: 'admin@megasuite.local', password: 'corta' })
    .expect(422);
  assert.equal(response.body.code, 'WEAK_PASSWORD');
});

test('activación de invitaciones exige una contraseña fuerte', async () => {
  const response = await request(createUnsecuredApp())
    .post('/api/auth/activate')
    .send({ token: 'token-temporal-no-valido-1234567890', password: 'corta' })
    .expect(422);
  assert.equal(response.body.code, 'WEAK_PASSWORD');
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
