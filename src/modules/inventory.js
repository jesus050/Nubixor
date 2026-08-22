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
const MOVEMENT_LIMIT = 100;
const INCIDENT_TYPES = new Set([
  'CUSTOMER_RETURN',
  'SUPPLIER_RETURN',
  'DAMAGE',
  'LOSS',
  'QUARANTINE',
  'QUARANTINE_RELEASE',
]);

router.use(requireTenant);

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeReason(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
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

async function ensureIncidentWarehouse(
  client,
  { tenantId, branchId, warehouseType },
) {
  const existing = await client.query(
    `SELECT id, name, warehouse_type
     FROM warehouses
     WHERE tenant_id = $1 AND branch_id = $2
       AND warehouse_type = $3 AND active = TRUE
     ORDER BY created_at
     LIMIT 1`,
    [tenantId, branchId, warehouseType],
  );
  if (existing.rowCount) return existing.rows[0];
  const prefix = warehouseType === 'DAMAGED' ? 'AV' : 'CU';
  const created = await client.query(
    `INSERT INTO warehouses(
       tenant_id, branch_id, name, code, warehouse_type
     )
     SELECT $1, branch.id,
            CASE WHEN $3 = 'DAMAGED'
              THEN 'Averías · ' || branch.name
              ELSE 'Cuarentena · ' || branch.name
            END,
            $4 || '-' || upper(substr(replace(branch.id::text, '-', ''), 1, 8)),
            $3
     FROM branches branch
     WHERE branch.id = $2 AND branch.tenant_id = $1
     RETURNING id, name, warehouse_type`,
    [tenantId, branchId, warehouseType, prefix],
  );
  if (!created.rowCount) {
    throw new AppError(
      'La sucursal de la novedad no pertenece a la empresa activa.',
      404,
      'INCIDENT_BRANCH_NOT_FOUND',
    );
  }
  return created.rows[0];
}

async function ensureTransitWarehouse(client, { tenantId, branchId }) {
  const existing = await client.query(
    `SELECT id, name, warehouse_type
     FROM warehouses
     WHERE tenant_id = $1 AND branch_id = $2
       AND warehouse_type = 'TRANSIT' AND active = TRUE
     ORDER BY created_at
     LIMIT 1`,
    [tenantId, branchId],
  );
  if (existing.rowCount) return existing.rows[0];
  const created = await client.query(
    `INSERT INTO warehouses(
       tenant_id, branch_id, name, code, warehouse_type
     )
     SELECT $1, branch.id, 'En tránsito · ' || branch.name,
            'TR-' || upper(substr(replace(branch.id::text, '-', ''), 1, 8)),
            'TRANSIT'
     FROM branches branch
     WHERE branch.id = $2 AND branch.tenant_id = $1
     RETURNING id, name, warehouse_type`,
    [tenantId, branchId],
  );
  if (!created.rowCount) {
    throw new AppError(
      'La sucursal de despacho no pertenece a la empresa activa.',
      404,
      'TRANSFER_BRANCH_NOT_FOUND',
    );
  }
  return created.rows[0];
}

export async function applyInventoryBalanceDelta(
  client,
  { tenantId, productId, warehouseId, quantity },
) {
  return client.query(
    `INSERT INTO inventory_balances(
       tenant_id, product_id, warehouse_id, on_hand
     )
     VALUES($1::uuid,$2::uuid,$3::uuid,$4::numeric)
     ON CONFLICT(tenant_id, product_id, warehouse_id)
     DO UPDATE SET
       on_hand = inventory_balances.on_hand + EXCLUDED.on_hand,
       updated_at = now()
     WHERE inventory_balances.on_hand + EXCLUDED.on_hand
       >= inventory_balances.reserved
     RETURNING *`,
    [tenantId, productId, warehouseId, quantity],
  );
}

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COUNT(DISTINCT ib.product_id) FILTER (WHERE ib.on_hand > 0)::integer stocked_products,
       COUNT(*) FILTER (WHERE ib.on_hand > 0)::integer active_balances,
       COALESCE(SUM(ib.on_hand), 0) total_units,
       COALESCE(SUM(GREATEST(ib.on_hand - ib.reserved, 0)), 0) available_units,
       COALESCE(SUM(ib.on_hand) FILTER (WHERE w.warehouse_type = 'DISPLAY'), 0)
         display_units,
       COALESCE(SUM(ib.on_hand) FILTER (WHERE w.warehouse_type = 'AVAILABLE'), 0)
         storage_units,
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
       w.warehouse_type,
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

router.get('/replenishments', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       p.id product_id,
       p.sku,
       p.name product_name,
       display.branch_id,
       display.id display_warehouse_id,
       display.name display_warehouse_name,
       source.id source_warehouse_id,
       source.name source_warehouse_name,
       COALESCE(rule.minimum_quantity, 2) minimum_quantity,
       COALESCE(rule.maximum_quantity, 5) maximum_quantity,
       COALESCE(display_balance.on_hand - display_balance.reserved, 0)
         display_available,
       COALESCE(source_balance.on_hand - source_balance.reserved, 0)
         source_available,
       LEAST(
         GREATEST(
           COALESCE(rule.maximum_quantity, 5) -
             COALESCE(display_balance.on_hand - display_balance.reserved, 0),
           0
         ),
         GREATEST(
           COALESCE(source_balance.on_hand - source_balance.reserved, 0),
           0
         )
       ) suggested_quantity,
       CASE
         WHEN COALESCE(display_balance.on_hand - display_balance.reserved, 0) <= 0
           THEN 'OUT'
         WHEN COALESCE(display_balance.on_hand - display_balance.reserved, 0)
           <= COALESCE(rule.minimum_quantity, 2)
           THEN 'LOW'
         ELSE 'OK'
       END status,
       (rule.id IS NOT NULL) configured
     FROM products p
     JOIN warehouses display
       ON display.tenant_id = p.tenant_id
      AND display.warehouse_type = 'DISPLAY'
      AND display.active = TRUE
     LEFT JOIN inventory_replenishment_rules rule
       ON rule.tenant_id = p.tenant_id
      AND rule.product_id = p.id
      AND rule.display_warehouse_id = display.id
      AND rule.active = TRUE
     LEFT JOIN LATERAL (
       SELECT warehouse.id, warehouse.name
       FROM warehouses warehouse
       WHERE warehouse.tenant_id = p.tenant_id
         AND warehouse.branch_id = display.branch_id
         AND warehouse.warehouse_type = 'AVAILABLE'
         AND warehouse.active = TRUE
       ORDER BY
         (warehouse.id = rule.source_warehouse_id) DESC,
         warehouse.name,
         warehouse.id
       LIMIT 1
     ) source ON TRUE
     LEFT JOIN inventory_balances display_balance
       ON display_balance.tenant_id = p.tenant_id
      AND display_balance.product_id = p.id
      AND display_balance.warehouse_id = display.id
     LEFT JOIN inventory_balances source_balance
       ON source_balance.tenant_id = p.tenant_id
      AND source_balance.product_id = p.id
      AND source_balance.warehouse_id = source.id
     WHERE p.tenant_id = $1
       AND p.deleted_at IS NULL
       AND ($2::uuid IS NULL OR display.branch_id = $2)
     ORDER BY
       CASE
         WHEN COALESCE(display_balance.on_hand - display_balance.reserved, 0) <= 0 THEN 0
         WHEN COALESCE(display_balance.on_hand - display_balance.reserved, 0)
           <= COALESCE(rule.minimum_quantity, 2) THEN 1
         ELSE 2
       END,
       p.name`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json(result.rows);
}));

router.put('/replenishments/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    sourceWarehouseId,
    displayWarehouseId,
    minimumQuantity,
    maximumQuantity,
  } = req.body;
  if (!isUuid(productId) || !isUuid(sourceWarehouseId) || !isUuid(displayWarehouseId)) {
    throw new AppError(
      'El producto, la bodega y la exhibición deben tener UUID válidos.',
      422,
      'INVALID_REPLENISHMENT_REFERENCE',
    );
  }
  const minimum = Number(minimumQuantity);
  const maximum = Number(maximumQuantity);
  if (!Number.isFinite(minimum) || minimum < 0 ||
      !Number.isFinite(maximum) || maximum <= minimum) {
    throw new AppError(
      'El mínimo debe ser cero o mayor y el máximo debe superar al mínimo.',
      422,
      'INVALID_REPLENISHMENT_LEVELS',
    );
  }

  const result = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT
         EXISTS(
           SELECT 1
           FROM products
           WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
         ) product_ok,
         source.warehouse_type source_type,
         source.branch_id source_branch_id,
         display.warehouse_type display_type,
         display.branch_id display_branch_id
       FROM warehouses source
       JOIN warehouses display ON display.tenant_id = source.tenant_id
       WHERE source.tenant_id = $1
         AND source.id = $3
         AND display.id = $4
         AND source.active = TRUE
         AND display.active = TRUE`,
      [
        req.context.tenantId,
        productId,
        sourceWarehouseId,
        displayWarehouseId,
      ],
    );
    const reference = references.rows[0];
    if (!reference?.product_ok ||
        reference.source_type !== 'AVAILABLE' ||
        reference.display_type !== 'DISPLAY' ||
        reference.source_branch_id !== reference.display_branch_id ||
        (req.context.branchId &&
          reference.display_branch_id !== req.context.branchId)) {
      throw new AppError(
        'La regla debe conectar una bodega disponible con una exhibición de la misma sucursal.',
        422,
        'INVALID_REPLENISHMENT_ROUTE',
      );
    }
    const saved = await client.query(
      `INSERT INTO inventory_replenishment_rules(
         tenant_id, product_id, source_warehouse_id, display_warehouse_id,
         minimum_quantity, maximum_quantity
       )
       VALUES($1, $2, $3, $4, $5, $6)
       ON CONFLICT(tenant_id, product_id, display_warehouse_id)
       DO UPDATE SET
         source_warehouse_id = EXCLUDED.source_warehouse_id,
         minimum_quantity = EXCLUDED.minimum_quantity,
         maximum_quantity = EXCLUDED.maximum_quantity,
         active = TRUE,
         updated_at = now()
       RETURNING *`,
      [
        req.context.tenantId,
        productId,
        sourceWarehouseId,
        displayWarehouseId,
        minimum,
        maximum,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.replenishment_rule_updated',
      entityType: 'inventory_replenishment_rule',
      entityId: saved.rows[0].id,
      after: saved.rows[0],
      reason: 'Configuración de niveles de exhibición',
    });
    return saved.rows[0];
  });
  res.json(result);
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

router.get('/kardex', asyncHandler(async (req, res) => {
  const productId = req.query.productId || null;
  const warehouseId = req.query.warehouseId || null;
  const dateFrom = req.query.dateFrom || null;
  const dateTo = req.query.dateTo || null;
  if ((productId && !isUuid(productId)) || (warehouseId && !isUuid(warehouseId))) {
    throw new AppError(
      'El producto o la bodega del kardex no son válidos.',
      422,
      'INVALID_KARDEX_REFERENCE',
    );
  }
  if ((dateFrom && !validDate(dateFrom)) || (dateTo && !validDate(dateTo)) ||
      (dateFrom && dateTo && dateTo < dateFrom)) {
    throw new AppError(
      'El período del kardex no es válido.',
      422,
      'INVALID_KARDEX_PERIOD',
    );
  }
  const result = await query(
    `WITH ordered AS (
       SELECT movement.id, movement.product_id, movement.warehouse_id,
              movement.movement_type, movement.quantity, movement.unit_cost,
              movement.reference_type, movement.reference_id, movement.reason,
              movement.created_at, product.sku, product.name product_name,
              warehouse.name warehouse_name, warehouse.code warehouse_code,
              branch.name branch_name,
              movement.balance_before, movement.balance_after,
              -- El saldo ya no se recalcula recorriendo toda la historia en
              -- cada consulta: viene sellado en el propio movimiento, que es
              -- además el que vale si alguna vez discrepan.
              movement.balance_after running_quantity,
              SUM(movement.quantity * movement.unit_cost) OVER (
                PARTITION BY movement.product_id, movement.warehouse_id
                ORDER BY movement.created_at, movement.id
              ) running_value
       FROM inventory_movements movement
       JOIN products product
         ON product.id = movement.product_id
        AND product.tenant_id = movement.tenant_id
       JOIN warehouses warehouse
         ON warehouse.id = movement.warehouse_id
        AND warehouse.tenant_id = movement.tenant_id
       JOIN branches branch ON branch.id = warehouse.branch_id
       WHERE movement.tenant_id = $1
         AND ($2::uuid IS NULL OR movement.product_id = $2)
         AND ($3::uuid IS NULL OR movement.warehouse_id = $3)
         AND ($6::uuid IS NULL OR warehouse.branch_id = $6)
     )
     SELECT *
     FROM ordered
     WHERE ($4::date IS NULL OR created_at >= $4::date)
       AND ($5::date IS NULL OR created_at < ($5::date + INTERVAL '1 day'))
     ORDER BY created_at DESC, id DESC
     LIMIT 500`,
    [
      req.context.tenantId,
      productId,
      warehouseId,
      dateFrom,
      dateTo,
      req.context.branchId,
    ],
  );
  res.json(result.rows);
}));

// El kardex y el saldo deberían contar lo mismo. Cuando no coinciden es que
// alguien movió existencias sin registrar el movimiento, y esa diferencia es
// justo lo que hay que poder ver: en un inventario, lo que no se explica se
// termina perdiendo.
router.get('/kardex/reconciliation', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT balance.product_id, product.sku, product.name product_name,
            balance.warehouse_id, warehouse.name warehouse_name,
            warehouse.code warehouse_code, branch.name branch_name,
            balance.on_hand, COALESCE(kardex.balance_after, 0) kardex_balance,
            balance.on_hand - COALESCE(kardex.balance_after, 0) difference,
            kardex.created_at last_movement_at
     FROM inventory_balances balance
     JOIN products product
       ON product.id = balance.product_id AND product.tenant_id = balance.tenant_id
     JOIN warehouses warehouse
       ON warehouse.id = balance.warehouse_id AND warehouse.tenant_id = balance.tenant_id
     JOIN branches branch ON branch.id = warehouse.branch_id
     LEFT JOIN LATERAL (
       SELECT movement.balance_after, movement.created_at
       FROM inventory_movements movement
       WHERE movement.tenant_id = balance.tenant_id
         AND movement.product_id = balance.product_id
         AND movement.warehouse_id = balance.warehouse_id
       ORDER BY movement.created_at DESC, movement.id DESC
       LIMIT 1
     ) kardex ON TRUE
     WHERE balance.tenant_id = $1
       AND ($2::uuid IS NULL OR warehouse.branch_id = $2)
       AND balance.on_hand <> COALESCE(kardex.balance_after, 0)
     ORDER BY abs(balance.on_hand - COALESCE(kardex.balance_after, 0)) DESC,
              product.name
     LIMIT 200`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json({
    differences: result.rows,
    total: result.rowCount,
    truncated: result.rowCount === 200,
    note: 'Una diferencia significa que el saldo cambió sin registrar el movimiento. '
      + 'Corrígela con un ajuste, que sí deja rastro.',
  });
}));

router.get('/incidents', asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit || 50);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;
  const result = await query(
    `SELECT incident.id, incident.incident_type, incident.status,
            incident.quantity, incident.unit_cost, incident.reason,
            incident.reference, incident.created_at, incident.resolved_at,
            product.id product_id, product.sku, product.name product_name,
            source.id source_warehouse_id, source.name source_warehouse_name,
            destination.id destination_warehouse_id,
            destination.name destination_warehouse_name,
            branch.name branch_name,
            creator.full_name created_by_name
     FROM inventory_incidents incident
     JOIN products product
       ON product.id = incident.product_id
      AND product.tenant_id = incident.company_id
     JOIN branches branch
       ON branch.id = incident.branch_id
      AND branch.tenant_id = incident.company_id
     LEFT JOIN warehouses source
       ON source.id = incident.source_warehouse_id
      AND source.tenant_id = incident.company_id
     LEFT JOIN warehouses destination
       ON destination.id = incident.destination_warehouse_id
      AND destination.tenant_id = incident.company_id
     LEFT JOIN users creator ON creator.id = incident.created_by
     WHERE incident.company_id = $1
       AND ($2::uuid IS NULL OR incident.branch_id = $2)
     ORDER BY incident.created_at DESC
     LIMIT $3`,
    [req.context.tenantId, req.context.branchId, limit],
  );
  res.json(result.rows);
}));

router.post('/incidents', asyncHandler(async (req, res) => {
  const productId = req.body.productId;
  const warehouseId = req.body.warehouseId;
  const destinationWarehouseId = req.body.destinationWarehouseId || null;
  const incidentType = typeof req.body.incidentType === 'string'
    ? req.body.incidentType.trim().toUpperCase()
    : '';
  const quantity = Number(req.body.quantity);
  const reason = normalizeReason(req.body.reason);
  const reference = normalizeReason(req.body.reference).slice(0, 160) || null;
  if (!isUuid(productId) || !isUuid(warehouseId) ||
      (destinationWarehouseId && !isUuid(destinationWarehouseId)) ||
      !INCIDENT_TYPES.has(incidentType)) {
    throw new AppError(
      'Selecciona un producto, una ubicación y un tipo de novedad válidos.',
      422,
      'INVALID_INVENTORY_INCIDENT',
    );
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || !reason) {
    throw new AppError(
      'La cantidad positiva y el motivo son obligatorios.',
      422,
      'INVALID_INVENTORY_INCIDENT_DETAIL',
    );
  }
  if (incidentType === 'QUARANTINE_RELEASE' && !destinationWarehouseId) {
    throw new AppError(
      'Selecciona la ubicación disponible donde se liberará el producto.',
      422,
      'INCIDENT_DESTINATION_REQUIRED',
    );
  }

  const result = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT product.cost,
              warehouse.branch_id, warehouse.warehouse_type,
              destination.branch_id destination_branch_id,
              destination.warehouse_type destination_type
       FROM products product
       JOIN warehouses warehouse
         ON warehouse.id = $3
        AND warehouse.tenant_id = product.tenant_id
        AND warehouse.active = TRUE
       LEFT JOIN warehouses destination
         ON destination.id = $4
        AND destination.tenant_id = product.tenant_id
        AND destination.active = TRUE
       WHERE product.id = $2 AND product.tenant_id = $1
         AND product.deleted_at IS NULL
       FOR SHARE OF product, warehouse`,
      [
        req.context.tenantId,
        productId,
        warehouseId,
        destinationWarehouseId,
      ],
    );
    if (!references.rowCount ||
        (destinationWarehouseId && !references.rows[0].destination_branch_id)) {
      throw new AppError(
        'El producto o alguna ubicación no pertenece a la empresa activa.',
        404,
        'INVENTORY_INCIDENT_REFERENCE_NOT_FOUND',
      );
    }
    const detail = references.rows[0];
    if (req.context.branchId && detail.branch_id !== req.context.branchId) {
      throw new AppError(
        'La novedad no corresponde a la sucursal asignada.',
        403,
        'INVENTORY_INCIDENT_BRANCH_DENIED',
      );
    }
    if (incidentType === 'QUARANTINE_RELEASE' &&
        (detail.warehouse_type !== 'QUARANTINE' ||
          detail.destination_branch_id !== detail.branch_id ||
          !['AVAILABLE', 'DISPLAY'].includes(detail.destination_type))) {
      throw new AppError(
        'La liberación debe salir de cuarentena hacia una ubicación disponible de la misma sucursal.',
        422,
        'INVALID_QUARANTINE_RELEASE_ROUTE',
      );
    }
    let targetId = destinationWarehouseId;
    if (incidentType === 'DAMAGE' || incidentType === 'QUARANTINE') {
      const target = await ensureIncidentWarehouse(client, {
        tenantId: req.context.tenantId,
        branchId: detail.branch_id,
        warehouseType: incidentType === 'DAMAGE' ? 'DAMAGED' : 'QUARANTINE',
      });
      targetId = target.id;
    }

    const removesFromSource = new Set([
      'SUPPLIER_RETURN',
      'DAMAGE',
      'LOSS',
      'QUARANTINE',
      'QUARANTINE_RELEASE',
    ]).has(incidentType);
    if (removesFromSource) {
      const source = await client.query(
        `UPDATE inventory_balances
         SET on_hand = on_hand - $4, updated_at = now()
         WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
           AND on_hand - reserved >= $4
         RETURNING *`,
        [req.context.tenantId, productId, warehouseId, quantity],
      );
      if (!source.rowCount) {
        throw new AppError(
          'No hay unidades disponibles suficientes para registrar la novedad.',
          409,
          'INSUFFICIENT_INCIDENT_STOCK',
        );
      }
    }
    const addsToDestination = incidentType === 'CUSTOMER_RETURN' ||
      ['DAMAGE', 'QUARANTINE', 'QUARANTINE_RELEASE'].includes(incidentType);
    const effectiveDestination = incidentType === 'CUSTOMER_RETURN'
      ? warehouseId
      : targetId;
    if (addsToDestination) {
      await applyInventoryBalanceDelta(client, {
        tenantId: req.context.tenantId,
        productId,
        warehouseId: effectiveDestination,
        quantity,
      });
    }
    const incident = await client.query(
      `INSERT INTO inventory_incidents(
         company_id, branch_id, product_id, source_warehouse_id,
         destination_warehouse_id, incident_type, quantity, unit_cost,
         reason, reference, created_by, resolved_by, resolved_at
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,now())
       RETURNING *`,
      [
        req.context.tenantId,
        detail.branch_id,
        productId,
        incidentType === 'CUSTOMER_RETURN' ? null : warehouseId,
        effectiveDestination,
        incidentType,
        quantity,
        detail.cost,
        reason,
        reference,
        req.context.userId,
      ],
    );
    const movementRows = [];
    if (removesFromSource) {
      movementRows.push({
        warehouseId,
        movementType: incidentType === 'SUPPLIER_RETURN'
          ? 'SUPPLIER_RETURN'
          : incidentType === 'LOSS'
            ? 'LOSS'
            : incidentType === 'QUARANTINE_RELEASE'
              ? 'QUARANTINE_RELEASE_OUT'
              : `${incidentType}_OUT`,
        quantity: -quantity,
      });
    }
    if (addsToDestination) {
      movementRows.push({
        warehouseId: effectiveDestination,
        movementType: incidentType === 'CUSTOMER_RETURN'
          ? 'CUSTOMER_RETURN'
          : incidentType === 'QUARANTINE_RELEASE'
            ? 'QUARANTINE_RELEASE_IN'
            : `${incidentType}_IN`,
        quantity,
      });
    }
    for (const movement of movementRows) {
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, product_id, warehouse_id, movement_type, quantity,
           unit_cost, reference_type, reference_id, reason, created_by
         )
         VALUES($1,$2,$3,$4,$5,$6,'INVENTORY_INCIDENT',$7,$8,$9)`,
        [
          req.context.tenantId,
          productId,
          movement.warehouseId,
          movement.movementType,
          movement.quantity,
          detail.cost,
          incident.rows[0].id,
          reason,
          req.context.userId,
        ],
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.incident_resolved',
      entityType: 'inventory_incident',
      entityId: incident.rows[0].id,
      after: {
        ...incident.rows[0],
        movements: movementRows,
      },
      reason,
    });
    return incident.rows[0];
  });
  res.status(201).json(result);
}));

router.get('/transfer-orders', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT transfer.id, transfer.status, transfer.quantity,
            transfer.unit_cost, transfer.reason, transfer.dispatch_reference,
            transfer.reception_notes, transfer.dispatched_at,
            transfer.received_at, transfer.cancelled_at,
            product.id product_id, product.sku, product.name product_name,
            source.name source_warehouse_name,
            source.branch_id source_branch_id,
            destination.name destination_warehouse_name,
            destination.branch_id destination_branch_id,
            source_branch.name source_branch_name,
            destination_branch.name destination_branch_name
     FROM inventory_transfer_orders transfer
     JOIN products product
       ON product.id = transfer.product_id
      AND product.tenant_id = transfer.company_id
     JOIN warehouses source
       ON source.id = transfer.source_warehouse_id
      AND source.tenant_id = transfer.company_id
     JOIN warehouses destination
       ON destination.id = transfer.destination_warehouse_id
      AND destination.tenant_id = transfer.company_id
     JOIN branches source_branch ON source_branch.id = source.branch_id
     JOIN branches destination_branch ON destination_branch.id = destination.branch_id
     WHERE transfer.company_id = $1
       AND (
         $2::uuid IS NULL OR source.branch_id = $2 OR destination.branch_id = $2
       )
     ORDER BY
       CASE transfer.status WHEN 'DISPATCHED' THEN 0 ELSE 1 END,
       transfer.dispatched_at DESC
     LIMIT 100`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json(result.rows);
}));

router.post('/transfer-orders', asyncHandler(async (req, res) => {
  const {
    productId,
    sourceWarehouseId,
    destinationWarehouseId,
  } = req.body;
  const quantity = Number(req.body.quantity);
  const reason = normalizeReason(req.body.reason);
  const dispatchReference =
    normalizeReason(req.body.dispatchReference).slice(0, 160) || null;
  validateInventoryReference(productId, sourceWarehouseId);
  if (!isUuid(destinationWarehouseId) ||
      destinationWarehouseId === sourceWarehouseId ||
      !Number.isFinite(quantity) || quantity <= 0 || !reason) {
    throw new AppError(
      'Selecciona ubicaciones diferentes, una cantidad positiva y el motivo.',
      422,
      'INVALID_TRANSFER_ORDER',
    );
  }
  const result = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT product.cost,
              source.branch_id source_branch_id,
              destination.branch_id destination_branch_id
       FROM products product
       JOIN warehouses source
         ON source.id = $3 AND source.tenant_id = product.tenant_id
        AND source.active = TRUE
       JOIN warehouses destination
         ON destination.id = $4 AND destination.tenant_id = product.tenant_id
        AND destination.active = TRUE
       WHERE product.id = $2 AND product.tenant_id = $1
         AND product.deleted_at IS NULL
       FOR SHARE OF product, source, destination`,
      [
        req.context.tenantId,
        productId,
        sourceWarehouseId,
        destinationWarehouseId,
      ],
    );
    if (!references.rowCount) {
      throw new AppError(
        'El producto o las ubicaciones no pertenecen a la empresa activa.',
        404,
        'TRANSFER_ORDER_REFERENCE_NOT_FOUND',
      );
    }
    const detail = references.rows[0];
    if (req.context.branchId &&
        detail.source_branch_id !== req.context.branchId) {
      throw new AppError(
        'Solo puedes despachar desde tu sucursal asignada.',
        403,
        'TRANSFER_DISPATCH_BRANCH_DENIED',
      );
    }
    const transit = await ensureTransitWarehouse(client, {
      tenantId: req.context.tenantId,
      branchId: detail.source_branch_id,
    });
    const source = await client.query(
      `UPDATE inventory_balances
       SET on_hand = on_hand - $4, updated_at = now()
       WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
         AND on_hand - reserved >= $4
       RETURNING *`,
      [req.context.tenantId, productId, sourceWarehouseId, quantity],
    );
    if (!source.rowCount) {
      throw new AppError(
        'No hay unidades disponibles suficientes para el despacho.',
        409,
        'INSUFFICIENT_DISPATCH_STOCK',
      );
    }
    await applyInventoryBalanceDelta(client, {
      tenantId: req.context.tenantId,
      productId,
      warehouseId: transit.id,
      quantity,
    });
    const transfer = await client.query(
      `INSERT INTO inventory_transfer_orders(
         company_id, product_id, source_warehouse_id, transit_warehouse_id,
         destination_warehouse_id, quantity, unit_cost, reason,
         dispatch_reference, dispatched_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.context.tenantId,
        productId,
        sourceWarehouseId,
        transit.id,
        destinationWarehouseId,
        quantity,
        detail.cost,
        reason,
        dispatchReference,
        req.context.userId,
      ],
    );
    await client.query(
      `INSERT INTO inventory_movements(
         tenant_id, product_id, warehouse_id, movement_type, quantity,
         unit_cost, reference_type, reference_id, reason, created_by
       )
       VALUES
         ($1,$2,$3,'TRANSFER_DISPATCH',-$5,$6,'TRANSFER_ORDER',$7,$8,$9),
         ($1,$2,$4,'TRANSFER_TRANSIT',$5,$6,'TRANSFER_ORDER',$7,$8,$9)`,
      [
        req.context.tenantId,
        productId,
        sourceWarehouseId,
        transit.id,
        quantity,
        detail.cost,
        transfer.rows[0].id,
        reason,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.transfer_dispatched',
      entityType: 'inventory_transfer_order',
      entityId: transfer.rows[0].id,
      after: transfer.rows[0],
      reason,
    });
    return transfer.rows[0];
  });
  res.status(201).json(result);
}));

router.post('/transfer-orders/:transferId/receive', asyncHandler(async (req, res) => {
  const { transferId } = req.params;
  const notes = normalizeReason(req.body.receptionNotes);
  if (!isUuid(transferId) || !notes) {
    throw new AppError(
      'La transferencia y las observaciones de recepción son obligatorias.',
      422,
      'INVALID_TRANSFER_RECEPTION',
    );
  }
  const result = await withTransaction(async (client) => {
    const transfer = await client.query(
      `SELECT transfer.*, destination.branch_id destination_branch_id
       FROM inventory_transfer_orders transfer
       JOIN warehouses destination
         ON destination.id = transfer.destination_warehouse_id
        AND destination.tenant_id = transfer.company_id
       WHERE transfer.id = $1 AND transfer.company_id = $2
         AND transfer.status = 'DISPATCHED'
       FOR UPDATE OF transfer`,
      [transferId, req.context.tenantId],
    );
    if (!transfer.rowCount) {
      throw new AppError(
        'La transferencia no existe o ya fue procesada.',
        404,
        'TRANSFER_ORDER_NOT_PENDING',
      );
    }
    const record = transfer.rows[0];
    if (req.context.branchId &&
        record.destination_branch_id !== req.context.branchId) {
      throw new AppError(
        'Solo la sucursal de destino puede confirmar la recepción.',
        403,
        'TRANSFER_RECEPTION_BRANCH_DENIED',
      );
    }
    const transit = await client.query(
      `UPDATE inventory_balances
       SET on_hand = on_hand - $4, updated_at = now()
       WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
         AND on_hand - reserved >= $4
       RETURNING *`,
      [
        req.context.tenantId,
        record.product_id,
        record.transit_warehouse_id,
        record.quantity,
      ],
    );
    if (!transit.rowCount) {
      throw new AppError(
        'El saldo en tránsito no coincide; revisa el kardex antes de recibir.',
        409,
        'TRANSFER_TRANSIT_BALANCE_MISMATCH',
      );
    }
    await applyInventoryBalanceDelta(client, {
      tenantId: req.context.tenantId,
      productId: record.product_id,
      warehouseId: record.destination_warehouse_id,
      quantity: record.quantity,
    });
    const updated = await client.query(
      `UPDATE inventory_transfer_orders
       SET status = 'RECEIVED', reception_notes = $3, received_by = $4,
           received_at = now(), updated_at = now()
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [transferId, req.context.tenantId, notes, req.context.userId],
    );
    await client.query(
      `INSERT INTO inventory_movements(
         tenant_id, product_id, warehouse_id, movement_type, quantity,
         unit_cost, reference_type, reference_id, reason, created_by
       )
       VALUES
         ($1,$2,$3,'TRANSFER_TRANSIT_OUT',-$5,$6,'TRANSFER_ORDER',$7,$8,$9),
         ($1,$2,$4,'TRANSFER_RECEIVED',$5,$6,'TRANSFER_ORDER',$7,$8,$9)`,
      [
        req.context.tenantId,
        record.product_id,
        record.transit_warehouse_id,
        record.destination_warehouse_id,
        record.quantity,
        record.unit_cost,
        transferId,
        notes,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'inventory.transfer_received',
      entityType: 'inventory_transfer_order',
      entityId: transferId,
      before: record,
      after: updated.rows[0],
      reason: notes,
    });
    return updated.rows[0];
  });
  res.json(result);
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
    const balance = await applyInventoryBalanceDelta(client, {
      tenantId: req.context.tenantId,
      productId,
      warehouseId,
      quantity: normalizedQuantity,
    });
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
