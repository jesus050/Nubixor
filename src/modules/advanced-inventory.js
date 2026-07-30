import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ZONES = new Set([
  'RECEIVING', 'STORAGE', 'PICKING', 'DISPLAY', 'QUARANTINE',
  'DAMAGED', 'DISPATCH', 'RETURNS',
]);
const UOM_CATEGORIES = new Set([
  'UNIT', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA', 'TIME', 'OTHER',
]);

router.use(requireTenant);

function clean(value, max = 160) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  if (!result) return null;
  if (result.length > max) {
    throw new AppError(`El campo supera ${max} caracteres.`, 422, 'FIELD_TOO_LONG');
  }
  return result;
}

function uuid(value, message = 'La referencia no es válida.') {
  if (!UUID.test(value || '')) throw new AppError(message, 422, 'INVALID_REFERENCE');
  return value;
}

function positive(value, message, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new AppError(message, 422, 'INVALID_QUANTITY');
  }
  return number;
}

router.get('/overview', asyncHandler(async (req, res) => {
  const tenantId = req.context.tenantId;
  const [
    summary, locations, units, variants, lots, serials,
    reservations, labels, closures, permissions, users,
  ] = await Promise.all([
    query(
      `SELECT
         (SELECT COUNT(*) FROM warehouse_locations WHERE tenant_id=$1 AND active) locations,
         (SELECT COUNT(*) FROM units_of_measure WHERE tenant_id=$1 AND active) units,
         (SELECT COUNT(*) FROM product_variants WHERE tenant_id=$1 AND active) variants,
         (SELECT COUNT(*) FROM inventory_lots WHERE tenant_id=$1 AND on_hand>0) lots,
         (SELECT COUNT(*) FROM inventory_lots
            WHERE tenant_id=$1 AND on_hand>0 AND expiration_date <= CURRENT_DATE + 30) expiring_lots,
         (SELECT COUNT(*) FROM inventory_serial_numbers
            WHERE tenant_id=$1 AND status IN ('AVAILABLE','RESERVED')) serials,
         (SELECT COALESCE(SUM(quantity),0) FROM inventory_reservations
            WHERE tenant_id=$1 AND status='ACTIVE') reserved_units,
         (SELECT COUNT(*) FROM inventory_label_jobs
            WHERE tenant_id=$1 AND status='PENDING') pending_labels`,
      [tenantId],
    ),
    query(
      `SELECT location.*, warehouse.name warehouse_name, warehouse.code warehouse_code
       FROM warehouse_locations location
       JOIN warehouses warehouse ON warehouse.id=location.warehouse_id
         AND warehouse.tenant_id=location.tenant_id
       WHERE location.tenant_id=$1
       ORDER BY warehouse.name, location.code`,
      [tenantId],
    ),
    query(
      `SELECT * FROM units_of_measure WHERE tenant_id=$1 ORDER BY active DESC, name`,
      [tenantId],
    ),
    query(
      `SELECT variant.*, product.name product_name
       FROM product_variants variant
       JOIN products product ON product.id=variant.product_id
         AND product.tenant_id=variant.tenant_id
       WHERE variant.tenant_id=$1 ORDER BY variant.created_at DESC LIMIT 100`,
      [tenantId],
    ),
    query(
      `SELECT lot.*, product.name product_name, warehouse.name warehouse_name,
              location.code location_code,
              GREATEST(lot.expiration_date-CURRENT_DATE,0) days_to_expire
       FROM inventory_lots lot
       JOIN products product ON product.id=lot.product_id AND product.tenant_id=lot.tenant_id
       JOIN warehouses warehouse ON warehouse.id=lot.warehouse_id AND warehouse.tenant_id=lot.tenant_id
       LEFT JOIN warehouse_locations location ON location.id=lot.location_id
       WHERE lot.tenant_id=$1
       ORDER BY lot.expiration_date NULLS LAST, lot.created_at DESC LIMIT 100`,
      [tenantId],
    ),
    query(
      `SELECT serial.*, product.name product_name, warehouse.name warehouse_name
       FROM inventory_serial_numbers serial
       JOIN products product ON product.id=serial.product_id AND product.tenant_id=serial.tenant_id
       JOIN warehouses warehouse ON warehouse.id=serial.warehouse_id AND warehouse.tenant_id=serial.tenant_id
       WHERE serial.tenant_id=$1 ORDER BY serial.created_at DESC LIMIT 100`,
      [tenantId],
    ),
    query(
      `SELECT reservation.*, product.name product_name, warehouse.name warehouse_name
       FROM inventory_reservations reservation
       JOIN products product ON product.id=reservation.product_id
         AND product.tenant_id=reservation.tenant_id
       JOIN warehouses warehouse ON warehouse.id=reservation.warehouse_id
         AND warehouse.tenant_id=reservation.tenant_id
       WHERE reservation.tenant_id=$1
       ORDER BY (reservation.status='ACTIVE') DESC, reservation.created_at DESC LIMIT 100`,
      [tenantId],
    ),
    query(
      `SELECT label.*, product.name product_name
       FROM inventory_label_jobs label
       JOIN products product ON product.id=label.product_id AND product.tenant_id=label.tenant_id
       WHERE label.tenant_id=$1 ORDER BY label.requested_at DESC LIMIT 100`,
      [tenantId],
    ),
    query(
      `SELECT * FROM inventory_valuation_closures
       WHERE tenant_id=$1 ORDER BY closure_date DESC LIMIT 24`,
      [tenantId],
    ),
    query(
      `SELECT permission.*, warehouse.name warehouse_name, users.full_name user_name
       FROM warehouse_user_permissions permission
       JOIN warehouses warehouse ON warehouse.id=permission.warehouse_id
         AND warehouse.tenant_id=permission.tenant_id
       JOIN users ON users.id=permission.user_id
       WHERE permission.tenant_id=$1 ORDER BY warehouse.name, users.full_name`,
      [tenantId],
    ),
    query(
      `SELECT users.id, users.full_name, role.name role_name
       FROM tenant_users membership
       JOIN users ON users.id=membership.user_id
       JOIN roles role ON role.id=membership.role_id AND role.tenant_id=membership.tenant_id
       WHERE membership.tenant_id=$1 AND membership.status='ACTIVE'
       ORDER BY users.full_name`,
      [tenantId],
    ),
  ]);
  res.json({
    summary: summary.rows[0],
    locations: locations.rows,
    units: units.rows,
    variants: variants.rows,
    lots: lots.rows,
    serials: serials.rows,
    reservations: reservations.rows,
    labels: labels.rows,
    closures: closures.rows,
    permissions: permissions.rows,
    users: users.rows,
  });
}));

router.patch('/products/:id/tracking', asyncHandler(async (req, res) => {
  const productId = uuid(req.params.id, 'El producto no es válido.');
  const minimumStock = positive(
    req.body.minimumStock || 0,
    'El mínimo no es válido.',
    { allowZero: true },
  );
  const maximumStock = req.body.maximumStock === '' || req.body.maximumStock == null
    ? null
    : positive(req.body.maximumStock, 'El máximo no es válido.');
  if (maximumStock !== null && maximumStock <= minimumStock) {
    throw new AppError('El máximo debe ser mayor que el mínimo.', 422, 'INVALID_STOCK_POLICY');
  }
  const result = await query(
    `UPDATE products
     SET base_uom_id=COALESCE($3,base_uom_id),
         track_lots=$4,track_serials=$5,track_expiration=$6,
         warranty_days=$7,minimum_stock=$8,maximum_stock=$9,updated_at=now()
     WHERE id=$1 AND tenant_id=$2
       AND ($3::uuid IS NULL OR EXISTS(
         SELECT 1 FROM units_of_measure WHERE id=$3 AND tenant_id=$2
       ))
     RETURNING *`,
    [
      productId, req.context.tenantId,
      req.body.baseUomId ? uuid(req.body.baseUomId) : null,
      Boolean(req.body.trackLots), Boolean(req.body.trackSerials),
      Boolean(req.body.trackExpiration),
      Math.trunc(positive(req.body.warrantyDays || 0, 'La garantía no es válida.', { allowZero: true })),
      minimumStock, maximumStock,
    ],
  );
  if (!result.rowCount) throw new AppError('Producto o unidad fuera de la empresa.', 404, 'TRACKING_REFERENCE_NOT_FOUND');
  res.json(result.rows[0]);
}));

router.post('/locations', asyncHandler(async (req, res) => {
  const warehouseId = uuid(req.body.warehouseId, 'La bodega no es válida.');
  const code = clean(req.body.code, 40)?.toUpperCase();
  const name = clean(req.body.name, 160);
  const zoneType = clean(req.body.zoneType, 30)?.toUpperCase() || 'STORAGE';
  if (!code || !name || !ZONES.has(zoneType)) {
    throw new AppError('Código, nombre y tipo de zona son obligatorios.', 422, 'INVALID_LOCATION');
  }
  try {
    const result = await query(
      `INSERT INTO warehouse_locations(
         tenant_id,warehouse_id,code,name,zone_type,aisle,rack,level,position,sellable
       )
       SELECT $1,warehouse.id,$3,$4,$5,$6,$7,$8,$9,$10
       FROM warehouses warehouse WHERE warehouse.id=$2 AND warehouse.tenant_id=$1
       RETURNING *`,
      [
        req.context.tenantId, warehouseId, code, name, zoneType,
        clean(req.body.aisle, 40), clean(req.body.rack, 40),
        clean(req.body.level, 40), clean(req.body.position, 40),
        Boolean(req.body.sellable),
      ],
    );
    if (!result.rowCount) throw new AppError('La bodega no pertenece a la empresa.', 404, 'WAREHOUSE_NOT_FOUND');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new AppError('Ya existe esa ubicación en la bodega.', 409, 'LOCATION_EXISTS');
    throw error;
  }
}));

router.post('/units', asyncHandler(async (req, res) => {
  const code = clean(req.body.code, 20)?.toUpperCase();
  const name = clean(req.body.name, 100);
  const symbol = clean(req.body.symbol, 20);
  const category = clean(req.body.category, 20)?.toUpperCase() || 'UNIT';
  if (!code || !name || !symbol || !UOM_CATEGORIES.has(category)) {
    throw new AppError('La unidad de medida está incompleta.', 422, 'INVALID_UOM');
  }
  try {
    const result = await query(
      `INSERT INTO units_of_measure(
         tenant_id,code,name,symbol,category,dian_code,allows_decimals
       ) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.context.tenantId, code, name, symbol, category,
        clean(req.body.dianCode, 20), Boolean(req.body.allowsDecimals),
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new AppError('Ya existe esa unidad de medida.', 409, 'UOM_EXISTS');
    throw error;
  }
}));

router.post('/conversions', asyncHandler(async (req, res) => {
  const productId = uuid(req.body.productId, 'El producto no es válido.');
  const uomId = uuid(req.body.uomId, 'La unidad no es válida.');
  const factor = positive(req.body.conversionFactor, 'La conversión debe ser mayor que cero.');
  const result = await query(
    `INSERT INTO product_unit_conversions(
       tenant_id,product_id,uom_id,conversion_factor,purchase_enabled,
       sale_enabled,barcode,price
     )
     SELECT $1,product.id,unit.id,$4,$5,$6,$7,$8
     FROM products product
     JOIN units_of_measure unit ON unit.id=$3 AND unit.tenant_id=$1
     WHERE product.id=$2 AND product.tenant_id=$1
     ON CONFLICT(tenant_id,product_id,uom_id) DO UPDATE
     SET conversion_factor=EXCLUDED.conversion_factor,
         purchase_enabled=EXCLUDED.purchase_enabled,
         sale_enabled=EXCLUDED.sale_enabled,
         barcode=EXCLUDED.barcode, price=EXCLUDED.price, active=TRUE, updated_at=now()
     RETURNING *`,
    [
      req.context.tenantId, productId, uomId, factor,
      req.body.purchaseEnabled !== false, req.body.saleEnabled !== false,
      clean(req.body.barcode, 80),
      req.body.price === '' || req.body.price == null ? null :
        positive(req.body.price, 'El precio no es válido.', { allowZero: true }),
    ],
  );
  if (!result.rowCount) throw new AppError('El producto o unidad no pertenece a la empresa.', 404, 'CONVERSION_REFERENCE_NOT_FOUND');
  res.status(201).json(result.rows[0]);
}));

router.post('/variants', asyncHandler(async (req, res) => {
  const productId = uuid(req.body.productId, 'El producto no es válido.');
  const sku = clean(req.body.sku, 80)?.toUpperCase();
  const name = clean(req.body.name, 160);
  if (!sku || !name) throw new AppError('SKU y nombre de variante son obligatorios.', 422, 'INVALID_VARIANT');
  try {
    const result = await query(
      `INSERT INTO product_variants(
         tenant_id,product_id,sku,barcode,name,attributes,cost,sale_price
       )
       SELECT $1,product.id,$3,$4,$5,$6::jsonb,$7,$8
       FROM products product WHERE product.id=$2 AND product.tenant_id=$1
       RETURNING *`,
      [
        req.context.tenantId, productId, sku, clean(req.body.barcode, 80), name,
        JSON.stringify(req.body.attributes && typeof req.body.attributes === 'object'
          ? req.body.attributes : {}),
        req.body.cost == null || req.body.cost === '' ? null :
          positive(req.body.cost, 'El costo no es válido.', { allowZero: true }),
        req.body.salePrice == null || req.body.salePrice === '' ? null :
          positive(req.body.salePrice, 'El precio no es válido.', { allowZero: true }),
      ],
    );
    if (!result.rowCount) throw new AppError('El producto no pertenece a la empresa.', 404, 'PRODUCT_NOT_FOUND');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new AppError('El SKU o código de barras ya existe.', 409, 'VARIANT_EXISTS');
    throw error;
  }
}));

router.post('/lots', asyncHandler(async (req, res) => {
  const productId = uuid(req.body.productId, 'El producto no es válido.');
  const warehouseId = uuid(req.body.warehouseId, 'La bodega no es válida.');
  const lotNumber = clean(req.body.lotNumber, 80);
  const quantity = positive(req.body.quantity, 'La cantidad del lote no es válida.', { allowZero: true });
  const expirationDate = clean(req.body.expirationDate, 10);
  const manufacturingDate = clean(req.body.manufacturingDate, 10);
  if (!lotNumber || (expirationDate && !DATE.test(expirationDate)) ||
      (manufacturingDate && !DATE.test(manufacturingDate))) {
    throw new AppError('Número de lote o vencimiento no válido.', 422, 'INVALID_LOT');
  }
  if (manufacturingDate && expirationDate && manufacturingDate > expirationDate) {
    throw new AppError(
      'El vencimiento debe ser posterior a la fabricación.',
      422,
      'INVALID_LOT_DATES',
    );
  }
  const lot = await withTransaction(async (client) => {
    const references = await client.query(
      `SELECT
         EXISTS(SELECT 1 FROM products WHERE id=$2 AND tenant_id=$1) product_ok,
         EXISTS(SELECT 1 FROM warehouses WHERE id=$3 AND tenant_id=$1) warehouse_ok,
         ($4::uuid IS NULL OR EXISTS(
           SELECT 1 FROM warehouse_locations
           WHERE id=$4 AND tenant_id=$1 AND warehouse_id=$3
         )) location_ok`,
      [
        req.context.tenantId,
        productId,
        warehouseId,
        req.body.locationId ? uuid(req.body.locationId) : null,
      ],
    );
    if (!references.rows[0].product_ok ||
        !references.rows[0].warehouse_ok ||
        !references.rows[0].location_ok) {
      throw new AppError(
        'Producto, bodega o ubicación fuera de la empresa activa.',
        404,
        'LOT_REFERENCE_NOT_FOUND',
      );
    }
    const result = await client.query(
      `INSERT INTO inventory_lots(
         tenant_id,product_id,warehouse_id,location_id,lot_number,
         manufacturing_date,expiration_date,on_hand,unit_cost,status,supplier_id
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'AVAILABLE',$10)
       RETURNING *`,
      [
        req.context.tenantId, productId, warehouseId,
        req.body.locationId ? uuid(req.body.locationId) : null,
        lotNumber, manufacturingDate, expirationDate,
        quantity, positive(req.body.unitCost || 0, 'El costo no es válido.', { allowZero: true }),
        req.body.supplierId ? uuid(req.body.supplierId) : null,
      ],
    );
    if (quantity > 0) {
      const balance = await client.query(
        `SELECT on_hand FROM inventory_balances
         WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3 FOR UPDATE`,
        [req.context.tenantId, productId, warehouseId],
      );
      const unassigned = Number(balance.rows[0]?.on_hand || 0) -
        Number((await client.query(
          `SELECT COALESCE(SUM(on_hand),0) total FROM inventory_lots
           WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3 AND id<>$4`,
          [req.context.tenantId, productId, warehouseId, result.rows[0].id],
        )).rows[0].total);
      if (unassigned < quantity) {
        throw new AppError(
          'El lote supera las existencias sin lote de esa bodega.',
          409,
          'LOT_EXCEEDS_UNASSIGNED_STOCK',
        );
      }
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'inventory.lot_created', entityType: 'inventory_lot',
      entityId: result.rows[0].id, after: result.rows[0],
      reason: clean(req.body.reason, 500) || 'Asignación de lote',
    });
    return result.rows[0];
  });
  res.status(201).json(lot);
}));

router.post('/serials', asyncHandler(async (req, res) => {
  const serialNumber = clean(req.body.serialNumber, 120);
  const warrantyUntil = clean(req.body.warrantyUntil, 10);
  if (!serialNumber) {
    throw new AppError('El número de serie es obligatorio.', 422, 'SERIAL_NUMBER_REQUIRED');
  }
  if (warrantyUntil && !DATE.test(warrantyUntil)) {
    throw new AppError('La fecha de garantía no es válida.', 422, 'INVALID_WARRANTY_DATE');
  }
  const productId = uuid(req.body.productId, 'El producto no es válido.');
  const warehouseId = uuid(req.body.warehouseId, 'La bodega no es válida.');
  const locationId = req.body.locationId ? uuid(req.body.locationId) : null;
  const lotId = req.body.lotId ? uuid(req.body.lotId) : null;
  try {
    const result = await query(
      `INSERT INTO inventory_serial_numbers(
         tenant_id,product_id,warehouse_id,location_id,lot_id,serial_number,
         warranty_until,notes
       )
       SELECT $1,product.id,warehouse.id,$4,$5,$6,$7,$8
       FROM products product
       JOIN warehouses warehouse ON warehouse.id=$3 AND warehouse.tenant_id=$1
       WHERE product.id=$2 AND product.tenant_id=$1
         AND ($4::uuid IS NULL OR EXISTS(
           SELECT 1 FROM warehouse_locations
           WHERE id=$4 AND tenant_id=$1 AND warehouse_id=$3
         ))
         AND ($5::uuid IS NULL OR EXISTS(
           SELECT 1 FROM inventory_lots
           WHERE id=$5 AND tenant_id=$1 AND warehouse_id=$3 AND product_id=$2
         ))
       RETURNING *`,
      [
        req.context.tenantId, productId, warehouseId, locationId, lotId,
        serialNumber, warrantyUntil, clean(req.body.notes, 500),
      ],
    );
    if (!result.rowCount) {
      throw new AppError(
        'Producto, bodega, ubicación o lote fuera de la empresa.',
        404,
        'SERIAL_REFERENCE_NOT_FOUND',
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Ese número de serie ya está registrado.', 409, 'SERIAL_EXISTS');
    }
    throw error;
  }
}));

router.post('/reservations', asyncHandler(async (req, res) => {
  const productId = uuid(req.body.productId, 'El producto no es válido.');
  const warehouseId = uuid(req.body.warehouseId, 'La bodega no es válida.');
  const quantity = positive(req.body.quantity, 'La cantidad reservada no es válida.');
  const referenceType = clean(req.body.referenceType, 40)?.toUpperCase();
  const referenceId = clean(req.body.referenceId, 120);
  if (!referenceType || !referenceId) throw new AppError('La reserva necesita una referencia.', 422, 'RESERVATION_REFERENCE_REQUIRED');
  const reservation = await withTransaction(async (client) => {
    const balance = await client.query(
      `UPDATE inventory_balances
       SET reserved=reserved+$4, updated_at=now()
       WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3
         AND on_hand-reserved >= $4
       RETURNING *`,
      [req.context.tenantId, productId, warehouseId, quantity],
    );
    if (!balance.rowCount) throw new AppError('No hay disponibilidad suficiente para reservar.', 409, 'INSUFFICIENT_AVAILABLE_STOCK');
    const result = await client.query(
      `INSERT INTO inventory_reservations(
         tenant_id,product_id,warehouse_id,lot_id,quantity,
         reference_type,reference_id,expires_at,notes,created_by
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.context.tenantId, productId, warehouseId,
        req.body.lotId ? uuid(req.body.lotId) : null,
        quantity, referenceType, referenceId, req.body.expiresAt || null,
        clean(req.body.notes, 500), req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId, userId: req.context.userId,
      action: 'inventory.reserved', entityType: 'inventory_reservation',
      entityId: result.rows[0].id, after: result.rows[0],
      reason: clean(req.body.notes, 500) || 'Reserva operativa',
    });
    return result.rows[0];
  });
  res.status(201).json(reservation);
}));

router.post('/reservations/:id/release', asyncHandler(async (req, res) => {
  uuid(req.params.id, 'La reserva no es válida.');
  const released = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM inventory_reservations
       WHERE id=$1 AND tenant_id=$2 AND status='ACTIVE' FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!current.rowCount) throw new AppError('La reserva no está activa.', 409, 'RESERVATION_NOT_ACTIVE');
    const item = current.rows[0];
    await client.query(
      `UPDATE inventory_balances SET reserved=GREATEST(reserved-$4,0),updated_at=now()
       WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3`,
      [req.context.tenantId, item.product_id, item.warehouse_id, item.quantity],
    );
    const result = await client.query(
      `UPDATE inventory_reservations
       SET status='RELEASED',released_by=$3,released_at=now()
       WHERE id=$1 AND tenant_id=$2 RETURNING *`,
      [req.params.id, req.context.tenantId, req.context.userId],
    );
    return result.rows[0];
  });
  res.json(released);
}));

router.post('/labels', asyncHandler(async (req, res) => {
  const type = clean(req.body.labelType, 20)?.toUpperCase();
  if (!['PRODUCT','PRICE','LOCATION','LOT','SERIAL'].includes(type)) {
    throw new AppError('El tipo de etiqueta no es válido.', 422, 'INVALID_LABEL_TYPE');
  }
  const quantity = Math.trunc(positive(req.body.quantity || 1, 'La cantidad no es válida.'));
  if (quantity > 1000) {
    throw new AppError('Puedes preparar máximo 1.000 etiquetas por solicitud.', 422, 'LABEL_LIMIT_EXCEEDED');
  }
  const result = await query(
    `INSERT INTO inventory_label_jobs(
       tenant_id,product_id,variant_id,lot_id,serial_id,label_type,
       quantity,barcode_value,requested_by
     ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      req.context.tenantId, uuid(req.body.productId, 'El producto no es válido.'),
      req.body.variantId ? uuid(req.body.variantId) : null,
      req.body.lotId ? uuid(req.body.lotId) : null,
      req.body.serialId ? uuid(req.body.serialId) : null,
      type, quantity,
      clean(req.body.barcodeValue, 160), req.context.userId,
    ],
  );
  res.status(201).json(result.rows[0]);
}));

router.put('/warehouse-permissions', asyncHandler(async (req, res) => {
  const result = await query(
    `INSERT INTO warehouse_user_permissions(
       tenant_id,warehouse_id,user_id,can_view,can_adjust,can_dispatch,
       can_receive,can_sell,granted_by
     )
     SELECT $1,warehouse.id,membership.user_id,$4,$5,$6,$7,$8,$9
     FROM warehouses warehouse
     JOIN tenant_users membership ON membership.user_id=$3
       AND membership.tenant_id=$1 AND membership.status='ACTIVE'
     WHERE warehouse.id=$2 AND warehouse.tenant_id=$1
     ON CONFLICT(tenant_id,warehouse_id,user_id) DO UPDATE
     SET can_view=EXCLUDED.can_view,can_adjust=EXCLUDED.can_adjust,
         can_dispatch=EXCLUDED.can_dispatch,can_receive=EXCLUDED.can_receive,
         can_sell=EXCLUDED.can_sell,granted_by=EXCLUDED.granted_by,updated_at=now()
     RETURNING *`,
    [
      req.context.tenantId, uuid(req.body.warehouseId), uuid(req.body.userId),
      req.body.canView !== false, Boolean(req.body.canAdjust),
      Boolean(req.body.canDispatch), Boolean(req.body.canReceive),
      Boolean(req.body.canSell), req.context.userId,
    ],
  );
  if (!result.rowCount) throw new AppError('Usuario o bodega fuera de la empresa.', 404, 'WAREHOUSE_ACCESS_REFERENCE_NOT_FOUND');
  res.json(result.rows[0]);
}));

router.post('/valuation-closures', asyncHandler(async (req, res) => {
  const closureDate = clean(req.body.closureDate, 10);
  if (!DATE.test(closureDate || '')) throw new AppError('La fecha de cierre no es válida.', 422, 'INVALID_CLOSURE_DATE');
  try {
    const closure = await withTransaction(async (client) => {
      const header = await client.query(
      `INSERT INTO inventory_valuation_closures(
         tenant_id,closure_date,valuation_method,notes,closed_by
       ) VALUES($1,$2,'WEIGHTED_AVERAGE',$3,$4) RETURNING *`,
      [req.context.tenantId, closureDate, clean(req.body.notes, 500), req.context.userId],
    );
    await client.query(
      `INSERT INTO inventory_valuation_lines(
         tenant_id,closure_id,product_id,warehouse_id,quantity,unit_cost,total_value
       )
       SELECT balance.tenant_id,$2,balance.product_id,balance.warehouse_id,
              balance.on_hand,product.cost,ROUND(balance.on_hand*product.cost,2)
       FROM inventory_balances balance
       JOIN products product ON product.id=balance.product_id AND product.tenant_id=balance.tenant_id
       WHERE balance.tenant_id=$1 AND balance.on_hand<>0`,
      [req.context.tenantId, header.rows[0].id],
    );
    const totals = await client.query(
      `UPDATE inventory_valuation_closures closure
       SET total_units=lines.units,total_value=lines.value
       FROM (
         SELECT closure_id,SUM(quantity) units,SUM(total_value) value
         FROM inventory_valuation_lines WHERE closure_id=$1 GROUP BY closure_id
       ) lines
       WHERE closure.id=lines.closure_id RETURNING closure.*`,
      [header.rows[0].id],
    );
    const saved = totals.rows[0] || header.rows[0];
    await writeAudit(client, {
      tenantId: req.context.tenantId,userId:req.context.userId,
      action:'inventory.valuation_closed',entityType:'inventory_valuation_closure',
      entityId:saved.id,after:saved,reason:clean(req.body.notes,500)||'Cierre de valoración',
    });
      return saved;
    });
    res.status(201).json(closure);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Ya existe un cierre valorizado para esa fecha.',
        409,
        'VALUATION_CLOSURE_EXISTS',
      );
    }
    throw error;
  }
}));

export default router;
