import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ORDER_TRANSITIONS = Object.freeze({
  DRAFT: new Set(['SENT', 'CONFIRMED', 'CANCELLED']),
  SENT: new Set(['ACCEPTED', 'CANCELLED', 'EXPIRED']),
  ACCEPTED: new Set(['CONFIRMED', 'CANCELLED']),
  CONFIRMED: new Set(['READY_TO_INVOICE', 'CANCELLED']),
  READY_TO_INVOICE: new Set(['INVOICED', 'CANCELLED']),
  INVOICED: new Set(),
  CANCELLED: new Set(),
  EXPIRED: new Set(),
});

router.use(requireTenant);

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function text(value, max = 1000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

// PostgreSQL devuelve las columnas DATE como Date de JavaScript. validDate solo
// acepta cadenas AAAA-MM-DD, así que normalizamos antes de validar un valor que
// viene de la base y no de la petición.
function dateOnly(value) {
  if (!(value instanceof Date)) return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value;
}

async function loadCommercialItems(client, tenantId, items) {
  if (!Array.isArray(items) || !items.length || items.length > 100 ||
      items.some((item) => !isUuid(item?.productId) ||
        !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
    throw new AppError(
      'Agrega entre 1 y 100 productos con cantidades positivas.',
      422,
      'INVALID_COMMERCIAL_ITEMS',
    );
  }
  const consolidated = new Map();
  items.forEach((item) => consolidated.set(
    item.productId,
    (consolidated.get(item.productId) || 0) + Number(item.quantity),
  ));
  const products = await client.query(
    `SELECT product.id, product.sku, product.name, product.sale_price,
            tax.rate tax_rate
     FROM products product
     JOIN tax_categories tax
       ON tax.id = product.tax_category_id
      AND tax.tenant_id = product.tenant_id
     WHERE product.tenant_id = $1
       AND product.id = ANY($2::uuid[])
       AND product.active = TRUE
       AND product.deleted_at IS NULL
       AND product.tax_review_status = 'REVIEWED'`,
    [tenantId, [...consolidated.keys()]],
  );
  if (products.rowCount !== consolidated.size) {
    throw new AppError(
      'Uno o más productos no están activos o no tienen impuesto revisado.',
      422,
      'COMMERCIAL_PRODUCT_NOT_READY',
    );
  }
  return products.rows.map((product) => {
    const quantity = consolidated.get(product.id);
    const lineTotal = Math.round(Number(product.sale_price) * quantity * 100) / 100;
    const taxRate = Number(product.tax_rate);
    const taxAmount = taxRate > 0
      ? Math.round(lineTotal * taxRate / (100 + taxRate) * 100) / 100
      : 0;
    return {
      ...product,
      quantity,
      unitPrice: Number(product.sale_price),
      taxRate,
      taxAmount,
      lineTotal,
    };
  });
}

function transitionAllowed(from, to) {
  return ORDER_TRANSITIONS[from]?.has(to) || false;
}

function statusTransitionError(from, to) {
  return new AppError(
    `No se puede pasar un pedido de ${from} a ${to}.`,
    409,
    'INVALID_STATUS_TRANSITION',
  );
}

async function reserveOrderInventory(client, { tenantId, order, warehouseId = null }) {
  if (warehouseId && !isUuid(warehouseId)) {
    throw new AppError('La bodega no es válida.', 422, 'INVALID_ORDER_WAREHOUSE');
  }
  if (warehouseId) {
    const warehouse = await client.query(
      `SELECT 1 FROM warehouses
       WHERE id = $1 AND tenant_id = $2 AND branch_id = $3 AND active = TRUE`,
      [warehouseId, tenantId, order.branch_id],
    );
    if (!warehouse.rowCount) {
      throw new AppError('La bodega no pertenece a la sucursal del pedido.', 422, 'INVALID_ORDER_WAREHOUSE');
    }
  }
  const items = await client.query(
    `SELECT id, product_id, name_snapshot, quantity
     FROM commercial_sales_document_items
     WHERE commercial_document_id = $1 AND company_id = $2
     ORDER BY product_id, id
     FOR UPDATE`,
    [order.id, tenantId],
  );
  for (const item of items.rows) {
    const balances = await client.query(
      `SELECT balance.warehouse_id, balance.on_hand, balance.reserved
       FROM inventory_balances balance
       JOIN warehouses warehouse ON warehouse.id = balance.warehouse_id
        AND warehouse.tenant_id = balance.tenant_id
       WHERE balance.tenant_id = $1
         AND balance.product_id = $2
         AND warehouse.branch_id = $3
         AND warehouse.active = TRUE
         AND ($4::uuid IS NULL OR balance.warehouse_id = $4)
       ORDER BY balance.warehouse_id
       FOR UPDATE OF balance`,
      [tenantId, item.product_id, order.branch_id, warehouseId],
    );
    let pending = Number(item.quantity);
    const allocations = [];
    for (const balance of balances.rows) {
      const available = Math.max(Number(balance.on_hand) - Number(balance.reserved), 0);
      const allocated = Math.min(available, pending);
      if (allocated > 0) allocations.push({ warehouseId: balance.warehouse_id, quantity: allocated });
      pending = Math.max(pending - allocated, 0);
    }
    if (pending > 0) {
      const available = Number(item.quantity) - pending;
      const error = new AppError(
        `No hay disponibilidad suficiente para ${item.name_snapshot}: faltan ${pending} unidades.`,
        409,
        'INSUFFICIENT_AVAILABLE_STOCK',
      );
      error.details = { productId: item.product_id, requested: Number(item.quantity), available, missing: pending };
      throw error;
    }
    for (const allocation of allocations) {
      await client.query(
        `UPDATE inventory_balances
         SET reserved = reserved + $4, updated_at = now()
         WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3`,
        [tenantId, item.product_id, allocation.warehouseId, allocation.quantity],
      );
      await client.query(
        `INSERT INTO commercial_order_reservations(
           company_id, commercial_document_id, document_item_id,
           product_id, warehouse_id, quantity
         ) VALUES($1,$2,$3,$4,$5,$6)`,
        [tenantId, order.id, item.id, item.product_id, allocation.warehouseId, allocation.quantity],
      );
    }
  }
}

async function releaseOrderReservations(client, { tenantId, orderId, reason }) {
  const reservations = await client.query(
    `SELECT id, product_id, warehouse_id, quantity
     FROM commercial_order_reservations
     WHERE commercial_document_id = $1 AND company_id = $2 AND released_at IS NULL
     ORDER BY product_id, warehouse_id
     FOR UPDATE`,
    [orderId, tenantId],
  );
  for (const reservation of reservations.rows) {
    await client.query(
      `UPDATE inventory_balances
       SET reserved = GREATEST(reserved - $4, 0), updated_at = now()
       WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3`,
      [tenantId, reservation.product_id, reservation.warehouse_id, reservation.quantity],
    );
  }
  if (reservations.rowCount) {
    await client.query(
      `UPDATE commercial_order_reservations
       SET released_at = now(), release_reason = $3
       WHERE commercial_document_id = $1 AND company_id = $2 AND released_at IS NULL`,
      [orderId, tenantId, reason],
    );
  }
}

router.get('/overview', asyncHandler(async (req, res) => {
  const [documents, notes, sources, invoices] = await Promise.all([
    query(
      `SELECT document.*, customer.name customer_name,
              branch.name branch_name,
              source.document_number source_document_number,
              COALESCE(items.item_count, 0)::integer item_count
       FROM commercial_sales_documents document
       JOIN branches branch
         ON branch.id = document.branch_id
        AND branch.tenant_id = document.company_id
       LEFT JOIN customers customer
         ON customer.id = document.customer_id
        AND customer.tenant_id = document.company_id
       LEFT JOIN commercial_sales_documents source
         ON source.id = document.source_document_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) item_count
         FROM commercial_sales_document_items
         WHERE commercial_document_id = document.id
           AND company_id = document.company_id
       ) items ON TRUE
       WHERE document.company_id = $1
         AND ($2::uuid IS NULL OR document.branch_id = $2)
       ORDER BY document.created_at DESC
       LIMIT 100`,
      [req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT note.*, document.prefix, document.document_number,
              sale.sequence_number, sale.total original_total
       FROM electronic_adjustment_notes note
       JOIN electronic_documents document
         ON document.id = note.original_document_id
        AND document.company_id = note.company_id
       JOIN sales sale
         ON sale.id = document.sale_id
        AND sale.company_id = note.company_id
       WHERE note.company_id = $1
       ORDER BY note.created_at DESC
       LIMIT 100`,
      [req.context.tenantId],
    ),
    query(
      `SELECT
         (SELECT COUNT(*)::integer FROM commercial_sales_documents
          WHERE company_id = $1 AND document_type = 'QUOTE'
            AND status NOT IN ('CANCELLED','CONVERTED','EXPIRED')) open_quotes,
         (SELECT COUNT(*)::integer FROM commercial_sales_documents
          WHERE company_id = $1 AND document_type = 'ORDER'
            AND status NOT IN ('CANCELLED','INVOICED')) open_orders,
         (SELECT COUNT(*)::integer FROM electronic_adjustment_notes
          WHERE company_id = $1 AND status IN ('PENDING','QUEUED','REJECTED')) pending_notes`,
      [req.context.tenantId],
    ),
    query(
      `SELECT document.id, document.prefix, document.document_number,
              document.status, document.cufe, document.qr_url,
              document.pdf_url, document.xml_url,
              sale.sequence_number, sale.total, sale.tax_total,
              sale.created_at, customer.name customer_name
       FROM electronic_documents document
       JOIN sales sale
         ON sale.id = document.sale_id
        AND sale.company_id = document.company_id
       LEFT JOIN customers customer
         ON customer.id = sale.customer_id
        AND customer.tenant_id = sale.company_id
       WHERE document.company_id = $1
       ORDER BY sale.created_at DESC
       LIMIT 100`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    documents: documents.rows,
    notes: notes.rows,
    counts: sources.rows[0],
    invoices: invoices.rows,
  });
}));

router.post('/quotes', asyncHandler(async (req, res) => {
  const branchId = req.body.branchId;
  const customerId = req.body.customerId || null;
  const validUntil = req.body.validUntil;
  const notes = text(req.body.notes, 2000) || null;
  if (!isUuid(branchId) || (customerId && !isUuid(customerId)) ||
      !validDate(validUntil)) {
    throw new AppError(
      'Selecciona sucursal, cliente opcional y fecha de vigencia válidos.',
      422,
      'INVALID_QUOTE_HEADER',
    );
  }
  const result = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT
         EXISTS(SELECT 1 FROM branches
           WHERE id = $2 AND tenant_id = $1 AND active = TRUE) branch_ok,
         ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM customers
           WHERE id = $3 AND tenant_id = $1 AND active = TRUE)) customer_ok`,
      [req.context.tenantId, branchId, customerId],
    );
    if (!references.rows[0].branch_ok || !references.rows[0].customer_ok) {
      throw new AppError(
        'La sucursal o el cliente no pertenece a la empresa activa.',
        404,
        'QUOTE_REFERENCE_NOT_FOUND',
      );
    }
    const items = await loadCommercialItems(
      client,
      req.context.tenantId,
      req.body.items,
    );
    const total = Math.round(
      items.reduce((sum, item) => sum + item.lineTotal, 0) * 100,
    ) / 100;
    const taxTotal = Math.round(
      items.reduce((sum, item) => sum + item.taxAmount, 0) * 100,
    ) / 100;
    const document = await client.query(
      `INSERT INTO commercial_sales_documents(
         company_id, branch_id, customer_id, document_type, document_number,
         status, valid_until, subtotal, tax_total, total, notes, created_by
       )
       VALUES(
         $1,$2,$3,'QUOTE',
         'COT-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
           lpad(nextval('billing_quote_number_seq')::text, 6, '0'),
         'DRAFT',$4,$5,$6,$7,$8,$9
       )
       RETURNING *`,
      [
        req.context.tenantId,
        branchId,
        customerId,
        validUntil,
        total - taxTotal,
        taxTotal,
        total,
        notes,
        req.context.userId,
      ],
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO commercial_sales_document_items(
           company_id, commercial_document_id, product_id, sku_snapshot,
           name_snapshot, quantity, unit_price, tax_rate, tax_amount, line_total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          req.context.tenantId, document.rows[0].id, item.id, item.sku,
          item.name, item.quantity, item.unitPrice, item.taxRate,
          item.taxAmount, item.lineTotal,
        ],
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'billing.quote_created',
      entityType: 'commercial_sales_document',
      entityId: document.rows[0].id,
      after: { ...document.rows[0], itemCount: items.length },
      reason: 'Cotización comercial creada sin consumir numeración fiscal',
    });
    return document.rows[0];
  });
  res.status(201).json(result);
}));

router.post('/quotes/:quoteId/convert-order', asyncHandler(async (req, res) => {
  const { quoteId } = req.params;
  if (!isUuid(quoteId)) {
    throw new AppError('La cotización no es válida.', 422, 'INVALID_QUOTE_ID');
  }
  const result = await withTransaction(async (client) => {
    const quote = await client.query(
      `SELECT * FROM commercial_sales_documents
       WHERE id = $1 AND company_id = $2 AND document_type = 'QUOTE'
         AND status NOT IN ('CONVERTED','CANCELLED','EXPIRED')
       FOR UPDATE`,
      [quoteId, req.context.tenantId],
    );
    if (!quote.rowCount) {
      throw new AppError(
        'La cotización no existe o ya fue cerrada.',
        404,
        'QUOTE_NOT_CONVERTIBLE',
      );
    }
    const order = await client.query(
      `INSERT INTO commercial_sales_documents(
         company_id, branch_id, customer_id, source_document_id,
         document_type, document_number, status, expected_date,
         subtotal, tax_total, total, notes, created_by
       )
       SELECT company_id, branch_id, customer_id, id, 'ORDER',
              'PED-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
                lpad(nextval('billing_order_number_seq')::text, 6, '0'),
              'CONFIRMED', $3::date, subtotal, tax_total, total, notes, $4
       FROM commercial_sales_documents
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [
        quoteId,
        req.context.tenantId,
        validDate(req.body.expectedDate) ? req.body.expectedDate : null,
        req.context.userId,
      ],
    );
    await client.query(
      `INSERT INTO commercial_sales_document_items(
         company_id, commercial_document_id, product_id, sku_snapshot,
         name_snapshot, quantity, unit_price, tax_rate, tax_amount, line_total
       )
       SELECT company_id, $3, product_id, sku_snapshot, name_snapshot,
              quantity, unit_price, tax_rate, tax_amount, line_total
       FROM commercial_sales_document_items
       WHERE commercial_document_id = $1 AND company_id = $2`,
      [quoteId, req.context.tenantId, order.rows[0].id],
    );
    await client.query(
      `UPDATE commercial_sales_documents
       SET status = 'CONVERTED', updated_at = now()
       WHERE id = $1`,
      [quoteId],
    );
    await reserveOrderInventory(client, {
      tenantId: req.context.tenantId,
      order: order.rows[0],
      warehouseId: req.body.warehouseId || null,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'billing.quote_converted_to_order',
      entityType: 'commercial_sales_document',
      entityId: order.rows[0].id,
      before: quote.rows[0],
      after: order.rows[0],
      reason: 'Cotización aceptada y convertida a pedido',
    });
    return order.rows[0];
  });
  res.status(201).json(result);
}));

router.post('/orders', asyncHandler(async (req, res) => {
  const branchId = req.body.branchId;
  const customerId = req.body.customerId || null;
  const expectedDate = req.body.expectedDate;
  const notes = text(req.body.notes, 2000) || null;
  if (!isUuid(branchId) || (customerId && !isUuid(customerId)) || !validDate(expectedDate)) {
    throw new AppError(
      'Selecciona sucursal, cliente opcional y fecha esperada válidos.',
      422,
      'INVALID_ORDER_HEADER',
    );
  }
  const result = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT
         EXISTS(SELECT 1 FROM branches WHERE id = $2 AND tenant_id = $1 AND active = TRUE) branch_ok,
         ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM customers
           WHERE id = $3 AND tenant_id = $1 AND active = TRUE)) customer_ok`,
      [req.context.tenantId, branchId, customerId],
    );
    if (!references.rows[0].branch_ok || !references.rows[0].customer_ok) {
      throw new AppError('La sucursal o el cliente no pertenece a la empresa activa.', 404, 'ORDER_REFERENCE_NOT_FOUND');
    }
    const items = await loadCommercialItems(client, req.context.tenantId, req.body.items);
    const total = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    const taxTotal = Math.round(items.reduce((sum, item) => sum + item.taxAmount, 0) * 100) / 100;
    const document = await client.query(
      `INSERT INTO commercial_sales_documents(
         company_id, branch_id, customer_id, document_type, document_number,
         status, expected_date, subtotal, tax_total, total, notes, created_by
       ) VALUES(
         $1,$2,$3,'ORDER',
         'PED-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
           lpad(nextval('billing_order_number_seq')::text, 6, '0'),
         'DRAFT',$4,$5,$6,$7,$8,$9
       ) RETURNING *`,
      [req.context.tenantId, branchId, customerId, expectedDate, total - taxTotal,
        taxTotal, total, notes, req.context.userId],
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO commercial_sales_document_items(
           company_id, commercial_document_id, product_id, sku_snapshot,
           name_snapshot, quantity, unit_price, tax_rate, tax_amount, line_total
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [req.context.tenantId, document.rows[0].id, item.id, item.sku, item.name,
          item.quantity, item.unitPrice, item.taxRate, item.taxAmount, item.lineTotal],
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'billing.order_created', entityType: 'commercial_sales_document',
      entityId: document.rows[0].id, after: { ...document.rows[0], itemCount: items.length },
      reason: 'Pedido comercial creado directamente',
    });
    return document.rows[0];
  });
  res.status(201).json(result);
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const status = text(req.query.status, 30).toUpperCase() || null;
  const customerId = req.query.customer_id || null;
  const branchId = req.query.branch_id || null;
  const dateFrom = req.query.date_from || null;
  const dateTo = req.query.date_to || null;
  const search = text(req.query.search, 100) || null;
  const page = Math.max(1, Math.trunc(Number(req.query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(req.query.limit) || 25)));
  if ((status && !Object.hasOwn(ORDER_TRANSITIONS, status)) ||
      (customerId && !isUuid(customerId)) || (branchId && !isUuid(branchId)) ||
      (dateFrom && !validDate(dateFrom)) || (dateTo && !validDate(dateTo))) {
    throw new AppError('Los filtros del listado de pedidos no son válidos.', 422, 'INVALID_ORDER_FILTERS');
  }
  const result = await query(
    `SELECT document.*, customer.name customer_name, branch.name branch_name,
            COUNT(item.id)::integer item_count, COUNT(*) OVER()::integer total_count
     FROM commercial_sales_documents document
     JOIN branches branch ON branch.id = document.branch_id AND branch.tenant_id = document.company_id
     LEFT JOIN customers customer ON customer.id = document.customer_id AND customer.tenant_id = document.company_id
     LEFT JOIN commercial_sales_document_items item ON item.commercial_document_id = document.id AND item.company_id = document.company_id
     WHERE document.company_id = $1 AND document.document_type = 'ORDER'
       AND ($2::text IS NULL OR document.status = $2)
       AND ($3::uuid IS NULL OR document.customer_id = $3)
       AND ($4::uuid IS NULL OR document.branch_id = $4)
       AND ($5::date IS NULL OR document.created_at >= $5::date)
       AND ($6::date IS NULL OR document.created_at < ($6::date + INTERVAL '1 day'))
       AND ($7::text IS NULL OR document.document_number ILIKE '%' || $7 || '%' OR customer.name ILIKE '%' || $7 || '%')
     GROUP BY document.id, customer.name, branch.name
     ORDER BY document.created_at DESC
     LIMIT $8 OFFSET $9`,
    [req.context.tenantId, status, customerId, branchId, dateFrom, dateTo, search, limit, (page - 1) * limit],
  );
  res.json({ items: result.rows, page, limit, total: result.rows[0]?.total_count || 0 });
}));

router.get('/orders/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!isUuid(orderId)) throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  const document = await query(
    `SELECT order_document.*, customer.name customer_name, source.document_number source_document_number
     FROM commercial_sales_documents order_document
     LEFT JOIN customers customer ON customer.id = order_document.customer_id AND customer.tenant_id = order_document.company_id
     LEFT JOIN commercial_sales_documents source ON source.id = order_document.source_document_id AND source.company_id = order_document.company_id
     WHERE order_document.id = $1 AND order_document.company_id = $2 AND order_document.document_type = 'ORDER'`,
    [orderId, req.context.tenantId],
  );
  if (!document.rowCount) throw new AppError('No encontramos el pedido.', 404, 'ORDER_NOT_FOUND');
  const [items, reservations] = await Promise.all([
    query(`SELECT * FROM commercial_sales_document_items WHERE commercial_document_id = $1 AND company_id = $2 ORDER BY id`, [orderId, req.context.tenantId]),
    query(`SELECT reservation.*, warehouse.name warehouse_name FROM commercial_order_reservations reservation JOIN warehouses warehouse ON warehouse.id = reservation.warehouse_id AND warehouse.tenant_id = reservation.company_id WHERE reservation.commercial_document_id = $1 AND reservation.company_id = $2 AND reservation.released_at IS NULL ORDER BY reservation.created_at`, [orderId, req.context.tenantId]),
  ]);
  res.json({ ...document.rows[0], items: items.rows, reservations: reservations.rows });
}));

router.patch('/orders/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!isUuid(orderId)) throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  const has = (name) => Object.hasOwn(req.body, name);
  if (!['branchId', 'customerId', 'expectedDate', 'notes', 'items'].some(has)) {
    throw new AppError('Indica al menos un campo para actualizar.', 422, 'EMPTY_ORDER_UPDATE');
  }
  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM commercial_sales_documents
       WHERE id = $1 AND company_id = $2 AND document_type = 'ORDER' FOR UPDATE`,
      [orderId, req.context.tenantId],
    );
    if (!current.rowCount) throw new AppError('No encontramos el pedido.', 404, 'ORDER_NOT_FOUND');
    if (current.rows[0].status !== 'DRAFT') {
      throw new AppError('Un pedido confirmado no puede editarse.', 409, 'CANNOT_EDIT_CONFIRMED_ORDER');
    }
    const branchId = has('branchId') ? req.body.branchId : current.rows[0].branch_id;
    const customerId = has('customerId') ? (req.body.customerId || null) : current.rows[0].customer_id;
    const expectedDate = has('expectedDate')
      ? req.body.expectedDate
      : dateOnly(current.rows[0].expected_date);
    const notes = has('notes') ? (text(req.body.notes, 2000) || null) : current.rows[0].notes;
    if (!isUuid(branchId) || (customerId && !isUuid(customerId)) || !validDate(expectedDate)) {
      throw new AppError('Los datos del pedido no son válidos.', 422, 'INVALID_ORDER_HEADER');
    }
    const references = await client.query(
      `SELECT EXISTS(SELECT 1 FROM branches WHERE id = $2 AND tenant_id = $1 AND active = TRUE) branch_ok,
         ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM customers WHERE id = $3 AND tenant_id = $1 AND active = TRUE)) customer_ok`,
      [req.context.tenantId, branchId, customerId],
    );
    if (!references.rows[0].branch_ok || !references.rows[0].customer_ok) {
      throw new AppError('La sucursal o el cliente no pertenece a la empresa activa.', 404, 'ORDER_REFERENCE_NOT_FOUND');
    }
    let items = null;
    if (has('items')) {
      items = await loadCommercialItems(client, req.context.tenantId, req.body.items);
      await client.query(
        `DELETE FROM commercial_sales_document_items WHERE commercial_document_id = $1 AND company_id = $2`,
        [orderId, req.context.tenantId],
      );
      for (const item of items) {
        await client.query(
          `INSERT INTO commercial_sales_document_items(company_id, commercial_document_id, product_id, sku_snapshot, name_snapshot, quantity, unit_price, tax_rate, tax_amount, line_total)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [req.context.tenantId, orderId, item.id, item.sku, item.name, item.quantity,
            item.unitPrice, item.taxRate, item.taxAmount, item.lineTotal],
        );
      }
    }
    const totals = items || (await client.query(
      `SELECT COALESCE(SUM(line_total), 0) total, COALESCE(SUM(tax_amount), 0) tax_total
       FROM commercial_sales_document_items WHERE commercial_document_id = $1 AND company_id = $2`,
      [orderId, req.context.tenantId],
    )).rows[0];
    const total = items
      ? Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100
      : Number(totals.total);
    const taxTotal = items
      ? Math.round(items.reduce((sum, item) => sum + item.taxAmount, 0) * 100) / 100
      : Number(totals.tax_total);
    const updated = await client.query(
      `UPDATE commercial_sales_documents
       SET branch_id = $3, customer_id = $4, expected_date = $5, notes = $6,
           subtotal = $7, tax_total = $8, total = $9, updated_at = now()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [orderId, req.context.tenantId, branchId, customerId, expectedDate, notes,
        total - taxTotal, taxTotal, total],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'billing.order_updated', entityType: 'commercial_sales_document', entityId: orderId,
      before: current.rows[0], after: updated.rows[0], reason: 'Pedido en borrador actualizado',
    });
    return updated.rows[0];
  });
  res.json(result);
}));

router.post('/orders/:orderId/confirm', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!isUuid(orderId)) throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM commercial_sales_documents WHERE id = $1 AND company_id = $2 AND document_type = 'ORDER' FOR UPDATE`,
      [orderId, req.context.tenantId],
    );
    if (!current.rowCount) throw new AppError('No encontramos el pedido.', 404, 'ORDER_NOT_FOUND');
    if (!transitionAllowed(current.rows[0].status, 'CONFIRMED')) {
      throw statusTransitionError(current.rows[0].status, 'CONFIRMED');
    }
    await reserveOrderInventory(client, {
      tenantId: req.context.tenantId, order: current.rows[0], warehouseId: req.body.warehouseId || null,
    });
    const updated = await client.query(
      `UPDATE commercial_sales_documents SET status = 'CONFIRMED', updated_at = now()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [orderId, req.context.tenantId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'billing.order_confirmed', entityType: 'commercial_sales_document', entityId: orderId,
      before: current.rows[0], after: updated.rows[0], reason: 'Pedido confirmado y existencias reservadas',
    });
    return updated.rows[0];
  });
  res.json(result);
}));

router.post('/orders/:orderId/cancel', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const reason = text(req.body.reason, 1000);
  if (!isUuid(orderId)) throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  if (!reason) throw new AppError('Indica el motivo de la cancelación.', 422, 'CANCELLATION_REASON_REQUIRED');
  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM commercial_sales_documents WHERE id = $1 AND company_id = $2 AND document_type = 'ORDER' FOR UPDATE`,
      [orderId, req.context.tenantId],
    );
    if (!current.rowCount) throw new AppError('No encontramos el pedido.', 404, 'ORDER_NOT_FOUND');
    if (!transitionAllowed(current.rows[0].status, 'CANCELLED')) {
      throw statusTransitionError(current.rows[0].status, 'CANCELLED');
    }
    await releaseOrderReservations(client, { tenantId: req.context.tenantId, orderId, reason: 'CANCELLED' });
    const updated = await client.query(
      `UPDATE commercial_sales_documents SET status = 'CANCELLED', updated_at = now()
       WHERE id = $1 AND company_id = $2 RETURNING *`, [orderId, req.context.tenantId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'billing.order_cancelled', entityType: 'commercial_sales_document', entityId: orderId,
      before: current.rows[0], after: updated.rows[0], reason,
    });
    return updated.rows[0];
  });
  res.json(result);
}));

router.post('/orders/:orderId/ready-to-invoice', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!isUuid(orderId)) {
    throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  }
  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM commercial_sales_documents
       WHERE id = $1 AND company_id = $2 AND document_type = 'ORDER'
       FOR UPDATE`,
      [orderId, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError(
        'El pedido no existe.', 404, 'ORDER_NOT_FOUND',
      );
    }
    if (!transitionAllowed(current.rows[0].status, 'READY_TO_INVOICE')) {
      throw statusTransitionError(current.rows[0].status, 'READY_TO_INVOICE');
    }
    const order = await client.query(
      `UPDATE commercial_sales_documents
       SET status = 'READY_TO_INVOICE', updated_at = now()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [orderId, req.context.tenantId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'billing.order_ready_to_invoice',
      entityType: 'commercial_sales_document',
      entityId: orderId,
      after: order.rows[0],
      reason: text(req.body.reason, 300) || 'Pedido revisado y listo para facturar',
    });
    return order.rows[0];
  });
  res.json(result);
}));

// La integración fiscal debe invocar este cierre una vez haya aplicado el movimiento
// real de inventario; aquí solo se libera la reserva para no descontar dos veces.
router.post('/orders/:orderId/invoice', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!isUuid(orderId)) throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM commercial_sales_documents WHERE id = $1 AND company_id = $2 AND document_type = 'ORDER' FOR UPDATE`,
      [orderId, req.context.tenantId],
    );
    if (!current.rowCount) throw new AppError('No encontramos el pedido.', 404, 'ORDER_NOT_FOUND');
    if (!transitionAllowed(current.rows[0].status, 'INVOICED')) {
      throw statusTransitionError(current.rows[0].status, 'INVOICED');
    }
    await releaseOrderReservations(client, { tenantId: req.context.tenantId, orderId, reason: 'INVOICED' });
    const updated = await client.query(
      `UPDATE commercial_sales_documents SET status = 'INVOICED', updated_at = now()
       WHERE id = $1 AND company_id = $2 RETURNING *`, [orderId, req.context.tenantId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'billing.order_invoiced', entityType: 'commercial_sales_document', entityId: orderId,
      before: current.rows[0], after: updated.rows[0],
      reason: text(req.body.reason, 300) || 'Pedido facturado; reserva liberada',
    });
    return updated.rows[0];
  });
  res.json(result);
}));

router.get('/documents/:documentId/adjustment-items', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!isUuid(documentId)) {
    throw new AppError('La factura no es válida.', 422, 'INVALID_BILLING_DOCUMENT_ID');
  }
  const result = await query(
    `SELECT item.id sale_item_id, item.product_id, item.sku_snapshot,
            item.name_snapshot, item.quantity, item.unit_price, item.tax_rate,
            item.tax_amount, item.line_total
     FROM electronic_documents document
     JOIN sales sale ON sale.id=document.sale_id AND sale.company_id=document.company_id
     JOIN sale_items item ON item.sale_id=sale.id AND item.seller_company_id=sale.company_id
     WHERE document.id=$1 AND document.company_id=$2 AND document.status='ACCEPTED'
     ORDER BY item.id`,
    [documentId, req.context.tenantId],
  );
  if (!result.rowCount) {
    throw new AppError('No encontramos líneas ajustables de una factura aceptada.', 404, 'ADJUSTMENT_SOURCE_NOT_FOUND');
  }
  res.json(result.rows);
}));

router.post('/notes', asyncHandler(async (req, res) => {
  const originalDocumentId = req.body.originalDocumentId;
  const noteType = text(req.body.noteType, 20).toUpperCase();
  const reasonCode = text(req.body.reasonCode, 20);
  const reason = text(req.body.reason, 1000);
  const selectedItems = Array.isArray(req.body.items) ? req.body.items : [];
  if (!isUuid(originalDocumentId) ||
      !['CREDIT_NOTE', 'DEBIT_NOTE'].includes(noteType) ||
      !reasonCode || !reason || !selectedItems.length || selectedItems.length > 100 ||
      selectedItems.some((item) => !isUuid(item?.saleItemId) ||
        !Number.isFinite(Number(item?.quantity)) || Number(item.quantity) <= 0)) {
    throw new AppError(
      'Selecciona factura, al menos un producto, tipo, causal y motivo.',
      422,
      'INVALID_ADJUSTMENT_NOTE',
    );
  }
  const result = await withTransaction(async (client) => {
    const original = await client.query(
      `SELECT document.id, document.status, sale.id sale_id, sale.total, sale.tax_total
       FROM electronic_documents document
       JOIN sales sale
         ON sale.id = document.sale_id
        AND sale.company_id = document.company_id
       WHERE document.id = $1 AND document.company_id = $2
       FOR SHARE OF document, sale`,
      [originalDocumentId, req.context.tenantId],
    );
    if (!original.rowCount || original.rows[0].status !== 'ACCEPTED') {
      throw new AppError(
        'Solo pueden ajustarse documentos electrónicos aceptados.',
        409,
        'ACCEPTED_DOCUMENT_REQUIRED',
      );
    }
    const consolidated = new Map();
    selectedItems.forEach((item) => consolidated.set(
      item.saleItemId,
      (consolidated.get(item.saleItemId) || 0) + Number(item.quantity),
    ));
    const sourceItems = await client.query(
      `SELECT id, product_id, sku_snapshot, name_snapshot, quantity, unit_price,
              tax_rate, tax_amount, line_total
       FROM sale_items
       WHERE sale_id=$1 AND seller_company_id=$2 AND id=ANY($3::uuid[])
       FOR SHARE`,
      [original.rows[0].sale_id, req.context.tenantId, [...consolidated.keys()]],
    );
    if (sourceItems.rowCount !== consolidated.size) {
      throw new AppError('Uno de los productos no pertenece a la factura original.', 422, 'INVALID_ADJUSTMENT_ITEM');
    }
    const noteItems = sourceItems.rows.map((item) => {
      const quantity = consolidated.get(item.id);
      if (quantity > Number(item.quantity)) {
        throw new AppError(`La cantidad de ${item.name_snapshot} supera lo facturado.`, 422, 'ADJUSTMENT_QUANTITY_EXCEEDED');
      }
      const ratio = quantity / Number(item.quantity);
      return {
        ...item,
        quantity,
        taxAmount: Math.round(Number(item.tax_amount) * ratio * 100) / 100,
        lineTotal: Math.round(Number(item.line_total) * ratio * 100) / 100,
      };
    });
    const total = Math.round(noteItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    const taxTotal = Math.round(noteItems.reduce((sum, item) => sum + item.taxAmount, 0) * 100) / 100;
    const note = await client.query(
      `INSERT INTO electronic_adjustment_notes(
         company_id, original_document_id, note_type, reason_code, reason,
         subtotal, tax_total, total, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.context.tenantId,
        originalDocumentId,
        noteType,
        reasonCode,
        reason,
        total - taxTotal,
        taxTotal,
        total,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: noteType === 'CREDIT_NOTE'
        ? 'billing.credit_note_created'
        : 'billing.debit_note_created',
      entityType: 'electronic_adjustment_note',
      entityId: note.rows[0].id,
      after: note.rows[0],
      reason,
    });
    for (const item of noteItems) {
      await client.query(
        `INSERT INTO electronic_adjustment_note_items(
           company_id, adjustment_note_id, original_sale_item_id, product_id,
           sku_snapshot, name_snapshot, quantity, unit_price, tax_rate,
           tax_amount, line_total
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [req.context.tenantId, note.rows[0].id, item.id, item.product_id,
          item.sku_snapshot, item.name_snapshot, item.quantity, item.unit_price,
          item.tax_rate, item.taxAmount, item.lineTotal],
      );
    }
    return note.rows[0];
  });
  res.status(201).json(result);
}));

router.post('/notes/:noteId/queue', asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  if (!isUuid(noteId)) {
    throw new AppError('La nota no es válida.', 422, 'INVALID_NOTE_ID');
  }
  const result = await withTransaction(async (client) => {
    const note = await client.query(
      `SELECT note.*, account.id billing_account_id,
              account.connection_status, account.provider_code,
              document.provider_reference original_provider_reference,
              sale.total original_total,
              resolution.provider_numbering_range_id
       FROM electronic_adjustment_notes note
       JOIN electronic_billing_accounts account
         ON account.company_id = note.company_id AND account.active = TRUE
       JOIN electronic_documents document
         ON document.id = note.original_document_id
        AND document.company_id = note.company_id
       JOIN sales sale ON sale.id = document.sale_id AND sale.company_id = note.company_id
       LEFT JOIN billing_resolutions resolution
         ON resolution.id = document.billing_resolution_id
        AND resolution.company_id = document.company_id
       WHERE note.id = $1 AND note.company_id = $2
         AND note.status IN ('PENDING','REJECTED')
       ORDER BY account.updated_at DESC
       LIMIT 1
       FOR UPDATE OF note`,
      [noteId, req.context.tenantId],
    );
    if (!note.rowCount || note.rows[0].connection_status !== 'READY') {
      throw new AppError(
        'La nota requiere conexión lista y un estado pendiente o rechazado.',
        409,
        'NOTE_NOT_READY_TO_QUEUE',
      );
    }
    const attempts = await client.query(
      `SELECT COALESCE(MAX(attempt_number), 0)::integer + 1 next_attempt
       FROM electronic_note_transmissions
       WHERE adjustment_note_id = $1`,
      [noteId],
    );
    const record = note.rows[0];
    let providerPayload = {
      schema: 'nubixor-electronic-adjustment-note-v1',
      noteId,
      noteType: record.note_type,
      originalDocumentId: record.original_document_id,
      reasonCode: record.reason_code,
      reason: record.reason,
      subtotal: record.subtotal,
      taxTotal: record.tax_total,
      total: record.total,
    };
    if (record.provider_code === 'FACTUS') {
      if (!record.original_provider_reference) {
        throw new AppError(
          'La factura original aún no tiene número Factus; espera su aceptación antes de emitir la nota.',
          409,
          'FACTUS_ORIGINAL_REFERENCE_REQUIRED',
        );
      }
      const sourcePayload = await client.query(
        `SELECT payload_snapshot
         FROM electronic_document_transmissions
         WHERE electronic_document_id = $1 AND company_id = $2
           AND status IN ('SUBMITTED','ACCEPTED')
         ORDER BY attempt_number DESC
         LIMIT 1`,
        [record.original_document_id, req.context.tenantId],
      );
      const invoicePayload = sourcePayload.rows[0]?.payload_snapshot;
      if (!invoicePayload?.items?.length || !invoicePayload?.payment_details?.length) {
        throw new AppError(
          'No encontramos la evidencia fiscal de la factura original para construir la nota.',
          409,
          'FACTUS_ORIGINAL_PAYLOAD_REQUIRED',
        );
      }
      const [sourceItems, noteItems] = await Promise.all([
        client.query(
          `SELECT id FROM sale_items
           WHERE sale_id=(SELECT sale_id FROM electronic_documents WHERE id=$1 AND company_id=$2)
             AND seller_company_id=$2
           ORDER BY id`,
          [record.original_document_id, req.context.tenantId],
        ),
        client.query(
          `SELECT original_sale_item_id, quantity
           FROM electronic_adjustment_note_items
           WHERE adjustment_note_id=$1 AND company_id=$2
           ORDER BY original_sale_item_id`,
          [noteId, req.context.tenantId],
        ),
      ]);
      if (!noteItems.rowCount || sourceItems.rowCount !== invoicePayload.items.length) {
        throw new AppError(
          'Faltan las líneas auditables de la nota o la evidencia de la factura original.',
          409,
          'FACTUS_NOTE_ITEM_EVIDENCE_REQUIRED',
        );
      }
      const selectedQuantities = new Map(noteItems.rows.map((item) => [
        item.original_sale_item_id,
        Number(item.quantity),
      ]));
      const providerItems = invoicePayload.items.flatMap((item, index) => {
        const quantity = selectedQuantities.get(sourceItems.rows[index].id);
        return quantity
          ? [{ ...item, quantity: String(Math.round(quantity * 100) / 100) }]
          : [];
      });
      if (!providerItems.length) {
        throw new AppError('Selecciona al menos una línea para transmitir la nota.', 409, 'FACTUS_NOTE_ITEMS_REQUIRED');
      }
      const ratio = Number(record.total) / Number(record.original_total);
      let paymentRemainder = Number(record.total);
      const paymentDetails = invoicePayload.payment_details.map((detail, index, all) => {
        const amount = index === all.length - 1
          ? paymentRemainder
          : Math.round(Number(detail.amount) * ratio * 100) / 100;
        paymentRemainder = Math.round((paymentRemainder - amount) * 100) / 100;
        return { ...detail, amount: amount.toFixed(2) };
      });
      providerPayload = {
        reference_code: `NUBIXOR-NOTE-${noteId}`,
        correction_concept_code: record.reason_code,
        bill_number: record.original_provider_reference,
        ...(record.provider_numbering_range_id
          ? { numbering_range_id: Number(record.provider_numbering_range_id) }
          : {}),
        observation: record.reason.slice(0, 250),
        payment_details: paymentDetails,
        customer: invoicePayload.customer,
        items: providerItems,
        note_type: record.note_type === 'CREDIT_NOTE' ? 'CREDIT' : 'DEBIT',
      };
    }
    const transmission = await client.query(
      `INSERT INTO electronic_note_transmissions(
         company_id, adjustment_note_id, billing_account_id,
         attempt_number, idempotency_key, payload_snapshot, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        req.context.tenantId,
        noteId,
        record.billing_account_id,
        attempts.rows[0].next_attempt,
        `${noteId}:${attempts.rows[0].next_attempt}:${randomUUID()}`,
        providerPayload,
        req.context.userId,
      ],
    );
    await client.query(
      `UPDATE electronic_adjustment_notes
       SET status = 'QUEUED',
           retry_count = CASE WHEN status = 'REJECTED'
             THEN retry_count + 1 ELSE retry_count END,
           failure_reason = NULL,
           updated_at = now()
       WHERE id = $1`,
      [noteId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'billing.adjustment_note_queued',
      entityType: 'electronic_note_transmission',
      entityId: transmission.rows[0].id,
      after: transmission.rows[0],
      reason: 'Nota preparada para el adaptador del proveedor',
    });
    return transmission.rows[0];
  });
  res.status(202).json(result);
}));

router.get('/documents/:documentId/status', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!isUuid(documentId)) {
    throw new AppError('El documento no es válido.', 422, 'INVALID_BILLING_DOCUMENT_ID');
  }
  const [document, transmissions] = await Promise.all([
    query(
      `SELECT electronic.id, electronic.prefix, electronic.document_number,
              electronic.status, electronic.provider_reference,
              electronic.cufe, electronic.qr_url, electronic.pdf_url,
              electronic.xml_url, electronic.failure_reason,
              electronic.submitted_at, electronic.accepted_at,
              electronic.last_synced_at, sale.total, sale.tax_total,
              sale.created_at
       FROM electronic_documents electronic
       JOIN sales sale
         ON sale.id = electronic.sale_id
        AND sale.company_id = electronic.company_id
       WHERE electronic.id = $1 AND electronic.company_id = $2`,
      [documentId, req.context.tenantId],
    ),
    query(
      `SELECT id, attempt_number, status, provider_status,
              provider_reference, error_code, error_message,
              queued_at, started_at, completed_at, next_attempt_at
       FROM electronic_document_transmissions
       WHERE electronic_document_id = $1 AND company_id = $2
       ORDER BY attempt_number DESC`,
      [documentId, req.context.tenantId],
    ),
  ]);
  if (!document.rowCount) {
    throw new AppError(
      'El documento no existe en la empresa activa.',
      404,
      'BILLING_DOCUMENT_NOT_FOUND',
    );
  }
  res.json({ document: document.rows[0], transmissions: transmissions.rows });
}));

router.get('/notes/:noteId/status', asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  if (!isUuid(noteId)) {
    throw new AppError('La nota no es válida.', 422, 'INVALID_NOTE_ID');
  }
  const [note, transmissions] = await Promise.all([
    query(
      `SELECT id, note_type, status, provider_reference, cude, qr_url,
              failure_reason, retry_count, next_attempt_at, submitted_at,
              accepted_at, updated_at
       FROM electronic_adjustment_notes
       WHERE id = $1 AND company_id = $2`,
      [noteId, req.context.tenantId],
    ),
    query(
      `SELECT id, attempt_number, status, error_code, error_message,
              queued_at, started_at, completed_at, next_attempt_at
       FROM electronic_note_transmissions
       WHERE adjustment_note_id = $1 AND company_id = $2
       ORDER BY attempt_number DESC`,
      [noteId, req.context.tenantId],
    ),
  ]);
  if (!note.rowCount) {
    throw new AppError(
      'La nota no existe en la empresa activa.',
      404,
      'NOTE_NOT_FOUND',
    );
  }
  res.json({ note: note.rows[0], transmissions: transmissions.rows });
}));

export default router;
