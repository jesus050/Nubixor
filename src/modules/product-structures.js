import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { requirePermission } from '../authorization.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.use(requireTenant);

function uuid(value, message = 'La referencia no es válida.') {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new AppError(message, 422, 'INVALID_PRODUCT_STRUCTURE_REFERENCE');
  }
  return value;
}

function clean(value, max = 200) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > max) {
    throw new AppError(
      `El texto supera ${max} caracteres.`,
      422,
      'PRODUCT_STRUCTURE_TEXT_TOO_LONG',
    );
  }
  return normalized;
}

function positive(value, message, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new AppError(message, 422, 'INVALID_PRODUCT_STRUCTURE_QUANTITY');
  }
  return number;
}

async function getProduct(client, tenantId, productId, { lock = false } = {}) {
  uuid(productId, 'El producto no es válido.');
  const result = await client.query(
    `SELECT *
     FROM products
     WHERE tenant_id=$1 AND id=$2 AND deleted_at IS NULL
     ${lock ? 'FOR UPDATE' : ''}`,
    [tenantId, productId],
  );
  if (!result.rowCount) {
    throw new AppError('El producto no existe.', 404, 'PRODUCT_NOT_FOUND');
  }
  return result.rows[0];
}

router.get(
  '/combos',
  requirePermission('catalog.manage'),
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT product.id,product.name,product.sku,product.sale_price,
              product.active,product.tax_review_status,
              tax.name tax_name,tax.rate tax_rate,
              COALESCE(component.component_count,0) component_count,
              COALESCE(stock.display_stock,0) display_stock,
              COALESCE(stock.warehouse_stock,0) warehouse_stock,
              COALESCE(stock.total_stock,0) total_stock,
              COALESCE(stock.stock_by_warehouse,'[]'::jsonb) stock_by_warehouse
       FROM products product
       LEFT JOIN tax_categories tax
         ON tax.tenant_id=product.tenant_id
        AND tax.id=product.sales_tax_category_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::integer component_count
         FROM product_combo_components
         WHERE tenant_id=product.tenant_id
           AND combo_product_id=product.id
       ) component ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(balance.on_hand)
             FILTER (WHERE warehouse.warehouse_type='DISPLAY'),0) display_stock,
           COALESCE(SUM(balance.on_hand)
             FILTER (WHERE warehouse.warehouse_type='AVAILABLE'),0) warehouse_stock,
           COALESCE(SUM(balance.on_hand),0) total_stock,
           COALESCE(
             jsonb_agg(jsonb_build_object(
               'warehouseId',warehouse.id,
               'warehouseName',warehouse.name,
               'warehouseType',warehouse.warehouse_type,
               'onHand',balance.on_hand
             )) FILTER (WHERE warehouse.id IS NOT NULL),
             '[]'::jsonb
           ) stock_by_warehouse
         FROM inventory_balances balance
         JOIN warehouses warehouse
           ON warehouse.tenant_id=balance.tenant_id
          AND warehouse.id=balance.warehouse_id
         WHERE balance.tenant_id=product.tenant_id
           AND balance.product_id=product.id
       ) stock ON TRUE
       WHERE product.tenant_id=$1 AND product.deleted_at IS NULL
         AND product.product_kind='COMBO'
       ORDER BY product.name`,
      [req.context.tenantId],
    );
    res.json(result.rows.map((combo) => ({
      ...combo,
      sale_ready: combo.active &&
        combo.tax_review_status === 'REVIEWED' &&
        Number(combo.component_count) > 0 &&
        Number(combo.total_stock) > 0,
      cashier_ready: combo.active &&
        combo.tax_review_status === 'REVIEWED' &&
        Number(combo.component_count) > 0 &&
        Number(combo.display_stock) > 0,
    })));
  }),
);

router.get(
  '/:productId',
  requirePermission('catalog.manage'),
  asyncHandler(async (req, res) => {
    const result = await withTransaction(async (client) => {
      const product = await getProduct(
        client,
        req.context.tenantId,
        req.params.productId,
      );
      const [variants, components, assemblies] = await Promise.all([
        client.query(
          `SELECT child.*,
                  COALESCE(stock.total,0) total_stock
           FROM products child
           LEFT JOIN LATERAL (
             SELECT SUM(balance.on_hand) total
             FROM inventory_balances balance
             WHERE balance.tenant_id=child.tenant_id
               AND balance.product_id=child.id
           ) stock ON TRUE
           WHERE child.tenant_id=$1 AND child.parent_product_id=$2
             AND child.deleted_at IS NULL
           ORDER BY child.name`,
          [req.context.tenantId, product.id],
        ),
        client.query(
          `SELECT component.*, product.name product_name,product.sku,
                  product.product_kind
           FROM product_combo_components component
           JOIN products product
             ON product.tenant_id=component.tenant_id
            AND product.id=component.component_product_id
           WHERE component.tenant_id=$1 AND component.combo_product_id=$2
           ORDER BY product.name`,
          [req.context.tenantId, product.id],
        ),
        client.query(
          `SELECT assembly.*,warehouse.name warehouse_name,
                  users.full_name created_by_name
           FROM product_combo_assemblies assembly
           JOIN warehouses warehouse
             ON warehouse.tenant_id=assembly.tenant_id
            AND warehouse.id=assembly.warehouse_id
           LEFT JOIN users ON users.id=assembly.created_by
           WHERE assembly.tenant_id=$1 AND assembly.combo_product_id=$2
           ORDER BY assembly.created_at DESC
           LIMIT 20`,
          [req.context.tenantId, product.id],
        ),
      ]);
      return {
        product,
        variants: variants.rows,
        components: components.rows,
        assemblies: assemblies.rows,
      };
    });
    res.json(result);
  }),
);

router.post(
  '/:productId/variants',
  requirePermission('catalog.manage'),
  asyncHandler(async (req, res) => {
    const optionName = clean(req.body.optionName, 80);
    const optionValue = clean(req.body.optionValue, 120);
    const sku = clean(req.body.sku, 60)?.toUpperCase();
    const barcode = clean(req.body.barcode, 80);
    const warehouseId = req.body.warehouseId
      ? uuid(req.body.warehouseId, 'La bodega no es válida.')
      : null;
    const initialQuantity = req.body.initialQuantity == null ||
      req.body.initialQuantity === ''
      ? 0
      : positive(req.body.initialQuantity, 'La cantidad inicial no es válida.', {
        allowZero: true,
      });
    if (!optionName || !optionValue || !sku || (initialQuantity > 0 && !warehouseId)) {
      throw new AppError(
        'Indica atributo, opción, SKU y bodega cuando transfieras existencias.',
        422,
        'INVALID_PRODUCT_VARIANT',
      );
    }
    const created = await withTransaction(async (client) => {
      const parent = await getProduct(
        client,
        req.context.tenantId,
        req.params.productId,
        { lock: true },
      );
      if (parent.product_kind === 'COMBO' || parent.product_kind === 'VARIANT') {
        throw new AppError(
          'Un combo o una variante no puede convertirse en producto principal.',
          409,
          'INVALID_VARIANT_PARENT',
        );
      }
      const duplicatedOption = await client.query(
        `SELECT 1
         FROM products
         WHERE tenant_id=$1 AND parent_product_id=$2 AND deleted_at IS NULL
           AND variant_attributes @> $3::jsonb
         LIMIT 1`,
        [
          req.context.tenantId,
          parent.id,
          JSON.stringify({ [optionName]: optionValue }),
        ],
      );
      if (duplicatedOption.rowCount) {
        throw new AppError(
          `La opción ${optionName}: ${optionValue} ya existe.`,
          409,
          'PRODUCT_VARIANT_OPTION_EXISTS',
        );
      }
      const result = await client.query(
        `INSERT INTO products(
           tenant_id,sku,barcode,name,category_id,brand_id,
           sales_tax_category_id,cost,sale_price,tax_review_status,active,
           product_kind,parent_product_id,variant_attributes,metadata
         )
         VALUES(
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,
           'VARIANT',$11,$12::jsonb,
           jsonb_build_object('source','PRODUCT_VARIANT')
         )
         RETURNING *`,
        [
          req.context.tenantId,
          sku,
          barcode,
          `${parent.name} · ${optionValue}`,
          parent.category_id,
          parent.brand_id,
          parent.sales_tax_category_id,
          req.body.cost == null || req.body.cost === ''
            ? parent.cost
            : positive(req.body.cost, 'El costo no es válido.', { allowZero: true }),
          req.body.salePrice == null || req.body.salePrice === ''
            ? parent.sale_price
            : positive(req.body.salePrice, 'El precio no es válido.', {
              allowZero: true,
            }),
          parent.tax_review_status,
          parent.id,
          JSON.stringify({ [optionName]: optionValue }),
        ],
      );
      const variant = result.rows[0];
      await client.query(
        `UPDATE products
         SET product_kind='VARIANT_PARENT',active=FALSE,updated_at=now()
         WHERE tenant_id=$1 AND id=$2`,
        [req.context.tenantId, parent.id],
      );
      if (initialQuantity > 0) {
        const source = await client.query(
          `UPDATE inventory_balances
           SET on_hand=on_hand-$1,updated_at=now()
           WHERE tenant_id=$2 AND product_id=$3 AND warehouse_id=$4
             AND on_hand-reserved >= $1
           RETURNING on_hand`,
          [initialQuantity, req.context.tenantId, parent.id, warehouseId],
        );
        if (!source.rowCount) {
          throw new AppError(
            'El producto principal no tiene suficientes unidades libres para asignarlas.',
            409,
            'VARIANT_SOURCE_STOCK_INSUFFICIENT',
          );
        }
        await client.query(
          `INSERT INTO inventory_balances(tenant_id,product_id,warehouse_id,on_hand)
           VALUES($1,$2,$3,$4)
           ON CONFLICT(tenant_id,product_id,warehouse_id) DO UPDATE
           SET on_hand=inventory_balances.on_hand+EXCLUDED.on_hand,updated_at=now()`,
          [req.context.tenantId, variant.id, warehouseId, initialQuantity],
        );
        for (const movement of [
          [parent.id, -initialQuantity, parent.cost, 'Salida para separar variante'],
          [variant.id, initialQuantity, variant.cost, 'Entrada de variante separada'],
        ]) {
          await client.query(
            `INSERT INTO inventory_movements(
               tenant_id,product_id,warehouse_id,movement_type,quantity,
               unit_cost,reference_type,reference_id,reason,created_by
             ) VALUES($1,$2,$3,'VARIANT_SPLIT',$4,$5,'PRODUCT_VARIANT',$6,$7,$8)`,
            [
              req.context.tenantId,
              movement[0],
              warehouseId,
              movement[1],
              movement[2],
              variant.id,
              movement[3],
              req.context.userId,
            ],
          );
        }
      }
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'product.variant.created',
        entityType: 'product',
        entityId: variant.id,
        before: parent,
        after: variant,
        reason: `Variante ${optionName}: ${optionValue}`,
      });
      return variant;
    }).catch((error) => {
      if (error.code === '23505') {
        throw new AppError(
          'El SKU o código de barras ya está siendo usado.',
          409,
          'PRODUCT_VARIANT_EXISTS',
        );
      }
      throw error;
    });
    res.status(201).json(created);
  }),
);

router.put(
  '/:productId/combo',
  requirePermission('catalog.manage'),
  asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body.components) || !req.body.components.length ||
        req.body.components.length > 50) {
      throw new AppError(
        'Agrega entre 1 y 50 componentes.',
        422,
        'INVALID_COMBO_COMPONENTS',
      );
    }
    const consolidated = new Map();
    for (const component of req.body.components) {
      const productId = uuid(component.productId, 'Un componente no es válido.');
      const quantity = positive(
        component.quantity,
        'La cantidad del componente no es válida.',
      );
      consolidated.set(productId, (consolidated.get(productId) || 0) + quantity);
    }
    const saved = await withTransaction(async (client) => {
      const combo = await getProduct(
        client,
        req.context.tenantId,
        req.params.productId,
        { lock: true },
      );
      if (combo.product_kind === 'VARIANT' ||
          combo.product_kind === 'VARIANT_PARENT' ||
          consolidated.has(combo.id)) {
        throw new AppError(
          'El producto elegido no puede configurarse como combo.',
          409,
          'INVALID_COMBO_PRODUCT',
        );
      }
      const components = await client.query(
        `SELECT id,name,sku,product_kind,active
         FROM products
         WHERE tenant_id=$1 AND id=ANY($2::uuid[]) AND deleted_at IS NULL
         FOR SHARE`,
        [req.context.tenantId, [...consolidated.keys()]],
      );
      if (components.rowCount !== consolidated.size ||
          components.rows.some((item) =>
            !item.active || ['COMBO', 'VARIANT_PARENT'].includes(item.product_kind))) {
        throw new AppError(
          'Usa productos o variantes activos; no se permiten combos anidados.',
          409,
          'INVALID_COMBO_COMPONENT',
        );
      }
      await client.query(
        `DELETE FROM product_combo_components
         WHERE tenant_id=$1 AND combo_product_id=$2`,
        [req.context.tenantId, combo.id],
      );
      for (const [componentId, quantity] of consolidated) {
        await client.query(
          `INSERT INTO product_combo_components(
             tenant_id,combo_product_id,component_product_id,quantity
           ) VALUES($1,$2,$3,$4)`,
          [req.context.tenantId, combo.id, componentId, quantity],
        );
      }
      const result = await client.query(
        `UPDATE products
         SET product_kind='COMBO',active=TRUE,updated_at=now()
         WHERE tenant_id=$1 AND id=$2
         RETURNING *`,
        [req.context.tenantId, combo.id],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'product.combo.configured',
        entityType: 'product',
        entityId: combo.id,
        before: combo,
        after: {
          ...result.rows[0],
          components: [...consolidated].map(([productId, quantity]) => ({
            productId,
            quantity,
          })),
        },
        reason: 'Configuración de composición del combo',
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);

router.post(
  '/:productId/combo/assemble',
  requirePermission('catalog.manage'),
  asyncHandler(async (req, res) => {
    const warehouseId = uuid(req.body.warehouseId, 'La bodega no es válida.');
    const quantity = positive(req.body.quantity, 'La cantidad a armar no es válida.');
    const assembled = await withTransaction(async (client) => {
      const combo = await getProduct(
        client,
        req.context.tenantId,
        req.params.productId,
        { lock: true },
      );
      if (combo.product_kind !== 'COMBO') {
        throw new AppError(
          'Configura primero los componentes del combo.',
          409,
          'PRODUCT_NOT_COMBO',
        );
      }
      const warehouse = await client.query(
        `SELECT id FROM warehouses
         WHERE tenant_id=$1 AND id=$2 AND active=TRUE
         FOR SHARE`,
        [req.context.tenantId, warehouseId],
      );
      if (!warehouse.rowCount) {
        throw new AppError(
          'La bodega no pertenece a la empresa.',
          404,
          'WAREHOUSE_NOT_FOUND',
        );
      }
      const components = await client.query(
        `SELECT component.component_product_id product_id,
                component.quantity component_quantity,
                product.name,product.sku,product.cost
         FROM product_combo_components component
         JOIN products product
           ON product.tenant_id=component.tenant_id
          AND product.id=component.component_product_id
         WHERE component.tenant_id=$1 AND component.combo_product_id=$2
         ORDER BY product.id
         FOR SHARE OF product`,
        [req.context.tenantId, combo.id],
      );
      if (!components.rowCount) {
        throw new AppError(
          'El combo no tiene componentes.',
          409,
          'EMPTY_COMBO',
        );
      }
      const snapshot = [];
      let assembledCost = 0;
      for (const component of components.rows) {
        const required = Number(component.component_quantity) * quantity;
        const balance = await client.query(
          `UPDATE inventory_balances
           SET on_hand=on_hand-$1,updated_at=now()
           WHERE tenant_id=$2 AND product_id=$3 AND warehouse_id=$4
             AND on_hand-reserved >= $1
           RETURNING on_hand`,
          [required, req.context.tenantId, component.product_id, warehouseId],
        );
        if (!balance.rowCount) {
          throw new AppError(
            `No hay suficientes unidades de ${component.name}.`,
            409,
            'COMBO_COMPONENT_STOCK_INSUFFICIENT',
          );
        }
        assembledCost += Number(component.cost) *
          Number(component.component_quantity);
        snapshot.push({
          productId: component.product_id,
          sku: component.sku,
          name: component.name,
          quantityPerCombo: Number(component.component_quantity),
          totalUsed: required,
        });
        await client.query(
          `INSERT INTO inventory_movements(
             tenant_id,product_id,warehouse_id,movement_type,quantity,
             unit_cost,reference_type,reference_id,reason,created_by
           ) VALUES($1,$2,$3,'COMBO_COMPONENT_OUT',$4,$5,
                    'COMBO_ASSEMBLY',$6,$7,$8)`,
          [
            req.context.tenantId,
            component.product_id,
            warehouseId,
            -required,
            component.cost,
            combo.id,
            `Componente usado para armar ${combo.name}`,
            req.context.userId,
          ],
        );
      }
      const assembly = await client.query(
        `INSERT INTO product_combo_assemblies(
           tenant_id,combo_product_id,warehouse_id,quantity,
           component_snapshot,created_by
         ) VALUES($1,$2,$3,$4,$5::jsonb,$6)
         RETURNING *`,
        [
          req.context.tenantId,
          combo.id,
          warehouseId,
          quantity,
          JSON.stringify(snapshot),
          req.context.userId,
        ],
      );
      await client.query(
        `INSERT INTO inventory_balances(tenant_id,product_id,warehouse_id,on_hand)
         VALUES($1,$2,$3,$4)
         ON CONFLICT(tenant_id,product_id,warehouse_id) DO UPDATE
         SET on_hand=inventory_balances.on_hand+EXCLUDED.on_hand,updated_at=now()`,
        [req.context.tenantId, combo.id, warehouseId, quantity],
      );
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id,product_id,warehouse_id,movement_type,quantity,
           unit_cost,reference_type,reference_id,reason,created_by
         ) VALUES($1,$2,$3,'COMBO_ASSEMBLY',$4,$5,
                  'COMBO_ASSEMBLY',$6,$7,$8)`,
        [
          req.context.tenantId,
          combo.id,
          warehouseId,
          quantity,
          assembledCost,
          assembly.rows[0].id,
          `Combo armado con ${components.rowCount} componente(s)`,
          req.context.userId,
        ],
      );
      await client.query(
        `UPDATE products SET cost=$3,updated_at=now()
         WHERE tenant_id=$1 AND id=$2`,
        [req.context.tenantId, combo.id, assembledCost],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'product.combo.assembled',
        entityType: 'product_combo_assembly',
        entityId: assembly.rows[0].id,
        after: { ...assembly.rows[0], components: snapshot, assembledCost },
        reason: `Armado de ${quantity} unidad(es) de ${combo.name}`,
      });
      return {
        ...assembly.rows[0],
        components: snapshot,
        unitCost: assembledCost,
      };
    });
    res.status(201).json(assembled);
  }),
);

export default router;
