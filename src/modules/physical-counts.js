import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.use(requireTenant);

function normalizedText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(`El campo supera ${maxLength} caracteres.`, 422, 'FIELD_TOO_LONG');
  }
  return normalized;
}

const itemClassificationSql = `
  CASE
    WHEN ci.counted_quantity IS NULL THEN 'PENDING'
    WHEN ci.expected_quantity = 0 AND ci.counted_quantity > 0 THEN 'UNEXPECTED'
    WHEN ci.expected_quantity > 0 AND ci.counted_quantity = 0 THEN 'MISSING'
    WHEN ci.counted_quantity < ci.expected_quantity THEN 'SHORTAGE'
    WHEN ci.counted_quantity > ci.expected_quantity THEN 'EXCESS'
    ELSE 'OK'
  END`;

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COUNT(DISTINCT c.id) FILTER (
         WHERE c.status IN ('DRAFT','IN_PROGRESS','REVIEW')
       )::int active_counts,
       COUNT(i.id) FILTER (
         WHERE c.status IN ('DRAFT','IN_PROGRESS','REVIEW')
           AND i.counted_quantity IS NULL
       )::int pending_items,
       COUNT(i.id) FILTER (
         WHERE c.status IN ('DRAFT','IN_PROGRESS','REVIEW')
           AND i.counted_quantity IS NOT NULL
           AND i.counted_quantity <> i.expected_quantity
       )::int discrepancies,
       COUNT(DISTINCT c.id) FILTER (
         WHERE c.status = 'COMPLETED'
           AND c.completed_at >= date_trunc('month', CURRENT_DATE)
       )::int completed_month
     FROM inventory_counts c
     LEFT JOIN inventory_count_items i
       ON i.count_id = c.id AND i.tenant_id = c.tenant_id
     WHERE c.tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT c.id, c.count_number, c.name, c.status, c.notes,
            c.created_at, c.started_at, c.completed_at,
            w.id warehouse_id, w.name warehouse_name, w.code warehouse_code,
            b.name branch_name,
            COUNT(i.id)::int item_count,
            COUNT(i.id) FILTER (WHERE i.counted_quantity IS NOT NULL)::int counted_count,
            COUNT(i.id) FILTER (
              WHERE i.counted_quantity IS NOT NULL
                AND i.counted_quantity <> i.expected_quantity
            )::int discrepancy_count
     FROM inventory_counts c
     JOIN warehouses w ON w.id = c.warehouse_id
     JOIN branches b ON b.id = w.branch_id
     LEFT JOIN inventory_count_items i
       ON i.count_id = c.id AND i.tenant_id = c.tenant_id
     WHERE c.tenant_id = $1
     GROUP BY c.id, w.id, b.name
     ORDER BY
       CASE c.status
         WHEN 'IN_PROGRESS' THEN 0 WHEN 'REVIEW' THEN 1 WHEN 'DRAFT' THEN 2
         ELSE 3
       END,
       c.created_at DESC`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const warehouseId = req.body.warehouseId;
  const name = normalizedText(req.body.name, 160);
  const notes = normalizedText(req.body.notes, 500);
  if (!UUID_PATTERN.test(warehouseId || '')) {
    return res.status(422).json({ error: 'La bodega debe tener un UUID válido.' });
  }
  if (!name) {
    return res.status(422).json({ error: 'El nombre del conteo es obligatorio.' });
  }

  try {
    const count = await withTransaction(async (client) => {
      const warehouse = await client.query(
        `SELECT id, name
         FROM warehouses
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE
         FOR SHARE`,
        [warehouseId, req.context.tenantId],
      );
      if (!warehouse.rowCount) {
        throw new AppError(
          'La bodega no pertenece a la empresa activa.',
          404,
          'COUNT_WAREHOUSE_NOT_FOUND',
        );
      }
      const result = await client.query(
        `INSERT INTO inventory_counts(
           tenant_id, warehouse_id, name, notes, created_by
         )
         VALUES($1,$2,$3,$4,$5)
         RETURNING id, count_number, warehouse_id, name, status, notes, created_at`,
        [req.context.tenantId, warehouseId, name, notes, req.context.userId],
      );
      await client.query(
        `INSERT INTO inventory_count_items(
           tenant_id, count_id, product_id, sku_snapshot, name_snapshot,
           expected_quantity
         )
         SELECT p.tenant_id, $1, p.id, p.sku, p.name, COALESCE(ib.on_hand, 0)
         FROM products p
         LEFT JOIN inventory_balances ib
           ON ib.tenant_id = p.tenant_id
          AND ib.product_id = p.id
          AND ib.warehouse_id = $2
         WHERE p.tenant_id = $3 AND p.deleted_at IS NULL
         ORDER BY p.name`,
        [result.rows[0].id, warehouseId, req.context.tenantId],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'inventory_count.created',
        entityType: 'inventory_count',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: 'Conteo físico creado con fotografía del saldo esperado',
      });
      return result.rows[0];
    });
    res.status(201).json(count);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Esta bodega ya tiene un conteo activo.',
        409,
        'ACTIVE_COUNT_EXISTS',
      );
    }
    throw error;
  }
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El conteo debe tener un UUID válido.' });
  }
  const [countResult, itemsResult] = await Promise.all([
    query(
      `SELECT c.*, w.name warehouse_name, w.code warehouse_code,
              b.name branch_name
       FROM inventory_counts c
       JOIN warehouses w ON w.id = c.warehouse_id
       JOIN branches b ON b.id = w.branch_id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT ci.id, ci.product_id, ci.sku_snapshot, ci.name_snapshot,
              ci.expected_quantity, ci.counted_quantity,
              CASE WHEN ci.counted_quantity IS NULL THEN NULL
                ELSE ci.counted_quantity - ci.expected_quantity END difference,
              ${itemClassificationSql} classification,
              CASE
                WHEN ci.counted_quantity IS NULL OR ci.counted_quantity = ci.expected_quantity
                  THEN 'NONE'
                WHEN ci.expected_quantity = 0
                  OR ABS(ci.counted_quantity - ci.expected_quantity)
                    / NULLIF(ci.expected_quantity, 0) >= 0.2
                  THEN 'HIGH'
                ELSE 'MEDIUM'
              END severity,
              ci.notes, ci.counted_at,
              pi.public_url image_url, pi.alt_text image_alt
       FROM inventory_count_items ci
       LEFT JOIN LATERAL (
         SELECT public_url, alt_text
         FROM product_images
         WHERE tenant_id = ci.tenant_id AND product_id = ci.product_id
         ORDER BY is_primary DESC, created_at
         LIMIT 1
       ) pi ON TRUE
       WHERE ci.count_id = $1 AND ci.tenant_id = $2
       ORDER BY
         CASE WHEN ci.counted_quantity IS NULL THEN 0
              WHEN ci.counted_quantity <> ci.expected_quantity THEN 1
              ELSE 2 END,
         ci.name_snapshot`,
      [req.params.id, req.context.tenantId],
    ),
  ]);
  if (!countResult.rowCount) {
    throw new AppError('No encontramos el conteo.', 404, 'INVENTORY_COUNT_NOT_FOUND');
  }
  const items = itemsResult.rows;
  res.json({
    ...countResult.rows[0],
    itemCount: items.length,
    countedCount: items.filter((item) => item.counted_quantity !== null).length,
    discrepancyCount: items.filter((item) =>
      item.counted_quantity !== null && Number(item.difference) !== 0).length,
    items,
  });
}));

router.post('/:id/start', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El conteo debe tener un UUID válido.' });
  }
  const result = await query(
    `UPDATE inventory_counts
     SET status = 'IN_PROGRESS', started_by = $1, started_at = now(), updated_at = now()
     WHERE id = $2 AND tenant_id = $3 AND status = 'DRAFT'
     RETURNING id, count_number, status, started_at`,
    [req.context.userId, req.params.id, req.context.tenantId],
  );
  if (!result.rowCount) {
    throw new AppError(
      'El conteo no está disponible para iniciar.',
      409,
      'INVENTORY_COUNT_NOT_STARTABLE',
    );
  }
  res.json(result.rows[0]);
}));

router.put('/:id/items/:productId', asyncHandler(async (req, res) => {
  if (![req.params.id, req.params.productId].every((id) => UUID_PATTERN.test(id))) {
    return res.status(422).json({ error: 'El conteo y el producto deben tener UUID válidos.' });
  }
  const countedQuantity = Number(req.body.countedQuantity);
  const notes = normalizedText(req.body.notes, 500);
  if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
    return res.status(422).json({ error: 'La cantidad contada debe ser cero o mayor.' });
  }
  const result = await query(
    `UPDATE inventory_count_items ci
     SET counted_quantity = $1, notes = $2, counted_by = $3,
         counted_at = now(), updated_at = now()
     FROM inventory_counts c
     WHERE ci.count_id = c.id
       AND ci.count_id = $4
       AND ci.product_id = $5
       AND ci.tenant_id = $6
       AND c.tenant_id = $6
       AND c.status = 'IN_PROGRESS'
     RETURNING ci.id, ci.product_id, ci.expected_quantity, ci.counted_quantity,
               ci.counted_quantity - ci.expected_quantity difference,
               ci.notes, ci.counted_at`,
    [
      countedQuantity,
      notes,
      req.context.userId,
      req.params.id,
      req.params.productId,
      req.context.tenantId,
    ],
  );
  if (!result.rowCount) {
    throw new AppError(
      'El producto no pertenece a un conteo en curso.',
      409,
      'COUNT_ITEM_NOT_EDITABLE',
    );
  }
  res.json(result.rows[0]);
}));

router.post('/:id/submit', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El conteo debe tener un UUID válido.' });
  }
  const count = await withTransaction(async (client) => {
    const pending = await client.query(
      `SELECT COUNT(*)::int pending
       FROM inventory_count_items i
       JOIN inventory_counts c ON c.id = i.count_id
       WHERE i.count_id = $1 AND i.tenant_id = $2
         AND c.tenant_id = $2 AND c.status = 'IN_PROGRESS'
         AND i.counted_quantity IS NULL`,
      [req.params.id, req.context.tenantId],
    );
    if (!pending.rowCount || Number(pending.rows[0].pending) > 0) {
      throw new AppError(
        `Faltan ${pending.rows[0]?.pending || 0} productos por contar.`,
        409,
        'COUNT_HAS_PENDING_ITEMS',
      );
    }
    const result = await client.query(
      `UPDATE inventory_counts
       SET status = 'REVIEW', updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND status = 'IN_PROGRESS'
       RETURNING id, count_number, status`,
      [req.params.id, req.context.tenantId],
    );
    if (!result.rowCount) {
      throw new AppError(
        'El conteo no está disponible para revisión.',
        409,
        'INVENTORY_COUNT_NOT_SUBMITTABLE',
      );
    }
    return result.rows[0];
  });
  res.json(count);
}));

router.post('/:id/complete', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El conteo debe tener un UUID válido.' });
  }
  const reason = normalizedText(req.body.reason, 500);
  if (!reason) {
    return res.status(422).json({ error: 'El motivo de cierre es obligatorio.' });
  }

  const completed = await withTransaction(async (client) => {
    const countResult = await client.query(
      `SELECT id, count_number, warehouse_id, status
       FROM inventory_counts
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!countResult.rowCount || countResult.rows[0].status !== 'REVIEW') {
      throw new AppError(
        'El conteo debe estar en revisión antes de cerrarlo.',
        409,
        'INVENTORY_COUNT_NOT_COMPLETABLE',
      );
    }
    const count = countResult.rows[0];
    const items = await client.query(
      `SELECT product_id, name_snapshot, expected_quantity, counted_quantity,
              counted_quantity - expected_quantity difference
       FROM inventory_count_items
       WHERE count_id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [count.id, req.context.tenantId],
    );

    let adjustments = 0;
    for (const item of items.rows) {
      const balanceResult = await client.query(
        `SELECT on_hand
         FROM inventory_balances
         WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
         FOR UPDATE`,
        [req.context.tenantId, item.product_id, count.warehouse_id],
      );
      const current = balanceResult.rowCount ? Number(balanceResult.rows[0].on_hand) : 0;
      if (current !== Number(item.expected_quantity)) {
        throw new AppError(
          `El saldo de ${item.name_snapshot} cambió después de iniciar el conteo. Actualiza el proceso antes de cerrar.`,
          409,
          'INVENTORY_CHANGED_SINCE_COUNT',
        );
      }
      const difference = Number(item.difference);
      if (difference === 0) continue;
      await client.query(
        `INSERT INTO inventory_balances(
           tenant_id, product_id, warehouse_id, on_hand, reserved, updated_at
         )
         VALUES($1,$2,$3,$4,0,now())
         ON CONFLICT(tenant_id, product_id, warehouse_id)
         DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now()`,
        [
          req.context.tenantId,
          item.product_id,
          count.warehouse_id,
          item.counted_quantity,
        ],
      );
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, product_id, warehouse_id, movement_type, quantity,
           unit_cost, reference_type, reference_id, reason, created_by
         )
         SELECT $1, p.id, $2, 'COUNT_ADJUSTMENT', $3,
                p.cost, 'INVENTORY_COUNT', $4, $5, $6
         FROM products p
         WHERE p.id = $7 AND p.tenant_id = $1`,
        [
          req.context.tenantId,
          count.warehouse_id,
          difference,
          count.id,
          reason,
          req.context.userId,
          item.product_id,
        ],
      );
      adjustments += 1;
    }
    const result = await client.query(
      `UPDATE inventory_counts
       SET status = 'COMPLETED', completed_by = $1,
           completed_at = now(), updated_at = now()
       WHERE id = $2
       RETURNING id, count_number, status, completed_at`,
      [req.context.userId, count.id],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory_count.completed',
      entityType: 'inventory_count',
      entityId: count.id,
      after: { ...result.rows[0], adjustments },
      reason,
    });
    return { ...result.rows[0], adjustments };
  });
  res.json(completed);
}));

export default router;
