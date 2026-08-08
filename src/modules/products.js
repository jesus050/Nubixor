import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { config } from '../config.js';
import { requirePermission } from '../authorization.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const IMAGE_DATA_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const productImageDir = path.resolve(
  config.storageDir,
  'product-images',
);
const imageExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hasValidImageSignature(contentType, buffer) {
  if (contentType === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  if (contentType === 'image/png') {
    return buffer.subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (contentType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

router.use(requireTenant);

router.get('/lookup', asyncHandler(async (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (search.length < 2 || search.length > 120) {
    throw new AppError(
      'Escribe entre 2 y 120 caracteres para consultar productos.',
      422,
      'INVALID_PRODUCT_LOOKUP',
    );
  }
  const cashierOnly = req.context.user?.role_code === 'CASHIER';
  const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
  const pattern = `%${escapedSearch}%`;
  const result = await query(
    `SELECT p.id, p.sku, p.barcode, p.name, p.sale_price,
            CASE WHEN $3::boolean THEN NULL ELSE p.cost END cost,
            p.tax_review_status, p.product_kind, p.billing_policy,
            c.name category_name, b.name brand_name,
            tc.name tax_name, tc.rate tax_rate, tc.treatment tax_treatment,
            pi.public_url image_url,
            COALESCE(stock.total_stock, 0) total_stock,
            COALESCE(stock.available_stock, 0) available_stock,
            COALESCE(stock.locations, '[]'::jsonb) locations
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
     LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
     LEFT JOIN tax_categories tc
       ON tc.id = p.sales_tax_category_id AND tc.tenant_id = p.tenant_id
     LEFT JOIN LATERAL (
       SELECT public_url
       FROM product_images
       WHERE tenant_id = p.tenant_id AND product_id = p.id
       ORDER BY is_primary DESC, created_at
       LIMIT 1
     ) pi ON TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(ib.on_hand), 0) total_stock,
              COALESCE(SUM(GREATEST(ib.on_hand - ib.reserved, 0)), 0) available_stock,
              jsonb_agg(
                jsonb_build_object(
                  'warehouseId', w.id,
                  'warehouse', w.name,
                  'code', w.code,
                  'type', w.warehouse_type,
                  'onHand', ib.on_hand,
                  'reserved', ib.reserved,
                  'available', GREATEST(ib.on_hand - ib.reserved, 0)
                )
                ORDER BY (w.warehouse_type = 'DISPLAY') DESC, w.name
              ) locations
       FROM inventory_balances ib
       JOIN warehouses w
         ON w.id = ib.warehouse_id
        AND w.tenant_id = ib.tenant_id
        AND w.active = TRUE
       WHERE ib.tenant_id = p.tenant_id
         AND ib.product_id = p.id
         AND ($3::boolean = FALSE OR w.warehouse_type = 'DISPLAY')
     ) stock ON TRUE
     WHERE p.tenant_id = $1
       AND p.deleted_at IS NULL
       AND p.active = TRUE
       AND (
         p.sku ILIKE $2 ESCAPE '\\'
         OR COALESCE(p.barcode, '') ILIKE $2 ESCAPE '\\'
         OR p.name ILIKE $2 ESCAPE '\\'
         OR COALESCE(c.name, '') ILIKE $2 ESCAPE '\\'
         OR COALESCE(b.name, '') ILIKE $2 ESCAPE '\\'
       )
     ORDER BY
       (upper(p.sku) = upper($4)) DESC,
       (upper(COALESCE(p.barcode, '')) = upper($4)) DESC,
       p.name
     LIMIT 30`,
    [req.context.tenantId, pattern, cashierOnly, search],
  );
  res.json({
    query: search,
    scope: cashierOnly ? 'DISPLAY_ONLY' : 'ALL_AUTHORIZED_WAREHOUSES',
    products: result.rows,
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  await query(
    `UPDATE products
     SET active = TRUE, updated_at = now()
     WHERE tenant_id = $1 AND product_kind = 'VARIANT_PARENT' AND active = FALSE`,
    [req.context.tenantId],
  );

  const result = await query(
    `SELECT p.id, p.tenant_id, p.sku, p.barcode, p.name, p.cost, p.sale_price,
            p.tax_review_status, p.created_at, p.category_id, p.brand_id,
            p.sales_tax_category_id,p.active,p.product_kind,p.parent_product_id, p.billing_policy,
            p.variant_attributes,p.metadata,
            COALESCE(NULLIF(p.metadata ->> 'invoiceCode', ''), p.sku) invoice_code,
            c.name category_name, b.name brand_name,
            tc.name tax_name, tc.rate tax_rate,
            pi.public_url image_url, pi.alt_text image_alt
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
     LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
     LEFT JOIN tax_categories tc ON tc.id = p.sales_tax_category_id
     LEFT JOIN LATERAL (
       SELECT public_url, alt_text
       FROM product_images
       WHERE tenant_id = p.tenant_id AND product_id = p.id
       ORDER BY is_primary DESC, created_at
       LIMIT 1
     ) pi ON TRUE
     WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    sku,
    name,
    barcode = null,
    categoryId = null,
    brandId = null,
    salesTaxCategoryId = null,
    cost = 0,
    salePrice = 0,
    billingPolicy = 'ELECTRONIC_INVOICE',
  } = req.body;
  const normalizedSku = typeof sku === 'string' ? sku.trim().toUpperCase() : '';
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedBarcode = typeof barcode === 'string' ? barcode.trim() || null : null;
  const normalizedBillingPolicy = typeof billingPolicy === 'string' && ['ELECTRONIC_INVOICE', 'EQUIVALENT_DOCUMENT_POS', 'INTERNAL_RECEIPT'].includes(billingPolicy) ? billingPolicy : 'ELECTRONIC_INVOICE';
  const normalizedCost = Number(cost);
  const normalizedSalePrice = Number(salePrice);
  const referenceIds = [categoryId, brandId, salesTaxCategoryId].filter(Boolean);

  if (!normalizedSku || !normalizedName) {
    return res.status(422).json({ error: 'sku y name son obligatorios.' });
  }
  if (normalizedSku.length > 60 || normalizedName.length > 200 || normalizedBarcode?.length > 80) {
    return res.status(422).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }
  if (!Number.isFinite(normalizedCost) || normalizedCost < 0 ||
      !Number.isFinite(normalizedSalePrice) || normalizedSalePrice < 0) {
    return res.status(422).json({ error: 'cost y salePrice deben ser valores positivos.' });
  }
  if (referenceIds.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))) {
    return res.status(422).json({ error: 'Las referencias del catálogo deben ser UUID válidos.' });
  }

  try {
    const product = await withTransaction(async (client) => {
      const references = await client.query(
        `SELECT
           ($2::uuid IS NULL OR EXISTS(
             SELECT 1 FROM categories WHERE id = $2 AND tenant_id = $1 AND active = TRUE
           )) category_ok,
           ($3::uuid IS NULL OR EXISTS(
             SELECT 1 FROM brands WHERE id = $3 AND tenant_id = $1 AND active = TRUE
           )) brand_ok,
           ($4::uuid IS NULL OR EXISTS(
             SELECT 1 FROM tax_categories WHERE id = $4 AND tenant_id = $1 AND active = TRUE
           )) tax_ok`,
        [req.context.tenantId, categoryId || null, brandId || null, salesTaxCategoryId || null],
      );
      const validation = references.rows[0];
      if (!validation.category_ok || !validation.brand_ok || !validation.tax_ok) {
        throw new AppError(
          'Una categoría, marca o impuesto no pertenece a la empresa activa.',
          422,
          'CATALOG_REFERENCE_INVALID',
        );
      }

      const result = await client.query(
         `INSERT INTO products(
           tenant_id, sku, name, barcode, category_id, brand_id,
           sales_tax_category_id, cost, sale_price, tax_review_status,
           electronic_unit_measure_code, electronic_standard_code, active, billing_policy
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'94','999',TRUE,$11)
         RETURNING *`,
        [
          req.context.tenantId,
          normalizedSku,
          normalizedName,
          normalizedBarcode,
          categoryId || null,
          brandId || null,
          salesTaxCategoryId || null,
          normalizedCost,
          normalizedSalePrice,
          salesTaxCategoryId ? 'REVIEWED' : 'PENDING',
          normalizedBillingPolicy,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'product.created',
        entityType: 'product',
        entityId: result.rows[0].id,
        after: result.rows[0],
      });
      return result.rows[0];
    });
    res.status(201).json(product);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Ya existe un producto con ese SKU.', 409, 'PRODUCT_SKU_EXISTS');
    }
    throw error;
  }
}));

router.post('/:id/images', asyncHandler(async (req, res) => {
  const { dataUrl, altText = null } = req.body;
  const normalizedAltText = typeof altText === 'string' ? altText.trim() || null : null;
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El producto debe tener un UUID válido.' });
  }
  if (typeof dataUrl !== 'string') {
    return res.status(422).json({ error: 'Debes seleccionar una imagen.' });
  }
  const match = dataUrl.match(IMAGE_DATA_PATTERN);
  if (!match) {
    return res.status(422).json({ error: 'La imagen debe ser JPG, PNG o WEBP.' });
  }
  if (normalizedAltText?.length > 180) {
    return res.status(422).json({ error: 'La descripción de la imagen es demasiado larga.' });
  }

  const contentType = match[1].toLowerCase();
  const imageBuffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
    return res.status(422).json({ error: 'La imagen debe pesar máximo 2 MB.' });
  }
  if (!hasValidImageSignature(contentType, imageBuffer)) {
    return res.status(422).json({
      error: 'El contenido del archivo no coincide con un formato de imagen permitido.',
    });
  }

  const product = await query(
    `SELECT id, name
     FROM products
     WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
    [req.params.id, req.context.tenantId],
  );
  if (!product.rowCount) {
    throw new AppError('Producto no encontrado.', 404, 'PRODUCT_NOT_FOUND');
  }

  const imageId = randomUUID();
  const fileName = `${imageId}.${imageExtensions[contentType]}`;
  const tenantImageDir = path.join(productImageDir, req.context.tenantId);
  const filePath = path.join(tenantImageDir, fileName);
  const publicUrl = `/api/assets/product-images/${imageId}`;
  await mkdir(tenantImageDir, { recursive: true });
  await writeFile(filePath, imageBuffer, { flag: 'wx', mode: 0o600 });

  try {
    const image = await withTransaction(async (client) => {
      await client.query(
        `UPDATE product_images
         SET is_primary = FALSE
         WHERE product_id = $1 AND tenant_id = $2 AND is_primary = TRUE`,
        [req.params.id, req.context.tenantId],
      );
      const result = await client.query(
        `INSERT INTO product_images(
           id, tenant_id, product_id, file_name, public_url,
           content_type, byte_size, alt_text, is_primary
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
         RETURNING id, product_id, public_url, content_type, byte_size, alt_text, is_primary`,
        [
          imageId,
          req.context.tenantId,
          req.params.id,
          fileName,
          publicUrl,
          contentType,
          imageBuffer.length,
          normalizedAltText || product.rows[0].name,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'product.image_uploaded',
        entityType: 'product_image',
        entityId: imageId,
        after: result.rows[0],
        reason: 'Imagen privada vinculada al catálogo',
      });
      return result.rows[0];
    });
    res.status(201).json(image);
  } catch (error) {
    await unlink(filePath).catch(() => {});
    throw error;
  }
}));

router.patch('/:id/tax', asyncHandler(async (req, res) => {
  const { taxCategoryId, reason } = req.body;
  const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!taxCategoryId || !normalizedReason) {
    return res.status(422).json({ error: 'taxCategoryId y reason son obligatorios.' });
  }
  if (!UUID_PATTERN.test(req.params.id) || !UUID_PATTERN.test(taxCategoryId)) {
    return res.status(422).json({ error: 'El producto y el impuesto deben tener UUID válidos.' });
  }
  if (normalizedReason.length > 240) {
    return res.status(422).json({ error: 'El motivo no puede superar 240 caracteres.' });
  }
  const product = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT *
       FROM products
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError('Producto no encontrado.', 404, 'PRODUCT_NOT_FOUND');
    }
    const tax = await client.query(
      `SELECT id
       FROM tax_categories
       WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
      [taxCategoryId, req.context.tenantId],
    );
    if (!tax.rowCount) {
      throw new AppError('El impuesto no pertenece a la empresa activa.', 422, 'TAX_REFERENCE_INVALID');
    }
    const updated = await client.query(
      `UPDATE products
       SET sales_tax_category_id = $1, tax_review_status = 'REVIEWED', updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [taxCategoryId, req.params.id],
    );
    await client.query(
      `INSERT INTO product_tax_history(
         tenant_id, product_id, previous_tax_category_id,
         new_tax_category_id, changed_by, reason
       )
       VALUES($1,$2,$3,$4,$5,$6)`,
      [
        req.context.tenantId,
        req.params.id,
        current.rows[0].sales_tax_category_id,
        taxCategoryId,
        req.context.userId,
        normalizedReason,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'product.tax_changed',
      entityType: 'product',
      entityId: req.params.id,
      before: current.rows[0],
      after: updated.rows[0],
      reason: normalizedReason,
    });
    return updated.rows[0];
  });
  res.json(product);
}));

router.delete(
  '/:id',
  requirePermission('catalog.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      return res.status(422).json({ error: 'El producto debe tener un UUID válido.' });
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : 'Retirado por administración de catálogo';
    const deleted = await withTransaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM products WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [req.params.id, req.context.tenantId],
      );
      if (!current.rowCount) {
        throw new AppError('Producto no encontrado.', 404, 'PRODUCT_NOT_FOUND');
      }
      const updated = await client.query(
        `UPDATE products SET deleted_at = now(), active = FALSE, updated_at = now() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.context.tenantId],
      );
      await client.query(
        `UPDATE products SET deleted_at = now(), active = FALSE, updated_at = now() WHERE parent_product_id = $1 AND tenant_id = $2`,
        [req.params.id, req.context.tenantId],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'product.deleted',
        entityType: 'product',
        entityId: req.params.id,
        before: current.rows[0],
        after: updated.rows[0],
        reason,
      });
      return updated.rows[0];
    });
    res.json({ message: 'Producto retirado conforme a los protocolos de auditoría.', product: deleted });
  }),
);

export default router;
