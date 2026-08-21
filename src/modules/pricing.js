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
router.use(requirePermission('catalog.manage'));

function id(value, message = 'La referencia no es válida.') {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new AppError(message, 422, 'INVALID_PRICING_REFERENCE');
  }
  return value;
}

function text(value, max = 160) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  if (!result) return null;
  if (result.length > max) {
    throw new AppError(
      `El texto supera ${max} caracteres.`,
      422,
      'PRICING_TEXT_TOO_LONG',
    );
  }
  return result;
}

function positive(value, message, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new AppError(message, 422, 'INVALID_PRICING_VALUE');
  }
  return number;
}

router.get('/overview', asyncHandler(async (req, res) => {
  const tenantId = req.context.tenantId;
  const [lists, prices, promotions, products, customers] = await Promise.all([
    query(
      `SELECT * FROM sales_price_lists
       WHERE tenant_id=$1 AND active=TRUE
       ORDER BY priority,name`,
      [tenantId],
    ),
    query(
      `SELECT price.*,list.name price_list_name,list.code price_list_code,
              product.name product_name,product.sku
       FROM sales_product_prices price
       JOIN sales_price_lists list
         ON list.tenant_id=price.tenant_id AND list.id=price.price_list_id
       JOIN products product
         ON product.tenant_id=price.tenant_id AND product.id=price.product_id
       WHERE price.tenant_id=$1 AND price.active=TRUE
         AND product.deleted_at IS NULL
       ORDER BY product.name,list.priority,price.min_quantity`,
      [tenantId],
    ),
    query(
      `SELECT promotion.*,product.name product_name,product.sku,
              CASE
                WHEN promotion.active=FALSE THEN 'INACTIVE'
                WHEN now()<promotion.starts_at THEN 'SCHEDULED'
                WHEN now()>promotion.ends_at THEN 'EXPIRED'
                ELSE 'ACTIVE'
              END status
       FROM sales_promotions promotion
       JOIN products product
         ON product.tenant_id=promotion.tenant_id
        AND product.id=promotion.product_id
       WHERE promotion.tenant_id=$1 AND product.deleted_at IS NULL
       ORDER BY promotion.starts_at DESC,promotion.created_at DESC`,
      [tenantId],
    ),
    query(
      `SELECT product.id,product.name,product.sku,product.cost,product.sale_price,
              product.product_kind,product.active,COALESCE(tax.rate, 0) tax_rate
       FROM products product
       LEFT JOIN tax_categories tax
         ON tax.id = product.sales_tax_category_id AND tax.tenant_id = product.tenant_id
       WHERE product.tenant_id=$1 AND product.deleted_at IS NULL
         AND product.product_kind <> 'VARIANT_PARENT'
       ORDER BY product.name`,
      [tenantId],
    ),
    query(
      `SELECT customer.id,customer.name,customer.document_number,
              customer.sales_price_list_id,list.name price_list_name
       FROM customers customer
       LEFT JOIN sales_price_lists list
         ON list.tenant_id=customer.tenant_id
        AND list.id=customer.sales_price_list_id
       WHERE customer.tenant_id=$1 AND customer.active=TRUE
       ORDER BY customer.name`,
      [tenantId],
    ),
  ]);
  res.json({
    lists: lists.rows,
    prices: prices.rows,
    promotions: promotions.rows,
    products: products.rows,
    customers: customers.rows,
  });
}));

router.put('/product-prices', asyncHandler(async (req, res) => {
  const priceListId = id(req.body.priceListId, 'La lista de precios no es válida.');
  const productId = id(req.body.productId, 'El producto no es válido.');
  const minQuantity = positive(
    req.body.minQuantity,
    'La cantidad mínima debe ser mayor que cero.',
  );
  const unitPrice = positive(
    req.body.unitPrice,
    'El precio no es válido.',
    { allowZero: true },
  );
  const saved = await withTransaction(async (client) => {
    const valid = await client.query(
      `SELECT
         EXISTS(SELECT 1 FROM sales_price_lists
           WHERE tenant_id=$1 AND id=$2 AND active=TRUE) list_ok,
         EXISTS(SELECT 1 FROM products
           WHERE tenant_id=$1 AND id=$3 AND deleted_at IS NULL
             AND product_kind <> 'VARIANT_PARENT') product_ok`,
      [req.context.tenantId, priceListId, productId],
    );
    if (!valid.rows[0].list_ok || !valid.rows[0].product_ok) {
      throw new AppError(
        'La lista o el producto no pertenece a esta empresa.',
        422,
        'INVALID_PRODUCT_PRICE_SCOPE',
      );
    }
    const before = await client.query(
      `SELECT * FROM sales_product_prices
       WHERE tenant_id=$1 AND price_list_id=$2 AND product_id=$3
         AND min_quantity=$4`,
      [req.context.tenantId, priceListId, productId, minQuantity],
    );
    const result = await client.query(
      `INSERT INTO sales_product_prices(
         tenant_id,price_list_id,product_id,min_quantity,unit_price
       ) VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(tenant_id,price_list_id,product_id,min_quantity)
       DO UPDATE SET unit_price=EXCLUDED.unit_price,active=TRUE,updated_at=now()
       RETURNING *`,
      [req.context.tenantId, priceListId, productId, minQuantity, unitPrice],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'pricing.product_price.saved',
      entityType: 'sales_product_price',
      entityId: result.rows[0].id,
      before: before.rows[0] || null,
      after: result.rows[0],
      reason: `Precio desde ${minQuantity} unidad(es)`,
    });
    return result.rows[0];
  });
  res.json(saved);
}));

router.delete('/product-prices/:priceId', asyncHandler(async (req, res) => {
  const priceId = id(req.params.priceId, 'El precio no es válido.');
  const removed = await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE sales_product_prices SET active=FALSE,updated_at=now()
       WHERE tenant_id=$1 AND id=$2 AND active=TRUE
       RETURNING *`,
      [req.context.tenantId, priceId],
    );
    if (!result.rowCount) {
      throw new AppError('El precio no existe.', 404, 'PRODUCT_PRICE_NOT_FOUND');
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'pricing.product_price.disabled',
      entityType: 'sales_product_price',
      entityId: result.rows[0].id,
      before: result.rows[0],
      after: { ...result.rows[0], active: false },
      reason: 'Escala de precio desactivada',
    });
    return result.rows[0];
  });
  res.json(removed);
}));

router.post('/promotions', asyncHandler(async (req, res) => {
  const productId = id(req.body.productId, 'El producto no es válido.');
  const name = text(req.body.name);
  const discountType = text(req.body.discountType, 20)?.toUpperCase();
  const discountValue = positive(
    req.body.discountValue,
    'El descuento no es válido.',
    { allowZero: true },
  );
  const minQuantity = positive(
    req.body.minQuantity ?? 1,
    'La cantidad mínima no es válida.',
  );
  const startsAt = new Date(req.body.startsAt);
  const endsAt = new Date(req.body.endsAt);
  if (!name || !['PERCENT', 'FIXED_PRICE'].includes(discountType) ||
      Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) ||
      endsAt <= startsAt || (discountType === 'PERCENT' && discountValue > 100)) {
    throw new AppError(
      'Completa producto, nombre, descuento y una vigencia válida.',
      422,
      'INVALID_PROMOTION',
    );
  }
  const created = await withTransaction(async (client) => {
    const product = await client.query(
      `SELECT id,name,sale_price FROM products
       WHERE tenant_id=$1 AND id=$2 AND deleted_at IS NULL
         AND product_kind <> 'VARIANT_PARENT'`,
      [req.context.tenantId, productId],
    );
    if (!product.rowCount) {
      throw new AppError('El producto no existe.', 404, 'PRODUCT_NOT_FOUND');
    }
    const result = await client.query(
      `INSERT INTO sales_promotions(
         tenant_id,product_id,name,discount_type,discount_value,min_quantity,
         starts_at,ends_at,created_by
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.context.tenantId,
        productId,
        name,
        discountType,
        discountValue,
        minQuantity,
        startsAt.toISOString(),
        endsAt.toISOString(),
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'pricing.promotion.created',
      entityType: 'sales_promotion',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: `Promoción ${name}`,
    });
    return result.rows[0];
  });
  res.status(201).json(created);
}));

router.patch('/promotions/:promotionId/status', asyncHandler(async (req, res) => {
  const promotionId = id(req.params.promotionId, 'La promoción no es válida.');
  if (typeof req.body.active !== 'boolean') {
    throw new AppError('Indica si la promoción queda activa.', 422, 'INVALID_PROMOTION_STATUS');
  }
  const updated = await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE sales_promotions SET active=$3,updated_at=now()
       WHERE tenant_id=$1 AND id=$2
       RETURNING *`,
      [req.context.tenantId, promotionId, req.body.active],
    );
    if (!result.rowCount) {
      throw new AppError('La promoción no existe.', 404, 'PROMOTION_NOT_FOUND');
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: req.body.active
        ? 'pricing.promotion.enabled'
        : 'pricing.promotion.disabled',
      entityType: 'sales_promotion',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: req.body.active ? 'Promoción activada' : 'Promoción pausada',
    });
    return result.rows[0];
  });
  res.json(updated);
}));

router.patch('/customers/:customerId/price-list', asyncHandler(async (req, res) => {
  const customerId = id(req.params.customerId, 'El cliente no es válido.');
  const priceListId = req.body.priceListId
    ? id(req.body.priceListId, 'La lista de precios no es válida.')
    : null;
  const updated = await withTransaction(async (client) => {
    if (priceListId) {
      const list = await client.query(
        `SELECT id FROM sales_price_lists
         WHERE tenant_id=$1 AND id=$2 AND active=TRUE`,
        [req.context.tenantId, priceListId],
      );
      if (!list.rowCount) {
        throw new AppError('La lista no pertenece a esta empresa.', 422, 'PRICE_LIST_SCOPE_INVALID');
      }
    }
    const result = await client.query(
      `UPDATE customers SET sales_price_list_id=$3,updated_at=now()
       WHERE tenant_id=$1 AND id=$2 AND active=TRUE
       RETURNING *`,
      [req.context.tenantId, customerId, priceListId],
    );
    if (!result.rowCount) {
      throw new AppError('El cliente no existe.', 404, 'CUSTOMER_NOT_FOUND');
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'pricing.customer_price_list.assigned',
      entityType: 'customer',
      entityId: customerId,
      after: result.rows[0],
      reason: 'Asignación de política comercial',
    });
    return result.rows[0];
  });
  res.json(updated);
}));

export default router;
