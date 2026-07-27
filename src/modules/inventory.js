import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MOVEMENT_LIMIT = 100;

router.use(requireTenant);

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeReason(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateInventoryReference(productId, warehouseId) {
  if (!isUuid(productId) || !isUuid(warehouseId)) {
    throw new AppError(
      'El producto y la bodega deben tener UUID válidos.',
      422,
      'INVALID_INVENTORY_REFERENCE',
    );
  }
}

async function lockInventoryReferences(client, tenantId, productId, warehouseIds) {
  const references = await client.query(
    `SELECT
       EXISTS(
         SELECT 1 FROM products
         WHERE id = $2 AND tenant_id = $1 AND deleted_at IS NULL
       ) product_ok,
       (
         SELECT COUNT(*)::integer
         FROM warehouses
         WHERE tenant_id = $1 AND active = TRUE AND id = ANY($3::uuid[])
       ) warehouse_count`,
    [tenantId, productId, warehouseIds],
  );
  if (!references.rows[0].product_ok) {
    throw new AppError(
      'El producto no pertenece a la empresa activa.',
      404,
      'INVENTORY_PRODUCT_NOT_FOUND',
    );
  }
  if (references.rows[0].warehouse_count !== new Set(warehouseIds).size) {
    throw new AppError(
      'Una de las bodegas no pertenece a la empresa activa o está inactiva.',
      404,
      'INVENTORY_WAREHOUSE_NOT_FOUND',
    );
  }
}

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COUNT(DISTINCT ib.product_id) FILTER (WHERE ib.on_hand > 0)::integer stocked_products,
       COUNT(*) FILTER (WHERE ib.on_hand > 0)::integer active_balances,
       COALESCE(SUM(ib.on_hand), 0) total_units,
       COALESCE(SUM(GREATEST(ib.on_hand - ib.reserved, 0)), 0) available_units,
       COALESCE(SUM(ib.reserved), 0) reserved_units,
       COALESCE(SUM(ib.on_hand * p.cost), 0) inventory_value,
       COUNT(*) FILTER (WHERE ib.on_hand > 0 AND ib.on_hand - ib.reserved <= 5)::integer low_stock_balances,
       (
         SELECT COUNT(*)::integer
         FROM inventory_movements im
         JOIN warehouses mw
           ON mw.id = im.warehouse_id AND mw.tenant_id = im.tenant_id
         WHERE im.tenant_id = $1
           AND im.created_at >= date_trunc('month', CURRENT_DATE)
           AND ($2::uuid IS NULL OR mw.branch_id = $2)
       ) movements_month
     FROM inventory_balances ib
     JOIN products p
       ON p.id = ib.product_id
      AND p.tenant_id = ib.tenant_id
      AND p.deleted_at IS NULL
     JOIN warehouses w
       ON w.id = ib.warehouse_id AND w.tenant_id = ib.tenant_id
     WHERE ib.tenant_id = $1
       AND ($2::uuid IS NULL OR w.branch_id = $2)`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json(result.rows[0]);
}));

router.get('/balances', asyncHandler(async (req, res) => {
  const warehouseId = req.query.warehouseId || null;
  if (warehouseId && !isUuid(warehouseId)) {
    throw new AppError('warehouseId debe ser un UUID válido.', 422, 'INVALID_WAREHOUSE_ID');
  }
  const result = await query(
    `SELECT
       ib.tenant_id, ib.product_id, ib.warehouse_id, ib.on_hand, ib.reserved,
       (ib.on_hand - ib.reserved) available,
       (ib.on_hand * p.cost) stock_value,
       ib.updated_at,
       p.sku, p.name, p.cost, p.sale_price,
       c.name category_name, b.name brand_name,
       w.name warehouse_name, w.code warehouse_code,
       br.name branch_name,
       pi.public_url image_url, pi.alt_text image_alt
     FROM inventory_balances ib
     JOIN products p
       ON p.id = ib.product_id
      AND p.tenant_id = ib.tenant_id
      AND p.deleted_at IS NULL
     JOIN warehouses w
       ON w.id = ib.warehouse_id
      AND w.tenant_id = ib.tenant_id
     JOIN branches br ON br.id = w.branch_id
     LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
     LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
     LEFT JOIN LATERAL (
       SELECT public_url, alt_text
       FROM product_images
       WHERE tenant_id = p.tenant_id AND product_id = p.id
       ORDER BY is_primary DESC, created_at
       LIMIT 1
     ) pi ON TRUE
     WHERE ib.tenant_id = $1
       AND ($2::uuid IS NULL OR ib.warehouse_id = $2)
       AND ($3::uuid IS NULL OR w.branch_id = $3)
     ORDER BY p.name, w.name`,
    [req.context.tenantId, warehouseId, req.context.branchId],
  );
  res.json(result.rows);
}));

router.get('/movements', asyncHandler(async (req, res) => {
  const warehouseId = req.query.warehouseId || null;
  const requestedLimit = Number(req.query.limit || 40);
  if (warehouseId && !isUuid(warehouseId)) {
    throw new AppError('warehouseId debe ser un UUID válido.', 422, 'INVALID_WAREHOUSE_ID');
  }
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MOVEMENT_LIMIT)
    : 40;
  const result = await query(
    `SELECT
       im.id, im.product_id, im.warehouse_id, im.movement_type, im.quantity,
       im.unit_cost, im.reference_type, im.reference_id, im.reason, im.created_at,
       p.sku, p.name product_name,
       w.name warehouse_name, w.code warehouse_code,
       br.name branch_name
     FROM inventory_movements im
     JOIN products p ON p.id = im.product_id AND p.tenant_id = im.tenant_id
     JOIN warehouses w ON w.id = im.warehouse_id AND w.tenant_id = im.tenant_id
     JOIN branches br ON br.id = w.branch_id
     WHERE im.tenant_id = $1
       AND ($2::uuid IS NULL OR im.warehouse_id = $2)
       AND ($4::uuid IS NULL OR w.branch_id = $4)
     ORDER BY im.created_at DESC
     LIMIT $3`,
    [req.context.tenantId, warehouseId, limit, req.context.branchId],
  );
  res.json(result.rows);
}));

router.post('/adjustments', asyncHandler(async (req, res) => {
  const { productId, warehouseId, quantity, reason } = req.body;
  validateInventoryReference(productId, warehouseId);
  const normalizedQuantity = Number(quantity);
  const normalizedReason = normalizeReason(reason);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity === 0) {
    throw new AppError(
      'La cantidad del ajuste debe ser un número diferente de cero.',
      422,
      'INVALID_ADJUSTMENT_QUANTITY',
    );
  }
  if (!normalizedReason) {
    throw new AppError(
      'El motivo del ajuste es obligatorio.',
      422,
      'ADJUSTMENT_REASON_REQUIRED',
    );
  }

  const result = await withTransaction(async (client) => {
    await lockInventoryReferences(
      client,
      req.context.tenantId,
      productId,
      [warehouseId],
    );
    const current = await client.query(
      `SELECT on_hand, reserved
       FROM inventory_balances
       WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
       FOR UPDATE`,
      [req.context.tenantId, productId, warehouseId],
    );
    const beforeOnHand = Number(current.rows[0]?.on_hand || 0);
    const reserved = Number(current.rows[0]?.reserved || 0);
    const afterOnHand = beforeOnHand + normalizedQuantity;
    if (afterOnHand < reserved) {
      throw new AppError(
        'El ajuste dejaría existencias disponibles negativas.',
        409,
        'NEGATIVE_AVAILABLE_STOCK',
      );
    }
    const balance = await client.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand)
       SELECT $1, $2, $3, $4
       WHERE $4 >= 0
       ON CONFLICT(tenant_id, product_id, warehouse_id)
       DO UPDATE SET
         on_hand = inventory_balances.on_hand + EXCLUDED.on_hand,
         updated_at = now()
       WHERE inventory_balances.on_hand + EXCLUDED.on_hand >= inventory_balances.reserved
       RETURNING *`,
      [req.context.tenantId, productId, warehouseId, normalizedQuantity],
    );
    if (!balance.rowCount) {
      throw new AppError(
        'El ajuste dejaría existencias disponibles negativas.',
        409,
        'NEGATIVE_AVAILABLE_STOCK',
      );
    }
    const movement = await client.query(
      `INSERT INTO inventory_movements(
         tenant_id, product_id, warehouse_id, movement_type, quantity,
         unit_cost, reference_type, reference_id, reason, created_by
       )
       SELECT $1, p.id, $3, $4, $5, p.cost, 'MANUAL_ADJUSTMENT', $6, $7, $8
       FROM products p
       WHERE p.id = $2 AND p.tenant_id = $1
       RETURNING *`,
      [
        req.context.tenantId,
        productId,
        warehouseId,
        normalizedQuantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        normalizedQuantity,
        randomUUID(),
        normalizedReason,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.adjustment_created',
      entityType: 'inventory_movement',
      entityId: movement.rows[0].id,
      before: { on_hand: beforeOnHand, reserved },
      after: balance.rows[0],
      reason: normalizedReason,
    });
    return { movement: movement.rows[0], balance: balance.rows[0] };
  });
  res.status(201).json(result);
}));

router.post('/transfers', asyncHandler(async (req, res) => {
  const {
    productId,
    sourceWarehouseId,
    destinationWarehouseId,
    quantity,
    reason,
  } = req.body;
  validateInventoryReference(productId, sourceWarehouseId);
  if (!isUuid(destinationWarehouseId)) {
    throw new AppError(
      'La bodega de destino debe tener un UUID válido.',
      422,
      'INVALID_DESTINATION_WAREHOUSE',
    );
  }
  if (sourceWarehouseId === destinationWarehouseId) {
    throw new AppError(
      'Las bodegas de origen y destino deben ser diferentes.',
      422,
      'SAME_TRANSFER_WAREHOUSE',
    );
  }
  const normalizedQuantity = Number(quantity);
  const normalizedReason = normalizeReason(reason);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    throw new AppError(
      'La cantidad a transferir debe ser mayor que cero.',
      422,
      'INVALID_TRANSFER_QUANTITY',
    );
  }
  if (!normalizedReason) {
    throw new AppError(
      'El motivo de la transferencia es obligatorio.',
      422,
      'TRANSFER_REASON_REQUIRED',
    );
  }

  const result = await withTransaction(async (client) => {
    await lockInventoryReferences(
      client,
      req.context.tenantId,
      productId,
      [sourceWarehouseId, destinationWarehouseId],
    );
    const locked = await client.query(
      `SELECT warehouse_id, on_hand, reserved
       FROM inventory_balances
       WHERE tenant_id = $1
         AND product_id = $2
         AND warehouse_id = ANY($3::uuid[])
       ORDER BY warehouse_id
       FOR UPDATE`,
      [
        req.context.tenantId,
        productId,
        [sourceWarehouseId, destinationWarehouseId],
      ],
    );
    const source = locked.rows.find((row) => row.warehouse_id === sourceWarehouseId);
    const sourceAvailable = Number(source?.on_hand || 0) - Number(source?.reserved || 0);
    if (sourceAvailable < normalizedQuantity) {
      throw new AppError(
        `Solo hay ${sourceAvailable} unidades disponibles en la bodega de origen.`,
        409,
        'INSUFFICIENT_TRANSFER_STOCK',
      );
    }

    const sourceBalance = await client.query(
      `UPDATE inventory_balances
       SET on_hand = on_hand - $4, updated_at = now()
       WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [req.context.tenantId, productId, sourceWarehouseId, normalizedQuantity],
    );
    const destinationBalance = await client.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand)
       VALUES($1, $2, $3, $4)
       ON CONFLICT(tenant_id, product_id, warehouse_id)
       DO UPDATE SET
         on_hand = inventory_balances.on_hand + EXCLUDED.on_hand,
         updated_at = now()
       RETURNING *`,
      [req.context.tenantId, productId, destinationWarehouseId, normalizedQuantity],
    );
    const transferId = randomUUID();
    const movements = await client.query(
      `INSERT INTO inventory_movements(
         tenant_id, product_id, warehouse_id, movement_type, quantity,
         unit_cost, reference_type, reference_id, reason, created_by
       )
       SELECT $1, p.id, movement.warehouse_id, movement.movement_type,
              movement.quantity, p.cost, 'TRANSFER', $5, $6, $7
       FROM products p
       CROSS JOIN (
         VALUES
           ($3::uuid, 'TRANSFER_OUT'::text, -$4::numeric),
           ($8::uuid, 'TRANSFER_IN'::text, $4::numeric)
       ) movement(warehouse_id, movement_type, quantity)
       WHERE p.id = $2 AND p.tenant_id = $1
       RETURNING *`,
      [
        req.context.tenantId,
        productId,
        sourceWarehouseId,
        normalizedQuantity,
        transferId,
        normalizedReason,
        req.context.userId,
        destinationWarehouseId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.transfer_created',
      entityType: 'inventory_transfer',
      entityId: transferId,
      after: {
        productId,
        sourceWarehouseId,
        destinationWarehouseId,
        quantity: normalizedQuantity,
      },
      reason: normalizedReason,
    });
    return {
      id: transferId,
      movements: movements.rows,
      sourceBalance: sourceBalance.rows[0],
      destinationBalance: destinationBalance.rows[0],
    };
  });
  res.status(201).json(result);
}));

// Compatibilidad con integraciones tempranas. Las operaciones manuales nuevas
// deben usar /adjustments o /transfers para conservar su intención explícita.
router.post('/movements', asyncHandler(async (req, res) => {
  const {
    productId,
    warehouseId,
    movementType,
    quantity,
    unitCost = 0,
    reason,
    referenceType = null,
    referenceId = null,
  } = req.body;
  validateInventoryReference(productId, warehouseId);
  const normalizedType = typeof movementType === 'string'
    ? movementType.trim().toUpperCase()
    : '';
  const normalizedQuantity = Number(quantity);
  const normalizedUnitCost = Number(unitCost);
  const normalizedReason = normalizeReason(reason);
  if (!normalizedType || !Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0 ||
      !Number.isFinite(normalizedUnitCost) || normalizedUnitCost < 0 || !normalizedReason) {
    throw new AppError(
      'movementType, quantity positiva, unitCost válido y reason son obligatorios.',
      422,
      'INVALID_INVENTORY_MOVEMENT',
    );
  }
  const signed = ['PURCHASE', 'RETURN_IN', 'TRANSFER_IN', 'ADJUSTMENT_IN']
    .includes(normalizedType)
    ? normalizedQuantity
    : -normalizedQuantity;
  const movement = await withTransaction(async (client) => {
    await lockInventoryReferences(
      client,
      req.context.tenantId,
      productId,
      [warehouseId],
    );
    const current = await client.query(
      `SELECT on_hand, reserved
       FROM inventory_balances
       WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
       FOR UPDATE`,
      [req.context.tenantId, productId, warehouseId],
    );
    const nextAvailable = Number(current.rows[0]?.on_hand || 0)
      + signed
      - Number(current.rows[0]?.reserved || 0);
    if (nextAvailable < 0) {
      throw new AppError(
        'El movimiento dejaría existencias disponibles negativas.',
        409,
        'NEGATIVE_AVAILABLE_STOCK',
      );
    }
    const created = await client.query(
      `INSERT INTO inventory_movements(
         tenant_id, product_id, warehouse_id, movement_type, quantity,
         unit_cost, reference_type, reference_id, reason, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.context.tenantId,
        productId,
        warehouseId,
        normalizedType,
        signed,
        normalizedUnitCost,
        referenceType,
        referenceId,
        normalizedReason,
        req.context.userId,
      ],
    );
    const balance = await client.query(
      `INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand)
       SELECT $1,$2,$3,$4
       WHERE $4 >= 0
       ON CONFLICT(tenant_id, product_id, warehouse_id)
       DO UPDATE SET
         on_hand = inventory_balances.on_hand + EXCLUDED.on_hand,
         updated_at = now()
       WHERE inventory_balances.on_hand + EXCLUDED.on_hand >= inventory_balances.reserved
       RETURNING *`,
      [req.context.tenantId, productId, warehouseId, signed],
    );
    if (!balance.rowCount) {
      throw new AppError(
        'El movimiento dejaría existencias disponibles negativas.',
        409,
        'NEGATIVE_AVAILABLE_STOCK',
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.movement_created',
      entityType: 'inventory_movement',
      entityId: created.rows[0].id,
      after: created.rows[0],
      reason: normalizedReason,
    });
    return { movement: created.rows[0], balance: balance.rows[0] };
  });
  res.status(201).json(movement);
}));

export default router;
