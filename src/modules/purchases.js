import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import { postPurchaseReceiptAccounting } from '../accounting.js';
import { createBillingAdapter } from '../electronic-billing/adapters/registry.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DOCUMENT_TYPES = new Set(['PURCHASE_ORDER', 'INVOICE', 'SUPPORT_DOCUMENT']);
const RADIAN_EVENTS = new Set(['030', '031', '032', '033']);

router.use(requireTenant);

function normalizedText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo supera ${maxLength} caracteres.`,
      422,
      'FIELD_TOO_LONG',
    );
  }
  return normalized;
}

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new AppError(
      'La orden debe incluir al menos un producto.',
      422,
      'PURCHASE_ITEMS_REQUIRED',
    );
  }
  const seen = new Set();
  return items.map((item) => {
    if (!isUuid(item.productId)) {
      throw new AppError(
        'Cada producto debe tener un UUID válido.',
        422,
        'INVALID_PURCHASE_PRODUCT',
      );
    }
    if (seen.has(item.productId)) {
      throw new AppError(
        'Un producto no puede repetirse en la misma orden.',
        422,
        'DUPLICATE_PURCHASE_PRODUCT',
      );
    }
    seen.add(item.productId);
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);
    const taxRate = Number(item.taxRate || 0);
    if (!Number.isFinite(quantity) || quantity <= 0 ||
        !Number.isFinite(unitCost) || unitCost < 0 ||
        !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      throw new AppError(
        'Cantidad, costo e impuesto deben ser valores válidos.',
        422,
        'INVALID_PURCHASE_ITEM',
      );
    }
    return { productId: item.productId, quantity, unitCost, taxRate };
  });
}

async function activeFactusAccount(tenantId) {
  const result = await query(
    `SELECT id, company_id, provider_code, environment, base_url,
            encrypted_credentials, provider_config, connection_status
     FROM electronic_billing_accounts
     WHERE company_id = $1 AND provider_code = 'FACTUS' AND active = TRUE
     ORDER BY updated_at DESC
     LIMIT 1`,
    [tenantId],
  );
  if (!result.rowCount || result.rows[0].connection_status !== 'READY') {
    throw new AppError(
      'Conecta y prueba Factus para esta empresa antes de recibir una factura electrónica.',
      409,
      'FACTUS_CONNECTION_REQUIRED',
    );
  }
  return result.rows[0];
}

async function purchaseForTenant(purchaseId, tenantId) {
  if (!isUuid(purchaseId)) {
    throw new AppError('La orden debe tener un UUID válido.', 422, 'INVALID_PURCHASE_ID');
  }
  const result = await query(
    `SELECT id, order_number FROM purchases WHERE id = $1 AND tenant_id = $2`,
    [purchaseId, tenantId],
  );
  if (!result.rowCount) {
    throw new AppError('No encontramos la orden en la empresa activa.', 404, 'PURCHASE_NOT_FOUND');
  }
  return result.rows[0];
}

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COUNT(DISTINCT p.id) FILTER (
         WHERE p.status IN ('ORDERED','PARTIAL')
       )::integer open_orders,
       COALESCE(SUM(
         GREATEST(pi.ordered_quantity - pi.received_quantity, 0)
       ) FILTER (WHERE p.status IN ('ORDERED','PARTIAL')), 0) pending_units,
       COALESCE((
         SELECT SUM(pri.quantity * pri.unit_cost)
         FROM purchase_receipts pr
         JOIN purchase_receipt_items pri
           ON pri.receipt_id = pr.id AND pri.tenant_id = pr.tenant_id
         WHERE pr.tenant_id = $1
           AND pr.received_at >= date_trunc('month', CURRENT_DATE)
       ), 0) received_value_month,
       (
         SELECT COUNT(*)::integer FROM suppliers
         WHERE tenant_id = $1 AND active = TRUE
       ) active_suppliers
     FROM purchases p
     LEFT JOIN purchase_items pi
       ON pi.purchase_id = p.id AND pi.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/suppliers', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, name, document_type, tax_id, email, phone, address,
            obligated_to_invoice, electronic_invoicer, payment_terms_days,
            active, created_at
     FROM suppliers
     WHERE tenant_id = $1
     ORDER BY active DESC, name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/suppliers', asyncHandler(async (req, res) => {
  const name = normalizedText(req.body.name, 160);
  const documentType = normalizedText(req.body.documentType, 20) || 'NIT';
  const taxId = normalizedText(req.body.taxId, 40);
  const email = normalizedText(req.body.email, 160);
  const phone = normalizedText(req.body.phone, 40);
  const address = normalizedText(req.body.address, 240);
  const paymentTermsDays = Number(req.body.paymentTermsDays || 0);
  if (!name) {
    throw new AppError(
      'El nombre del proveedor es obligatorio.',
      422,
      'SUPPLIER_NAME_REQUIRED',
    );
  }
  if (!Number.isInteger(paymentTermsDays) ||
      paymentTermsDays < 0 || paymentTermsDays > 3650) {
    throw new AppError(
      'El plazo de pago debe expresarse en días válidos.',
      422,
      'INVALID_PAYMENT_TERMS',
    );
  }
  try {
    const result = await query(
      `INSERT INTO suppliers(
         tenant_id, name, document_type, tax_id, email, phone, address,
         obligated_to_invoice, electronic_invoicer, payment_terms_days
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.context.tenantId,
        name,
        documentType.toUpperCase(),
        taxId,
        email,
        phone,
        address,
        Boolean(req.body.obligatedToInvoice),
        Boolean(req.body.electronicInvoicer),
        paymentTermsDays,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Ya existe un proveedor con ese documento.',
        409,
        'SUPPLIER_DOCUMENT_EXISTS',
      );
    }
    throw error;
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.id, p.order_number, p.document_type, p.document_number,
            p.issue_date, p.expected_date, p.status, p.subtotal, p.tax_total,
            p.total, p.created_at, p.received_at,
            s.id supplier_id, s.name supplier_name, s.tax_id supplier_tax_id,
            b.id branch_id, b.name branch_name,
            COUNT(pi.id)::integer item_count,
            COALESCE(SUM(pi.ordered_quantity), 0) ordered_units,
            COALESCE(SUM(pi.received_quantity), 0) received_units
     FROM purchases p
     JOIN suppliers s ON s.id = p.supplier_id AND s.tenant_id = p.tenant_id
     JOIN branches b ON b.id = p.branch_id AND b.tenant_id = p.tenant_id
     LEFT JOIN purchase_items pi
       ON pi.purchase_id = p.id AND pi.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1
     GROUP BY p.id, s.id, b.id
     ORDER BY
       CASE p.status WHEN 'PARTIAL' THEN 0 WHEN 'ORDERED' THEN 1 ELSE 2 END,
       p.created_at DESC`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.get('/:id/support-document/readiness', asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw new AppError('La orden debe tener un UUID válido.', 422, 'INVALID_PURCHASE_ID');
  }

  const purchaseResult = await query(
    `SELECT p.id, p.order_number, p.support_document_required,
            s.name supplier_name, s.document_type supplier_document_type,
            s.tax_id supplier_tax_id, s.email supplier_email,
            s.address supplier_address, s.obligated_to_invoice
     FROM purchases p
     JOIN suppliers s ON s.id = p.supplier_id AND s.tenant_id = p.tenant_id
     WHERE p.id = $1 AND p.tenant_id = $2`,
    [req.params.id, req.context.tenantId],
  );
  if (!purchaseResult.rowCount) {
    throw new AppError('No encontramos la orden en la empresa activa.', 404, 'PURCHASE_NOT_FOUND');
  }
  const purchase = purchaseResult.rows[0];
  if (!purchase.support_document_required) {
    return res.json({
      applicable: false,
      ready: false,
      status: 'NOT_REQUIRED',
      requirements: [],
      message: 'Esta compra no requiere documento soporte según el perfil actual del proveedor.',
    });
  }

  const accountResult = await query(
    `SELECT id, environment, connection_status
     FROM electronic_billing_accounts
     WHERE company_id = $1 AND provider_code = 'FACTUS' AND active = TRUE
     ORDER BY updated_at DESC
     LIMIT 1`,
    [req.context.tenantId],
  );
  const account = accountResult.rows[0] || null;
  const [itemsResult, mappingsResult, rangesResult] = await Promise.all([
    query(
      `SELECT pi.id, p.name, p.sku, p.electronic_unit_measure_code,
              p.electronic_standard_code
       FROM purchase_items pi
       JOIN products p ON p.id = pi.product_id AND p.tenant_id = pi.tenant_id
       WHERE pi.purchase_id = $1 AND pi.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    ),
    account
      ? query(
        `SELECT catalog_type, internal_code, provider_value
         FROM electronic_billing_reference_mappings
         WHERE company_id = $1 AND provider_code = 'FACTUS' AND environment = $2`,
        [req.context.tenantId, account.environment],
      )
      : Promise.resolve({ rows: [] }),
    account
      ? query(
        `SELECT provider_numbering_range_id
         FROM billing_resolutions
         WHERE company_id = $1 AND active = TRUE
           AND provider_numbering_range_id IS NOT NULL
         ORDER BY provider_synced_at DESC NULLS LAST
         LIMIT 1`,
        [req.context.tenantId],
      )
      : Promise.resolve({ rows: [] }),
  ]);

  const hasMapping = (catalogType, internalCode) => mappingsResult.rows.some((mapping) =>
    mapping.catalog_type === catalogType && mapping.internal_code === internalCode && mapping.provider_value,
  );
  const incompleteItems = itemsResult.rows.filter((item) =>
    !item.sku || !item.electronic_unit_measure_code || !item.electronic_standard_code,
  );
  const requirements = [
    {
      key: 'factus_connection',
      label: 'Conexión Factus lista',
      ready: account?.connection_status === 'READY',
      detail: account
        ? account.connection_status === 'READY'
          ? `Cuenta Factus ${account.environment} verificada.`
          : 'La cuenta Factus debe quedar en estado READY antes de emitir.'
        : 'Conecta una cuenta Factus para esta empresa.',
    },
    {
      key: 'supplier_identity',
      label: 'Perfil básico del proveedor',
      ready: Boolean(
        purchase.supplier_name && purchase.supplier_document_type && purchase.supplier_tax_id &&
        purchase.supplier_address,
      ),
      detail: 'Nombre, tipo y número de documento, y dirección del proveedor.',
    },
    {
      key: 'supplier_policy',
      label: 'Proveedor no obligado a facturar',
      ready: purchase.obligated_to_invoice === false,
      detail: purchase.obligated_to_invoice === false
        ? 'La compra está marcada correctamente para documento soporte.'
        : 'Revisa el perfil tributario del proveedor antes de continuar.',
    },
    {
      key: 'reference_mappings',
      label: 'Equivalencias Factus de documento soporte',
      ready: hasMapping('DOCUMENT_TYPE', 'SUPPORT_DOCUMENT') &&
        hasMapping('OPERATION_TYPE', 'SUPPORT_DOCUMENT') &&
        hasMapping('IDENTIFICATION_DOCUMENT', purchase.supplier_document_type),
      detail: 'Configura desde la cuenta real los catálogos de documento, operación e identificación.',
    },
    {
      key: 'numbering_range',
      label: 'Rango asociado en Factus',
      ready: Boolean(rangesResult.rowCount),
      detail: 'Sincroniza y asocia el rango habilitado para la empresa; Nubixor no inventa rangos ni resoluciones.',
    },
    {
      key: 'products',
      label: 'Productos preparados para documento electrónico',
      ready: itemsResult.rowCount > 0 && incompleteItems.length === 0,
      detail: incompleteItems.length
        ? `${incompleteItems.length} producto(s) requieren SKU, unidad y código estándar electrónico.`
        : 'Cada línea tiene SKU, unidad de medida y código estándar configurados.',
    },
  ];
  const ready = requirements.every((requirement) => requirement.ready);
  res.json({
    applicable: true,
    ready,
    status: ready ? 'READY_TO_PREPARE' : 'CONFIGURATION_REQUIRED',
    requirements,
    message: ready
      ? 'La información mínima está lista para preparar el documento soporte. La emisión seguirá requiriendo una acción autorizada.'
      : 'Completa los puntos pendientes antes de preparar o emitir un documento soporte.',
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw new AppError('La orden debe tener un UUID válido.', 422, 'INVALID_PURCHASE_ID');
  }
  const [purchase, electronicReception, items, receipts] = await Promise.all([
    query(
      `SELECT p.*, s.name supplier_name, s.tax_id supplier_tax_id,
              s.email supplier_email, s.payment_terms_days,
              b.name branch_name, b.code branch_code
       FROM purchases p
       JOIN suppliers s ON s.id = p.supplier_id AND s.tenant_id = p.tenant_id
       JOIN branches b ON b.id = p.branch_id AND b.tenant_id = p.tenant_id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT er.id, er.track_id, er.provider_bill_id, er.provider_code,
              er.status, er.last_error, er.uploaded_at, er.updated_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', event.id, 'event_type', event.event_type,
                    'status', event.status, 'error_message', event.error_message,
                    'emitted_at', event.emitted_at
                  ) ORDER BY event.emitted_at DESC
                ) FILTER (WHERE event.id IS NOT NULL),
                '[]'::json
              ) events
       FROM purchase_electronic_receptions er
       LEFT JOIN purchase_electronic_reception_events event
         ON event.reception_id = er.id AND event.tenant_id = er.tenant_id
       WHERE er.purchase_id = $1 AND er.tenant_id = $2
       GROUP BY er.id`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT pi.*, p.sku, p.name product_name, img.public_url image_url,
              img.alt_text image_alt
       FROM purchase_items pi
       JOIN products p ON p.id = pi.product_id AND p.tenant_id = pi.tenant_id
       LEFT JOIN LATERAL (
         SELECT public_url, alt_text
         FROM product_images
         WHERE tenant_id = p.tenant_id AND product_id = p.id
         ORDER BY is_primary DESC, created_at
         LIMIT 1
       ) img ON TRUE
       WHERE pi.purchase_id = $1 AND pi.tenant_id = $2
       ORDER BY p.name`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT pr.id, pr.receipt_number, pr.notes, pr.received_at,
              w.name warehouse_name, w.code warehouse_code,
              COALESCE(SUM(pri.quantity), 0) received_units,
              COALESCE(SUM(pri.quantity * pri.unit_cost), 0) received_value
       FROM purchase_receipts pr
       JOIN warehouses w ON w.id = pr.warehouse_id
       LEFT JOIN purchase_receipt_items pri
         ON pri.receipt_id = pr.id AND pri.tenant_id = pr.tenant_id
       WHERE pr.purchase_id = $1 AND pr.tenant_id = $2
       GROUP BY pr.id, w.id
       ORDER BY pr.received_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
  ]);
  if (!purchase.rowCount) {
    throw new AppError(
      'No encontramos la orden en la empresa activa.',
      404,
      'PURCHASE_NOT_FOUND',
    );
  }
  res.json({
    ...purchase.rows[0],
    items: items.rows,
    receipts: receipts.rows,
    electronic_reception: electronicReception.rows[0] || null,
  });
}));

router.post('/:id/electronic-reception', asyncHandler(async (req, res) => {
  const trackId = normalizedText(req.body.trackId, 512);
  if (!trackId) {
    throw new AppError('Indica el CUFE o track ID de la factura del proveedor.', 422, 'TRACK_ID_REQUIRED');
  }
  const purchase = await purchaseForTenant(req.params.id, req.context.tenantId);
  const account = await activeFactusAccount(req.context.tenantId);
  // La llamada sólo ocurre tras la acción explícita de un usuario autorizado.
  let providerResponse;
  try {
    providerResponse = await createBillingAdapter(account).uploadReceivedInvoice(trackId);
  } catch (error) {
    await withTransaction(async (client) => {
      const failed = await client.query(
        `INSERT INTO purchase_electronic_receptions(
           tenant_id, purchase_id, billing_account_id, provider_code, track_id,
           status, provider_payload, last_error
         ) VALUES($1,$2,$3,$4,$5,'FAILED','{}'::jsonb,$6)
         ON CONFLICT(tenant_id, purchase_id)
         DO UPDATE SET track_id = EXCLUDED.track_id, status = 'FAILED',
                       last_error = EXCLUDED.last_error, updated_at = now()
         RETURNING id, track_id, status, last_error`,
        [req.context.tenantId, purchase.id, account.id, account.provider_code, trackId, error.message],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId, userId: req.context.userId,
        action: 'purchases.electronic_invoice_reception_failed', entityType: 'purchase', entityId: purchase.id,
        after: failed.rows[0], reason: 'Factus rechazó la carga de factura de proveedor',
      });
    });
    throw error;
  }
  const providerBillId = providerResponse?.data?.id || providerResponse?.data?.bill_id || null;
  const saved = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO purchase_electronic_receptions(
         tenant_id, purchase_id, billing_account_id, provider_code, track_id,
         provider_bill_id, status, provider_payload, last_error
       ) VALUES($1,$2,$3,$4,$5,$6,'UPLOADED',$7,NULL)
       ON CONFLICT(tenant_id, purchase_id)
       DO UPDATE SET billing_account_id = EXCLUDED.billing_account_id,
                     provider_code = EXCLUDED.provider_code,
                     track_id = EXCLUDED.track_id,
                     provider_bill_id = EXCLUDED.provider_bill_id,
                     status = 'UPLOADED', provider_payload = EXCLUDED.provider_payload,
                     last_error = NULL, uploaded_at = now(), updated_at = now()
       RETURNING id, track_id, provider_bill_id, provider_code, status, uploaded_at`,
      [req.context.tenantId, purchase.id, account.id, account.provider_code, trackId, providerBillId, JSON.stringify(providerResponse)],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'purchases.electronic_invoice_received', entityType: 'purchase', entityId: purchase.id,
      after: result.rows[0], reason: 'Factura electrónica de proveedor cargada en Factus',
    });
    return result.rows[0];
  });
  res.status(201).json(saved);
}));

router.post('/electronic-receptions/:id/events', asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw new AppError('La recepción electrónica debe tener un UUID válido.', 422, 'INVALID_ELECTRONIC_RECEPTION_ID');
  }
  const eventType = normalizedText(req.body.eventType, 3);
  if (!RADIAN_EVENTS.has(eventType)) {
    throw new AppError('Selecciona un evento RADIAN permitido.', 422, 'INVALID_RADIAN_EVENT');
  }
  if (!req.body.eventPayload || typeof req.body.eventPayload !== 'object' || Array.isArray(req.body.eventPayload)) {
    throw new AppError('Completa la información requerida para el evento RADIAN.', 422, 'RADIAN_EVENT_PAYLOAD_REQUIRED');
  }
  const reception = await query(
    `SELECT er.id, er.purchase_id, er.provider_bill_id, er.billing_account_id,
            account.id account_id, account.provider_code, account.environment,
            account.base_url, account.encrypted_credentials, account.provider_config,
            account.connection_status
     FROM purchase_electronic_receptions er
     JOIN electronic_billing_accounts account ON account.id = er.billing_account_id
     WHERE er.id = $1 AND er.tenant_id = $2`,
    [req.params.id, req.context.tenantId],
  );
  if (!reception.rowCount || !reception.rows[0].provider_bill_id) {
    throw new AppError('La factura aún no tiene el identificador de recepción del proveedor.', 409, 'RADIAN_BILL_NOT_READY');
  }
  const current = reception.rows[0];
  if (current.connection_status !== 'READY') {
    throw new AppError('La conexión Factus de esta empresa no está lista.', 409, 'FACTUS_CONNECTION_REQUIRED');
  }
  let providerResponse;
  try {
    providerResponse = await createBillingAdapter({
      ...current, id: current.account_id, company_id: req.context.tenantId,
    }).emitReceptionEvent(current.provider_bill_id, eventType, req.body.eventPayload);
  } catch (error) {
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO purchase_electronic_reception_events(
           tenant_id, reception_id, event_type, request_payload, provider_response,
           status, error_message, emitted_by
         ) VALUES($1,$2,$3,$4,'{}'::jsonb,'REJECTED',$5,$6)`,
        [req.context.tenantId, current.id, eventType, JSON.stringify(req.body.eventPayload), error.message, req.context.userId],
      );
      await client.query(
        `UPDATE purchase_electronic_receptions
         SET status = 'EVENT_REJECTED', last_error = $3, updated_at = now()
         WHERE id = $1 AND tenant_id = $2`,
        [current.id, req.context.tenantId, error.message],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId, userId: req.context.userId,
        action: 'purchases.radian_event_rejected', entityType: 'purchase_electronic_reception', entityId: current.id,
        after: { eventType, error: error.code || 'FACTUS_ERROR' },
        reason: 'Factus rechazó un evento RADIAN',
      });
    });
    throw error;
  }
  const saved = await withTransaction(async (client) => {
    const event = await client.query(
      `INSERT INTO purchase_electronic_reception_events(
         tenant_id, reception_id, event_type, request_payload, provider_response,
         status, emitted_by
       ) VALUES($1,$2,$3,$4,$5,'SENT',$6) RETURNING *`,
      [req.context.tenantId, current.id, eventType, JSON.stringify(req.body.eventPayload), JSON.stringify(providerResponse), req.context.userId],
    );
    await client.query(
      `UPDATE purchase_electronic_receptions
       SET status = 'EVENT_SENT', last_error = NULL, updated_at = now()
       WHERE id = $1 AND tenant_id = $2`,
      [current.id, req.context.tenantId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'purchases.radian_event_emitted', entityType: 'purchase_electronic_reception', entityId: current.id,
      after: { eventType, providerBillId: current.provider_bill_id },
      reason: 'Evento RADIAN emitido mediante Factus',
    });
    return event.rows[0];
  });
  res.status(201).json(saved);
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    supplierId,
    branchId,
    documentType = 'PURCHASE_ORDER',
    documentNumber = null,
    issueDate,
    expectedDate = null,
    electronicInvoice = false,
    supportDocumentRequired = false,
    notes = null,
  } = req.body;
  if (!isUuid(supplierId) || !isUuid(branchId)) {
    throw new AppError(
      'El proveedor y la sucursal deben tener UUID válidos.',
      422,
      'INVALID_PURCHASE_REFERENCES',
    );
  }
  const normalizedDocumentType =
    typeof documentType === 'string' ? documentType.trim().toUpperCase() : '';
  if (!DOCUMENT_TYPES.has(normalizedDocumentType)) {
    throw new AppError(
      'El tipo de documento de compra no es válido.',
      422,
      'INVALID_PURCHASE_DOCUMENT_TYPE',
    );
  }
  const normalizedItems = normalizeOrderItems(req.body.items);
  const normalizedDocumentNumber = normalizedText(documentNumber, 80);
  const normalizedNotes = normalizedText(notes, 500);
  const normalizedIssueDate = issueDate || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedIssueDate) ||
      (expectedDate && !/^\d{4}-\d{2}-\d{2}$/.test(expectedDate))) {
    throw new AppError(
      'Las fechas de la orden no son válidas.',
      422,
      'INVALID_PURCHASE_DATES',
    );
  }
  if (expectedDate && expectedDate < normalizedIssueDate) {
    throw new AppError(
      'La fecha esperada no puede ser anterior a la emisión.',
      422,
      'INVALID_PURCHASE_DATES',
    );
  }

  const created = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT
         (
           SELECT json_build_object(
             'active', active,
             'obligated_to_invoice', obligated_to_invoice
           )
           FROM suppliers
           WHERE id = $2 AND tenant_id = $1
         ) supplier,
         EXISTS(
           SELECT 1 FROM branches
           WHERE id = $3 AND tenant_id = $1 AND active = TRUE
         ) branch_ok,
         (
           SELECT COUNT(*)::integer
           FROM products
           WHERE tenant_id = $1 AND deleted_at IS NULL
             AND id = ANY($4::uuid[])
         ) product_count`,
      [
        req.context.tenantId,
        supplierId,
        branchId,
        normalizedItems.map((item) => item.productId),
      ],
    );
    const reference = references.rows[0];
    if (!reference.supplier?.active || !reference.branch_ok ||
        reference.product_count !== normalizedItems.length) {
      throw new AppError(
        'Una referencia no pertenece a la empresa activa.',
        404,
        'PURCHASE_REFERENCE_NOT_FOUND',
      );
    }
    const totals = normalizedItems.reduce((result, item) => {
      const subtotal = item.quantity * item.unitCost;
      const tax = subtotal * item.taxRate / 100;
      result.subtotal += subtotal;
      result.tax += tax;
      return result;
    }, { subtotal: 0, tax: 0 });
    const purchase = await client.query(
      `INSERT INTO purchases(
         tenant_id, supplier_id, branch_id, document_type, document_number,
         electronic_invoice, support_document_required, status, notes,
         issue_date, expected_date, subtotal, tax_total, total, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,'ORDERED',$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        req.context.tenantId,
        supplierId,
        branchId,
        normalizedDocumentType,
        normalizedDocumentNumber,
        Boolean(electronicInvoice),
        Boolean(supportDocumentRequired) ||
          normalizedDocumentType === 'SUPPORT_DOCUMENT' ||
          reference.supplier.obligated_to_invoice === false,
        normalizedNotes,
        normalizedIssueDate,
        expectedDate || null,
        totals.subtotal.toFixed(2),
        totals.tax.toFixed(2),
        (totals.subtotal + totals.tax).toFixed(2),
        req.context.userId,
      ],
    );
    for (const item of normalizedItems) {
      const product = await client.query(
        `SELECT name FROM products
         WHERE id = $1 AND tenant_id = $2`,
        [item.productId, req.context.tenantId],
      );
      const subtotal = item.quantity * item.unitCost;
      const taxAmount = subtotal * item.taxRate / 100;
      await client.query(
        `INSERT INTO purchase_items(
           tenant_id, purchase_id, product_id, description,
           ordered_quantity, unit_cost, tax_rate, subtotal, tax_amount, line_total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          req.context.tenantId,
          purchase.rows[0].id,
          item.productId,
          product.rows[0].name,
          item.quantity,
          item.unitCost,
          item.taxRate,
          subtotal.toFixed(2),
          taxAmount.toFixed(2),
          (subtotal + taxAmount).toFixed(2),
        ],
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'purchase.order_created',
      entityType: 'purchase',
      entityId: purchase.rows[0].id,
      after: purchase.rows[0],
      reason: normalizedNotes,
    });
    return purchase.rows[0];
  });
  res.status(201).json(created);
}));

router.post('/:id/receipts', asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id) || !isUuid(req.body.warehouseId)) {
    throw new AppError(
      'La orden y la bodega deben tener UUID válidos.',
      422,
      'INVALID_RECEIPT_REFERENCES',
    );
  }
  if (!Array.isArray(req.body.items) || !req.body.items.length) {
    throw new AppError(
      'La recepción debe incluir al menos un producto.',
      422,
      'RECEIPT_ITEMS_REQUIRED',
    );
  }
  const receiptItems = req.body.items.map((item) => {
    const quantity = Number(item.quantity);
    if (!isUuid(item.purchaseItemId) || !Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError(
        'Cada línea recibida debe tener UUID y cantidad válida.',
        422,
        'INVALID_RECEIPT_ITEM',
      );
    }
    return { purchaseItemId: item.purchaseItemId, quantity };
  });
  const notes = normalizedText(req.body.notes, 500);

  const result = await withTransaction(async (client) => {
    const purchase = await client.query(
      `SELECT id, branch_id, status, order_number
       FROM purchases
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!purchase.rowCount) {
      throw new AppError('No encontramos la orden.', 404, 'PURCHASE_NOT_FOUND');
    }
    if (!['ORDERED', 'PARTIAL'].includes(purchase.rows[0].status)) {
      throw new AppError(
        'La orden ya no admite recepciones.',
        409,
        'PURCHASE_NOT_RECEIVABLE',
      );
    }
    const warehouse = await client.query(
      `SELECT id, name FROM warehouses
       WHERE id = $1 AND tenant_id = $2 AND branch_id = $3 AND active = TRUE
       FOR SHARE`,
      [
        req.body.warehouseId,
        req.context.tenantId,
        purchase.rows[0].branch_id,
      ],
    );
    if (!warehouse.rowCount) {
      throw new AppError(
        'La bodega debe pertenecer a la sucursal de la orden.',
        404,
        'RECEIPT_WAREHOUSE_NOT_FOUND',
      );
    }
    const itemIds = receiptItems.map((item) => item.purchaseItemId);
    const orderItems = await client.query(
      `SELECT pi.*, p.cost current_cost,
              COALESCE((
                SELECT SUM(ib.on_hand)
                FROM inventory_balances ib
                WHERE ib.tenant_id = pi.tenant_id
                  AND ib.product_id = pi.product_id
              ), 0) current_stock
       FROM purchase_items pi
       JOIN products p ON p.id = pi.product_id AND p.tenant_id = pi.tenant_id
       WHERE pi.purchase_id = $1 AND pi.tenant_id = $2
         AND pi.id = ANY($3::uuid[])
       ORDER BY pi.id
       FOR UPDATE OF pi, p`,
      [req.params.id, req.context.tenantId, itemIds],
    );
    if (orderItems.rowCount !== receiptItems.length) {
      throw new AppError(
        'Una línea no pertenece a la orden.',
        404,
        'RECEIPT_ITEM_NOT_FOUND',
      );
    }
    const receipt = await client.query(
      `INSERT INTO purchase_receipts(
         tenant_id, purchase_id, warehouse_id, notes, received_by
       )
       VALUES($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        req.context.tenantId,
        req.params.id,
        req.body.warehouseId,
        notes,
        req.context.userId,
      ],
    );
    for (const requested of receiptItems) {
      const item = orderItems.rows.find((row) => row.id === requested.purchaseItemId);
      const pending =
        Number(item.ordered_quantity) - Number(item.received_quantity);
      if (requested.quantity > pending) {
        throw new AppError(
          `La recepción de ${item.description} supera ${pending} unidades pendientes.`,
          409,
          'PURCHASE_OVER_RECEIPT',
        );
      }
      await client.query(
        `INSERT INTO purchase_receipt_items(
           tenant_id, receipt_id, purchase_item_id, product_id, quantity, unit_cost
         )
         VALUES($1,$2,$3,$4,$5,$6)`,
        [
          req.context.tenantId,
          receipt.rows[0].id,
          item.id,
          item.product_id,
          requested.quantity,
          item.unit_cost,
        ],
      );
      await client.query(
        `UPDATE purchase_items
         SET received_quantity = received_quantity + $3
         WHERE id = $1 AND tenant_id = $2`,
        [item.id, req.context.tenantId, requested.quantity],
      );
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, product_id, warehouse_id, movement_type, quantity,
           unit_cost, reference_type, reference_id, reason, created_by
         )
         VALUES($1,$2,$3,'PURCHASE',$4,$5,'PURCHASE_RECEIPT',$6,$7,$8)`,
        [
          req.context.tenantId,
          item.product_id,
          req.body.warehouseId,
          requested.quantity,
          item.unit_cost,
          receipt.rows[0].id,
          `Recepción ${receipt.rows[0].receipt_number} de ${purchase.rows[0].order_number}`,
          req.context.userId,
        ],
      );
      await client.query(
        `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand)
         VALUES($1,$2,$3,$4)
         ON CONFLICT(tenant_id, product_id, warehouse_id)
         DO UPDATE SET
           on_hand = inventory_balances.on_hand + EXCLUDED.on_hand,
           updated_at = now()`,
        [
          req.context.tenantId,
          item.product_id,
          req.body.warehouseId,
          requested.quantity,
        ],
      );
      const currentStock = Number(item.current_stock);
      const currentCost = Number(item.current_cost);
      const newCost = currentStock + requested.quantity > 0
        ? (
          (currentStock * currentCost) +
          (requested.quantity * Number(item.unit_cost))
        ) / (currentStock + requested.quantity)
        : Number(item.unit_cost);
      await client.query(
        `UPDATE products SET cost = $3, updated_at = now()
         WHERE id = $1 AND tenant_id = $2`,
        [item.product_id, req.context.tenantId, newCost.toFixed(4)],
      );
    }
    const pending = await client.query(
      `SELECT COUNT(*)::integer pending_lines
       FROM purchase_items
       WHERE purchase_id = $1 AND tenant_id = $2
         AND received_quantity < ordered_quantity`,
      [req.params.id, req.context.tenantId],
    );
    const status = pending.rows[0].pending_lines ? 'PARTIAL' : 'RECEIVED';
    await client.query(
      `UPDATE purchases
       SET status = $3,
           received_at = CASE WHEN $3 = 'RECEIVED' THEN now() ELSE received_at END,
           updated_at = now()
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.context.tenantId, status],
    );
    await postPurchaseReceiptAccounting(client, {
      tenantId: req.context.tenantId,
      receiptId: receipt.rows[0].id,
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'purchase.receipt_created',
      entityType: 'purchase_receipt',
      entityId: receipt.rows[0].id,
      after: {
        ...receipt.rows[0],
        purchaseId: req.params.id,
        status,
        items: receiptItems,
      },
      reason: notes,
    });
    return { ...receipt.rows[0], purchaseStatus: status };
  });
  res.status(201).json(result);
}));

export default router;
