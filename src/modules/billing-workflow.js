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

router.use(requireTenant);

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function text(value, max = 1000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
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

router.post('/orders/:orderId/ready-to-invoice', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!isUuid(orderId)) {
    throw new AppError('El pedido no es válido.', 422, 'INVALID_ORDER_ID');
  }
  const result = await withTransaction(async (client) => {
    const order = await client.query(
      `UPDATE commercial_sales_documents
       SET status = 'READY_TO_INVOICE', updated_at = now()
       WHERE id = $1 AND company_id = $2 AND document_type = 'ORDER'
         AND status = 'CONFIRMED'
       RETURNING *`,
      [orderId, req.context.tenantId],
    );
    if (!order.rowCount) {
      throw new AppError(
        'El pedido no existe o no está confirmado.',
        409,
        'ORDER_NOT_READY',
      );
    }
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

router.post('/notes', asyncHandler(async (req, res) => {
  const originalDocumentId = req.body.originalDocumentId;
  const noteType = text(req.body.noteType, 20).toUpperCase();
  const reasonCode = text(req.body.reasonCode, 20);
  const reason = text(req.body.reason, 1000);
  const total = Number(req.body.total);
  if (!isUuid(originalDocumentId) ||
      !['CREDIT_NOTE', 'DEBIT_NOTE'].includes(noteType) ||
      !reasonCode || !reason || !Number.isFinite(total) || total <= 0) {
    throw new AppError(
      'Selecciona factura, tipo, causal, motivo y valor positivo.',
      422,
      'INVALID_ADJUSTMENT_NOTE',
    );
  }
  const result = await withTransaction(async (client) => {
    const original = await client.query(
      `SELECT document.id, document.status, sale.total, sale.tax_total
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
    if (noteType === 'CREDIT_NOTE' &&
        total > Number(original.rows[0].total)) {
      throw new AppError(
        'La nota crédito no puede superar el valor del documento original.',
        422,
        'CREDIT_NOTE_EXCEEDS_DOCUMENT',
      );
    }
    const ratio = total / Number(original.rows[0].total);
    const taxTotal = Math.round(Number(original.rows[0].tax_total) * ratio * 100) / 100;
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
      if (Number(record.total) !== Number(record.original_total)) {
        throw new AppError(
          'Las notas parciales requieren seleccionar productos y cantidades. La nota completa puede transmitirse ahora.',
          409,
          'FACTUS_PARTIAL_NOTE_ITEMS_REQUIRED',
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
      providerPayload = {
        reference_code: `NUBIXOR-NOTE-${noteId}`,
        correction_concept_code: record.reason_code,
        bill_number: record.original_provider_reference,
        ...(record.provider_numbering_range_id
          ? { numbering_range_id: Number(record.provider_numbering_range_id) }
          : {}),
        observation: record.reason.slice(0, 250),
        payment_details: invoicePayload.payment_details,
        customer: invoicePayload.customer,
        items: invoicePayload.items,
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
