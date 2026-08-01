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
  assert.match(response.text, /Nubixor/);
  assert.match(response.text, /href="\.\/styles\.css\?v=/);
  assert.match(response.text, /src="\.\/app\.js\?v=/);
  assert.doesNotMatch(
    response.headers['content-security-policy'],
    /upgrade-insecure-requests/,
  );
  assert.match(response.text, /Centro de operaciones/);
  assert.match(response.text, /Primer módulo funcional/);
  assert.match(response.text, /Nueva empresa/);
  assert.match(response.text, /Modo de facturación inicial/);
  assert.match(response.text, /Factura electrónica — requiere conexión DIAN/);
  assert.match(response.text, /Habilitar bodega/);
  assert.match(response.text, /Roles &amp; permisos/);
  assert.match(response.text, /Agregar al catálogo/);
  assert.match(response.text, /Adjuntar fotografía/);
  assert.match(response.text, /Colores o presentaciones/);
  assert.match(response.text, /Combo o kit/);
  assert.match(response.text, /Descontar componentes y armar/);
  assert.match(response.text, /Combos listos para vender/);
  assert.match(response.text, /Precios y promociones/);
  assert.match(response.text, /Escala por cantidad/);
  assert.match(response.text, /Precio por cliente/);
  assert.match(response.text, /Nueva promoción/);
  assert.match(response.text, /Abrir turno de caja/);
  assert.match(response.text, /Selecciona productos/);
  assert.match(response.text, /Control e historial de caja/);
  assert.match(response.text, /Nubixor Caja/);
  assert.match(response.text, /data-payment-method="CASH"/);
  assert.match(response.text, /id="posCategoryStrip"/);
  assert.match(response.text, /Efectivo recibido/);
  assert.match(response.text, /Cambio a entregar/);
  assert.match(response.text, /Consumidor final/);
  assert.match(response.text, /data-sale-terms="CREDIT"/);
  assert.match(response.text, /La cuenta por cobrar se creará/);
  assert.match(response.text, /Facturas y comprobantes/);
  assert.match(response.text, /Devolver productos/);
  assert.match(response.text, /Devolución controlada/);
  assert.match(response.text, /Cuenta que recibió/);
  assert.match(response.text, /id="posSalesHistoryList"/);
  assert.match(response.text, /Áreas de Nubixor/);
  assert.match(response.text, /nav-group-toggle/);
  assert.match(response.text, /data-view="productos"/);
  assert.match(response.text, /Áreas del catálogo/);
  assert.match(response.text, /Crear impuesto de venta/);
  assert.match(response.text, /Asignar impuesto/);
  assert.match(response.text, /data-view="cartera"/);
  assert.match(response.text, /Facturas y cuentas por cobrar/);
  assert.match(response.text, /Registrar abono/);
  assert.match(response.text, /data-view="facturacion"/);
  assert.match(response.text, /Cotizaciones y pedidos/);
  assert.match(response.text, /CUFE, CUDE y QR solo se muestran/);
  assert.match(response.text, /data-view="inventario"/);
  assert.match(response.text, /data-view="logistica"/);
  assert.match(response.text, /data-tenant-module-link="LOGISTICS"/);
  assert.match(response.text, /Módulo opcional/);
  assert.match(response.text, /Capacidades opcionales/);
  assert.match(response.text, /Activar o desactivar Logística/);
  assert.match(response.text, /Recepciones/);
  assert.match(response.text, /Lotes de mercancía/);
  assert.match(response.text, /Escáner de bodega/);
  assert.match(response.text, /Decisión de jefatura/);
  assert.match(response.text, /Imprimir lote completo/);
  assert.match(response.text, /Código de barras/);
  assert.match(response.text, /Historial del lote/);
  assert.match(response.text, /Existencias actuales/);
  assert.match(response.text, /Programar toma física/);
  assert.match(response.text, /Aprobar y ajustar inventario/);
  assert.match(response.text, /Operación logística/);
  assert.match(response.text, /De la recepción a la exhibición/);
  assert.match(response.text, /Trazabilidad/);
  assert.match(response.text, /Maestros y gobierno/);
  assert.match(response.text, /Permisos por bodega/);
  assert.match(response.text, /Política del producto/);
  assert.match(response.text, /Lote y vencimiento/);
  assert.match(response.text, /Permiso por bodega/);
  assert.match(response.text, /Cierre valorizado/);
  assert.match(response.text, /data-view="compras"/);
  assert.match(response.text, /Órdenes y recepciones/);
  assert.match(response.text, /Confirmar entrada a inventario/);
  assert.match(response.text, /data-view="cuentas-pagar"/);
  assert.match(response.text, /Facturas y cuentas por pagar/);
  assert.match(response.text, /Registrar pago/);
  assert.match(response.text, /data-view="gastos"/);
  assert.match(response.text, /Gastos del negocio/);
  assert.match(response.text, /Nuevo gasto/);
  assert.match(response.text, /Centro de costos/);
  assert.match(response.text, /Enviar para aprobación/);
  assert.match(response.text, /Aprobar gasto/);
  assert.match(response.text, /Cuenta de salida/);
  assert.match(response.text, /Recursos comprometidos/);
  assert.match(response.text, /data-view="terceros"/);
  assert.match(response.text, /Directorio comercial central/);
  assert.match(response.text, /Registrar tercero/);
  assert.match(response.text, /Cliente y proveedor a la vez/);
  assert.match(response.text, /id="dashboardPayable"/);
  assert.match(response.text, /data-view="usuarios"/);
  assert.match(response.text, /Equipo y accesos/);
  assert.match(response.text, /Invitar persona/);
  assert.match(response.text, /Roles y permisos/);
  assert.match(response.text, /Crea tu acceso principal/);
  assert.match(response.text, /Entra a Nubixor/);
  assert.match(response.text, /Activa tu cuenta/);
  assert.match(response.text, /¿Olvidaste tu contraseña\?/);
  assert.match(response.text, /Recupera tu acceso/);
  assert.match(response.text, /Perfil tributario/);
  assert.match(response.text, /Soporte RUT/);
  assert.match(response.text, /Enlace personal de activación/);
  assert.match(response.text, /Cerrar sesión/);
  assert.match(response.text, /data-view="auditoria"/);
  assert.match(response.text, /Auditoría consultable/);
  assert.match(response.text, /Preparación para auditoría/);
  assert.match(response.text, /Conciliación, balances y expediente/);
  assert.match(response.text, /Expediente mensual/);
  assert.match(response.text, /Cierre bancario/);
  assert.match(response.text, /Firmar validación/);
  assert.match(response.text, /Descargar expediente/);
  assert.match(response.text, /Exportar CSV/);
  assert.match(response.text, /Estado anterior/);
  assert.match(response.text, /data-view="reportes"/);
  assert.match(response.text, /Centro de reportes/);
  assert.match(response.text, /Inventario valorizado/);
  assert.match(response.text, /Descargar CSV/);
  assert.match(response.text, /Proyección a 30 días/);
  assert.match(response.text, /El negocio, hoy\./);
  assert.match(response.text, /Cartera vencida/);
  assert.match(response.text, /Últimos siete días/);
  assert.match(response.text, /Movimientos e historial/);
  assert.match(response.text, /Registrar ingreso o salida/);
  assert.match(response.text, /Imprimir ticket 80 mm/);
  assert.match(response.text, /Abrir factura DIAN \(PDF\)/);
  assert.match(response.text, /data-denomination="100000"/);
});

test('la configuración de módulos valida código y estado antes de consultar PostgreSQL', async () => {
  const app = createUnsecuredApp();
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };

  const unknown = await request(app)
    .patch('/api/module-settings/desconocido')
    .set(headers)
    .send({ enabled: true })
    .expect(422);
  assert.equal(unknown.body.code, 'INVALID_TENANT_MODULE');

  const invalidState = await request(app)
    .patch('/api/module-settings/LOGISTICS')
    .set(headers)
    .send({ enabled: 'sí' })
    .expect(422);
  assert.equal(invalidState.body.code, 'INVALID_TENANT_MODULE');
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

test('la interfaz local puede consultar la API desde su propio origen', async () => {
  const response = await request(createUnsecuredApp())
    .get('/api/health')
    .set('Origin', 'http://localhost:4100')
    .expect(200);
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:4100');
});

test('CORS rechaza orígenes externos no configurados', async () => {
  const response = await request(createUnsecuredApp())
    .get('/api/health')
    .set('Origin', 'https://origen-no-autorizado.example')
    .expect(403);
  assert.equal(response.body.code, 'CORS_ORIGIN_DENIED');
});

test('POST /api/companies valida la razón social antes de consultar PostgreSQL', async () => {
  const response = await request(createUnsecuredApp())
    .post('/api/companies')
    .send({ legalName: '   ' })
    .expect(422);
  assert.equal(response.body.error, 'legalName es obligatorio.');

  const billingMode = await request(createUnsecuredApp())
    .post('/api/companies')
    .send({ legalName: 'Empresa válida', billingMode: 'DESCONOCIDO' })
    .expect(422);
  assert.equal(billingMode.body.error, 'El modo de facturación no es válido.');
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

  const tax = await request(app)
    .post('/api/taxes')
    .set(headers)
    .send({ code: '', name: ' ', treatment: '' })
    .expect(422);
  assert.equal(tax.body.error, 'code, name y treatment son obligatorios.');

  const invalidTaxRate = await request(app)
    .post('/api/taxes')
    .set(headers)
    .send({ code: 'EXCL', name: 'Excluido', treatment: 'EXCLUDED', rate: 19 })
    .expect(422);
  assert.match(invalidTaxRate.body.error, /deben usar tarifa 0/i);

  const invalidPrice = await request(app)
    .post('/api/products')
    .set(headers)
    .send({ sku: 'SKU-1', name: 'Producto', salePrice: -1 })
    .expect(422);
  assert.equal(invalidPrice.body.error, 'cost y salePrice deben ser valores positivos.');

  const invalidProductTax = await request(app)
    .patch('/api/products/invalid/tax')
    .set(headers)
    .send({ taxCategoryId: 'invalid', reason: 'Prueba' })
    .expect(422);
  assert.equal(
    invalidProductTax.body.error,
    'El producto y el impuesto deben tener UUID válidos.',
  );

  const invalidLookup = await request(app)
    .get('/api/products/lookup?q=x')
    .set(headers)
    .expect(422);
  assert.match(invalidLookup.body.error, /entre 2 y 120 caracteres/i);
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

  const invalidInternalQr = await request(app)
    .get('/api/pos/sales/invalid/internal-receipt-qr')
    .set(headers)
    .expect(422);
  assert.equal(invalidInternalQr.body.code, 'INVALID_SALE_ID');

  const invalidReturn = await request(app)
    .post('/api/pos/sales/invalid/returns')
    .set(headers)
    .send({})
    .expect(422);
  assert.equal(invalidReturn.body.code, 'INVALID_RETURN_CONTEXT');
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
  const replenishment = await request(application)
    .put('/api/inventory/replenishments/invalid')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({
      sourceWarehouseId: 'invalid',
      displayWarehouseId: 'invalid',
      minimumQuantity: 2,
      maximumQuantity: 5,
    })
    .expect(422);
  assert.match(replenishment.body.error, /UUID válidos/i);
  const incident = await request(application)
    .post('/api/inventory/incidents')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({
      incidentType: 'INVALID',
      productId: 'invalid',
      warehouseId: 'invalid',
    })
    .expect(422);
  assert.match(incident.body.error, /tipo de novedad válidos/i);
  const transferOrder = await request(application)
    .post('/api/inventory/transfer-orders')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({
      productId: 'invalid',
      sourceWarehouseId: 'invalid',
      destinationWarehouseId: 'invalid',
    })
    .expect(422);
  assert.match(transferOrder.body.error, /UUID válidos/i);
  const reception = await request(application)
    .post('/api/inventory/transfer-orders/invalid/receive')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ receptionNotes: '' })
    .expect(422);
  assert.match(reception.body.error, /observaciones de recepción/i);
});

test('inventario avanzado valida ubicaciones, series y reservas antes de consultar PostgreSQL', async () => {
  const application = createUnsecuredApp();
  const location = await request(application)
    .post('/api/inventory-advanced/locations')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ warehouseId: 'invalid', code: '', name: '' })
    .expect(422);
  assert.match(location.body.error, /bodega no es válida/i);

  const serial = await request(application)
    .post('/api/inventory-advanced/serials')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({
      productId: '90000000-0000-0000-0000-000000000001',
      warehouseId: '90000000-0000-0000-0000-000000000002',
    })
    .expect(422);
  assert.match(serial.body.error, /número de serie/i);

  const reservation = await request(application)
    .post('/api/inventory-advanced/reservations')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ productId: 'invalid', warehouseId: 'invalid', quantity: 0 })
    .expect(422);
  assert.match(reservation.body.error, /producto no es válido/i);
});

test('facturación electrónica valida conexión, resolución y documento', async () => {
  const application = createUnsecuredApp();
  const connection = await request(application)
    .put('/api/electronic-billing/connection')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ providerCode: '!', displayName: '', environment: 'INVALID' })
    .expect(422);
  assert.match(connection.body.error, /proveedor, nombre y ambiente/i);
  const resolution = await request(application)
    .post('/api/electronic-billing/resolutions')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ branchId: 'invalid', prefix: '', numberFrom: 0, numberTo: 0 })
    .expect(422);
  assert.match(resolution.body.error, /rango o vigencia/i);
  const document = await request(application)
    .post('/api/electronic-billing/documents/invalid/queue')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .expect(422);
  assert.match(document.body.error, /UUID válido/i);
  const documentQr = await request(application)
    .get('/api/electronic-billing/documents/invalid/qr')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .expect(422);
  assert.equal(documentQr.body.code, 'INVALID_ELECTRONIC_DOCUMENT_ID');
  const sandbox = await request(application)
    .post('/api/electronic-billing/documents/invalid/process-sandbox')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .expect(422);
  assert.match(sandbox.body.error, /documento no es válido/i);
  const contingency = await request(application)
    .post('/api/electronic-billing/contingencies')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ reason: ' ' })
    .expect(422);
  assert.match(contingency.body.error, /causa de la contingencia/i);
  const closeContingency = await request(application)
    .post('/api/electronic-billing/contingencies/invalid/close')
    .set('x-tenant-id', DEMO_TENANT_ID)
    .send({ resolutionNotes: '' })
    .expect(422);
  assert.match(closeContingency.body.error, /cómo fue resuelta/i);
});

test('el flujo comercial valida cotizaciones, pedidos, notas y consultas', async () => {
  const application = createUnsecuredApp();
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };
  const quote = await request(application)
    .post('/api/billing-workflow/quotes')
    .set(headers)
    .send({ branchId: 'invalid', validUntil: '2026-15-80', items: [] })
    .expect(422);
  assert.match(quote.body.error, /sucursal.*fecha de vigencia/i);

  const order = await request(application)
    .post('/api/billing-workflow/quotes/invalid/convert-order')
    .set(headers)
    .send({})
    .expect(422);
  assert.match(order.body.error, /cotización no es válida/i);

  const invoiceReady = await request(application)
    .post('/api/billing-workflow/orders/invalid/ready-to-invoice')
    .set(headers)
    .send({})
    .expect(422);
  assert.match(invoiceReady.body.error, /pedido no es válido/i);

  const note = await request(application)
    .post('/api/billing-workflow/notes')
    .set(headers)
    .send({})
    .expect(422);
  assert.match(note.body.error, /factura, tipo, causal/i);

  const noteQueue = await request(application)
    .post('/api/billing-workflow/notes/invalid/queue')
    .set(headers)
    .expect(422);
  assert.match(noteQueue.body.error, /nota no es válida/i);

  const documentStatus = await request(application)
    .get('/api/billing-workflow/documents/invalid/status')
    .set(headers)
    .expect(422);
  assert.match(documentStatus.body.error, /documento no es válido/i);
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

  const invalidControlPeriod = await request(application)
    .get('/api/audit/readiness?dateFrom=2026-07-30&dateTo=2026-07-01')
    .set(headers)
    .expect(422);
  assert.match(invalidControlPeriod.body.error, /período/i);

  const invalidReview = await request(application)
    .post('/api/audit/reviews')
    .set(headers)
    .send({
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      reviewType: 'DESCONOCIDA',
      status: 'APPROVED',
      reviewerName: 'Contador de prueba',
      professionalCard: 'TP-1',
      notes: 'Revisión de prueba',
    })
    .expect(422);
  assert.match(invalidReview.body.error, /tipo de validación/i);

  const invalidAuxiliary = await request(application)
    .get('/api/audit/accounting/auxiliary/invalid?dateFrom=2026-07-01&dateTo=2026-07-31')
    .set(headers)
    .expect(422);
  assert.match(invalidAuxiliary.body.error, /cuenta contable no es válida/i);

  const invalidVoucher = await request(application)
    .get('/api/audit/accounting/entries/invalid/voucher.html')
    .set(headers)
    .expect(422);
  assert.match(invalidVoucher.body.error, /comprobante no es válido/i);

  const invalidMonth = await request(application)
    .get('/api/audit/accounting/monthly-package.json?month=2026-99')
    .set(headers)
    .expect(422);
  assert.match(invalidMonth.body.error, /AAAA-MM/i);
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

test('recuperación de contraseña valida correo, token y contraseña', async () => {
  const invalidEmail = await request(createUnsecuredApp())
    .post('/api/auth/password-recovery/request')
    .send({ email: 'correo-invalido' })
    .expect(422);
  assert.equal(invalidEmail.body.code, 'INVALID_EMAIL');

  const weakPassword = await request(createUnsecuredApp())
    .post('/api/auth/password-recovery/complete')
    .send({ token: 'token-temporal-no-valido-1234567890', password: 'corta' })
    .expect(422);
  assert.equal(weakPassword.body.code, 'WEAK_PASSWORD');
});

test('los archivos públicos y los identificadores inválidos quedan protegidos', async () => {
  await request(createUnsecuredApp())
    .get('/uploads/product-images/no-existe.webp')
    .expect(404);
  const invalidImage = await request(createUnsecuredApp())
    .get('/api/assets/product-images/invalida')
    .expect(422);
  assert.equal(invalidImage.body.code, 'INVALID_IMAGE_ID');
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
