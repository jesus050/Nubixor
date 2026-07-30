import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import { postPurchaseReceiptAccounting } from '../accounting.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DOCUMENT_TYPES = new Set(['PURCHASE_ORDER', 'INVOICE', 'SUPPORT_DOCUMENT']);

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

router.get('/:id', asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw new AppError('La orden debe tener un UUID válido.', 422, 'INVALID_PURCHASE_ID');
  }
  const [purchase, items, receipts] = await Promise.all([
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
  });
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
         EXISTS(
           SELECT 1 FROM suppliers
           WHERE id = $2 AND tenant_id = $1 AND active = TRUE
         ) supplier_ok,
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
    if (!reference.supplier_ok || !reference.branch_ok ||
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
          normalizedDocumentType === 'SUPPORT_DOCUMENT',
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
