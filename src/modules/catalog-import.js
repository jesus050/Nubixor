import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const MAX_CSV_BYTES = 1_500_000;
const MAX_ROWS = 1_000;
const REQUIRED_HEADERS = [
  'sku',
  'nombre',
  'costo',
  'precio_venta',
  'impuesto_codigo',
  'bodega_codigo',
];
const TEMPLATE_HEADERS = [
  ...REQUIRED_HEADERS.slice(0, 2),
  'codigo_barras',
  'categoria_codigo',
  'categoria',
  'marca_codigo',
  'marca',
  ...REQUIRED_HEADERS.slice(2),
  'existencia',
  'stock_minimo',
  'stock_maximo',
  'precio_docena',
  'cantidad_mayor',
  'precio_mayor',
  'cantidad_gran_mayor',
  'precio_gran_mayor',
];
const HEADER_ALIASES = new Map([
  ['name', 'nombre'],
  ['barcode', 'codigo_barras'],
  ['category_code', 'categoria_codigo'],
  ['category', 'categoria'],
  ['brand_code', 'marca_codigo'],
  ['brand', 'marca'],
  ['cost', 'costo'],
  ['sale_price', 'precio_venta'],
  ['tax_code', 'impuesto_codigo'],
  ['warehouse_code', 'bodega_codigo'],
  ['stock', 'existencia'],
  ['initial_stock', 'existencia'],
  ['minimum_stock', 'stock_minimo'],
  ['maximum_stock', 'stock_maximo'],
  ['dozen_price', 'precio_docena'],
  ['wholesale_price', 'precio_mayor'],
  ['wholesale_min_quantity', 'cantidad_mayor'],
  ['distributor_price', 'precio_gran_mayor'],
  ['distributor_min_quantity', 'cantidad_gran_mayor'],
]);

router.use(requireTenant);

function normalizeHeader(value) {
  const normalized = String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\s-]+/g, '_');
  return HEADER_ALIASES.get(normalized) || normalized;
}

function detectDelimiter(firstLine) {
  let quoted = false;
  let semicolons = 0;
  let commas = 0;
  for (let index = 0; index < firstLine.length; index += 1) {
    const character = firstLine[index];
    if (character === '"') {
      if (quoted && firstLine[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && character === ';') semicolons += 1;
    else if (!quoted && character === ',') commas += 1;
  }
  return semicolons >= commas ? ';' : ',';
}

export function parseCatalogCsv(csv) {
  if (typeof csv !== 'string' || !csv.trim()) {
    throw new AppError('Selecciona un archivo CSV con productos.', 422, 'CATALOG_IMPORT_EMPTY');
  }
  if (Buffer.byteLength(csv, 'utf8') > MAX_CSV_BYTES) {
    throw new AppError(
      'El archivo supera 1,5 MB. Divide la carga en archivos más pequeños.',
      413,
      'CATALOG_IMPORT_TOO_LARGE',
    );
  }
  const firstLine = csv.split(/\r?\n/, 1)[0];
  const delimiter = detectDelimiter(firstLine);
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      record.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      record.push(field);
      if (record.some((value) => String(value).trim())) records.push(record);
      record = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) {
    throw new AppError(
      'El CSV contiene comillas sin cerrar.',
      422,
      'CATALOG_IMPORT_INVALID_CSV',
    );
  }
  record.push(field);
  if (record.some((value) => String(value).trim())) records.push(record);
  if (records.length < 2) {
    throw new AppError(
      'El archivo debe contener encabezados y al menos un producto.',
      422,
      'CATALOG_IMPORT_NO_ROWS',
    );
  }
  const headers = records[0].map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new AppError(
      `Faltan estas columnas obligatorias: ${missing.join(', ')}.`,
      422,
      'CATALOG_IMPORT_HEADERS_MISSING',
    );
  }
  if (records.length - 1 > MAX_ROWS) {
    throw new AppError(
      `La carga admite máximo ${MAX_ROWS} productos por archivo.`,
      422,
      'CATALOG_IMPORT_ROW_LIMIT',
    );
  }
  return records.slice(1).map((values, index) => Object.fromEntries(
    headers.map((header, column) => [header, String(values[column] ?? '').trim()]),
  )).map((row, index) => ({ ...row, rowNumber: index + 2 }));
}

function parseDecimal(value, { required = false, nullable = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    if (required) return { error: 'es obligatorio' };
    return { value: nullable ? null : 0 };
  }
  const normalized = raw
    .replace(/\s/g, '')
    .replace(/^\$/, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) {
    return { error: 'debe ser un número positivo sin símbolos adicionales' };
  }
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0
    ? { value: number }
    : { error: 'debe ser un número positivo' };
}

function normalizeCode(value, maxLength) {
  const code = String(value || '').trim().toUpperCase();
  return code && code.length <= maxLength ? code : null;
}

function normalizeRow(row) {
  const errors = [];
  const sku = normalizeCode(row.sku, 60);
  const name = String(row.nombre || '').trim();
  const barcode = String(row.codigo_barras || '').trim() || null;
  const categoryCode = normalizeCode(row.categoria_codigo, 30);
  const categoryName = String(row.categoria || '').trim() || null;
  const brandCode = normalizeCode(row.marca_codigo, 30);
  const brandName = String(row.marca || '').trim() || null;
  const taxCode = normalizeCode(row.impuesto_codigo, 30);
  const warehouseCode = normalizeCode(row.bodega_codigo, 60);
  const cost = parseDecimal(row.costo, { required: true });
  const salePrice = parseDecimal(row.precio_venta, { required: true });
  const stock = parseDecimal(row.existencia, { nullable: true });
  const minimumStock = parseDecimal(row.stock_minimo);
  const maximumStock = parseDecimal(row.stock_maximo, { nullable: true });
  const dozenPrice = parseDecimal(row.precio_docena, { nullable: true });
  const wholesaleQuantity = parseDecimal(row.cantidad_mayor, { nullable: true });
  const wholesalePrice = parseDecimal(row.precio_mayor, { nullable: true });
  const distributorQuantity = parseDecimal(row.cantidad_gran_mayor, { nullable: true });
  const distributorPrice = parseDecimal(row.precio_gran_mayor, { nullable: true });
  if (!sku) errors.push('SKU obligatorio o mayor a 60 caracteres.');
  if (!name || name.length > 200) errors.push('Nombre obligatorio o mayor a 200 caracteres.');
  if (barcode?.length > 80) errors.push('Código de barras mayor a 80 caracteres.');
  if (!taxCode) errors.push('Código de impuesto obligatorio.');
  if (!warehouseCode) errors.push('Código de bodega obligatorio.');
  if (row.categoria_codigo && !categoryCode) errors.push('Código de categoría no válido.');
  if (row.marca_codigo && !brandCode) errors.push('Código de marca no válido.');
  if (categoryCode && (!categoryName || categoryName.length > 160)) {
    errors.push('La categoría necesita un nombre válido.');
  }
  if (brandCode && (!brandName || brandName.length > 160)) {
    errors.push('La marca necesita un nombre válido.');
  }
  if (cost.error) errors.push(`Costo ${cost.error}.`);
  if (salePrice.error) errors.push(`Precio de venta ${salePrice.error}.`);
  if (stock.error) errors.push(`Existencia ${stock.error}.`);
  if (minimumStock.error) errors.push(`Stock mínimo ${minimumStock.error}.`);
  if (maximumStock.error) errors.push(`Stock máximo ${maximumStock.error}.`);
  if (dozenPrice.error) errors.push(`Precio docena ${dozenPrice.error}.`);
  if (wholesaleQuantity.error) errors.push(`Cantidad mayor ${wholesaleQuantity.error}.`);
  if (wholesalePrice.error) errors.push(`Precio mayor ${wholesalePrice.error}.`);
  if (distributorQuantity.error) errors.push(`Cantidad gran mayor ${distributorQuantity.error}.`);
  if (distributorPrice.error) errors.push(`Precio gran mayor ${distributorPrice.error}.`);
  if (dozenPrice.value !== null && dozenPrice.value <= 0) errors.push('El precio docena debe ser mayor que cero.');
  if (wholesalePrice.value !== null && (!wholesaleQuantity.value || wholesaleQuantity.value <= 0)) errors.push('El precio mayor necesita una cantidad mínima válida.');
  if (distributorPrice.value !== null && (!distributorQuantity.value || distributorQuantity.value <= 0)) errors.push('El precio gran mayor necesita una cantidad mínima válida.');
  if (maximumStock.value !== null && maximumStock.value <= minimumStock.value) {
    errors.push('El stock máximo debe ser mayor que el mínimo.');
  }
  return {
    rowNumber: row.rowNumber,
    sku,
    name,
    barcode,
    categoryCode,
    categoryName,
    brandCode,
    brandName,
    cost: cost.value,
    salePrice: salePrice.value,
    taxCode,
    warehouseCode,
    stock: stock.value,
    minimumStock: minimumStock.value,
    maximumStock: maximumStock.value,
    dozenPrice: dozenPrice.value,
    wholesaleQuantity: wholesaleQuantity.value,
    wholesalePrice: wholesalePrice.value,
    distributorQuantity: distributorQuantity.value,
    distributorPrice: distributorPrice.value,
    errors,
    warnings: [],
  };
}

async function catalogContext(tenantId, executor = query) {
  const products = await executor(
    `SELECT id, sku, barcode FROM products
     WHERE tenant_id = $1 AND deleted_at IS NULL`,
    [tenantId],
  );
  const categories = await executor(
    `SELECT id, code, name FROM categories WHERE tenant_id = $1 AND active = TRUE`,
    [tenantId],
  );
  const brands = await executor(
    `SELECT id, code, name FROM brands WHERE tenant_id = $1 AND active = TRUE`,
    [tenantId],
  );
  const taxes = await executor(
    `SELECT id, code, name, treatment, rate FROM tax_categories
     WHERE tenant_id = $1 AND active = TRUE`,
    [tenantId],
  );
  const warehouses = await executor(
    `SELECT id, code, name, warehouse_type FROM warehouses
     WHERE tenant_id = $1 AND active = TRUE`,
    [tenantId],
  );
  const balances = await executor(
    `SELECT product_id, warehouse_id, on_hand, reserved FROM inventory_balances
     WHERE tenant_id = $1`,
    [tenantId],
  );
  const byCode = (rows) => new Map(rows.map((row) => [row.code.toUpperCase(), row]));
  return {
    products: byCode(products.rows.map((row) => ({ ...row, code: row.sku }))),
    categories: byCode(categories.rows),
    brands: byCode(brands.rows),
    taxes: byCode(taxes.rows),
    warehouses: byCode(warehouses.rows),
    balances: new Map(balances.rows.map((row) => [
      `${row.product_id}:${row.warehouse_id}`,
      row,
    ])),
  };
}

export async function validateCatalogImport(csv, tenantId, executor = query) {
  const parsed = parseCatalogCsv(csv);
  const context = await catalogContext(tenantId, executor);
  const normalized = parsed.map(normalizeRow);
  const seenSkus = new Set();
  const seenBarcodes = new Set();
  for (const row of normalized) {
    if (row.sku && seenSkus.has(row.sku)) row.errors.push('SKU repetido dentro del archivo.');
    if (row.sku) seenSkus.add(row.sku);
    if (row.barcode && seenBarcodes.has(row.barcode)) {
      row.errors.push('Código de barras repetido dentro del archivo.');
    }
    if (row.barcode) seenBarcodes.add(row.barcode);
    if (row.taxCode && !context.taxes.has(row.taxCode)) {
      row.errors.push(`El impuesto ${row.taxCode} no existe en la empresa.`);
    }
    if (row.warehouseCode && !context.warehouses.has(row.warehouseCode)) {
      row.errors.push(`La bodega ${row.warehouseCode} no existe en la empresa.`);
    }
    if (row.categoryCode && !context.categories.has(row.categoryCode)) {
      row.warnings.push(`Se creará la categoría ${row.categoryCode}.`);
    }
    if (row.brandCode && !context.brands.has(row.brandCode)) {
      row.warnings.push(`Se creará la marca ${row.brandCode}.`);
    }
    const existing = row.sku ? context.products.get(row.sku) : null;
    row.action = existing ? 'UPDATE' : 'CREATE';
    row.productId = existing?.id || null;
    const warehouse = context.warehouses.get(row.warehouseCode);
    const balance = existing && warehouse
      ? context.balances.get(`${existing.id}:${warehouse.id}`)
      : null;
    row.currentStock = Number(balance?.on_hand || 0);
    if (row.stock === null) {
      row.warnings.push('La existencia quedará sin cambios.');
    } else if (balance && row.stock < Number(balance.reserved)) {
      row.errors.push(
        `La existencia no puede quedar por debajo de ${Number(balance.reserved)} unidades reservadas.`,
      );
    }
  }
  const errorRows = normalized.filter((row) => row.errors.length).length;
  return {
    rows: normalized,
    summary: {
      total: normalized.length,
      creates: normalized.filter((row) => row.action === 'CREATE').length,
      updates: normalized.filter((row) => row.action === 'UPDATE').length,
      errorRows,
      valid: errorRows === 0,
    },
  };
}

router.get('/template.csv', asyncHandler(async (req, res) => {
  const references = await query(
    `SELECT
       (
         SELECT code FROM warehouses
         WHERE tenant_id = $1 AND active = TRUE
         ORDER BY (warehouse_type = 'DISPLAY') DESC, name
         LIMIT 1
       ) warehouse_code,
       (
         SELECT code FROM tax_categories
         WHERE tenant_id = $1 AND active = TRUE
         ORDER BY (treatment = 'EXCLUDED') DESC, rate, name
         LIMIT 1
       ) tax_code`,
    [req.context.tenantId],
  );
  if (!references.rows[0].warehouse_code || !references.rows[0].tax_code) {
    throw new AppError(
      'Configura al menos una bodega y un impuesto antes de descargar la plantilla.',
      422,
      'CATALOG_IMPORT_REFERENCES_REQUIRED',
    );
  }
  const example = [
    'PROD-001',
    'Producto de ejemplo',
    '770000000001',
    'GENERAL',
    'General',
    'SIN-MARCA',
    'Sin marca',
    '10000',
    '19900',
    references.rows[0].tax_code,
    references.rows[0].warehouse_code,
    '20',
    '5',
    '50',
    '180000',
    '12',
    '14500',
    '50',
    '13000',
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla-productos-nubixor.csv"');
  res.send(`\uFEFF${TEMPLATE_HEADERS.join(';')}\r\n${example.join(';')}\r\n`);
}));

router.post('/preview', asyncHandler(async (req, res) => {
  const preview = await validateCatalogImport(req.body?.csv, req.context.tenantId);
  res.json(preview);
}));

router.post('/commit', asyncHandler(async (req, res) => {
  if (req.body?.confirmation !== 'IMPORTAR') {
    throw new AppError(
      'Confirma expresamente la carga masiva.',
      422,
      'CATALOG_IMPORT_CONFIRMATION_REQUIRED',
    );
  }
  const csv = req.body?.csv;
  const result = await withTransaction(async (client) => {
    const executor = (text, values) => client.query(text, values);
    const preview = await validateCatalogImport(csv, req.context.tenantId, executor);
    if (!preview.summary.valid) {
      throw new AppError(
        'La carga contiene errores. Corrige el archivo y genera una nueva vista previa.',
        422,
        'CATALOG_IMPORT_HAS_ERRORS',
        { rows: preview.rows.filter((row) => row.errors.length).slice(0, 50) },
      );
    }
    const batchId = randomUUID();
    let inventoryChanges = 0;
    for (const row of preview.rows) {
      let categoryId = null;
      if (row.categoryCode) {
        const category = await client.query(
          `INSERT INTO categories(tenant_id, name, code)
           VALUES($1,$2,$3)
           ON CONFLICT(tenant_id, code) DO UPDATE
           SET name = EXCLUDED.name, active = TRUE
           RETURNING id`,
          [req.context.tenantId, row.categoryName, row.categoryCode],
        );
        categoryId = category.rows[0].id;
      }
      let brandId = null;
      if (row.brandCode) {
        const brand = await client.query(
          `INSERT INTO brands(tenant_id, name, code)
           VALUES($1,$2,$3)
           ON CONFLICT(tenant_id, code) DO UPDATE
           SET name = EXCLUDED.name, active = TRUE
           RETURNING id`,
          [req.context.tenantId, row.brandName, row.brandCode],
        );
        brandId = brand.rows[0].id;
      }
      const tax = await client.query(
        `SELECT id FROM tax_categories
         WHERE tenant_id = $1 AND code = $2 AND active = TRUE`,
        [req.context.tenantId, row.taxCode],
      );
      const warehouse = await client.query(
        `SELECT id FROM warehouses
         WHERE tenant_id = $1 AND code = $2 AND active = TRUE`,
        [req.context.tenantId, row.warehouseCode],
      );
      const product = await client.query(
        `INSERT INTO products(
           tenant_id, sku, name, barcode, category_id, brand_id,
           sales_tax_category_id, cost, sale_price, tax_review_status,
           default_warehouse_id, minimum_stock, maximum_stock, active
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'REVIEWED',$10,$11,$12,TRUE)
         ON CONFLICT(tenant_id, sku) DO UPDATE
         SET name = EXCLUDED.name,
             barcode = EXCLUDED.barcode,
             category_id = EXCLUDED.category_id,
             brand_id = EXCLUDED.brand_id,
             sales_tax_category_id = EXCLUDED.sales_tax_category_id,
             cost = EXCLUDED.cost,
             sale_price = EXCLUDED.sale_price,
             tax_review_status = 'REVIEWED',
             default_warehouse_id = EXCLUDED.default_warehouse_id,
             minimum_stock = EXCLUDED.minimum_stock,
             maximum_stock = EXCLUDED.maximum_stock,
             active = TRUE,
             deleted_at = NULL,
             updated_at = now()
         RETURNING id, sku, cost`,
        [
          req.context.tenantId,
          row.sku,
          row.name,
          row.barcode,
          categoryId,
          brandId,
          tax.rows[0].id,
          row.cost,
          row.salePrice,
          warehouse.rows[0].id,
          row.minimumStock,
          row.maximumStock,
        ],
      );
      const priceTiers = [
        row.dozenPrice === null ? null : { code: 'WHOLESALE', minQuantity: 12, unitPrice: row.dozenPrice },
        row.wholesalePrice === null ? null : { code: 'WHOLESALE', minQuantity: row.wholesaleQuantity, unitPrice: row.wholesalePrice },
        row.distributorPrice === null ? null : { code: 'DISTRIBUTOR', minQuantity: row.distributorQuantity, unitPrice: row.distributorPrice },
      ].filter(Boolean);
      for (const tier of priceTiers) {
        const priceList = await client.query(
          `SELECT id FROM sales_price_lists
           WHERE tenant_id = $1 AND code = $2 AND active = TRUE`,
          [req.context.tenantId, tier.code],
        );
        if (!priceList.rowCount) {
          throw new AppError(
            `La lista de precios ${tier.code} no está configurada en la empresa.`,
            422,
            'CATALOG_IMPORT_PRICE_LIST_REQUIRED',
          );
        }
        await client.query(
          `INSERT INTO sales_product_prices(
             tenant_id, price_list_id, product_id, min_quantity, unit_price, active
           ) VALUES($1,$2,$3,$4,$5,TRUE)
           ON CONFLICT(tenant_id, price_list_id, product_id, min_quantity)
           DO UPDATE SET unit_price = EXCLUDED.unit_price, active = TRUE, updated_at = now()`,
          [req.context.tenantId, priceList.rows[0].id, product.rows[0].id, tier.minQuantity, tier.unitPrice],
        );
      }
      if (row.stock !== null) {
        const current = await client.query(
          `SELECT on_hand, reserved FROM inventory_balances
           WHERE tenant_id = $1 AND product_id = $2 AND warehouse_id = $3
           FOR UPDATE`,
          [req.context.tenantId, product.rows[0].id, warehouse.rows[0].id],
        );
        const currentStock = Number(current.rows[0]?.on_hand || 0);
        const reserved = Number(current.rows[0]?.reserved || 0);
        if (row.stock < reserved) {
          throw new AppError(
            `El producto ${row.sku} tiene ${reserved} unidades reservadas.`,
            409,
            'CATALOG_IMPORT_RESERVED_STOCK',
          );
        }
        const delta = row.stock - currentStock;
        await client.query(
          `INSERT INTO inventory_balances(
             tenant_id, product_id, warehouse_id, on_hand, reserved
           )
           VALUES($1,$2,$3,$4,0)
           ON CONFLICT(tenant_id, product_id, warehouse_id) DO UPDATE
           SET on_hand = EXCLUDED.on_hand, updated_at = now()`,
          [req.context.tenantId, product.rows[0].id, warehouse.rows[0].id, row.stock],
        );
        if (delta !== 0) {
          inventoryChanges += 1;
          await client.query(
            `INSERT INTO inventory_movements(
               tenant_id, product_id, warehouse_id, movement_type, quantity,
               unit_cost, reference_type, reference_id, reason, created_by
             )
             VALUES($1,$2,$3,'OPENING_IMPORT',$4,$5,'CATALOG_IMPORT',$6,$7,$8)`,
            [
              req.context.tenantId,
              product.rows[0].id,
              warehouse.rows[0].id,
              delta,
              row.cost,
              batchId,
              'Carga masiva de catálogo con saldo objetivo',
              req.context.userId,
            ],
          );
        }
      }
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'catalog.bulk_imported',
      entityType: 'catalog_import',
      entityId: batchId,
      after: {
        ...preview.summary,
        inventoryChanges,
        csvSha256: createHash('sha256').update(csv).digest('hex'),
      },
      reason: 'Carga masiva confirmada desde el catálogo',
    });
    return { batchId, ...preview.summary, inventoryChanges };
  });
  res.status(201).json(result);
}));

export default router;
