import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { requireAnyPermission, requirePermission } from '../authorization.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import { csvCell } from '../shared/csv.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MOVEMENT_MODES = new Set(['ADD', 'REPLACE']);

router.use(requireTenant);

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function text(value, maxLength = 500) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El texto supera ${maxLength} caracteres.`,
      422,
      'LOGISTICS_TEXT_TOO_LONG',
    );
  }
  return normalized;
}

function positiveNumber(value, field, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new AppError(
      `${field} debe ser un número ${allowZero ? 'igual o mayor que cero' : 'mayor que cero'}.`,
      422,
      'INVALID_LOGISTICS_QUANTITY',
    );
  }
  return number;
}

async function getBatch(client, tenantId, batchId, { lock = false } = {}) {
  if (!isUuid(batchId)) {
    throw new AppError('El lote logístico no es válido.', 422, 'INVALID_LOGISTICS_BATCH');
  }
  const result = await client.query(
    `SELECT batch.*
     FROM logistics_intake_batches batch
     WHERE batch.tenant_id=$1 AND batch.id=$2
     ${lock ? 'FOR UPDATE' : ''}`,
    [tenantId, batchId],
  );
  if (!result.rowCount) {
    throw new AppError('El lote logístico no existe.', 404, 'LOGISTICS_BATCH_NOT_FOUND');
  }
  return result.rows[0];
}

async function appendBatchEvent(
  client,
  { tenantId, batchId, userId, eventType, comment },
) {
  await client.query(
    `INSERT INTO logistics_intake_comments(
       tenant_id,batch_id,user_id,event_type,comment
     ) VALUES($1,$2,$3,$4,$5)`,
    [tenantId, batchId, userId, eventType, comment],
  );
}

router.get(
  '/overview',
  requirePermission('logistics.view'),
  asyncHandler(async (req, res) => {
    const [summary, batches, settings] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE status='COUNTING')::integer counting,
           COUNT(*) FILTER (WHERE status='PRICING')::integer pricing,
           COUNT(*) FILTER (WHERE status='APPROVAL')::integer approval,
           COUNT(*) FILTER (
             WHERE status='COMPLETED'
               AND completed_at >= date_trunc('month', now())
           )::integer completed_month,
           COALESCE(SUM(item_totals.units) FILTER (
             WHERE batch.status <> 'REJECTED'
           ),0) units_in_flow,
           COALESCE(SUM(item_totals.value) FILTER (
             WHERE batch.status <> 'REJECTED'
           ),0) value_in_flow,
           COALESCE(SUM(item_totals.labels_pending) FILTER (
             WHERE batch.status='COMPLETED'
           ),0)::integer labels_pending
         FROM logistics_intake_batches batch
         LEFT JOIN LATERAL (
           SELECT
             SUM(item.counted_quantity) units,
             SUM(item.counted_quantity * item.unit_cost) value,
             COUNT(*) FILTER (WHERE item.label_status='PENDING') labels_pending
           FROM logistics_intake_items item
           WHERE item.tenant_id=batch.tenant_id AND item.batch_id=batch.id
         ) item_totals ON TRUE
         WHERE batch.tenant_id=$1`,
        [req.context.tenantId],
      ),
      query(
        `SELECT batch.*,
                branch.name branch_name,
                warehouse.name warehouse_name,
                supplier.name supplier_name,
                COALESCE(totals.item_count,0)::integer item_count,
                COALESCE(totals.units,0) units,
                COALESCE(totals.total_cost,0) total_cost,
                COALESCE(totals.labels_pending,0)::integer labels_pending
         FROM logistics_intake_batches batch
         JOIN branches branch
           ON branch.id=batch.branch_id AND branch.tenant_id=batch.tenant_id
         JOIN warehouses warehouse
           ON warehouse.id=batch.warehouse_id AND warehouse.tenant_id=batch.tenant_id
         LEFT JOIN suppliers supplier
           ON supplier.id=batch.supplier_id AND supplier.tenant_id=batch.tenant_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*) item_count,
                  SUM(item.counted_quantity) units,
                  SUM(item.counted_quantity * item.unit_cost) total_cost,
                  COUNT(*) FILTER (WHERE item.label_status='PENDING') labels_pending
           FROM logistics_intake_items item
           WHERE item.tenant_id=batch.tenant_id AND item.batch_id=batch.id
         ) totals ON TRUE
         WHERE batch.tenant_id=$1
         ORDER BY
           CASE batch.status
             WHEN 'APPROVAL' THEN 1
             WHEN 'PRICING' THEN 2
             WHEN 'COUNTING' THEN 3
             WHEN 'COMPLETED' THEN 4
             ELSE 5
           END,
           batch.updated_at DESC
         LIMIT 100`,
        [req.context.tenantId],
      ),
      query(
        `SELECT COALESCE(settings->'labels','{}'::jsonb) labels
         FROM tenant_modules
         WHERE tenant_id=$1 AND module_code='LOGISTICS'`,
        [req.context.tenantId],
      ),
    ]);
    res.json({
      summary: summary.rows[0],
      batches: batches.rows,
      labelSettings: settings.rows[0]?.labels || {},
    });
  }),
);

router.patch(
  '/labels/settings',
  requirePermission('logistics.labels'),
  asyncHandler(async (req, res) => {
    const defaults = {
      templateId: 'CUSTOM',
      showBarcodeValue: true,
      productFontSizePt: 8,
      priceFontSizePt: 11,
      barcodeHeightMm: 8,
      barcodeWidth: 1.2,
      barcodeMarginMm: 1,
      offsetXmm: 0,
      offsetYmm: 0,
      productLines: 1,
      textAlign: 'center',
    };
    const submitted = { ...defaults, ...req.body };
    const widthMm = Number(req.body.widthMm);
    const heightMm = Number(req.body.heightMm);
    const booleanFields = [
      'showCompany',
      'showProduct',
      'showPrice',
      'showSku',
      'showBarcode',
      'showBarcodeValue',
    ];
    const boundedNumber = (value, min, max) => {
      const number = Number(value);
      return Number.isFinite(number) && number >= min && number <= max;
    };
    const templateId = text(submitted.templateId, 30)?.toUpperCase() || 'CUSTOM';
    const validTemplates = ['PRICE_COMPACT', 'WAREHOUSE', 'LARGE_PRICE', 'CUSTOM'];
    if (!Number.isFinite(widthMm) || widthMm < 25 || widthMm > 120 ||
        !Number.isFinite(heightMm) || heightMm < 15 || heightMm > 100 ||
        booleanFields.some((field) => typeof submitted[field] !== 'boolean') ||
        !validTemplates.includes(templateId) ||
        !boundedNumber(submitted.productFontSizePt, 6, 22) ||
        !boundedNumber(submitted.priceFontSizePt, 7, 26) ||
        !boundedNumber(submitted.barcodeHeightMm, 5, 35) ||
        !boundedNumber(submitted.barcodeWidth, 0.6, 3) ||
        !boundedNumber(submitted.barcodeMarginMm, 0, 5) ||
        !boundedNumber(submitted.offsetXmm, -5, 5) ||
        !boundedNumber(submitted.offsetYmm, -5, 5) ||
        !Number.isInteger(Number(submitted.productLines)) ||
        Number(submitted.productLines) < 1 || Number(submitted.productLines) > 3 ||
        !['left', 'center', 'right'].includes(submitted.textAlign)) {
      throw new AppError(
        'Revisa el tamaño y las opciones de la etiqueta.',
        422,
        'INVALID_LOGISTICS_LABEL_SETTINGS',
      );
    }
    const labels = {
      templateId,
      widthMm,
      heightMm,
      showCompany: req.body.showCompany,
      showProduct: req.body.showProduct,
      showPrice: req.body.showPrice,
      showSku: req.body.showSku,
      showBarcode: req.body.showBarcode,
      showBarcodeValue: submitted.showBarcodeValue,
      productFontSizePt: Number(submitted.productFontSizePt),
      priceFontSizePt: Number(submitted.priceFontSizePt),
      barcodeHeightMm: Number(submitted.barcodeHeightMm),
      barcodeWidth: Number(submitted.barcodeWidth),
      barcodeMarginMm: Number(submitted.barcodeMarginMm),
      offsetXmm: Number(submitted.offsetXmm),
      offsetYmm: Number(submitted.offsetYmm),
      productLines: Number(submitted.productLines),
      textAlign: submitted.textAlign,
      footerText: text(req.body.footerText, 80) || '',
    };
    const saved = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE tenant_modules
         SET settings=jsonb_set(settings,'{labels}',$3::jsonb,TRUE),
             updated_by=$4,updated_at=now()
         WHERE tenant_id=$1 AND module_code=$2
         RETURNING settings->'labels' labels`,
        [
          req.context.tenantId,
          'LOGISTICS',
          JSON.stringify(labels),
          req.context.userId,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'logistics.labels.settings.updated',
        entityType: 'tenant_module',
        entityId: 'LOGISTICS',
        after: labels,
        reason: 'Configuración de impresión de etiquetas',
      });
      return result.rows[0]?.labels || labels;
    });
    res.json(saved);
  }),
);

router.get(
  '/batches/:batchId',
  requirePermission('logistics.view'),
  asyncHandler(async (req, res) => {
    const result = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
      );
      const [items, comments] = await Promise.all([
        client.query(
          `SELECT item.*, product.active product_active,
                  product.tax_review_status, product.barcode
           FROM logistics_intake_items item
           LEFT JOIN products product
             ON product.id=item.product_id AND product.tenant_id=item.tenant_id
           WHERE item.tenant_id=$1 AND item.batch_id=$2
           ORDER BY item.created_at,item.id`,
          [req.context.tenantId, batch.id],
        ),
        client.query(
          `SELECT comment.*, users.full_name user_name
           FROM logistics_intake_comments comment
           LEFT JOIN users ON users.id=comment.user_id
           WHERE comment.tenant_id=$1 AND comment.batch_id=$2
           ORDER BY comment.created_at DESC
           LIMIT 100`,
          [req.context.tenantId, batch.id],
        ),
      ]);
      return { batch, items: items.rows, comments: comments.rows };
    });
    res.json(result);
  }),
);

router.post(
  '/batches',
  requirePermission('logistics.count'),
  asyncHandler(async (req, res) => {
    const {
      branchId,
      warehouseId,
      supplierId = null,
      purchaseId = null,
      supplierInvoiceNumber = null,
      receivedOn = null,
    } = req.body;
    const title = text(req.body.title, 180);
    const notes = text(req.body.notes, 2000);
    if (!title || !isUuid(branchId) || !isUuid(warehouseId) ||
        (supplierId && !isUuid(supplierId)) ||
        (purchaseId && !isUuid(purchaseId))) {
      throw new AppError(
        'Indica nombre, sucursal, bodega y referencias válidas.',
        422,
        'INVALID_LOGISTICS_BATCH',
      );
    }
    const created = await withTransaction(async (client) => {
      const references = await client.query(
        `SELECT
           EXISTS(
             SELECT 1 FROM warehouses
             WHERE tenant_id=$1 AND id=$2 AND branch_id=$3 AND active=TRUE
           ) warehouse_ok,
           ($4::uuid IS NULL OR EXISTS(
             SELECT 1 FROM suppliers
             WHERE tenant_id=$1 AND id=$4 AND active=TRUE
           )) supplier_ok,
           ($5::uuid IS NULL OR EXISTS(
             SELECT 1 FROM purchases
             WHERE tenant_id=$1 AND id=$5
           )) purchase_ok`,
        [
          req.context.tenantId,
          warehouseId,
          branchId,
          supplierId,
          purchaseId,
        ],
      );
      if (!references.rows[0].warehouse_ok ||
          !references.rows[0].supplier_ok ||
          !references.rows[0].purchase_ok) {
        throw new AppError(
          'La sucursal, bodega, proveedor u orden no pertenece a la empresa activa.',
          409,
          'LOGISTICS_SCOPE_MISMATCH',
        );
      }
      const result = await client.query(
        `INSERT INTO logistics_intake_batches(
           tenant_id,batch_number,branch_id,warehouse_id,supplier_id,purchase_id,
           supplier_invoice_number,title,notes,received_on,created_by,counted_by
         ) VALUES(
           $1,
           'LR-' || to_char(CURRENT_DATE,'YYYY') || '-' ||
             lpad(nextval('logistics_intake_number_seq')::text,6,'0'),
           $2,$3,$4,$5,$6,$7,$8,COALESCE($9::date,CURRENT_DATE),$10,$10
         )
         RETURNING *`,
        [
          req.context.tenantId,
          branchId,
          warehouseId,
          supplierId,
          purchaseId,
          text(supplierInvoiceNumber, 100),
          title,
          notes,
          receivedOn,
          req.context.userId,
        ],
      );
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: result.rows[0].id,
        userId: req.context.userId,
        eventType: 'CREATED',
        comment: 'Lote de recepción creado y habilitado para conteo.',
      });
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'logistics.batch.created',
        entityType: 'logistics_intake_batch',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: 'Inicio de recepción logística',
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  }),
);

router.post(
  '/batches/:batchId/scan',
  requirePermission('logistics.count'),
  asyncHandler(async (req, res) => {
    const sku = text(req.body.sku, 120);
    const quantity = positiveNumber(req.body.quantity ?? 1, 'La cantidad');
    const expectedQuantity = req.body.expectedQuantity == null
      ? 0
      : positiveNumber(req.body.expectedQuantity, 'La cantidad esperada', {
        allowZero: true,
      });
    const productName = text(req.body.productName, 220);
    const createIfMissing = req.body.createIfMissing === true;
    if (!sku) {
      throw new AppError('Escanea o escribe un SKU.', 422, 'LOGISTICS_SKU_REQUIRED');
    }
    const item = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
        { lock: true },
      );
      if (batch.status !== 'COUNTING' || batch.locked_at) {
        throw new AppError(
          'El conteo de este lote ya está cerrado.',
          409,
          'LOGISTICS_COUNT_LOCKED',
        );
      }
      let product = await client.query(
        `SELECT id,name,sku
         FROM products
         WHERE tenant_id=$1 AND upper(sku)=upper($2) AND deleted_at IS NULL
         LIMIT 1`,
        [req.context.tenantId, sku],
      );
      if (!product.rowCount && !createIfMissing) {
        throw new AppError(
          'El producto no existe. Regístralo como producto nuevo para continuar.',
          404,
          'LOGISTICS_PRODUCT_NOT_FOUND',
        );
      }
      if (!product.rowCount) {
        if (!productName) {
          throw new AppError(
            'Escribe el nombre del producto nuevo.',
            422,
            'LOGISTICS_PRODUCT_NAME_REQUIRED',
          );
        }
        product = await client.query(
          `INSERT INTO products(
             tenant_id,sku,name,cost,sale_price,tax_review_status,active,metadata
           ) VALUES(
             $1,$2,$3,0,0,'PENDING',FALSE,
             jsonb_build_object(
               'provisional',TRUE,
               'source','LOGISTICS_INTAKE',
               'batchId',$4::text
             )
           )
           RETURNING id,name,sku`,
          [req.context.tenantId, sku, productName, batch.id],
        );
      }
      const result = await client.query(
        `INSERT INTO logistics_intake_items(
           tenant_id,batch_id,product_id,sku,product_name,
           expected_quantity,counted_quantity,created_by
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT(batch_id,sku) DO UPDATE
         SET counted_quantity =
               logistics_intake_items.counted_quantity + EXCLUDED.counted_quantity,
             expected_quantity = GREATEST(
               logistics_intake_items.expected_quantity,
               EXCLUDED.expected_quantity
             ),
             product_id=EXCLUDED.product_id,
             product_name=EXCLUDED.product_name,
             updated_at=now()
         RETURNING *`,
        [
          req.context.tenantId,
          batch.id,
          product.rows[0].id,
          product.rows[0].sku,
          product.rows[0].name,
          expectedQuantity,
          quantity,
          req.context.userId,
        ],
      );
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: batch.id,
        userId: req.context.userId,
        eventType: 'SCAN',
        comment: `${product.rows[0].sku}: +${quantity} unidad(es) contadas.`,
      });
      return result.rows[0];
    });
    res.status(201).json(item);
  }),
);

router.post(
  '/batches/:batchId/finish-count',
  requirePermission('logistics.count'),
  asyncHandler(async (req, res) => {
    const saved = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
        { lock: true },
      );
      if (batch.status !== 'COUNTING') {
        throw new AppError(
          'Solo un lote en conteo puede pasar a valoración.',
          409,
          'INVALID_LOGISTICS_TRANSITION',
        );
      }
      const items = await client.query(
        `SELECT COUNT(*)::integer count
         FROM logistics_intake_items
         WHERE tenant_id=$1 AND batch_id=$2 AND counted_quantity > 0`,
        [req.context.tenantId, batch.id],
      );
      if (!items.rows[0].count) {
        throw new AppError(
          'Escanea al menos un producto antes de finalizar.',
          409,
          'EMPTY_LOGISTICS_BATCH',
        );
      }
      const result = await client.query(
        `UPDATE logistics_intake_batches
         SET status='PRICING',count_completed_at=now(),counted_by=$3,updated_at=now()
         WHERE tenant_id=$1 AND id=$2
         RETURNING *`,
        [req.context.tenantId, batch.id, req.context.userId],
      );
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: batch.id,
        userId: req.context.userId,
        eventType: 'COUNT_COMPLETED',
        comment: 'Conteo físico cerrado. El lote pasa a costos y precios.',
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);

router.patch(
  '/batches/:batchId/items/:itemId/pricing',
  requirePermission('logistics.price'),
  asyncHandler(async (req, res) => {
    if (!isUuid(req.params.itemId)) {
      throw new AppError('El producto del lote no es válido.', 422, 'INVALID_LOGISTICS_ITEM');
    }
    const unitCost = positiveNumber(req.body.unitCost, 'El costo unitario', {
      allowZero: true,
    });
    const proposedPrice = positiveNumber(
      req.body.proposedPrice,
      'El precio propuesto',
      { allowZero: true },
    );
    const movementMode = String(req.body.movementMode || '').toUpperCase();
    if (!MOVEMENT_MODES.has(movementMode)) {
      throw new AppError(
        'El movimiento debe sumar o reemplazar existencias.',
        422,
        'INVALID_LOGISTICS_MOVEMENT_MODE',
      );
    }
    const saved = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
        { lock: true },
      );
      if (batch.status !== 'PRICING') {
        throw new AppError(
          'Los precios solo pueden editarse durante la valoración.',
          409,
          'LOGISTICS_PRICING_LOCKED',
        );
      }
      const result = await client.query(
        `UPDATE logistics_intake_items
         SET unit_cost=$4,proposed_price=$5,movement_mode=$6,updated_at=now()
         WHERE tenant_id=$1 AND batch_id=$2 AND id=$3
         RETURNING *`,
        [
          req.context.tenantId,
          batch.id,
          req.params.itemId,
          unitCost,
          proposedPrice,
          movementMode,
        ],
      );
      if (!result.rowCount) {
        throw new AppError(
          'El producto no pertenece al lote.',
          404,
          'LOGISTICS_ITEM_NOT_FOUND',
        );
      }
      return result.rows[0];
    });
    res.json(saved);
  }),
);

router.post(
  '/batches/:batchId/submit-approval',
  requirePermission('logistics.price'),
  asyncHandler(async (req, res) => {
    const saved = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
        { lock: true },
      );
      if (batch.status !== 'PRICING') {
        throw new AppError(
          'Solo un lote valorado puede enviarse a aprobación.',
          409,
          'INVALID_LOGISTICS_TRANSITION',
        );
      }
      const invalid = await client.query(
        `SELECT COUNT(*)::integer count
         FROM logistics_intake_items
         WHERE tenant_id=$1 AND batch_id=$2
           AND (
             product_id IS NULL OR counted_quantity <= 0 OR
             unit_cost <= 0 OR proposed_price <= 0
           )`,
        [req.context.tenantId, batch.id],
      );
      if (invalid.rows[0].count) {
        throw new AppError(
          'Todos los productos requieren cantidad, costo y precio antes de aprobar.',
          409,
          'LOGISTICS_PRICING_INCOMPLETE',
        );
      }
      const result = await client.query(
        `UPDATE logistics_intake_batches
         SET status='APPROVAL',pricing_completed_at=now(),priced_by=$3,updated_at=now()
         WHERE tenant_id=$1 AND id=$2
         RETURNING *`,
        [req.context.tenantId, batch.id, req.context.userId],
      );
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: batch.id,
        userId: req.context.userId,
        eventType: 'PRICING_COMPLETED',
        comment: 'Costos y precios completos. Lote enviado a jefatura.',
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);

router.post(
  '/batches/:batchId/reject',
  requirePermission('logistics.approve'),
  asyncHandler(async (req, res) => {
    const reason = text(req.body.reason, 1000);
    if (!reason) {
      throw new AppError(
        'Explica por qué devuelves el lote.',
        422,
        'LOGISTICS_REJECTION_REASON_REQUIRED',
      );
    }
    const saved = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
        { lock: true },
      );
      if (batch.status !== 'APPROVAL') {
        throw new AppError(
          'Solo un lote pendiente de aprobación puede devolverse.',
          409,
          'INVALID_LOGISTICS_TRANSITION',
        );
      }
      if ([batch.created_by, batch.counted_by, batch.priced_by].includes(req.context.userId)) {
        throw new AppError(
          'Quien creó, contó o valoró el lote no puede devolverlo desde aprobación.',
          403,
          'LOGISTICS_SELF_APPROVAL_FORBIDDEN',
        );
      }
      const result = await client.query(
        `UPDATE logistics_intake_batches
         SET status='PRICING',updated_at=now()
         WHERE tenant_id=$1 AND id=$2
         RETURNING *`,
        [req.context.tenantId, batch.id],
      );
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: batch.id,
        userId: req.context.userId,
        eventType: 'REJECTED',
        comment: reason,
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);

router.post(
  '/batches/:batchId/approve',
  requirePermission('logistics.approve'),
  asyncHandler(async (req, res) => {
    const approved = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
        { lock: true },
      );
      if (batch.status !== 'APPROVAL' || batch.locked_at) {
        throw new AppError(
          'El lote no está disponible para aprobación.',
          409,
          'LOGISTICS_APPROVAL_LOCKED',
        );
      }
      if ([batch.created_by, batch.counted_by, batch.priced_by].includes(req.context.userId)) {
        throw new AppError(
          'Quien creó, contó o valoró el lote no puede aprobarlo.',
          403,
          'LOGISTICS_SELF_APPROVAL_FORBIDDEN',
        );
      }
      const items = await client.query(
        `SELECT item.*, balance.on_hand current_on_hand,
                balance.reserved current_reserved
         FROM logistics_intake_items item
         LEFT JOIN inventory_balances balance
           ON balance.tenant_id=item.tenant_id
          AND balance.product_id=item.product_id
          AND balance.warehouse_id=$3
         WHERE item.tenant_id=$1 AND item.batch_id=$2
         ORDER BY item.id
         FOR UPDATE OF item`,
        [req.context.tenantId, batch.id, batch.warehouse_id],
      );
      if (!items.rowCount) {
        throw new AppError(
          'El lote no contiene productos.',
          409,
          'EMPTY_LOGISTICS_BATCH',
        );
      }
      for (const item of items.rows) {
        if (!item.product_id || Number(item.unit_cost) <= 0 ||
            Number(item.proposed_price) <= 0 ||
            Number(item.counted_quantity) <= 0) {
          throw new AppError(
            `El producto ${item.sku} no está listo para cargar.`,
            409,
            'LOGISTICS_ITEM_INCOMPLETE',
          );
        }
        const current = Number(item.current_on_hand || 0);
        const reserved = Number(item.current_reserved || 0);
        const counted = Number(item.counted_quantity);
        const resulting = item.movement_mode === 'REPLACE'
          ? counted
          : current + counted;
        if (resulting < reserved) {
          throw new AppError(
            `El producto ${item.sku} quedaría por debajo de sus reservas.`,
            409,
            'LOGISTICS_RESERVED_STOCK_CONFLICT',
          );
        }
        await client.query(
          `INSERT INTO inventory_balances(
             tenant_id,product_id,warehouse_id,on_hand
           ) VALUES($1,$2,$3,$4)
           ON CONFLICT(tenant_id,product_id,warehouse_id) DO UPDATE
           SET on_hand=$4,updated_at=now()`,
          [
            req.context.tenantId,
            item.product_id,
            batch.warehouse_id,
            resulting,
          ],
        );
        const delta = resulting - current;
        if (delta !== 0) {
          await client.query(
            `INSERT INTO inventory_movements(
               tenant_id,product_id,warehouse_id,movement_type,quantity,
               unit_cost,reference_type,reference_id,reason,created_by
             ) VALUES($1,$2,$3,'LOGISTICS_INTAKE',$4,$5,
                      'LOGISTICS_BATCH',$6,$7,$8)`,
            [
              req.context.tenantId,
              item.product_id,
              batch.warehouse_id,
              delta,
              item.unit_cost,
              batch.id,
              `Carga aprobada del lote ${batch.batch_number}`,
              req.context.userId,
            ],
          );
        }
        await client.query(
          `UPDATE products
           SET cost=$3,sale_price=$4,updated_at=now()
           WHERE tenant_id=$1 AND id=$2`,
          [
            req.context.tenantId,
            item.product_id,
            item.unit_cost,
            item.proposed_price,
          ],
        );
        await client.query(
          `UPDATE logistics_intake_items
           SET approved_price=proposed_price,updated_at=now()
           WHERE tenant_id=$1 AND id=$2`,
          [req.context.tenantId, item.id],
        );
      }
      const result = await client.query(
        `UPDATE logistics_intake_batches
         SET status='COMPLETED',approved_by=$3,approved_at=now(),
             completed_at=now(),locked_at=now(),updated_at=now()
         WHERE tenant_id=$1 AND id=$2
         RETURNING *`,
        [req.context.tenantId, batch.id, req.context.userId],
      );
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: batch.id,
        userId: req.context.userId,
        eventType: 'APPROVED',
        comment: 'Jefatura aprobó el lote. Inventario, costos y precios fueron cargados.',
      });
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'logistics.batch.approved',
        entityType: 'logistics_intake_batch',
        entityId: batch.id,
        before: batch,
        after: result.rows[0],
        reason: text(req.body.reason, 1000) || 'Aprobación final de jefatura',
        metadata: { itemCount: items.rowCount },
      });
      return result.rows[0];
    });
    res.json(approved);
  }),
);

router.post(
  '/batches/:batchId/items/:itemId/label-printed',
  requirePermission('logistics.labels'),
  asyncHandler(async (req, res) => {
    if (!isUuid(req.params.itemId)) {
      throw new AppError('La etiqueta no es válida.', 422, 'INVALID_LOGISTICS_ITEM');
    }
    const quantity = Math.trunc(Number(req.body.quantity ?? 1));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      throw new AppError(
        'La cantidad de etiquetas debe estar entre 1 y 10.000.',
        422,
        'INVALID_LOGISTICS_LABEL_QUANTITY',
      );
    }
    const saved = await withTransaction(async (client) => {
      const batch = await getBatch(
        client,
        req.context.tenantId,
        req.params.batchId,
      );
      if (batch.status !== 'COMPLETED') {
        throw new AppError(
          'Las etiquetas se liberan después de aprobar el lote.',
          409,
          'LOGISTICS_LABELS_LOCKED',
        );
      }
      const result = await client.query(
        `UPDATE logistics_intake_items
         SET label_status='PRINTED',print_count=print_count+1,
             label_quantity_printed=label_quantity_printed+$4,
             last_printed_at=now(),updated_at=now()
         WHERE tenant_id=$1 AND batch_id=$2 AND id=$3
         RETURNING *`,
        [req.context.tenantId, batch.id, req.params.itemId, quantity],
      );
      if (!result.rowCount) {
        throw new AppError('El producto no pertenece al lote.', 404, 'LOGISTICS_ITEM_NOT_FOUND');
      }
      await appendBatchEvent(client, {
        tenantId: req.context.tenantId,
        batchId: batch.id,
        userId: req.context.userId,
        eventType: 'LABEL_PRINTED',
        comment: `${quantity} etiqueta(s) de ${result.rows[0].sku} enviadas a impresión.`,
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);

router.get(
  '/batches/:batchId/export.csv',
  requireAnyPermission(['logistics.price', 'logistics.approve', 'logistics.view']),
  asyncHandler(async (req, res) => {
    const result = await withTransaction(async (client) => {
      const batch = await getBatch(client, req.context.tenantId, req.params.batchId);
      const items = await client.query(
        `SELECT sku,product_name,expected_quantity,counted_quantity,
                movement_mode,unit_cost,proposed_price,approved_price,
                label_status,print_count,created_at
         FROM logistics_intake_items
         WHERE tenant_id=$1 AND batch_id=$2
         ORDER BY created_at,id`,
        [req.context.tenantId, batch.id],
      );
      return { batch, items: items.rows };
    });
    const headers = [
      'Lote', 'SKU', 'Producto', 'Esperado', 'Contado', 'Movimiento',
      'Costo', 'Precio propuesto', 'Precio aprobado', 'Etiqueta',
      'Impresiones', 'Fecha',
    ];
    const rows = result.items.map((item) => [
      result.batch.batch_number,
      item.sku,
      item.product_name,
      item.expected_quantity,
      item.counted_quantity,
      item.movement_mode,
      item.unit_cost,
      item.proposed_price,
      item.approved_price,
      item.label_status,
      item.print_count,
      item.created_at,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.batch.batch_number}.csv"`,
    );
    res.send(`\uFEFF${csv}`);
  }),
);

export default router;
