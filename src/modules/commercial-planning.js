import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAnyPermission, requirePermission } from '../authorization.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { paginatedQuery, paginatedResponse, parsePagination } from '../shared/pagination.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLAN_STATUSES = new Set(['DRAFT', 'ACTIVE', 'REVIEW', 'CLOSED', 'CANCELLED']);
const INITIATIVE_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']);
const CHANNELS = new Set(['STORE', 'WHOLESALE', 'DIGITAL', 'FIELD', 'OTHER']);
const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const COMMERCIAL_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const PRODUCT_LIFECYCLES = new Set([
  'PERMANENT',
  'TEMPORARY',
  'SEASONAL',
  'LIMITED_EDITION',
  'LAUNCH',
  'PROMOTIONAL',
]);
const SEASON_TYPES = new Set([
  'CHRISTMAS',
  'LOVE_AND_FRIENDSHIP',
  'MOTHERS_DAY',
  'FATHERS_DAY',
  'BACK_TO_SCHOOL',
  'HALLOWEEN',
  'VACATIONS',
  'HOLY_WEEK',
  'HIGH_SEASON',
  'LOW_SEASON',
  'CUSTOM',
]);
const BUDGET_TYPES = new Set(['MONTHLY', 'QUARTERLY', 'CUSTOM']);
const BUDGET_STATUSES = new Set(['DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED']);
const CAMPAIGN_OBJECTIVES = new Set([
  'LAUNCH',
  'INCREASE_SALES',
  'LIQUIDATE_INVENTORY',
  'MOVE_LOW_ROTATION',
  'SEASON',
  'POSITIONING',
  'GENERATE_LEADS',
  'PROMOTION',
  'RECOVER_STALLED_PRODUCT',
  'OTHER',
]);
const CAMPAIGN_STATUSES = new Set([
  'DRAFT',
  'PLANNED',
  'APPROVED',
  'ACTIVE',
  'FINISHED',
  'EVALUATED',
  'CANCELLED',
]);
const CAMPAIGN_CHANNELS = new Set([
  'STORE',
  'WHOLESALE',
  'DIGITAL',
  'FIELD',
  'META_ADS',
  'GOOGLE_ADS',
  'TIKTOK_ADS',
  'OTHER',
]);
const EXPENSE_TYPES = new Set([
  'META_ADS',
  'GOOGLE_ADS',
  'TIKTOK_ADS',
  'VIDEO_PRODUCTION',
  'PHOTOGRAPHY',
  'DESIGN',
  'INFLUENCERS',
  'POP_MATERIAL',
  'ACTIVATIONS',
  'PRINTED',
  'PROMOTIONS',
  'EVENTS',
  'OTHER',
]);
const EXPENSE_STATUSES = new Set(['COMMITTED', 'SPENT', 'VOID']);

router.use(requireTenant);
router.use(requireAnyPermission([
  'commercial_planning.view',
  'commercial_planning.manage',
  'commercial_planning.marketing',
  'commercial_planning.supervise',
  'reports.view',
  'sales.operate',
]));

function cleanText(input, maxLength, required = false) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (required && !value) {
    throw new AppError('Completa los campos obligatorios.', 422, 'COMMERCIAL_PLAN_REQUIRED_FIELD');
  }
  if (value.length > maxLength) {
    throw new AppError(`El texto supera ${maxLength} caracteres.`, 422, 'COMMERCIAL_PLAN_TEXT_TOO_LONG');
  }
  return value || null;
}

function date(input, message = 'La fecha no es válida.') {
  if (typeof input !== 'string' || !DATE.test(input)) {
    throw new AppError(message, 422, 'INVALID_COMMERCIAL_PLAN_DATE');
  }
  const candidate = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(candidate.valueOf()) || candidate.toISOString().slice(0, 10) !== input) {
    throw new AppError(message, 422, 'INVALID_COMMERCIAL_PLAN_DATE');
  }
  return input;
}

function optionalId(input, message) {
  if (!input) return null;
  if (typeof input !== 'string' || !UUID.test(input)) {
    throw new AppError(message, 422, 'INVALID_COMMERCIAL_PLAN_REFERENCE');
  }
  return input;
}

function id(input, message) {
  const value = optionalId(input, message);
  if (!value) throw new AppError(message, 422, 'INVALID_COMMERCIAL_PLAN_REFERENCE');
  return value;
}

function money(input, message = 'El valor monetario no es válido.') {
  const amount = Math.round(Number(input || 0) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(message, 422, 'INVALID_COMMERCIAL_PLAN_AMOUNT');
  }
  return amount;
}

function numberValue(input, message, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const value = Number(input);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new AppError(message, 422, 'INVALID_COMMERCIAL_PLAN_NUMBER');
  }
  return value;
}

function bool(input) {
  return input === true || input === 'true' || input === 'on' || input === 1 || input === '1';
}

function enumValue(input, values, fallback, code = 'INVALID_COMMERCIAL_PLAN_STATUS') {
  const value = cleanText(input, 40)?.toUpperCase() || fallback;
  if (!values.has(value)) {
    throw new AppError('El estado o clasificación no es válido.', 422, code);
  }
  return value;
}

function branchFilter(req) {
  const branchId = optionalId(req.query.branchId, 'La sucursal no es válida.');
  return branchId || req.context.branchId || null;
}

async function assertBranch(client, tenantId, branchId) {
  if (!branchId) return;
  const branch = await client.query(
    'SELECT id FROM branches WHERE tenant_id = $1 AND id = $2 AND active = TRUE',
    [tenantId, branchId],
  );
  if (!branch.rowCount) {
    throw new AppError('La sucursal no pertenece a la empresa activa.', 404, 'COMMERCIAL_PLAN_BRANCH_NOT_FOUND');
  }
}

async function assertUser(client, tenantId, userId) {
  if (!userId) return;
  const user = await client.query(
    'SELECT user_id FROM tenant_users WHERE tenant_id = $1 AND user_id = $2',
    [tenantId, userId],
  );
  if (!user.rowCount) {
    throw new AppError('La persona responsable no pertenece a la empresa activa.', 404, 'COMMERCIAL_PLAN_USER_NOT_FOUND');
  }
}

async function assertProduct(client, tenantId, productId) {
  if (!productId) return;
  const product = await client.query(
    `SELECT id FROM products
     WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL`,
    [tenantId, productId],
  );
  if (!product.rowCount) {
    throw new AppError('El producto no pertenece a la empresa activa.', 404, 'COMMERCIAL_PLAN_PRODUCT_NOT_FOUND');
  }
}

async function assertSeason(client, tenantId, seasonId) {
  if (!seasonId) return;
  const season = await client.query(
    'SELECT id FROM commercial_seasons WHERE tenant_id = $1 AND id = $2 AND active = TRUE',
    [tenantId, seasonId],
  );
  if (!season.rowCount) {
    throw new AppError('La temporada no pertenece a la empresa activa.', 404, 'COMMERCIAL_PLAN_SEASON_NOT_FOUND');
  }
}

function buildRotationFilters(req) {
  return {
    branchId: branchFilter(req),
    warehouseId: optionalId(req.query.warehouseId, 'La bodega no es válida.'),
    rotation: cleanText(req.query.rotation, 20)?.toUpperCase(),
    priority: cleanText(req.query.priority, 20)?.toUpperCase(),
    seasonId: optionalId(req.query.seasonId, 'La temporada no es válida.'),
    onlyNew: req.query.onlyNew === undefined ? null : bool(req.query.onlyNew),
    campaign: cleanText(req.query.campaign, 20),
    minStock: req.query.minStock === undefined ? null : numberValue(req.query.minStock, 'El stock mínimo no es válido.'),
    maxStock: req.query.maxStock === undefined ? null : numberValue(req.query.maxStock, 'El stock máximo no es válido.'),
    minMargin: req.query.minMargin === undefined ? null : numberValue(req.query.minMargin, 'El margen mínimo no es válido.'),
    maxMargin: req.query.maxMargin === undefined ? null : numberValue(req.query.maxMargin, 'El margen máximo no es válido.'),
    daysWithoutSale: req.query.daysWithoutSale === undefined
      ? null
      : numberValue(req.query.daysWithoutSale, 'Los días sin venta no son válidos.'),
    periodDays: parseAnalysisPeriod(req.query.periodDays),
    coverage: cleanText(req.query.coverage, 20)?.toUpperCase() || null,
  };
}

// La ventana de análisis venía fija en la configuración de la empresa. Poder
// pedirla por petición es lo que permite comparar 7, 30, 60 y 90 días sin
// cambiar un ajuste que afecta a todos los demás: la misma referencia se ve
// distinta según cuánto se mire hacia atrás, y esa diferencia es la información.
function parseAnalysisPeriod(value) {
  if (value === undefined || value === '') return null;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > 730) {
    throw new AppError(
      'El período de análisis debe ser un número de días entre 1 y 730.',
      422,
      'INVALID_ANALYSIS_PERIOD',
    );
  }
  return days;
}

const COVERAGE_CLASSES = new Set(['AGOTADO', 'RIESGO', 'SANA', 'EXCESO', 'SIN_VENTAS']);

function rotationQuery({ opportunitiesOnly = false } = {}) {
  return `WITH settings AS (
       SELECT *,
              COALESCE($14::integer, analysis_period_days) effective_period_days
       FROM commercial_rotation_settings
       WHERE tenant_id = $1
     ),
     scope AS (
       SELECT
         product.id product_id,
         product.sku,
         product.name product_name,
         product.cost,
         product.sale_price,
         product.sale_price
           / (1 + COALESCE(sales_tax.rate, 0) / 100) net_sale_price,
         category.id category_id,
         category.name category_name,
         brand.id brand_id,
         brand.name brand_name,
         profile.product_lifecycle,
         COALESCE(profile.is_new_product, FALSE) is_new_product,
         COALESCE(profile.requires_launch, FALSE) requires_launch,
         COALESCE(profile.push_candidate, FALSE) push_candidate,
         COALESCE(profile.commercial_priority, 'MEDIUM') commercial_priority,
         profile.suggested_launch_date,
         profile.marketing_notes,
         COALESCE(SUM(balance.on_hand), 0) stock_on_hand,
         MIN(first_entry.created_at) first_entry_at,
         MAX(last_entry.created_at) last_entry_at
       FROM products product
       LEFT JOIN categories category
         ON category.id = product.category_id AND category.tenant_id = product.tenant_id
       LEFT JOIN brands brand
         ON brand.id = product.brand_id AND brand.tenant_id = product.tenant_id
       LEFT JOIN tax_categories sales_tax
         ON sales_tax.id = product.sales_tax_category_id
        AND sales_tax.tenant_id = product.tenant_id
       LEFT JOIN commercial_product_profiles profile
         ON profile.product_id = product.id AND profile.tenant_id = product.tenant_id
       LEFT JOIN inventory_balances balance
         ON balance.product_id = product.id AND balance.tenant_id = product.tenant_id
       LEFT JOIN warehouses warehouse
         ON warehouse.id = balance.warehouse_id AND warehouse.tenant_id = balance.tenant_id
       LEFT JOIN LATERAL (
         SELECT created_at
         FROM inventory_movements movement
         WHERE movement.tenant_id = product.tenant_id
           AND movement.product_id = product.id
           AND movement.quantity > 0
         ORDER BY created_at ASC
         LIMIT 1
       ) first_entry ON TRUE
       LEFT JOIN LATERAL (
         SELECT created_at
         FROM inventory_movements movement
         WHERE movement.tenant_id = product.tenant_id
           AND movement.product_id = product.id
           AND movement.quantity > 0
         ORDER BY created_at DESC
         LIMIT 1
       ) last_entry ON TRUE
       WHERE product.tenant_id = $1
         AND product.deleted_at IS NULL
         AND product.product_kind <> 'VARIANT_PARENT'
         AND ($2::uuid IS NULL OR warehouse.branch_id = $2)
         AND ($3::uuid IS NULL OR balance.warehouse_id = $3)
       GROUP BY product.id, category.id, category.name, brand.id, brand.name,
                profile.id, sales_tax.rate
     ),
     sales_window AS (
       SELECT
         item.product_id,
         COALESCE(SUM(item.quantity), 0) units_sold,
         COALESCE(SUM(item.line_total), 0) sales_amount,
         -- Los precios del punto de venta son IVA incluido. El impuesto pasa por
         -- la caja pero no es ingreso: contarlo como margen haría parecer
         -- rentable justo el producto que se vende al costo.
         COALESCE(SUM(item.line_total - item.tax_amount), 0) net_sales_amount,
         COALESCE(
           SUM(item.line_total - item.tax_amount - (item.unit_cost * item.quantity)),
           0
         ) gross_margin_amount,
         MAX(sale.created_at) last_sale_at
       FROM sale_items item
       JOIN sales sale
         ON sale.id = item.sale_id
        AND sale.tenant_id = item.tenant_id
        AND sale.status = 'COMPLETED'
       JOIN settings ON settings.tenant_id = item.tenant_id
       WHERE item.tenant_id = $1
         AND sale.created_at >= CURRENT_DATE - settings.effective_period_days * INTERVAL '1 day'
         AND ($2::uuid IS NULL OR item.warehouse_id IN (
           SELECT id FROM warehouses WHERE tenant_id = $1 AND branch_id = $2
         ))
         AND ($3::uuid IS NULL OR item.warehouse_id = $3)
       GROUP BY item.product_id
     ),
     returns_window AS (
       SELECT
         item.product_id,
         COALESCE(SUM(item.quantity), 0) units_returned,
         COALESCE(SUM(item.subtotal), 0) net_returned_amount,
         COALESCE(
           SUM(item.subtotal - (item.unit_cost * item.quantity)),
           0
         ) returned_margin_amount
       FROM sale_return_items item
       JOIN sale_returns header
         ON header.id = item.sale_return_id
        AND header.company_id = item.company_id
        AND header.status = 'COMPLETED'
       JOIN settings ON settings.tenant_id = item.company_id
       WHERE item.company_id = $1
         AND header.created_at >= CURRENT_DATE - settings.effective_period_days * INTERVAL '1 day'
         AND ($2::uuid IS NULL OR item.warehouse_id IN (
           SELECT id FROM warehouses WHERE tenant_id = $1 AND branch_id = $2
         ))
         AND ($3::uuid IS NULL OR item.warehouse_id = $3)
       GROUP BY item.product_id
     ),
     active_campaigns AS (
       SELECT cp.product_id, COUNT(*)::integer active_campaign_count
       FROM commercial_campaign_products cp
       JOIN commercial_campaigns campaign
         ON campaign.id = cp.campaign_id AND campaign.tenant_id = cp.tenant_id
       WHERE cp.tenant_id = $1
         AND campaign.status IN ('PLANNED','APPROVED','ACTIVE')
       GROUP BY cp.product_id
     ),
     season_flags AS (
       SELECT
         product_season.product_id,
         string_agg(season.name, ', ' ORDER BY season.starts_on) season_names,
         BOOL_OR(CURRENT_DATE BETWEEN season.starts_on AND season.ends_on) in_season,
         BOOL_OR(season.starts_on BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days') upcoming_season
       FROM commercial_product_seasons product_season
       JOIN commercial_seasons season
         ON season.id = product_season.season_id
        AND season.tenant_id = product_season.tenant_id
        AND season.active = TRUE
       WHERE product_season.tenant_id = $1
         AND ($11::uuid IS NULL OR season.id = $11)
       GROUP BY product_season.product_id
     ),
     calculated AS (
       SELECT
         scope.*,
         COALESCE(sales.units_sold, 0) units_sold,
         COALESCE(returns.units_returned, 0) units_returned,
         GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0) net_units_sold,
         COALESCE(sales.sales_amount, 0) sales_amount,
         GREATEST(
           COALESCE(sales.net_sales_amount, 0) - COALESCE(returns.net_returned_amount, 0),
           0
         ) net_sales_amount,
         COALESCE(sales.gross_margin_amount, 0)
           - COALESCE(returns.returned_margin_amount, 0) gross_margin_amount,
         -- El porcentaje se mide contra la venta sin IVA y neta de devoluciones,
         -- que es la misma base con la que se calculó el margen.
         CASE WHEN COALESCE(sales.net_sales_amount, 0) - COALESCE(returns.net_returned_amount, 0) > 0
           THEN ROUND((
             (COALESCE(sales.gross_margin_amount, 0) - COALESCE(returns.returned_margin_amount, 0))
             / (COALESCE(sales.net_sales_amount, 0) - COALESCE(returns.net_returned_amount, 0))
           ) * 100, 4)
           -- Sin ventas en la ventana solo queda el margen teórico de lista. El
           -- precio también es IVA incluido, así que se le quita el impuesto de
           -- la categoría antes de compararlo con el costo.
           WHEN scope.net_sale_price > 0
           THEN ROUND(((scope.net_sale_price - scope.cost) / scope.net_sale_price) * 100, 4)
           ELSE 0
         END gross_margin_percent,
         sales.last_sale_at,
         CASE WHEN sales.last_sale_at IS NULL THEN NULL
           ELSE EXTRACT(DAY FROM CURRENT_TIMESTAMP - sales.last_sale_at)::integer
         END days_since_last_sale,
         CASE WHEN scope.first_entry_at IS NULL THEN NULL
           ELSE EXTRACT(DAY FROM CURRENT_TIMESTAMP - scope.first_entry_at)::integer
         END days_since_first_entry,
         ROUND(
           GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0)
           / GREATEST(settings.effective_period_days, 1),
           6
         ) sales_velocity,
         CASE
           WHEN GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0) = 0 THEN NULL
           ELSE ROUND(scope.stock_on_hand / (
             GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0)
             / GREATEST(settings.effective_period_days, 1)
           ), 2)
         END coverage_days,
         CASE
           WHEN GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0) >= settings.high_rotation_min_units THEN 'HIGH'
           WHEN GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0) >= settings.medium_rotation_min_units THEN 'MEDIUM'
           WHEN GREATEST(COALESCE(sales.units_sold, 0) - COALESCE(returns.units_returned, 0), 0) >= settings.low_rotation_min_units THEN 'LOW'
           ELSE 'NONE'
         END rotation_class,
         CASE
           WHEN season.product_id IS NULL THEN 'NOT_SEASONAL'
           WHEN season.in_season THEN 'IN_SEASON'
           WHEN season.upcoming_season THEN 'UPCOMING'
           ELSE 'OUT_OF_SEASON'
         END season_context,
         COALESCE(season.season_names, '') season_names,
         COALESCE(campaign.active_campaign_count, 0) active_campaign_count,
         settings.high_stock_units,
         settings.stale_days_threshold,
         settings.good_margin_percent,
         settings.new_product_launch_days,
         settings.coverage_risk_days,
         settings.coverage_excess_days,
         settings.effective_period_days analysis_period_days,
         -- El dinero que está quieto en la bodega. Es la cifra que convierte
         -- "tengo 45 unidades" en una decisión: son cuatro millones sin usar.
         ROUND(scope.stock_on_hand * scope.cost, 2) immobilized_capital
       FROM scope
       CROSS JOIN settings
       LEFT JOIN sales_window sales ON sales.product_id = scope.product_id
       LEFT JOIN returns_window returns ON returns.product_id = scope.product_id
       LEFT JOIN active_campaigns campaign ON campaign.product_id = scope.product_id
       LEFT JOIN season_flags season ON season.product_id = scope.product_id
     ),
     enriquecido AS (
     SELECT *,
       -- La cobertura clasifica lo que la rotación por unidades no ve: un
       -- producto puede vender poco y estar a punto de agotarse, o vender
       -- bastante y aun así tener inventario para medio año.
       CASE
         WHEN stock_on_hand <= 0 THEN 'AGOTADO'
         WHEN coverage_days IS NULL THEN 'SIN_VENTAS'
         WHEN coverage_days <= coverage_risk_days THEN 'RIESGO'
         WHEN coverage_days >= coverage_excess_days THEN 'EXCESO'
         ELSE 'SANA'
       END coverage_class,
       CASE
         WHEN gross_margin_percent >= good_margin_percent
          AND stock_on_hand >= high_stock_units
          AND (days_since_last_sale IS NULL OR days_since_last_sale >= stale_days_threshold)
          THEN 'Oportunidad comercial: inventario elevado, buen margen y baja rotación. Considere crear una campaña.'
         WHEN is_new_product = TRUE
          AND active_campaign_count = 0
          AND COALESCE(days_since_first_entry, 0) >= new_product_launch_days
          THEN 'Producto nuevo pendiente de lanzamiento.'
         WHEN season_context = 'UPCOMING' AND active_campaign_count = 0
          THEN 'Temporada próxima sin campaña activa.'
         WHEN rotation_class IN ('LOW','NONE') AND active_campaign_count = 0
          THEN 'Producto por impulsar: baja rotación sin campaña activa.'
         ELSE NULL
       END recommendation
     FROM calculated
     )
     SELECT *,
       -- Lo que hay que hacer con este producto, dicho en la unidad en que se
       -- decide: días. "Quedan seis días de inventario" mueve a alguien;
       -- "rotación alta" no.
       CASE
         WHEN coverage_class = 'AGOTADO' THEN 'Sin existencias. Reponer si sigue vigente.'
         WHEN coverage_class = 'RIESGO'
          THEN 'Al ritmo actual quedan aproximadamente ' || ROUND(coverage_days)::text
               || ' días de inventario.'
         WHEN coverage_class = 'EXCESO'
          THEN 'Inventario para aproximadamente ' || ROUND(coverage_days)::text
               || ' días. Hay capital detenido aquí.'
         ELSE NULL
       END coverage_note
     FROM enriquecido
     WHERE ($4::text IS NULL OR rotation_class = $4)
       AND ($5::text IS NULL OR commercial_priority = $5)
       AND ($6::boolean IS NULL OR is_new_product = $6)
       AND ($7::text IS NULL OR ($7 = 'WITH' AND active_campaign_count > 0) OR ($7 = 'WITHOUT' AND active_campaign_count = 0))
       AND ($8::numeric IS NULL OR stock_on_hand >= $8)
       AND ($9::numeric IS NULL OR stock_on_hand <= $9)
       AND ($10::numeric IS NULL OR gross_margin_percent >= $10)
       AND ($12::numeric IS NULL OR gross_margin_percent <= $12)
       AND ($13::numeric IS NULL OR COALESCE(days_since_last_sale, 999999) >= $13)
       AND ($15::text IS NULL OR coverage_class = $15)
       ${opportunitiesOnly ? `AND (
         rotation_class IN ('LOW','NONE')
         OR is_new_product = TRUE
         OR requires_launch = TRUE
         OR push_candidate = TRUE
         OR season_context = 'UPCOMING'
         OR stock_on_hand >= high_stock_units
         OR commercial_priority IN ('HIGH','URGENT')
       )` : ''}
`;
}

// El orden lo aplica la paginación en la consulta externa, no aquí dentro: el
// orden de un CTE no está garantizado y recortar fuera lo que se ordenó dentro
// puede devolver páginas que no encajan.
const ROTATION_ORDER = `
  CASE commercial_priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
  CASE rotation_class WHEN 'NONE' THEN 0 WHEN 'LOW' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
  stock_on_hand DESC,
  product_name`;

async function loadRotationRows(req, { opportunitiesOnly = false, coverage = null } = {}) {
  const filters = { ...buildRotationFilters(req), ...(coverage ? { coverage } : {}) };
  if (filters.rotation && !['HIGH', 'MEDIUM', 'LOW', 'NONE'].includes(filters.rotation)) {
    throw new AppError('La rotación solicitada no es válida.', 422, 'INVALID_ROTATION_FILTER');
  }
  if (filters.priority && !COMMERCIAL_PRIORITIES.has(filters.priority)) {
    throw new AppError('La prioridad solicitada no es válida.', 422, 'INVALID_PRIORITY_FILTER');
  }
  if (filters.campaign && !['WITH', 'WITHOUT'].includes(filters.campaign.toUpperCase())) {
    throw new AppError('El filtro de campaña no es válido.', 422, 'INVALID_CAMPAIGN_FILTER');
  }
  if (filters.coverage && !COVERAGE_CLASSES.has(filters.coverage)) {
    throw new AppError('La cobertura solicitada no es válida.', 422, 'INVALID_COVERAGE_FILTER');
  }
  // La consulta recorría el catálogo entero sin límite. En una empresa con
  // miles de referencias eso es una respuesta que nadie lee completa y una
  // consulta que se degrada sola con el tiempo.
  const pagination = parsePagination(req);
  const page = paginatedQuery(rotationQuery({ opportunitiesOnly }), [
    req.context.tenantId,
    filters.branchId,
    filters.warehouseId,
    filters.rotation,
    filters.priority,
    filters.onlyNew,
    filters.campaign?.toUpperCase() || null,
    filters.minStock,
    filters.maxStock,
    filters.minMargin,
    filters.seasonId,
    filters.maxMargin,
    filters.daysWithoutSale,
    filters.periodDays,
    filters.coverage,
  ], pagination, ROTATION_ORDER);
  const result = await query(page.text, page.values);
  return paginatedResponse(result, pagination, 'products');
}

router.get('/overview', asyncHandler(async (req, res) => {
  const filterBranchId = branchFilter(req);
  const result = await query(
    `WITH plan_scope AS (
       SELECT plan.*
       FROM commercial_plans plan
       WHERE plan.tenant_id = $1
         AND ($2::uuid IS NULL OR plan.branch_id = $2)
     ),
     current_plan AS (
       SELECT *
       FROM plan_scope
       WHERE status IN ('DRAFT','ACTIVE','REVIEW')
       ORDER BY
         CASE WHEN CURRENT_DATE BETWEEN period_start AND period_end THEN 0 ELSE 1 END,
         period_start DESC,
         created_at DESC
       LIMIT 1
     ),
     actuals AS (
       SELECT
         COALESCE((
           SELECT SUM(s.total)
           FROM current_plan plan
           JOIN sales s
             ON s.tenant_id = plan.tenant_id
            AND s.status = 'COMPLETED'
            AND s.created_at >= plan.period_start
            AND s.created_at < plan.period_end + INTERVAL '1 day'
           JOIN cash_sessions cs ON cs.id = s.cash_session_id
           JOIN cash_registers cr ON cr.id = cs.cash_register_id
           WHERE plan.id IS NOT NULL
             AND (plan.branch_id IS NULL OR cr.branch_id = plan.branch_id)
         ), 0) revenue,
         COALESCE((
           -- Mismo criterio que el resto del módulo: el IVA cobrado no es margen.
           SELECT SUM(si.line_total - si.tax_amount - (si.unit_cost * si.quantity))
           FROM current_plan plan
           JOIN sales s
             ON s.tenant_id = plan.tenant_id
            AND s.status = 'COMPLETED'
            AND s.created_at >= plan.period_start
            AND s.created_at < plan.period_end + INTERVAL '1 day'
           JOIN cash_sessions cs ON cs.id = s.cash_session_id
           JOIN cash_registers cr ON cr.id = cs.cash_register_id
           JOIN sale_items si ON si.sale_id = s.id AND si.tenant_id = s.tenant_id
           WHERE plan.id IS NOT NULL
             AND (plan.branch_id IS NULL OR cr.branch_id = plan.branch_id)
         ), 0) margin
     )
     SELECT
       (SELECT row_to_json(plan_row) FROM (
         SELECT plan.*, branch.name branch_name, owner.full_name owner_name
         FROM current_plan plan
         LEFT JOIN branches branch ON branch.id = plan.branch_id AND branch.tenant_id = plan.tenant_id
         LEFT JOIN users owner ON owner.id = plan.owner_user_id
       ) plan_row) current_plan,
       (SELECT COALESCE(json_agg(plan_row ORDER BY plan_row.period_start DESC), '[]'::json)
        FROM (
          SELECT plan.*, branch.name branch_name, owner.full_name owner_name,
                 COALESCE(SUM(initiative.expected_revenue), 0) initiative_revenue,
                 COUNT(initiative.id)::integer initiative_count
          FROM plan_scope plan
          LEFT JOIN branches branch ON branch.id = plan.branch_id AND branch.tenant_id = plan.tenant_id
          LEFT JOIN users owner ON owner.id = plan.owner_user_id
          LEFT JOIN commercial_plan_initiatives initiative
            ON initiative.plan_id = plan.id AND initiative.tenant_id = plan.tenant_id
          GROUP BY plan.id, branch.name, owner.full_name
          ORDER BY plan.period_start DESC, plan.created_at DESC
          LIMIT 12
        ) plan_row) plans,
       (SELECT COALESCE(json_agg(initiative_row ORDER BY initiative_row.due_date NULLS LAST, initiative_row.created_at DESC), '[]'::json)
        FROM (
          SELECT initiative.*, plan.name plan_name, responsible.full_name responsible_name
          FROM commercial_plan_initiatives initiative
          JOIN current_plan plan ON plan.id = initiative.plan_id AND plan.tenant_id = initiative.tenant_id
          LEFT JOIN users responsible ON responsible.id = initiative.responsible_user_id
          ORDER BY initiative.due_date NULLS LAST, initiative.created_at DESC
        ) initiative_row) initiatives,
       COALESCE((SELECT revenue FROM actuals), 0) actual_revenue,
       COALESCE((SELECT margin FROM actuals), 0) actual_margin,
       (SELECT COUNT(*)::integer FROM plan_scope WHERE status IN ('DRAFT','ACTIVE','REVIEW')) open_plans`,
    [req.context.tenantId, filterBranchId],
  );
  res.json(result.rows[0]);
}));

router.get('/people', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT user_account.id, user_account.full_name, user_account.email, tenant_user.role_code
     FROM tenant_users tenant_user
     JOIN users user_account ON user_account.id = tenant_user.user_id
     WHERE tenant_user.tenant_id = $1 AND user_account.status = 'ACTIVE'
     ORDER BY user_account.full_name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.get('/rotation-settings', asyncHandler(async (req, res) => {
  const result = await query(
    `INSERT INTO commercial_rotation_settings(tenant_id)
     VALUES($1)
     ON CONFLICT(tenant_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id
     RETURNING *`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.put(
  '/rotation-settings',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const payload = {
      analysisPeriodDays: numberValue(req.body.analysisPeriodDays, 'El período de análisis no es válido.', { min: 1, max: 730 }),
      highRotationMinUnits: numberValue(req.body.highRotationMinUnits, 'El umbral de alta rotación no es válido.'),
      mediumRotationMinUnits: numberValue(req.body.mediumRotationMinUnits, 'El umbral de rotación media no es válido.'),
      lowRotationMinUnits: numberValue(req.body.lowRotationMinUnits, 'El umbral de baja rotación no es válido.'),
      highStockUnits: numberValue(req.body.highStockUnits, 'El inventario alto no es válido.'),
      staleDaysThreshold: numberValue(req.body.staleDaysThreshold, 'Los días sin venta no son válidos.', { min: 1, max: 3650 }),
      goodMarginPercent: numberValue(req.body.goodMarginPercent, 'El margen objetivo no es válido.'),
      newProductLaunchDays: numberValue(req.body.newProductLaunchDays, 'Los días para lanzamiento no son válidos.', { min: 0, max: 365 }),
    };
    if (payload.highRotationMinUnits < payload.mediumRotationMinUnits ||
        payload.mediumRotationMinUnits < payload.lowRotationMinUnits) {
      throw new AppError('Los umbrales deben respetar alta >= media >= baja.', 422, 'INVALID_ROTATION_THRESHOLDS');
    }
    const updated = await withTransaction(async (client) => {
      const before = await client.query(
        'SELECT * FROM commercial_rotation_settings WHERE tenant_id = $1',
        [req.context.tenantId],
      );
      const result = await client.query(
        `INSERT INTO commercial_rotation_settings(
           tenant_id, analysis_period_days, high_rotation_min_units,
           medium_rotation_min_units, low_rotation_min_units, high_stock_units,
           stale_days_threshold, good_margin_percent, new_product_launch_days
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT(tenant_id) DO UPDATE SET
           analysis_period_days = EXCLUDED.analysis_period_days,
           high_rotation_min_units = EXCLUDED.high_rotation_min_units,
           medium_rotation_min_units = EXCLUDED.medium_rotation_min_units,
           low_rotation_min_units = EXCLUDED.low_rotation_min_units,
           high_stock_units = EXCLUDED.high_stock_units,
           stale_days_threshold = EXCLUDED.stale_days_threshold,
           good_margin_percent = EXCLUDED.good_margin_percent,
           new_product_launch_days = EXCLUDED.new_product_launch_days,
           updated_at = now()
         RETURNING *`,
        [
          req.context.tenantId,
          payload.analysisPeriodDays,
          payload.highRotationMinUnits,
          payload.mediumRotationMinUnits,
          payload.lowRotationMinUnits,
          payload.highStockUnits,
          payload.staleDaysThreshold,
          payload.goodMarginPercent,
          payload.newProductLaunchDays,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.rotation_settings.updated',
        entityType: 'commercial_rotation_settings',
        entityId: req.context.tenantId,
        before: before.rows[0] || null,
        after: result.rows[0],
        reason: 'Configuración de rotación comercial',
      });
      return result.rows[0];
    });
    res.json(updated);
  }),
);

router.get('/seasons', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT season.*,
            COUNT(product_season.product_id)::integer product_count
     FROM commercial_seasons season
     LEFT JOIN commercial_product_seasons product_season
       ON product_season.season_id = season.id
      AND product_season.tenant_id = season.tenant_id
     WHERE season.tenant_id = $1
       AND ($2::boolean IS NULL OR season.active = $2)
     GROUP BY season.id
     ORDER BY season.starts_on DESC, season.name`,
    [
      req.context.tenantId,
      req.query.active === undefined ? null : bool(req.query.active),
    ],
  );
  res.json(result.rows);
}));

router.post(
  '/seasons',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name, 160, true);
    const seasonType = enumValue(req.body.seasonType, SEASON_TYPES, 'CUSTOM', 'INVALID_SEASON_TYPE');
    const startsOn = date(req.body.startsOn, 'La fecha inicial de temporada no es válida.');
    const endsOn = date(req.body.endsOn, 'La fecha final de temporada no es válida.');
    if (endsOn < startsOn) {
      throw new AppError('La temporada debe terminar después de iniciar.', 422, 'INVALID_SEASON_RANGE');
    }
    const notes = cleanText(req.body.notes, 1000);
    const created = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO commercial_seasons(
           tenant_id, name, season_type, starts_on, ends_on, notes, created_by
         ) VALUES($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [req.context.tenantId, name, seasonType, startsOn, endsOn, notes, req.context.userId],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.season.created',
        entityType: 'commercial_season',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: `Temporada ${name}`,
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  }),
);

router.put(
  '/products/:productId/profile',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const productId = id(req.params.productId, 'El producto no es válido.');
    const lifecycle = enumValue(req.body.productLifecycle, PRODUCT_LIFECYCLES, 'PERMANENT', 'INVALID_PRODUCT_LIFECYCLE');
    const priority = enumValue(req.body.commercialPriority, COMMERCIAL_PRIORITIES, 'MEDIUM', 'INVALID_COMMERCIAL_PRIORITY');
    const suggestedLaunchDate = req.body.suggestedLaunchDate
      ? date(req.body.suggestedLaunchDate, 'La fecha sugerida de lanzamiento no es válida.')
      : null;
    const seasonIds = Array.isArray(req.body.seasonIds) ? req.body.seasonIds : [];
    const marketingNotes = cleanText(req.body.marketingNotes, 2000);
    const saved = await withTransaction(async (client) => {
      await assertProduct(client, req.context.tenantId, productId);
      for (const seasonId of seasonIds) {
        await assertSeason(client, req.context.tenantId, id(seasonId, 'La temporada no es válida.'));
      }
      const before = await client.query(
        'SELECT * FROM commercial_product_profiles WHERE tenant_id = $1 AND product_id = $2',
        [req.context.tenantId, productId],
      );
      const result = await client.query(
        `INSERT INTO commercial_product_profiles(
           tenant_id, product_id, product_lifecycle, is_new_product,
           requires_launch, push_candidate, commercial_priority,
           suggested_launch_date, marketing_notes, updated_by, created_by
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
         ON CONFLICT(tenant_id, product_id) DO UPDATE SET
           product_lifecycle = EXCLUDED.product_lifecycle,
           is_new_product = EXCLUDED.is_new_product,
           requires_launch = EXCLUDED.requires_launch,
           push_candidate = EXCLUDED.push_candidate,
           commercial_priority = EXCLUDED.commercial_priority,
           suggested_launch_date = EXCLUDED.suggested_launch_date,
           marketing_notes = EXCLUDED.marketing_notes,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()
         RETURNING *`,
        [
          req.context.tenantId,
          productId,
          lifecycle,
          bool(req.body.isNewProduct),
          bool(req.body.requiresLaunch),
          bool(req.body.pushCandidate),
          priority,
          suggestedLaunchDate,
          marketingNotes,
          req.context.userId,
        ],
      );
      await client.query(
        'DELETE FROM commercial_product_seasons WHERE tenant_id = $1 AND product_id = $2',
        [req.context.tenantId, productId],
      );
      for (const seasonId of seasonIds) {
        await client.query(
          `INSERT INTO commercial_product_seasons(tenant_id, product_id, season_id, created_by)
           VALUES($1,$2,$3,$4)
           ON CONFLICT DO NOTHING`,
          [req.context.tenantId, productId, seasonId, req.context.userId],
        );
      }
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.product_profile.updated',
        entityType: 'commercial_product_profile',
        entityId: result.rows[0].id,
        before: before.rows[0] || null,
        after: { ...result.rows[0], seasonIds },
        reason: 'Clasificación comercial del producto',
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);


// ¿Dónde está mi dinero inmovilizado? Un inventario grande no es riqueza: es
// capital que ya se pagó y todavía no volvió. Esta consulta lo agrupa por donde
// se toman las decisiones —categoría, sucursal, bodega— en vez de dejar una
// lista de miles de productos que nadie lee.
const CAPITAL_GROUPINGS = {
  product: { column: 'product.id', label: "product.name || ' · ' || product.sku", extra: 'product.sku' },
  category: { column: 'category.id', label: "COALESCE(category.name, 'Sin categoría')", extra: 'NULL' },
  brand: { column: 'brand.id', label: "COALESCE(brand.name, 'Sin marca')", extra: 'NULL' },
  branch: { column: 'branch.id', label: 'branch.name', extra: 'NULL' },
  warehouse: { column: 'warehouse.id', label: 'warehouse.name', extra: 'warehouse.code' },
};

router.get('/immobilized-capital', asyncHandler(async (req, res) => {
  const requested = cleanText(req.query.groupBy, 20)?.toLowerCase() || 'category';
  const grouping = CAPITAL_GROUPINGS[requested];
  if (!grouping) {
    throw new AppError(
      `El agrupamiento debe ser uno de: ${Object.keys(CAPITAL_GROUPINGS).join(', ')}.`,
      422,
      'INVALID_CAPITAL_GROUPING',
    );
  }
  const pagination = parsePagination(req);
  const page = paginatedQuery(
    `SELECT ${grouping.column} group_id,
            ${grouping.label} group_label,
            ${grouping.extra} group_code,
            COUNT(DISTINCT product.id)::integer product_count,
            SUM(balance.on_hand) units,
            ROUND(SUM(balance.on_hand * product.cost), 2) immobilized_capital,
            ROUND(AVG(product.cost), 2) average_cost
     FROM inventory_balances balance
     JOIN products product
       ON product.id = balance.product_id AND product.tenant_id = balance.tenant_id
     JOIN warehouses warehouse
       ON warehouse.id = balance.warehouse_id AND warehouse.tenant_id = balance.tenant_id
     JOIN branches branch ON branch.id = warehouse.branch_id
     LEFT JOIN categories category
       ON category.id = product.category_id AND category.tenant_id = product.tenant_id
     LEFT JOIN brands brand
       ON brand.id = product.brand_id AND brand.tenant_id = product.tenant_id
     WHERE balance.tenant_id = $1
       AND balance.on_hand > 0
       AND product.deleted_at IS NULL
       AND ($2::uuid IS NULL OR warehouse.branch_id = $2)
       AND ($3::uuid IS NULL OR balance.warehouse_id = $3)
     GROUP BY 1, 2, 3`,
    [
      req.context.tenantId,
      branchFilter(req),
      optionalId(req.query.warehouseId, 'La bodega no es válida.'),
    ],
    pagination,
    'immobilized_capital DESC NULLS LAST',
  );
  const [rows, total] = await Promise.all([
    query(page.text, page.values),
    query(
      `SELECT ROUND(SUM(balance.on_hand * product.cost), 2) immobilized_capital,
              SUM(balance.on_hand) units,
              COUNT(DISTINCT product.id)::integer product_count
       FROM inventory_balances balance
       JOIN products product
         ON product.id = balance.product_id AND product.tenant_id = balance.tenant_id
       JOIN warehouses warehouse
         ON warehouse.id = balance.warehouse_id AND warehouse.tenant_id = balance.tenant_id
       WHERE balance.tenant_id = $1
         AND balance.on_hand > 0
         AND product.deleted_at IS NULL
         AND ($2::uuid IS NULL OR warehouse.branch_id = $2)
         AND ($3::uuid IS NULL OR balance.warehouse_id = $3)`,
      [
        req.context.tenantId,
        branchFilter(req),
        optionalId(req.query.warehouseId, 'La bodega no es válida.'),
      ],
    ),
  ]);
  res.json({
    groupBy: requested,
    ...paginatedResponse(rows, pagination, 'groups'),
    totals: {
      immobilizedCapital: Number(total.rows[0]?.immobilized_capital || 0),
      units: Number(total.rows[0]?.units || 0),
      productCount: total.rows[0]?.product_count || 0,
    },
    note: 'Capital inmovilizado = existencias por costo unitario. No incluye mercancía en tránsito.',
  });
}));

router.get('/rotation', asyncHandler(async (req, res) => {
  res.json(await loadRotationRows(req));
}));

router.get('/opportunities', asyncHandler(async (req, res) => {
  res.json(await loadRotationRows(req, { opportunitiesOnly: true }));
}));

// ¿Qué productos debería mover entre sucursales? El caso clásico: la sucursal A
// tiene inventario alto y rotación baja, la B lo vende y se le está acabando.
// La misma mercancía, quieta en un sitio y faltando en otro.
//
// Esto solo sugiere. Nunca ejecuta un traslado: mover mercancía tiene costo,
// contexto y responsable, y esas tres cosas las pone una persona. El traslado
// se registra por la ruta de inventario de siempre, con su aprobación.
router.get('/transfer-suggestions', asyncHandler(async (req, res) => {
  const pagination = parsePagination(req);
  const page = paginatedQuery(
    `WITH settings AS (
       SELECT *, COALESCE($2::integer, analysis_period_days) period_days
       FROM commercial_rotation_settings
       WHERE tenant_id = $1
     ),
     stock_por_sucursal AS (
       SELECT balance.product_id,
              warehouse.branch_id,
              SUM(balance.on_hand - balance.reserved) available,
              MAX(product.cost) cost,
              MAX(product.sku) sku,
              MAX(product.name) product_name
       FROM inventory_balances balance
       JOIN products product
         ON product.id = balance.product_id AND product.tenant_id = balance.tenant_id
       JOIN warehouses warehouse
         ON warehouse.id = balance.warehouse_id AND warehouse.tenant_id = balance.tenant_id
       WHERE balance.tenant_id = $1
         AND product.deleted_at IS NULL
         AND product.active = TRUE
         AND warehouse.active = TRUE
       GROUP BY 1, 2
     ),
     ventas_por_sucursal AS (
       SELECT item.product_id,
              warehouse.branch_id,
              SUM(item.quantity) units_sold
       FROM sale_items item
       JOIN sales sale
         ON sale.id = item.sale_id
        AND sale.tenant_id = item.tenant_id
        AND sale.status = 'COMPLETED'
       JOIN warehouses warehouse
         ON warehouse.id = item.warehouse_id AND warehouse.tenant_id = item.tenant_id
       CROSS JOIN settings
       WHERE item.tenant_id = $1
         AND sale.created_at >= CURRENT_DATE - settings.period_days * INTERVAL '1 day'
       GROUP BY 1, 2
     ),
     situacion AS (
       SELECT stock.product_id, stock.branch_id, stock.sku, stock.product_name,
              stock.cost, stock.available,
              branch.name branch_name,
              COALESCE(ventas.units_sold, 0) units_sold,
              COALESCE(ventas.units_sold, 0) / GREATEST(settings.period_days, 1) velocity,
              settings.coverage_risk_days, settings.coverage_excess_days,
              settings.transfer_min_units
       FROM stock_por_sucursal stock
       JOIN branches branch ON branch.id = stock.branch_id
       CROSS JOIN settings
       LEFT JOIN ventas_por_sucursal ventas
         ON ventas.product_id = stock.product_id AND ventas.branch_id = stock.branch_id
     ),
     origenes AS (
       SELECT *,
              -- Lo que la sucursal necesita conservar para cubrir su propio
              -- horizonte. Si no lo vende, no necesita conservar nada.
              FLOOR(available - velocity * coverage_excess_days) surplus
       FROM situacion
       WHERE available > 0
         AND (velocity = 0 OR available > velocity * coverage_excess_days)
     ),
     destinos AS (
       SELECT *,
              -- Se repone hasta el doble del umbral de riesgo: lo justo para
              -- salir del apuro sin trasladar el problema a la otra sucursal.
              CEIL(velocity * coverage_risk_days * 2 - available) need
       FROM situacion
       WHERE velocity > 0
         AND available < velocity * coverage_risk_days
     )
     SELECT DISTINCT ON (destino.product_id, destino.branch_id)
       destino.product_id, destino.sku, destino.product_name,
       origen.branch_id source_branch_id, origen.branch_name source_branch_name,
       origen.available source_available, origen.units_sold source_units_sold,
       ROUND(origen.velocity, 4) source_velocity,
       destino.branch_id destination_branch_id,
       destino.branch_name destination_branch_name,
       destino.available destination_available,
       destino.units_sold destination_units_sold,
       ROUND(destino.velocity, 4) destination_velocity,
       CASE WHEN destino.velocity > 0
         THEN ROUND(destino.available / destino.velocity, 1)
         ELSE NULL
       END destination_coverage_days,
       LEAST(origen.surplus, destino.need) suggested_quantity,
       ROUND(LEAST(origen.surplus, destino.need) * destino.cost, 2) suggested_value,
       'Sucursal ' || origen.branch_name || ': inventario alto y rotación baja. '
         || 'Sucursal ' || destino.branch_name || ': inventario bajo y rotación alta.'
         reason
     FROM destinos destino
     JOIN origenes origen
       ON origen.product_id = destino.product_id
      AND origen.branch_id <> destino.branch_id
     WHERE LEAST(origen.surplus, destino.need) >= destino.transfer_min_units
       AND ($3::uuid IS NULL OR destino.branch_id = $3 OR origen.branch_id = $3)
     -- Entre varios orígenes posibles se propone el que más puede ceder: es el
     -- que menos nota la salida.
     ORDER BY destino.product_id, destino.branch_id, origen.surplus DESC`,
    [
      req.context.tenantId,
      parseAnalysisPeriod(req.query.periodDays),
      branchFilter(req),
    ],
    pagination,
    'suggested_value DESC NULLS LAST, product_name',
  );
  const result = await query(page.text, page.values);
  res.json({
    ...paginatedResponse(result, pagination, 'suggestions'),
    note: 'Sugerencias basadas en rotación por sucursal. Ninguna se ejecuta sola: '
      + 'el traslado se registra desde Inventario, con su aprobación y su motivo.',
  });
}));

// ¿Qué productos están próximos a agotarse? Es la vista de riesgo, ordenada por
// lo que primero se acaba y no por lo que más se vende.
router.get('/stockout-risk', asyncHandler(async (req, res) => {
  const page = await loadRotationRows(req, { coverage: 'RIESGO' });
  res.json({
    ...page,
    note: 'Días estimados al ritmo de venta del período analizado. '
      + 'Un producto sin ventas en el período no aparece aquí: no tiene ritmo con el que estimar.',
  });
}));


router.post(
  '/opportunities/:productId/follow-up',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const productId = id(req.params.productId, 'El producto no es válido.');
    const branchId = optionalId(req.body.branchId, 'La sucursal no es válida.');
    const warehouseId = optionalId(req.body.warehouseId, 'La bodega no es válida.');
    const reason = cleanText(req.body.reason, 500) || 'Seguimiento comercial';
    const saved = await withTransaction(async (client) => {
      await assertProduct(client, req.context.tenantId, productId);
      await assertBranch(client, req.context.tenantId, branchId);
      const result = await client.query(
        `INSERT INTO commercial_opportunity_actions(
           tenant_id, product_id, branch_id, warehouse_id, action_type, reason, created_by
         ) VALUES($1,$2,$3,$4,'FOLLOW_UP',$5,$6)
         RETURNING *`,
        [req.context.tenantId, productId, branchId, warehouseId, reason, req.context.userId],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.opportunity.follow_up',
        entityType: 'commercial_opportunity_action',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason,
      });
      return result.rows[0];
    });
    res.status(201).json(saved);
  }),
);

router.post(
  '/budgets',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name, 160, true);
    const budgetType = enumValue(req.body.budgetType, BUDGET_TYPES, 'MONTHLY', 'INVALID_BUDGET_TYPE');
    const periodStart = date(req.body.periodStart, 'La fecha inicial del presupuesto no es válida.');
    const periodEnd = date(req.body.periodEnd, 'La fecha final del presupuesto no es válida.');
    if (periodEnd < periodStart) {
      throw new AppError('El presupuesto debe terminar después de iniciar.', 422, 'INVALID_BUDGET_RANGE');
    }
    const responsibleUserId = optionalId(req.body.responsibleUserId, 'La persona responsable no es válida.');
    const created = await withTransaction(async (client) => {
      await assertUser(client, req.context.tenantId, responsibleUserId);
      const result = await client.query(
        `INSERT INTO commercial_marketing_budgets(
           tenant_id, name, budget_type, period_start, period_end, total_budget,
           status, responsible_user_id, notes, created_by
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *, total_budget - committed_budget available_budget`,
        [
          req.context.tenantId,
          name,
          budgetType,
          periodStart,
          periodEnd,
          money(req.body.totalBudget, 'El presupuesto total no es válido.'),
          enumValue(req.body.status, BUDGET_STATUSES, 'ACTIVE'),
          responsibleUserId,
          cleanText(req.body.notes, 2000),
          req.context.userId,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.budget.created',
        entityType: 'commercial_marketing_budget',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: `Presupuesto ${name}`,
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  }),
);

router.get('/budgets', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT budget.*, budget.total_budget - budget.committed_budget available_budget,
            owner.full_name responsible_name
     FROM commercial_marketing_budgets budget
     LEFT JOIN users owner ON owner.id = budget.responsible_user_id
     WHERE budget.tenant_id = $1
     ORDER BY budget.period_start DESC, budget.created_at DESC
     LIMIT 24`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post(
  '/campaigns',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name, 160, true);
    const startsOn = date(req.body.startsOn, 'La fecha inicial de campaña no es válida.');
    const endsOn = date(req.body.endsOn, 'La fecha final de campaña no es válida.');
    if (endsOn < startsOn) {
      throw new AppError('La campaña debe terminar después de iniciar.', 422, 'INVALID_CAMPAIGN_RANGE');
    }
    const branchId = optionalId(req.body.branchId, 'La sucursal no es válida.');
    const budgetId = optionalId(req.body.budgetId, 'El presupuesto no es válido.');
    const responsibleUserId = optionalId(req.body.responsibleUserId, 'La persona responsable no es válida.');
    const productIds = Array.isArray(req.body.productIds) ? req.body.productIds : [];
    const created = await withTransaction(async (client) => {
      await assertBranch(client, req.context.tenantId, branchId);
      await assertUser(client, req.context.tenantId, responsibleUserId);
      for (const productId of productIds) {
        await assertProduct(client, req.context.tenantId, id(productId, 'El producto no es válido.'));
      }
      if (budgetId) {
        const budget = await client.query(
          'SELECT id FROM commercial_marketing_budgets WHERE tenant_id = $1 AND id = $2',
          [req.context.tenantId, budgetId],
        );
        if (!budget.rowCount) {
          throw new AppError('El presupuesto no pertenece a la empresa activa.', 404, 'COMMERCIAL_BUDGET_NOT_FOUND');
        }
      }
      const approvedBudget = money(req.body.approvedBudget, 'El presupuesto aprobado no es válido.');
      const result = await client.query(
        `INSERT INTO commercial_campaigns(
           tenant_id, branch_id, budget_id, name, objective, description,
           starts_on, ends_on, requested_budget, approved_budget,
           responsible_user_id, channel, status, observations, created_by
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          req.context.tenantId,
          branchId,
          budgetId,
          name,
          enumValue(req.body.objective, CAMPAIGN_OBJECTIVES, 'INCREASE_SALES', 'INVALID_CAMPAIGN_OBJECTIVE'),
          cleanText(req.body.description, 2000),
          startsOn,
          endsOn,
          money(req.body.requestedBudget, 'El presupuesto solicitado no es válido.'),
          approvedBudget,
          responsibleUserId,
          enumValue(req.body.channel, CAMPAIGN_CHANNELS, 'STORE', 'INVALID_CAMPAIGN_CHANNEL'),
          enumValue(req.body.status, CAMPAIGN_STATUSES, 'PLANNED', 'INVALID_CAMPAIGN_STATUS'),
          cleanText(req.body.observations, 2000),
          req.context.userId,
        ],
      );
      for (const productId of productIds) {
        await client.query(
          `INSERT INTO commercial_campaign_products(tenant_id, campaign_id, product_id, created_by)
           VALUES($1,$2,$3,$4)
           ON CONFLICT DO NOTHING`,
          [req.context.tenantId, result.rows[0].id, productId, req.context.userId],
        );
      }
      if (budgetId && approvedBudget > 0) {
        await client.query(
          `UPDATE commercial_marketing_budgets
           SET committed_budget = committed_budget + $3, updated_at = now()
           WHERE tenant_id = $1 AND id = $2`,
          [req.context.tenantId, budgetId, approvedBudget],
        );
      }
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.campaign.created',
        entityType: 'commercial_campaign',
        entityId: result.rows[0].id,
        after: { ...result.rows[0], productIds },
        reason: `Campaña ${name}`,
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  }),
);

router.get('/campaigns', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT campaign.*, branch.name branch_name, budget.name budget_name,
            owner.full_name responsible_name,
            COUNT(product.product_id)::integer product_count
     FROM commercial_campaigns campaign
     LEFT JOIN branches branch
       ON branch.id = campaign.branch_id AND branch.tenant_id = campaign.tenant_id
     LEFT JOIN commercial_marketing_budgets budget
       ON budget.id = campaign.budget_id AND budget.tenant_id = campaign.tenant_id
     LEFT JOIN users owner ON owner.id = campaign.responsible_user_id
     LEFT JOIN commercial_campaign_products product
       ON product.campaign_id = campaign.id AND product.tenant_id = campaign.tenant_id
     WHERE campaign.tenant_id = $1
     GROUP BY campaign.id, branch.name, budget.name, owner.full_name
     ORDER BY campaign.starts_on DESC, campaign.created_at DESC
     LIMIT 50`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post(
  '/expenses',
  requireAnyPermission(['commercial_planning.manage', 'commercial_planning.marketing']),
  asyncHandler(async (req, res) => {
    const campaignId = optionalId(req.body.campaignId, 'La campaña no es válida.');
    const budgetId = optionalId(req.body.budgetId, 'El presupuesto no es válido.');
    const expenseType = enumValue(req.body.expenseType, EXPENSE_TYPES, 'OTHER', 'INVALID_MARKETING_EXPENSE_TYPE');
    const status = enumValue(req.body.status, EXPENSE_STATUSES, 'COMMITTED', 'INVALID_MARKETING_EXPENSE_STATUS');
    const amount = money(req.body.amount, 'El gasto de marketing no es válido.');
    const expenseDate = req.body.expenseDate
      ? date(req.body.expenseDate, 'La fecha del gasto no es válida.')
      : new Date().toISOString().slice(0, 10);
    const description = cleanText(req.body.description, 500, true);
    const created = await withTransaction(async (client) => {
      if (campaignId) {
        const campaign = await client.query(
          'SELECT id FROM commercial_campaigns WHERE tenant_id = $1 AND id = $2',
          [req.context.tenantId, campaignId],
        );
        if (!campaign.rowCount) {
          throw new AppError('La campaña no pertenece a la empresa activa.', 404, 'COMMERCIAL_CAMPAIGN_NOT_FOUND');
        }
      }
      if (budgetId) {
        const budget = await client.query(
          'SELECT id FROM commercial_marketing_budgets WHERE tenant_id = $1 AND id = $2',
          [req.context.tenantId, budgetId],
        );
        if (!budget.rowCount) {
          throw new AppError('El presupuesto no pertenece a la empresa activa.', 404, 'COMMERCIAL_BUDGET_NOT_FOUND');
        }
      }
      const result = await client.query(
        `INSERT INTO commercial_marketing_expenses(
           tenant_id, campaign_id, budget_id, expense_type, description,
           amount, expense_date, status, reference, created_by
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          req.context.tenantId,
          campaignId,
          budgetId,
          expenseType,
          description,
          amount,
          expenseDate,
          status,
          cleanText(req.body.reference, 120),
          req.context.userId,
        ],
      );
      if (budgetId) {
        await client.query(
          `UPDATE commercial_marketing_budgets
           SET committed_budget = committed_budget + CASE WHEN $3 = 'COMMITTED' THEN $4 ELSE 0 END,
               actual_spend = actual_spend + CASE WHEN $3 = 'SPENT' THEN $4 ELSE 0 END,
               updated_at = now()
           WHERE tenant_id = $1 AND id = $2`,
          [req.context.tenantId, budgetId, status, amount],
        );
      }
      if (campaignId) {
        await client.query(
          `UPDATE commercial_campaigns
           SET actual_spend = actual_spend + CASE WHEN $3 = 'SPENT' THEN $4 ELSE 0 END,
               updated_at = now()
           WHERE tenant_id = $1 AND id = $2`,
          [req.context.tenantId, campaignId, status, amount],
        );
      }
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'commercial_planning.expense.created',
        entityType: 'commercial_marketing_expense',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: `Gasto de marketing ${description}`,
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  }),
);

router.get('/expenses', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT expense.*, campaign.name campaign_name, budget.name budget_name
     FROM commercial_marketing_expenses expense
     LEFT JOIN commercial_campaigns campaign
       ON campaign.id = expense.campaign_id AND campaign.tenant_id = expense.tenant_id
     LEFT JOIN commercial_marketing_budgets budget
       ON budget.id = expense.budget_id AND budget.tenant_id = expense.tenant_id
     WHERE expense.tenant_id = $1
     ORDER BY expense.expense_date DESC, expense.created_at DESC
     LIMIT 100`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.get('/campaigns/:campaignId/results', asyncHandler(async (req, res) => {
  const campaignId = id(req.params.campaignId, 'La campaña no es válida.');
  const result = await query(
    `WITH campaign AS (
       SELECT *
       FROM commercial_campaigns
       WHERE tenant_id = $1 AND id = $2
     ),
     product_scope AS (
       SELECT product_id
       FROM commercial_campaign_products
       WHERE tenant_id = $1 AND campaign_id = $2
     ),
     sales_totals AS (
       SELECT
         COALESCE(SUM(item.quantity), 0) units_sold,
         COALESCE(SUM(item.line_total), 0) sales_amount,
         COALESCE(SUM(item.line_total - item.tax_amount), 0) net_sales_amount,
         -- Igual que en rotación: el IVA cobrado no es margen de la campaña.
         COALESCE(
           SUM(item.line_total - item.tax_amount - (item.unit_cost * item.quantity)),
           0
         ) gross_margin_amount
       FROM campaign
       JOIN sales sale
         ON sale.tenant_id = campaign.tenant_id
        AND sale.status = 'COMPLETED'
        AND sale.created_at >= campaign.starts_on
        AND sale.created_at < campaign.ends_on + INTERVAL '1 day'
       JOIN sale_items item
         ON item.sale_id = sale.id
        AND item.tenant_id = sale.tenant_id
       WHERE item.product_id IN (SELECT product_id FROM product_scope)
     ),
     stock_totals AS (
       SELECT COALESCE(SUM(balance.on_hand), 0) stock_current
       FROM inventory_balances balance
       WHERE balance.tenant_id = $1
         AND balance.product_id IN (SELECT product_id FROM product_scope)
     ),
     spend AS (
       SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'SPENT'), 0) actual_spend
       FROM commercial_marketing_expenses
       WHERE tenant_id = $1 AND campaign_id = $2
     )
     SELECT
       campaign.*,
       (SELECT COUNT(*)::integer FROM product_scope) product_count,
       COALESCE((SELECT units_sold FROM sales_totals), 0) units_sold,
       COALESCE((SELECT sales_amount FROM sales_totals), 0) sales_amount,
       COALESCE((SELECT net_sales_amount FROM sales_totals), 0) net_sales_amount,
       COALESCE((SELECT gross_margin_amount FROM sales_totals), 0) gross_margin_amount,
       COALESCE((SELECT stock_current FROM stock_totals), 0) stock_current,
       GREATEST(COALESCE((SELECT actual_spend FROM spend), campaign.actual_spend), 0) marketing_spend,
       CASE WHEN GREATEST(COALESCE((SELECT actual_spend FROM spend), campaign.actual_spend), 0) > 0
         THEN ROUND(
           COALESCE((SELECT sales_amount FROM sales_totals), 0)
           / GREATEST(COALESCE((SELECT actual_spend FROM spend), campaign.actual_spend), 1),
           2
         )
         ELSE NULL
       END roas,
       COALESCE((SELECT gross_margin_amount FROM sales_totals), 0)
         - GREATEST(COALESCE((SELECT actual_spend FROM spend), campaign.actual_spend), 0)
         approximate_commercial_result,
       campaign.ends_on - campaign.starts_on + 1 campaign_days,
       'ROAS mide retorno sobre gasto publicitario y no equivale a utilidad neta.' roas_note,
       'Resultado comercial aproximado; no sustituye estados financieros oficiales.' profitability_note
     FROM campaign`,
    [req.context.tenantId, campaignId],
  );
  if (!result.rowCount) {
    throw new AppError('La campaña no existe.', 404, 'COMMERCIAL_CAMPAIGN_NOT_FOUND');
  }
  res.json(result.rows[0]);
}));

router.post('/plans', requirePermission('commercial_planning.manage'), asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name, 160, true);
  const periodStart = date(req.body.periodStart, 'La fecha inicial no es válida.');
  const periodEnd = date(req.body.periodEnd, 'La fecha final no es válida.');
  if (periodEnd < periodStart) {
    throw new AppError('El periodo final debe ser igual o posterior al inicial.', 422, 'INVALID_COMMERCIAL_PLAN_PERIOD');
  }
  const branchId = optionalId(req.body.branchId, 'La sucursal no es válida.');
  const ownerUserId = optionalId(req.body.ownerUserId, 'La persona responsable no es válida.');
  const status = enumValue(req.body.status, PLAN_STATUSES, 'ACTIVE');
  const targetRevenue = money(req.body.targetRevenue, 'La meta de ventas no es válida.');
  const targetMargin = money(req.body.targetMargin, 'La meta de margen no es válida.');
  const notes = cleanText(req.body.notes, 2000);

  const created = await withTransaction(async (client) => {
    await assertBranch(client, req.context.tenantId, branchId);
    await assertUser(client, req.context.tenantId, ownerUserId);
    const result = await client.query(
      `INSERT INTO commercial_plans(
         tenant_id, branch_id, name, period_start, period_end, target_revenue,
         target_margin, status, owner_user_id, notes, created_by
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        req.context.tenantId,
        branchId,
        name,
        periodStart,
        periodEnd,
        targetRevenue,
        targetMargin,
        status,
        ownerUserId,
        notes,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'commercial_planning.plan.created',
      entityType: 'commercial_plan',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: `Plan comercial ${name}`,
    });
    return result.rows[0];
  });
  res.status(201).json(created);
}));

router.patch('/plans/:planId/status', requirePermission('commercial_planning.manage'), asyncHandler(async (req, res) => {
  const planId = id(req.params.planId, 'El plan no es válido.');
  const status = enumValue(req.body.status, PLAN_STATUSES, null);
  const updated = await withTransaction(async (client) => {
    const before = await client.query(
      'SELECT * FROM commercial_plans WHERE tenant_id = $1 AND id = $2',
      [req.context.tenantId, planId],
    );
    if (!before.rowCount) throw new AppError('El plan comercial no existe.', 404, 'COMMERCIAL_PLAN_NOT_FOUND');
    const result = await client.query(
      'UPDATE commercial_plans SET status = $3, updated_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *',
      [req.context.tenantId, planId, status],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'commercial_planning.plan.status_changed',
      entityType: 'commercial_plan',
      entityId: planId,
      before: before.rows[0],
      after: result.rows[0],
      reason: `Estado del plan: ${status}`,
    });
    return result.rows[0];
  });
  res.json(updated);
}));

router.post('/initiatives', requirePermission('commercial_planning.manage'), asyncHandler(async (req, res) => {
  const planId = id(req.body.planId, 'El plan no es válido.');
  const title = cleanText(req.body.title, 180, true);
  const channel = enumValue(req.body.channel, CHANNELS, 'STORE', 'INVALID_COMMERCIAL_PLAN_CHANNEL');
  const priority = enumValue(req.body.priority, PRIORITIES, 'MEDIUM', 'INVALID_COMMERCIAL_PLAN_PRIORITY');
  const status = enumValue(req.body.status, INITIATIVE_STATUSES, 'TODO');
  const dueDate = req.body.dueDate ? date(req.body.dueDate, 'La fecha de entrega no es válida.') : null;
  const responsibleUserId = optionalId(req.body.responsibleUserId, 'La persona responsable no es válida.');
  const expectedRevenue = money(req.body.expectedRevenue, 'El ingreso esperado no es válido.');
  const notes = cleanText(req.body.notes, 2000);

  const created = await withTransaction(async (client) => {
    const plan = await client.query(
      'SELECT id FROM commercial_plans WHERE tenant_id = $1 AND id = $2',
      [req.context.tenantId, planId],
    );
    if (!plan.rowCount) throw new AppError('El plan comercial no existe.', 404, 'COMMERCIAL_PLAN_NOT_FOUND');
    await assertUser(client, req.context.tenantId, responsibleUserId);
    const result = await client.query(
      `INSERT INTO commercial_plan_initiatives(
         tenant_id, plan_id, title, channel, expected_revenue, priority,
         status, due_date, responsible_user_id, notes, created_by
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        req.context.tenantId,
        planId,
        title,
        channel,
        expectedRevenue,
        priority,
        status,
        dueDate,
        responsibleUserId,
        notes,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'commercial_planning.initiative.created',
      entityType: 'commercial_plan_initiative',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: `Iniciativa comercial ${title}`,
    });
    return result.rows[0];
  });
  res.status(201).json(created);
}));

router.patch('/initiatives/:initiativeId/status', requirePermission('commercial_planning.manage'), asyncHandler(async (req, res) => {
  const initiativeId = id(req.params.initiativeId, 'La iniciativa no es válida.');
  const status = enumValue(req.body.status, INITIATIVE_STATUSES, null);
  const updated = await withTransaction(async (client) => {
    const before = await client.query(
      'SELECT * FROM commercial_plan_initiatives WHERE tenant_id = $1 AND id = $2',
      [req.context.tenantId, initiativeId],
    );
    if (!before.rowCount) {
      throw new AppError('La iniciativa comercial no existe.', 404, 'COMMERCIAL_PLAN_INITIATIVE_NOT_FOUND');
    }
    const result = await client.query(
      'UPDATE commercial_plan_initiatives SET status = $3, updated_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *',
      [req.context.tenantId, initiativeId, status],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'commercial_planning.initiative.status_changed',
      entityType: 'commercial_plan_initiative',
      entityId: initiativeId,
      before: before.rows[0],
      after: result.rows[0],
      reason: `Estado de iniciativa: ${status}`,
    });
    return result.rows[0];
  });
  res.json(updated);
}));

export default router;
