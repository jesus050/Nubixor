import { createHash, createHmac, randomUUID } from 'node:crypto';
import { Router } from 'express';
import QRCode from 'qrcode';
import { query, withDeclaredTenant, withTransaction } from '../db.js';
import { widenTenantScope } from '../tenant-context.js';
import { config } from '../config.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import {
  postCashMovementAccounting,
  postCashSessionClosingAccounting,
  postCashSessionOpeningAccounting,
  postSaleAccounting,
} from '../accounting.js';
import { autoProcessElectronicDocument } from './electronic-billing.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DOCUMENT_TYPES = new Set(['NIT', 'CC', 'CE', 'PASSPORT', 'OTHER']);
const CASH_MOVEMENT_TYPES = new Set(['INCOME', 'EXPENSE', 'WITHDRAWAL']);
const CASH_DENOMINATIONS = new Set([
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50,
]);
const POS_STOCK_SOURCES = new Set(['DISPLAY', 'AVAILABLE']);
const IDEMPOTENCY_KEY_MAX_LENGTH = 160;

// La clave la genera el punto de venta y viaja en la cabecera Idempotency-Key.
// Se acepta también en el cuerpo para clientes que no puedan fijar cabeceras.
// Sin clave la venta se comporta como antes: se inventa una, el cobro funciona
// y el reintento simplemente no queda cubierto. Eso mantiene compatibles a los
// clientes que aún no la envían.
function resolveIdempotencyKey(req) {
  const fromHeader = req.header('idempotency-key');
  const supplied = typeof fromHeader === 'string' && fromHeader.trim()
    ? fromHeader.trim()
    : normalizedText(req.body?.idempotencyKey, IDEMPOTENCY_KEY_MAX_LENGTH);
  if (!supplied) return randomUUID();
  if (supplied.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new AppError(
      `La clave de idempotencia supera ${IDEMPOTENCY_KEY_MAX_LENGTH} caracteres.`,
      422,
      'IDEMPOTENCY_KEY_TOO_LONG',
    );
  }
  return supplied;
}

// Dos peticiones idénticas simultáneas pasan las dos por esta comprobación sin
// ver nada. Quien las separa es el índice único; esto solo evita rehacer el
// trabajo en el caso normal, que es el reintento posterior.
async function findSaleByIdempotencyKey(runQuery, tenantId, idempotencyKey) {
  const existing = await runQuery(
    'SELECT id FROM sales WHERE company_id = $1 AND idempotency_key = $2',
    [tenantId, idempotencyKey],
  );
  return existing.rows[0]?.id || null;
}

// Las empresas que atiende una caja compartida. Salen de la configuración de la
// caja cruzada con la membresía activa del usuario: nada de esto lo elige el
// navegador. Mientras dure la petición, el catálogo y las existencias de esas
// empresas quedan dentro del alcance; el resto del sistema sigue viendo solo la
// empresa activa.
async function widenScopeToRegisterCompanies(req, cashSessionId) {
  const companies = await query(
    `SELECT crc.company_id
     FROM cash_sessions session
     JOIN cash_register_companies crc
       ON crc.cash_register_id = session.cash_register_id
      AND crc.active = TRUE
     JOIN tenant_users membership
       ON membership.tenant_id = crc.company_id
      AND membership.user_id = $2
      AND membership.status = 'ACTIVE'
     WHERE session.id = $1 AND session.tenant_id = $3`,
    [cashSessionId, req.context.userId, req.context.tenantId],
  );
  if (!companies.rowCount) return [];
  return widenTenantScope(companies.rows.map((row) => row.company_id));
}

function isIdempotencyConflict(error, indexName) {
  return error?.code === '23505' && error?.constraint === indexName;
}


router.use(requireTenant);

function normalizedText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo supera ${maxLength} caracteres.`,
      422,
      'FIELD_TOO_LONG',
    );
  }
  return normalized;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function normalizeManualDiscount(value) {
  if (value === null || value === undefined) return { amount: 0, type: null, reason: null };
  const type = typeof value?.type === 'string' ? value.type.trim().toUpperCase() : '';
  const amount = Number(value?.amount);
  const reason = normalizedText(value?.reason, 240);
  if (!['PERCENT', 'AMOUNT'].includes(type) || !Number.isFinite(amount) || amount <= 0) {
    throw new AppError('El descuento debe indicar un porcentaje o valor válido.', 422, 'INVALID_MANUAL_DISCOUNT');
  }
  if (type === 'PERCENT' && amount > 100) {
    throw new AppError('El porcentaje de descuento no puede superar 100%.', 422, 'INVALID_MANUAL_DISCOUNT');
  }
  if (!reason) {
    throw new AppError('Indica el motivo del descuento.', 422, 'DISCOUNT_REASON_REQUIRED');
  }
  return { amount, type, reason };
}

function applyManualDiscount(lines, discount) {
  const grossTotal = money(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const requested = discount.type === 'PERCENT'
    ? money(grossTotal * discount.amount / 100)
    : money(discount.amount);
  if (requested > grossTotal) {
    throw new AppError('El descuento no puede ser mayor que el total de la venta.', 422, 'DISCOUNT_EXCEEDS_SALE');
  }
  if (!requested || !grossTotal) {
    lines.forEach((line) => { line.manualDiscountAmount = 0; });
    return 0;
  }
  let remaining = requested;
  lines.forEach((line, index) => {
    const share = index === lines.length - 1
      ? remaining
      : money(requested * line.lineTotal / grossTotal);
    line.manualDiscountAmount = share;
    line.lineTotal = money(line.lineTotal - share);
    line.lineTax = line.taxRate > 0 ? money(line.lineTotal * line.taxRate / (100 + line.taxRate)) : 0;
    line.taxAmount = line.lineTax;
    remaining = money(remaining - share);
  });
  return requested;
}

function internalReceiptControlCode(payload) {
  const canonical = JSON.stringify(payload);
  return (config.receiptVerificationKey
    ? createHmac('sha256', config.receiptVerificationKey)
    : createHash('sha256'))
    .update(canonical)
    .digest('hex')
    .slice(0, 20)
    .toUpperCase();
}

export function resolveCommercialPrice(product, quantity, pricing = {}) {
  const basePrice = Number(product.sale_price);
  const scale = (pricing.prices || [])
    .filter((item) => Number(item.min_quantity) <= quantity)
    .sort((left, right) => Number(right.min_quantity) - Number(left.min_quantity))[0];
  let unitPrice = scale ? Number(scale.unit_price) : basePrice;
  let source = scale ? 'PRICE_LIST' : 'BASE';
  let label = scale?.price_list_name || 'Precio unitario';
  for (const promotion of pricing.promotions || []) {
    if (Number(promotion.min_quantity) > quantity) continue;
    const promotionalPrice = promotion.discount_type === 'FIXED_PRICE'
      ? Number(promotion.discount_value)
      : money(unitPrice * (1 - Number(promotion.discount_value) / 100));
    if (promotionalPrice <= unitPrice) {
      unitPrice = promotionalPrice;
      source = 'PROMOTION';
      label = promotion.name;
    }
  }
  return {
    unitPrice: money(unitPrice),
    basePrice: money(basePrice),
    source,
    label,
    discountAmount: money(Math.max(0, basePrice - unitPrice)),
  };
}

async function loadCommercialPricing(client, products, customerId = null) {
  if (!products.length) return new Map();
  const productIds = products.map((product) => product.id);
  const prices = customerId
    ? await client.query(
      `SELECT price.product_id,price.min_quantity,price.unit_price,
              list.name price_list_name
       FROM sales_product_prices price
       JOIN sales_price_lists list
         ON list.tenant_id=price.tenant_id
        AND list.id=price.price_list_id AND list.active=TRUE
       JOIN customers customer
         ON customer.tenant_id=price.tenant_id
        AND customer.sales_price_list_id=price.price_list_id
        AND customer.id=$2 AND customer.active=TRUE
       WHERE price.product_id=ANY($1::uuid[]) AND price.active=TRUE`,
      [productIds, customerId],
    )
    : { rows: [] };
  const promotions = await client.query(
    `SELECT product_id,name,discount_type,discount_value,min_quantity
     FROM sales_promotions
     WHERE product_id=ANY($1::uuid[]) AND active=TRUE
       AND now() BETWEEN starts_at AND ends_at`,
    [productIds],
  );
  const result = new Map();
  for (const product of products) {
    result.set(product.id, {
      prices: prices.rows.filter((item) => item.product_id === product.id),
      promotions: promotions.rows.filter((item) => item.product_id === product.id),
    });
  }
  return result;
}

function normalizePosStockSource(value) {
  const normalized = typeof value === 'string'
    ? value.trim().toUpperCase()
    : 'DISPLAY';
  if (!POS_STOCK_SOURCES.has(normalized)) {
    throw new AppError(
      'La ubicación de salida debe ser Exhibición o Bodega.',
      422,
      'POS_STOCK_SOURCE_INVALID',
    );
  }
  return normalized;
}

function normalizeSaleTenders(body, saleTotal) {
  const supplied = Array.isArray(body.payments) ? body.payments : null;
  const legacyMethod = typeof body.paymentMethod === 'string'
    ? body.paymentMethod.trim().toUpperCase()
    : '';
  const candidates = supplied || [{
    method: legacyMethod,
    amount: saleTotal,
    tenderedAmount: legacyMethod === 'CASH' ? body.cashReceived : null,
    receivingCompanyId: body.transferReceivingCompanyId,
    bankAccountId: body.transferBankAccountId,
    reference: body.paymentReference,
  }];
  if (!candidates.length || candidates.length > 3) {
    throw new AppError(
      'Registra entre uno y tres medios de pago.',
      422,
      'INVALID_SALE_TENDERS',
    );
  }
  const tenders = candidates.map((candidate) => {
    const method = typeof candidate?.method === 'string'
      ? candidate.method.trim().toUpperCase()
      : '';
    const amount = money(candidate?.amount);
    const tenderedAmount = candidate?.tenderedAmount === null ||
      candidate?.tenderedAmount === undefined ||
      candidate?.tenderedAmount === ''
      ? null
      : money(candidate.tenderedAmount);
    return {
      method,
      amount,
      tenderedAmount,
      receivingCompanyId: candidate?.receivingCompanyId || null,
      bankAccountId: candidate?.bankAccountId || null,
      reference: normalizedText(candidate?.reference, 120),
    };
  });
  const methods = tenders.map((tender) => tender.method);
  if (
    new Set(methods).size !== methods.length ||
    tenders.some((tender) =>
      !['CASH', 'CARD', 'TRANSFER'].includes(tender.method) ||
      !Number.isFinite(tender.amount) ||
      tender.amount <= 0)
  ) {
    throw new AppError(
      'Cada medio de pago debe aparecer una vez y tener un valor positivo.',
      422,
      'INVALID_SALE_TENDERS',
    );
  }
  if (Math.abs(money(tenders.reduce((sum, tender) => sum + tender.amount, 0)) - saleTotal) >= 0.01) {
    throw new AppError(
      'La suma de los medios de pago debe ser igual al total de la venta.',
      422,
      'SALE_TENDERS_MISMATCH',
    );
  }
  for (const tender of tenders) {
    if (
      tender.method === 'CASH' &&
      (!Number.isFinite(tender.tenderedAmount) || tender.tenderedAmount < tender.amount)
    ) {
      throw new AppError(
        'El efectivo recibido debe cubrir la parte pagada en efectivo.',
        422,
        'INSUFFICIENT_CASH_RECEIVED',
      );
    }
    if (
      tender.method === 'TRANSFER' &&
      (
        typeof tender.receivingCompanyId !== 'string' ||
        !UUID_PATTERN.test(tender.receivingCompanyId) ||
        typeof tender.bankAccountId !== 'string' ||
        !UUID_PATTERN.test(tender.bankAccountId) ||
        !tender.reference
      )
    ) {
      throw new AppError(
        'La transferencia requiere empresa receptora, cuenta bancaria y referencia.',
        422,
        'TRANSFER_ACCOUNT_REQUIRED',
      );
    }
  }
  return tenders;
}

export function allocateTendersBySale(tenders, saleGroups) {
  const total = money(saleGroups.reduce((sum, group) => sum + group.total, 0));
  if (total <= 0) {
    throw new AppError('No fue posible distribuir un pago sin total de venta.', 422, 'SALE_TENDER_ALLOCATION_FAILED');
  }
  const allocations = new Map();
  for (const group of saleGroups) allocations.set(group.id, []);

  for (const [sourceIndex, tender] of tenders.entries()) {
    let allocated = 0;
    saleGroups.forEach((group, groupIndex) => {
      const isLastGroup = groupIndex === saleGroups.length - 1;
      const amount = isLastGroup
        ? money(tender.amount - allocated)
        : money(tender.amount * group.total / total);
      allocated = money(allocated + amount);
      if (amount <= 0) return;
      allocations.get(group.id).push({
        ...tender,
        sourceIndex,
        amount,
        tenderedAmount: amount,
        changeAmount: 0,
      });
    });
  }

  for (const [sourceIndex, tender] of tenders.entries()) {
    if (tender.method !== 'CASH') continue;
    const change = money(tender.tenderedAmount - tender.amount);
    const allocatedLines = [...allocations.values()]
      .flat()
      .filter((line) => line.sourceIndex === sourceIndex);
    const last = allocatedLines.at(-1);
    if (last) {
      last.changeAmount = change;
      last.tenderedAmount = money(last.amount + change);
    }
  }
  return allocations;
}

router.get('/customers', asyncHandler(async (req, res) => {
  const search = normalizedText(req.query.search, 120);
  const result = await query(
    `SELECT c.id, c.name, c.document_type, c.document_number, c.email,
            c.phone, c.active,c.sales_price_list_id,
            list.name price_list_name,
            COALESCE(SUM(i.total - i.paid_amount)
              FILTER (WHERE i.status IN ('ISSUED','PARTIAL')), 0) outstanding
     FROM customers c
     LEFT JOIN sales_price_lists list
       ON list.tenant_id=c.tenant_id AND list.id=c.sales_price_list_id
     LEFT JOIN ar_invoices i
       ON i.customer_id = c.id AND i.tenant_id = c.tenant_id
     WHERE c.tenant_id = $1 AND c.active = TRUE
       AND ($2::text IS NULL OR c.name ILIKE '%' || $2 || '%'
         OR c.document_number ILIKE '%' || $2 || '%'
         OR c.phone ILIKE '%' || $2 || '%')
     GROUP BY c.id,list.name
     ORDER BY c.name
     LIMIT 300`,
    [req.context.tenantId, search],
  );
  res.json(result.rows);
}));

router.post('/customers', asyncHandler(async (req, res) => {
  const name = normalizedText(req.body.name, 160);
  const documentType = normalizedText(req.body.documentType, 20)?.toUpperCase() || 'NIT';
  const documentNumber = normalizedText(req.body.documentNumber, 40);
  const email = normalizedText(req.body.email, 160);
  const phone = normalizedText(req.body.phone, 40);
  const address = normalizedText(req.body.address, 240);
  if (!name) {
    return res.status(422).json({ error: 'El nombre del cliente es obligatorio.' });
  }
  if (!DOCUMENT_TYPES.has(documentType)) {
    return res.status(422).json({ error: 'El tipo de documento no es válido.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ error: 'El correo del cliente no es válido.' });
  }
  try {
    const customer = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO customers(
           tenant_id, name, document_type, document_number, email, phone, address
         )
         VALUES($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, name, document_type, document_number, email, phone,
                   address, active, created_at`,
        [
          req.context.tenantId,
          name,
          documentType,
          documentNumber,
          email,
          phone,
          address,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'customer.created_from_pos',
        entityType: 'customer',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: 'Cliente creado desde Caja & POS',
      });
      return { ...result.rows[0], outstanding: 0 };
    });
    res.status(201).json(customer);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Ya existe un cliente con ese documento.',
        409,
        'CUSTOMER_DOCUMENT_EXISTS',
      );
    }
    throw error;
  }
}));

router.get('/bank-accounts', asyncHandler(async (req, res) => {
  const cashSessionId = req.query.cashSessionId;
  if (typeof cashSessionId !== 'string' || !UUID_PATTERN.test(cashSessionId)) {
    throw new AppError(
      'Selecciona un turno de caja válido.',
      422,
      'INVALID_CASH_SESSION_ID',
    );
  }
  const result = await query(
    `SELECT account.id, account.tenant_id company_id,
            company.trade_name company_name, account.bank_name,
            account.account_name, account.masked_account, account.currency
     FROM cash_sessions session
     JOIN cash_register_companies register_company
       ON register_company.cash_register_id = session.cash_register_id
      AND register_company.active = TRUE
     JOIN tenant_users membership
       ON membership.tenant_id = register_company.company_id
      AND membership.user_id = $3
      AND membership.status = 'ACTIVE'
     JOIN bank_accounts account
       ON account.tenant_id = register_company.company_id
      AND account.active = TRUE
     JOIN tenants company ON company.id = account.tenant_id
     WHERE session.id = $1 AND session.tenant_id = $2
       AND session.status = 'OPEN'
     ORDER BY company.trade_name, account.bank_name, account.account_name`,
    [cashSessionId, req.context.tenantId, req.context.userId],
  );
  res.json(result.rows);
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const summary = await withTransaction(async (client) => {
    const fiscalProfile = await client.query(
      `SELECT ctp.electronic_invoicing_required, ctp.default_document_type,
              ctp.taxpayer_type, ctp.vat_responsibility, ctp.tax_regime,
              EXISTS(
                SELECT 1 FROM electronic_billing_accounts account
                WHERE account.company_id = ctp.company_id AND account.active = TRUE
              ) billing_account_configured,
              EXISTS(
                SELECT 1 FROM billing_resolutions resolution
                WHERE resolution.company_id = ctp.company_id
                  AND resolution.active = TRUE
                  AND CURRENT_DATE BETWEEN resolution.valid_from AND resolution.valid_until
                  AND resolution.current_number <= resolution.number_to
              ) billing_resolution_configured
       FROM company_tax_profiles ctp
       WHERE ctp.company_id = $1`,
      [req.context.tenantId],
    );
    const registers = await client.query(
      `SELECT cr.id, cr.name, cr.code, cr.branch_id, b.name branch_name, cr.active
       FROM cash_registers cr
       JOIN branches b ON b.id = cr.branch_id
       WHERE cr.tenant_id = $1 AND cr.active = TRUE
         AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ORDER BY b.name, cr.name`,
      [req.context.tenantId, req.context.branchId],
    );
    const session = await client.query(
      `SELECT cs.id, cs.cash_register_id, cs.status, cs.opening_amount,
              cs.opened_at, cr.name register_name, cr.code register_code,
              cr.branch_id, b.name branch_name,
              COALESCE(sales.cash_sales, 0) cash_sales,
              COALESCE(sales.card_sales, 0) card_sales,
              COALESCE(sales.transfer_sales, 0) transfer_sales,
              COALESCE(movements.income, 0) manual_income,
              COALESCE(movements.expense, 0) expenses,
              COALESCE(movements.withdrawal, 0) withdrawals,
              cs.opening_amount
                + COALESCE(sales.cash_sales, 0)
                + COALESCE(movements.income, 0)
                - COALESCE(movements.expense, 0)
                - COALESCE(movements.withdrawal, 0) calculated_cash
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CASH'), 0) cash_sales,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CARD'), 0) card_sales,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'TRANSFER'), 0) transfer_sales
         FROM sales sale
         JOIN sale_payment_tenders tender
           ON tender.sale_id = sale.id
          AND tender.seller_company_id = sale.company_id
          AND tender.reconciliation_status <> 'REVERSED'
         WHERE sale.cash_session_id = cs.id
           AND sale.status = 'COMPLETED'
       ) sales ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
         FROM cash_movements
         WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
       ) movements ON TRUE
       WHERE cs.tenant_id = $1 AND cs.status = 'OPEN'
         AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ORDER BY cs.opened_at DESC
       LIMIT 1`,
      [req.context.tenantId, req.context.branchId],
    );
    return {
      registers: registers.rows,
      openSession: session.rows[0] || null,
      fiscalProfile: fiscalProfile.rows[0] || {
        electronic_invoicing_required: false,
        default_document_type: 'INTERNAL_RECEIPT',
        billing_account_configured: false,
        billing_resolution_configured: false,
      },
    };
  });
  res.json(summary);
}));

router.get('/sessions', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT cs.id, cs.status, cs.opening_amount, cs.closing_amount,
            cs.expected_cash, cs.difference, cs.opened_at, cs.closed_at,
            cs.closing_notes, cr.name register_name, cr.code register_code,
            b.name branch_name,
            COALESCE(sales.sale_count, 0)::integer sale_count,
            COALESCE(sales.sales_total, 0) sales_total,
            COALESCE(tenders.cash_sales, 0) cash_sales,
            COALESCE(movements.movement_count, 0)::integer movement_count
     FROM cash_sessions cs
     JOIN cash_registers cr ON cr.id = cs.cash_register_id
     JOIN branches b ON b.id = cr.branch_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*) sale_count, COALESCE(SUM(total), 0) sales_total
       FROM sales
       WHERE cash_session_id = cs.id
         AND status = 'COMPLETED'
     ) sales ON TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(tender.amount), 0) cash_sales
       FROM sales sale
       JOIN sale_payment_tenders tender
         ON tender.sale_id = sale.id
        AND tender.seller_company_id = sale.company_id
        AND tender.method = 'CASH'
        AND tender.reconciliation_status <> 'REVERSED'
       WHERE sale.cash_session_id = cs.id
         AND sale.status = 'COMPLETED'
     ) tenders ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) movement_count
       FROM cash_movements
       WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
     ) movements ON TRUE
     WHERE cs.tenant_id = $1
       AND ($2::uuid IS NULL OR cr.branch_id = $2)
     ORDER BY cs.opened_at DESC
     LIMIT 60`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json(result.rows);
}));

router.get('/sessions/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError(
      'El turno debe tener un UUID válido.',
      422,
      'INVALID_CASH_SESSION_ID',
    );
  }
  const [session, movements, sales, counts, companies] = await Promise.all([
    query(
      `SELECT cs.*, cr.name register_name, cr.code register_code,
              b.name branch_name,
              COALESCE(sale_totals.cash_sales, 0) cash_sales,
              COALESCE(sale_totals.card_sales, 0) card_sales,
              COALESCE(sale_totals.transfer_sales, 0) transfer_sales,
              COALESCE(movement_totals.income, 0) manual_income,
              COALESCE(movement_totals.expense, 0) expenses,
              COALESCE(movement_totals.withdrawal, 0) withdrawals,
              cs.opening_amount
                + COALESCE(sale_totals.cash_sales, 0)
                + COALESCE(movement_totals.income, 0)
                - COALESCE(movement_totals.expense, 0)
                - COALESCE(movement_totals.withdrawal, 0) calculated_cash
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CASH'), 0) cash_sales,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CARD'), 0) card_sales,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'TRANSFER'), 0) transfer_sales
         FROM sales sale
         JOIN sale_payment_tenders tender
           ON tender.sale_id = sale.id
          AND tender.seller_company_id = sale.company_id
          AND tender.reconciliation_status <> 'REVERSED'
         WHERE sale.cash_session_id = cs.id
           AND sale.status = 'COMPLETED'
       ) sale_totals ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
         FROM cash_movements
         WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
       ) movement_totals ON TRUE
       WHERE cs.id = $1 AND cs.tenant_id = $2
         AND ($3::uuid IS NULL OR cr.branch_id = $3)`,
      [req.params.id, req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT id, movement_type, category, amount, reference, notes,
              created_by, created_at
       FROM cash_movements
       WHERE cash_session_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT s.id, s.company_id, seller.trade_name company_name,
              s.sequence_number, s.payment_method, s.sale_terms,
              s.total, s.status, s.created_at,
              COALESCE(c.name, 'Consumidor final') customer_name,
              COUNT(si.id)::integer item_count
       FROM sales s
       JOIN tenants seller ON seller.id = s.company_id
       LEFT JOIN customers c ON c.id = s.customer_id AND c.tenant_id = s.tenant_id
       LEFT JOIN sale_items si ON si.sale_id = s.id AND si.tenant_id = s.tenant_id
       WHERE s.cash_session_id = $1
       GROUP BY s.id, seller.trade_name, c.name
       ORDER BY s.created_at DESC`,
      [req.params.id],
    ),
    query(
      `SELECT denomination, quantity, total
       FROM cash_count_lines
       WHERE cash_session_id = $1 AND tenant_id = $2
       ORDER BY denomination DESC`,
      [req.params.id, req.context.tenantId],
    ),
    // Una caja compartida puede vender para varias empresas en el mismo turno.
    // El cierre necesita el corte por empresa vendedora, no solo el total.
    query(
      `SELECT sale.company_id,
              seller.trade_name company_name,
              COUNT(DISTINCT sale.id)::integer sale_count,
              COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CASH'), 0) cash_sales,
              COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CARD'), 0) card_sales,
              COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'TRANSFER'), 0) transfer_sales,
              COALESCE(SUM(tender.amount), 0) collected
       FROM sales sale
       JOIN tenants seller ON seller.id = sale.company_id
       JOIN sale_payment_tenders tender
         ON tender.sale_id = sale.id
        AND tender.seller_company_id = sale.company_id
        AND tender.reconciliation_status <> 'REVERSED'
       WHERE sale.cash_session_id = $1
         AND sale.status = 'COMPLETED'
       GROUP BY sale.company_id, seller.trade_name
       ORDER BY collected DESC`,
      [req.params.id],
    ),
  ]);
  if (!session.rowCount) {
    throw new AppError(
      'No encontramos el turno de caja.',
      404,
      'CASH_SESSION_NOT_FOUND',
    );
  }
  res.json({
    ...session.rows[0],
    movements: movements.rows,
    sales: sales.rows,
    counts: counts.rows,
    companyBreakdown: companies.rows,
  });
}));

router.get('/catalog', asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;
  if (typeof warehouseId !== 'string' || !UUID_PATTERN.test(warehouseId)) {
    return res.status(422).json({ error: 'warehouseId debe ser un UUID válido.' });
  }
  const result = await query(
    `SELECT p.id, p.sku, p.name, p.barcode, p.sale_price, p.tax_review_status,
            p.product_kind, p.parent_product_id, p.variant_attributes,
            parent.sku parent_sku, parent.name parent_name,
            COALESCE(NULLIF(p.metadata->>'invoiceCode', ''), parent.sku, p.sku) invoice_code,
            c.id category_id, c.name category_name,
            tc.name tax_name, tc.rate tax_rate,
            COALESCE(ib.on_hand, 0) on_hand,
            pi.public_url image_url, pi.alt_text image_alt
     FROM products p
     LEFT JOIN products parent
       ON parent.id = p.parent_product_id
      AND parent.tenant_id = p.tenant_id
      AND parent.deleted_at IS NULL
     LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
     LEFT JOIN tax_categories tc ON tc.id = p.sales_tax_category_id
     LEFT JOIN inventory_balances ib
       ON ib.product_id = p.id
      AND ib.tenant_id = p.tenant_id
      AND ib.warehouse_id = $2
     LEFT JOIN LATERAL (
       SELECT image_url public_url, image_alt alt_text
       FROM (
         SELECT '/api/media/assets/' || media.id::text || '/content?tenantId=' || p.tenant_id::text image_url,
                COALESCE(NULLIF(media.metadata ->> 'description', ''), p.name) image_alt,
                0 priority, link.created_at
         FROM media_links link JOIN media_assets media
           ON media.id = link.media_id AND media.company_id = link.company_id
         WHERE link.company_id = p.tenant_id AND link.entity_type = 'PRODUCT'
           AND link.entity_id = p.id AND link.purpose = 'PRIMARY_IMAGE' AND media.deleted_at IS NULL
         UNION ALL
         SELECT legacy.public_url, legacy.alt_text, 1 priority, legacy.created_at
         FROM product_images legacy WHERE legacy.tenant_id = p.tenant_id AND legacy.product_id = p.id
       ) image_source
       ORDER BY priority, created_at DESC
       LIMIT 1
     ) pi ON TRUE
     WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
       AND p.active = TRUE
       AND p.tax_review_status = 'REVIEWED'
       AND EXISTS(
         SELECT 1 FROM warehouses
         WHERE id = $2 AND tenant_id = $1 AND active = TRUE
           AND ($3::uuid IS NULL OR branch_id = $3)
           AND ($4::boolean = FALSE OR warehouse_type = 'DISPLAY')
       )
     ORDER BY p.name`,
    [
      req.context.tenantId,
      warehouseId,
      req.context.branchId,
      req.context.user?.role_code === 'CASHIER',
    ],
  );
  res.json(result.rows);
}));

router.get('/shared-catalog', asyncHandler(async (req, res) => {
  const { cashSessionId } = req.query;
  if (typeof cashSessionId !== 'string' || !UUID_PATTERN.test(cashSessionId)) {
    return res.status(422).json({ error: 'cashSessionId debe ser un UUID válido.' });
  }
  const stockSource = normalizePosStockSource(req.query.stockSource);
  const customerId = req.query.customerId || null;
  if (customerId && (typeof customerId !== 'string' || !UUID_PATTERN.test(customerId))) {
    return res.status(422).json({ error: 'El cliente no es válido.' });
  }
  await widenScopeToRegisterCompanies(req, cashSessionId);
  const result = await query(
    `SELECT p.id, p.sku, p.name, p.barcode, p.sale_price, p.tax_review_status,
            p.product_kind, p.parent_product_id, p.variant_attributes,
            parent.sku parent_sku, parent.name parent_name,
            COALESCE(NULLIF(p.metadata->>'invoiceCode', ''), parent.sku, p.sku) invoice_code,
            p.seller_company_id, seller.trade_name seller_company_name,
            warehouse.id warehouse_id, warehouse.name warehouse_name,
            warehouse.warehouse_type,
            c.id category_id, c.name category_name,
            tc.name tax_name, tc.rate tax_rate,
            COALESCE(ib.on_hand, 0) on_hand,
            customer_price_list.name customer_price_list_name,
            COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'minQuantity',price.min_quantity,
                'unitPrice',price.unit_price,
                'priceListName',customer_price_list.name
              ) ORDER BY price.min_quantity)
              FROM sales_product_prices price
              WHERE price.tenant_id=p.tenant_id
                AND price.product_id=p.id
                AND price.price_list_id=customer_price_list.id
                AND price.active=TRUE
            ),'[]'::jsonb) price_rules,
            COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'name',promotion.name,
                'discountType',promotion.discount_type,
                'discountValue',promotion.discount_value,
                'minQuantity',promotion.min_quantity,
                'endsAt',promotion.ends_at
              ))
              FROM sales_promotions promotion
              WHERE promotion.tenant_id=p.tenant_id
                AND promotion.product_id=p.id
                AND promotion.active=TRUE
                AND now() BETWEEN promotion.starts_at AND promotion.ends_at
            ),'[]'::jsonb) promotions,
            pi.public_url image_url, pi.alt_text image_alt
     FROM cash_sessions session
     JOIN cash_register_companies crc
       ON crc.cash_register_id = session.cash_register_id AND crc.active = TRUE
     JOIN tenant_users membership
       ON membership.tenant_id = crc.company_id
      AND membership.user_id = $3
      AND membership.status = 'ACTIVE'
     LEFT JOIN roles membership_role
       ON membership_role.id = membership.role_id
      AND membership_role.tenant_id = membership.tenant_id
      AND membership_role.active = TRUE
     JOIN tenants seller ON seller.id = crc.company_id AND seller.status = 'ACTIVE'
     LEFT JOIN customers selected_customer
       ON selected_customer.id=$5
      AND selected_customer.tenant_id=crc.company_id
      AND selected_customer.active=TRUE
     LEFT JOIN sales_price_lists customer_price_list
       ON customer_price_list.id=selected_customer.sales_price_list_id
      AND customer_price_list.tenant_id=selected_customer.tenant_id
      AND customer_price_list.active=TRUE
     JOIN warehouses default_warehouse
       ON default_warehouse.id = crc.default_warehouse_id
      AND default_warehouse.tenant_id = crc.company_id
      AND default_warehouse.active = TRUE
     JOIN LATERAL (
       SELECT candidate.id, candidate.name, candidate.warehouse_type
       FROM warehouses candidate
       WHERE candidate.tenant_id = crc.company_id
         AND candidate.branch_id = default_warehouse.branch_id
         AND candidate.warehouse_type = $4
         AND candidate.active = TRUE
       ORDER BY (candidate.id = crc.default_warehouse_id) DESC,
                candidate.name, candidate.id
       LIMIT 1
     ) warehouse ON TRUE
     JOIN products p
       ON p.seller_company_id = crc.company_id
      AND p.owner_company_id = crc.company_id
      AND p.deleted_at IS NULL
      AND p.active = TRUE
      AND p.tax_review_status = 'REVIEWED'
     LEFT JOIN products parent
       ON parent.id = p.parent_product_id
      AND parent.tenant_id = p.tenant_id
      AND parent.deleted_at IS NULL
     LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
     LEFT JOIN tax_categories tc
       ON tc.id = p.sales_tax_category_id AND tc.tenant_id = p.seller_company_id
     LEFT JOIN inventory_balances ib
       ON ib.product_id = p.id
      AND ib.tenant_id = p.owner_company_id
      AND ib.warehouse_id = warehouse.id
     LEFT JOIN LATERAL (
       SELECT image_url public_url, image_alt alt_text
       FROM (
         SELECT '/api/media/assets/' || media.id::text || '/content?tenantId=' || p.tenant_id::text image_url,
                COALESCE(NULLIF(media.metadata ->> 'description', ''), p.name) image_alt,
                0 priority, link.created_at
         FROM media_links link JOIN media_assets media
           ON media.id = link.media_id AND media.company_id = link.company_id
         WHERE link.company_id = p.tenant_id AND link.entity_type = 'PRODUCT'
           AND link.entity_id = p.id AND link.purpose = 'PRIMARY_IMAGE' AND media.deleted_at IS NULL
         UNION ALL
         SELECT legacy.public_url, legacy.alt_text, 1 priority, legacy.created_at
         FROM product_images legacy WHERE legacy.tenant_id = p.tenant_id AND legacy.product_id = p.id
       ) image_source
       ORDER BY priority, created_at DESC
       LIMIT 1
     ) pi ON TRUE
     WHERE session.id = $1
       AND session.tenant_id = $2
       AND session.status = 'OPEN'
       AND (
         EXISTS(
           SELECT 1
           FROM role_permissions permission
           WHERE permission.tenant_id = membership.tenant_id
             AND permission.role_id = membership.role_id
             AND permission.permission_code = ANY(ARRAY['sales.operate', 'sale.create', 'pos.use'])
         )
         OR (
           membership.role_id IS NULL
           AND membership.role_code IN ('OWNER','ADMIN','OPERATIONS','CASHIER')
         )
       )
       AND (
         COALESCE(membership_role.code, membership.role_code) <> 'CASHIER'
         OR warehouse.warehouse_type = 'DISPLAY'
       )
     ORDER BY seller.trade_name, p.name`,
    [
      cashSessionId,
      req.context.tenantId,
      req.context.userId,
      stockSource,
      customerId,
    ],
  );
  res.json(result.rows);
}));

router.get('/documents', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT sale.id, sale.company_id, company.trade_name company_name,
            sale.sequence_number, sale.created_at, sale.payment_method,
            sale.subtotal, sale.tax_total, sale.total, sale.status,
            sale.document_type, COALESCE(customer.name, 'Consumidor final') customer_name,
            document.status electronic_status, document.prefix,
            document.document_number, document.cufe, document.qr_url,
            payment.receiving_company_id,
            receiver.trade_name receiving_company_name,
            payment.reference payment_reference,
            payment.reconciliation_status,
            COUNT(item.id)::integer item_count
     FROM sales sale
     JOIN tenant_users membership
       ON membership.tenant_id = sale.company_id
      AND membership.user_id = $1
      AND membership.status = 'ACTIVE'
     JOIN tenants company ON company.id = sale.company_id
     LEFT JOIN customers customer
       ON customer.id = sale.customer_id AND customer.tenant_id = sale.tenant_id
     LEFT JOIN electronic_documents document
       ON document.sale_id = sale.id AND document.company_id = sale.company_id
     LEFT JOIN sale_payment_records payment ON payment.sale_id = sale.id
     LEFT JOIN tenants receiver ON receiver.id = payment.receiving_company_id
     LEFT JOIN sale_items item
       ON item.sale_id = sale.id AND item.tenant_id = sale.tenant_id
     WHERE sale.status = 'COMPLETED'
     GROUP BY sale.id, company.trade_name, customer.name, document.status,
              document.prefix, document.document_number, document.cufe, document.qr_url,
              payment.receiving_company_id,
              receiver.trade_name, payment.reference, payment.reconciliation_status
     ORDER BY sale.created_at DESC
     LIMIT 300`,
    [req.context.userId],
  );
  const items = result.rows.map((item) => ({
    ...item,
    receipt_number: item.document_number
      ? `${item.prefix || ''}${item.document_number}`
      : `POS-${String(item.sequence_number).padStart(6, '0')}`,
  }));
  const transferSummary = new Map();
  for (const item of items.filter((sale) => sale.payment_method === 'TRANSFER')) {
    const receiverId = item.receiving_company_id || item.company_id;
    const current = transferSummary.get(receiverId) || {
      company_id: receiverId,
      company_name: item.receiving_company_name || item.company_name,
      transfer_count: 0,
      total_received: 0,
    };
    current.transfer_count += 1;
    current.total_received = Math.round(
      (current.total_received + Number(item.total)) * 100,
    ) / 100;
    transferSummary.set(receiverId, current);
  }
  res.json({ items, transferSummary: [...transferSummary.values()] });
}));

router.post('/sessions', asyncHandler(async (req, res) => {
  const { cashRegisterId, openingAmount = 0 } = req.body;
  const amount = Number(openingAmount);
  if (!cashRegisterId) {
    return res.status(422).json({ error: 'cashRegisterId es obligatorio.' });
  }
  if (typeof cashRegisterId !== 'string' || !UUID_PATTERN.test(cashRegisterId)) {
    return res.status(422).json({ error: 'cashRegisterId debe ser un UUID válido.' });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(422).json({ error: 'openingAmount debe ser un valor positivo.' });
  }

  try {
    const session = await withTransaction(async (client) => {
      const register = await client.query(
        `SELECT id
         FROM cash_registers
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE
           AND ($3::uuid IS NULL OR branch_id = $3)
         FOR UPDATE`,
        [cashRegisterId, req.context.tenantId, req.context.branchId],
      );
      if (!register.rowCount) {
        throw new AppError('La caja no pertenece a la empresa activa.', 404, 'CASH_REGISTER_NOT_FOUND');
      }
      const result = await client.query(
        `INSERT INTO cash_sessions(
           tenant_id, cash_register_id, opening_amount, opened_by
         )
         VALUES($1,$2,$3,$4)
         RETURNING id, tenant_id, cash_register_id, status, opening_amount, opened_at`,
        [req.context.tenantId, cashRegisterId, amount, req.context.userId],
      );
      await postCashSessionOpeningAccounting(client, {
        tenantId: req.context.tenantId,
        session: result.rows[0],
        userId: req.context.userId,
      });
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'cash.session_opened',
        entityType: 'cash_session',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: 'Apertura de turno de caja',
      });
      return result.rows[0];
    });
    res.status(201).json(session);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Esta caja ya tiene un turno abierto.', 409, 'CASH_SESSION_ALREADY_OPEN');
    }
    throw error;
  }
}));

router.post('/sessions/:id/movements', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError(
      'El turno debe tener un UUID válido.',
      422,
      'INVALID_CASH_SESSION_ID',
    );
  }
  const movementType = normalizedText(req.body.movementType, 30)?.toUpperCase();
  const category = normalizedText(req.body.category, 80);
  const amount = Number(req.body.amount);
  const reference = normalizedText(req.body.reference, 100);
  const notes = normalizedText(req.body.notes, 300);
  if (!CASH_MOVEMENT_TYPES.has(movementType) || !category || !notes ||
      !Number.isFinite(amount) || amount <= 0) {
    throw new AppError(
      'Tipo, categoría, valor positivo y motivo son obligatorios.',
      422,
      'INVALID_CASH_MOVEMENT',
    );
  }
  const movement = await withTransaction(async (client) => {
    const session = await client.query(
      `SELECT cs.id FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
         AND ($3::uuid IS NULL OR cr.branch_id = $3)
       FOR UPDATE OF cs`,
      [req.params.id, req.context.tenantId, req.context.branchId],
    );
    if (!session.rowCount) {
      throw new AppError(
        'Los movimientos requieren un turno abierto.',
        409,
        'CASH_SESSION_REQUIRED',
      );
    }
    const result = await client.query(
      `INSERT INTO cash_movements(
         tenant_id, cash_session_id, movement_type, category, amount,
         reference, notes, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.context.tenantId,
        req.params.id,
        movementType,
        category,
        amount,
        reference,
        notes,
        req.context.userId,
      ],
    );
    await postCashMovementAccounting(client, {
      tenantId: req.context.tenantId,
      movement: result.rows[0],
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'cash.movement_created',
      entityType: 'cash_movement',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: notes,
    });
    return result.rows[0];
  });
  res.status(201).json(movement);
}));

router.post('/sessions/:id/close', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El turno debe tener un UUID válido.' });
  }
  const counts = Array.isArray(req.body.counts) ? req.body.counts : [];
  const normalizedCounts = counts.map((line) => ({
    denomination: Number(line.denomination),
    quantity: Number(line.quantity),
  }));
  const countKeys = normalizedCounts.map((line) => line.denomination);
  if (normalizedCounts.some((line) =>
    !CASH_DENOMINATIONS.has(line.denomination) ||
    !Number.isInteger(line.quantity) ||
    line.quantity < 0
  ) || new Set(countKeys).size !== countKeys.length) {
    throw new AppError(
      'El conteo contiene denominaciones o cantidades no válidas.',
      422,
      'INVALID_CASH_COUNT',
    );
  }
  const countedFromLines = normalizedCounts.reduce(
    (total, line) => total + line.denomination * line.quantity,
    0,
  );
  const fallbackAmount = Number(req.body.closingAmount);
  const amount = normalizedCounts.length ? countedFromLines : fallbackAmount;
  const notes = normalizedText(req.body.notes, 500);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(
      'Registra el conteo de efectivo antes de cerrar.',
      422,
      'INVALID_CLOSING_AMOUNT',
    );
  }
  const session = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT cs.id, cs.opening_amount,
              COALESCE(sales.cash_sales, 0) cash_sales,
              COALESCE(sales.card_sales, 0) card_sales,
              COALESCE(sales.transfer_sales, 0) transfer_sales,
              COALESCE(sales.sale_count, 0)::integer sale_count,
              COALESCE(sales.sales_total, 0) sales_total,
              COALESCE(movements.income, 0) manual_income,
              COALESCE(movements.expense, 0) expenses,
              COALESCE(movements.withdrawal, 0) withdrawals
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       LEFT JOIN LATERAL (
         SELECT
           (
             SELECT COUNT(*)
             FROM sales session_sale
             WHERE session_sale.cash_session_id = cs.id
               AND session_sale.status = 'COMPLETED'
           ) sale_count,
           (
             SELECT COALESCE(SUM(session_sale.total), 0)
             FROM sales session_sale
             WHERE session_sale.cash_session_id = cs.id
               AND session_sale.status = 'COMPLETED'
           ) sales_total,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CASH'), 0) cash_sales,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'CARD'), 0) card_sales,
           COALESCE(SUM(tender.amount) FILTER (WHERE tender.method = 'TRANSFER'), 0) transfer_sales
         FROM sales sale
         JOIN sale_payment_tenders tender
           ON tender.sale_id = sale.id
          AND tender.seller_company_id = sale.company_id
          AND tender.reconciliation_status <> 'REVERSED'
         WHERE sale.cash_session_id = cs.id
           AND sale.status = 'COMPLETED'
       ) sales ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
         FROM cash_movements
         WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
       ) movements ON TRUE
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
         AND ($3::uuid IS NULL OR cr.branch_id = $3)
       FOR UPDATE OF cs`,
      [req.params.id, req.context.tenantId, req.context.branchId],
    );
    if (!current.rowCount) {
      throw new AppError('No encontramos un turno de caja abierto.', 404, 'CASH_SESSION_NOT_FOUND');
    }
    const expected =
      Number(current.rows[0].opening_amount) +
      Number(current.rows[0].cash_sales) +
      Number(current.rows[0].manual_income) -
      Number(current.rows[0].expenses) -
      Number(current.rows[0].withdrawals);
    const difference = amount - expected;
    if (Math.abs(difference) >= 0.01 && !notes) {
      throw new AppError(
        'Explica la diferencia encontrada antes de cerrar.',
        422,
        'CASH_DIFFERENCE_REASON_REQUIRED',
      );
    }
    if (normalizedCounts.length) {
      for (const line of normalizedCounts) {
        await client.query(
          `INSERT INTO cash_count_lines(
             tenant_id, cash_session_id, denomination, quantity
           )
           VALUES($1,$2,$3,$4)`,
          [
            req.context.tenantId,
            req.params.id,
            line.denomination,
            line.quantity,
          ],
        );
      }
    }
    const result = await client.query(
      `UPDATE cash_sessions
       SET status = 'CLOSED', closing_amount = $1, expected_cash = $2,
           difference = $3, closing_notes = $4, closed_by = $5,
           closed_at = now()
       WHERE id = $6 AND tenant_id = $7 AND status = 'OPEN'
       RETURNING id, status, opening_amount, closing_amount, expected_cash,
                 difference, closing_notes, opened_at, closed_at`,
      [
        amount,
        expected,
        difference,
        notes,
        req.context.userId,
        req.params.id,
        req.context.tenantId,
      ],
    );
    await postCashSessionClosingAccounting(client, {
      tenantId: req.context.tenantId,
      session: result.rows[0],
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'cash.session_closed',
      entityType: 'cash_session',
      entityId: result.rows[0].id,
      before: current.rows[0],
      after: result.rows[0],
      reason: notes || 'Cierre sin diferencias',
    });
    return {
      ...result.rows[0],
      sale_count: current.rows[0].sale_count,
      sales_total: current.rows[0].sales_total,
      cash_sales: current.rows[0].cash_sales,
      card_sales: current.rows[0].card_sales,
      transfer_sales: current.rows[0].transfer_sales,
      manual_income: current.rows[0].manual_income,
      expenses: current.rows[0].expenses,
      withdrawals: current.rows[0].withdrawals,
      count_lines: normalizedCounts,
    };
  });
  res.json(session);
}));

router.post('/sales/grouped', asyncHandler(async (req, res) => {
  const {
    cashSessionId,
    stockSource: requestedStockSource = 'DISPLAY',
    paymentMethod,
    cashReceived,
    payments = null,
    transferReceivingCompanyId = null,
    transferBankAccountId = null,
    paymentReference = null,
    customerId = null,
    saleTerms = 'IMMEDIATE',
    manualDiscount = null,
    items,
  } = req.body;
  const stockSource = normalizePosStockSource(requestedStockSource);
  const normalizedPayment = typeof paymentMethod === 'string'
    ? paymentMethod.trim().toUpperCase()
    : '';
  const hasPaymentBreakdown = Array.isArray(payments) && payments.length > 0;
  if (
    typeof cashSessionId !== 'string' ||
    !UUID_PATTERN.test(cashSessionId) ||
    (!hasPaymentBreakdown && !['CASH', 'CARD', 'TRANSFER'].includes(normalizedPayment)) ||
    saleTerms !== 'IMMEDIATE' ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 100 ||
    items.some((item) =>
      typeof item?.productId !== 'string' ||
      !UUID_PATTERN.test(item.productId) ||
      typeof item?.warehouseId !== 'string' ||
      !UUID_PATTERN.test(item.warehouseId) ||
      !Number.isFinite(Number(item.quantity)) ||
      Number(item.quantity) <= 0) ||
    (customerId && (typeof customerId !== 'string' || !UUID_PATTERN.test(customerId)))
  ) {
    return res.status(422).json({
      error: 'La venta conjunta requiere turno, pago de contado y productos válidos.',
    });
  }
  const consolidated = new Map();
  const requestedDiscount = normalizeManualDiscount(manualDiscount);
  const idempotencyKey = resolveIdempotencyKey(req);
  for (const item of items) {
    const current = consolidated.get(item.productId);
    if (current && current.warehouseId !== item.warehouseId) {
      throw new AppError(
        'Un producto no puede salir de dos ubicaciones en el mismo cobro.',
        422,
        'POS_PRODUCT_LOCATION_CONFLICT',
      );
    }
    consolidated.set(item.productId, {
      warehouseId: item.warehouseId,
      quantity: (current?.quantity || 0) + Number(item.quantity),
    });
  }

  // El cobro descuenta existencias de cada empresa vendedora, así que el alcance
  // se amplía antes de abrir la transacción: dentro ya no se puede cambiar.
  await widenScopeToRegisterCompanies(req, cashSessionId);

  const registerGroupedSale = async () => withTransaction(async (client) => {
    const session = await client.query(
      `SELECT cs.id, cs.cash_register_id, cr.branch_id
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
       FOR UPDATE OF cs`,
      [cashSessionId, req.context.tenantId],
    );
    if (!session.rowCount) {
      throw new AppError('La venta requiere un turno de caja abierto.', 409, 'CASH_SESSION_REQUIRED');
    }
    if (customerId) {
      const customer = await client.query(
        `SELECT id FROM customers
         WHERE tenant_id=$1 AND id=$2 AND active=TRUE`,
        [req.context.tenantId, customerId],
      );
      if (!customer.rowCount) {
        throw new AppError(
          'El cliente no pertenece a la empresa activa.',
          404,
          'CUSTOMER_NOT_FOUND',
        );
      }
    }

    const productIds = [...consolidated.keys()];
    const products = await client.query(
      `SELECT p.id, p.sku, p.name, p.cost, p.sale_price,
              p.owner_company_id, p.seller_company_id,
              seller.trade_name seller_company_name,
              warehouse.id warehouse_id,
              warehouse.warehouse_type,
              warehouse.branch_id warehouse_branch_id,
              p.tax_category_id, tc.rate tax_rate,
              profile.default_document_type,
              p.billing_policy, p.exclude_from_einvoice
       FROM products p
       JOIN tenants seller ON seller.id = p.seller_company_id
       JOIN cash_register_companies crc
         ON crc.cash_register_id = $1
        AND crc.company_id = p.seller_company_id
        AND crc.active = TRUE
       JOIN warehouses register_default
         ON register_default.id = crc.default_warehouse_id
        AND register_default.tenant_id = crc.company_id
        AND register_default.active = TRUE
       JOIN tenant_users membership
         ON membership.tenant_id = p.seller_company_id
        AND membership.user_id = $2
        AND membership.status = 'ACTIVE'
       LEFT JOIN roles membership_role
         ON membership_role.id = membership.role_id
        AND membership_role.tenant_id = membership.tenant_id
        AND membership_role.active = TRUE
       JOIN warehouses warehouse
         ON warehouse.id = ANY($4::uuid[])
        AND warehouse.tenant_id = p.owner_company_id
        AND warehouse.branch_id = register_default.branch_id
        AND warehouse.warehouse_type = $5
        AND warehouse.active = TRUE
       JOIN tax_categories tc
         ON tc.id = p.tax_category_id
        AND tc.tenant_id = p.seller_company_id
       JOIN company_tax_profiles profile
         ON profile.company_id = p.seller_company_id AND profile.active = TRUE
       WHERE p.id = ANY($3::uuid[])
         AND p.deleted_at IS NULL
         AND p.active = TRUE
         AND p.tax_review_status = 'REVIEWED'
         AND (
           EXISTS(
             SELECT 1
             FROM role_permissions permission
             WHERE permission.tenant_id = membership.tenant_id
               AND permission.role_id = membership.role_id
               AND permission.permission_code = ANY(ARRAY['sales.operate', 'sale.create', 'pos.use'])
           )
           OR (
             membership.role_id IS NULL
             AND membership.role_code IN ('OWNER','ADMIN','OPERATIONS','CASHIER')
           )
         )
         AND (
           COALESCE(membership_role.code, membership.role_code) <> 'CASHIER'
           OR warehouse.warehouse_type = 'DISPLAY'
         )
       FOR SHARE OF p`,
      [
        session.rows[0].cash_register_id,
        req.context.userId,
        productIds,
        [...consolidated.values()].map((item) => item.warehouseId),
        stockSource,
      ],
    );
    const productById = new Map(products.rows.map((product) => [product.id, product]));
    const invalidSelection = productIds.some((productId) => {
      const product = productById.get(productId);
      return !product ||
        product.warehouse_id !== consolidated.get(productId).warehouseId;
    });
    if (products.rowCount !== productIds.length || invalidSelection) {
      throw new AppError(
        stockSource === 'DISPLAY'
          ? 'Uno o más productos no están autorizados para esta exhibición.'
          : 'Tu perfil no permite vender uno o más productos directamente desde bodega.',
        403,
        'POS_STOCK_SOURCE_DENIED',
      );
    }

    const commercialPricing = await loadCommercialPricing(
      client,
      products.rows,
      customerId,
    );
    const groups = new Map();
    for (const product of products.rows) {
      const quantity = consolidated.get(product.id).quantity;
      const appliedPrice = resolveCommercialPrice(
        product,
        quantity,
        commercialPricing.get(product.id),
      );
      const unitPrice = appliedPrice.unitPrice;
      const taxRate = Number(product.tax_rate);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      const taxAmount = taxRate > 0
        ? Math.round((lineTotal * taxRate / (100 + taxRate)) * 100) / 100
        : 0;
      const line = {
        ...product,
        quantity,
        unitPrice,
        taxRate,
        lineTotal,
        taxAmount,
        pricing: appliedPrice,
      };
      const groupKey = `${product.seller_company_id}::${product.billing_policy}`;
      const group = groups.get(groupKey) || [];
      group.push(line);
      groups.set(groupKey, group);
    }
    const allLines = [...groups.values()].flat();
    if (requestedDiscount.amount > 0) {
      const sellerCompanyIds = [...new Set(allLines.map((line) => line.seller_company_id))];
      const discountPermissions = await client.query(
        `SELECT DISTINCT membership.tenant_id
         FROM tenant_users membership
         JOIN role_permissions permission
           ON permission.tenant_id = membership.tenant_id
          AND permission.role_id = membership.role_id
          AND permission.permission_code = 'sale.discount.apply'
         WHERE membership.tenant_id = ANY($1::uuid[])
           AND membership.user_id = $2
           AND membership.status = 'ACTIVE'`,
        [sellerCompanyIds, req.context.userId],
      );
      if (discountPermissions.rowCount !== sellerCompanyIds.length) {
        throw new AppError(
          'Tu perfil no tiene autorización para aplicar descuentos en todas las empresas de esta venta.',
          403,
          'DISCOUNT_PERMISSION_DENIED',
        );
      }
    }
    const manualDiscountAmount = applyManualDiscount(allLines, requestedDiscount);
    const grandTotal = money(allLines.reduce((sum, line) => sum + line.lineTotal, 0));
    const grandTax = money(allLines.reduce((sum, line) => sum + line.taxAmount, 0));
    const tenders = normalizeSaleTenders({
      payments,
      paymentMethod: normalizedPayment,
      cashReceived,
      transferReceivingCompanyId,
      transferBankAccountId,
      paymentReference,
    }, grandTotal);
    const transferTenders = tenders.filter((tender) => tender.method === 'TRANSFER');
    if (transferTenders.length) {
      const bankIds = transferTenders.map((tender) => tender.bankAccountId);
      const bankAccounts = await client.query(
        `SELECT account.id, account.tenant_id, account.bank_name,
                account.account_name, account.masked_account
         FROM bank_accounts account
         JOIN cash_register_companies register_company
           ON register_company.cash_register_id = $1
          AND register_company.company_id = account.tenant_id
          AND register_company.active = TRUE
         JOIN tenant_users membership
           ON membership.tenant_id = account.tenant_id
          AND membership.user_id = $2
          AND membership.status = 'ACTIVE'
         WHERE account.id = ANY($3::uuid[]) AND account.active = TRUE
         FOR SHARE OF account`,
        [session.rows[0].cash_register_id, req.context.userId, bankIds],
      );
      const bankById = new Map(bankAccounts.rows.map((account) => [account.id, account]));
      for (const tender of transferTenders) {
        const account = bankById.get(tender.bankAccountId);
        if (
          !account ||
          account.tenant_id !== tender.receivingCompanyId ||
          ![...groups.keys()].some((groupKey) =>
            groupKey.startsWith(`${tender.receivingCompanyId}::`))
        ) {
          throw new AppError(
            'La cuenta bancaria debe pertenecer a una empresa incluida en la venta.',
            422,
            'TRANSFER_RECEIVER_INVALID',
          );
        }
        tender.bankName = account.bank_name;
        tender.accountName = account.account_name;
        tender.maskedAccount = account.masked_account;
      }
    }
    const saleGroups = [...groups].map(([groupKey, lines]) => ({
      id: groupKey,
      total: money(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
    }));
    const tenderAllocations = allocateTendersBySale(tenders, saleGroups);
    const checkoutPaymentMethod = tenders.length === 1 ? tenders[0].method : 'MIXED';

    // Insert Parent Sale Group
    const saleGroupResult = await client.query(
      `INSERT INTO sale_groups(
         tenant_id, cash_session_id, total, created_by, idempotency_key
       )
       VALUES($1, $2, $3, $4, $5) RETURNING id`,
      [
        req.context.tenantId,
        cashSessionId,
        grandTotal,
        req.context.userId,
        idempotencyKey,
      ],
    );
    const saleGroupId = saleGroupResult.rows[0].id;

    const receipts = [];
    let isFirstReceipt = true;
    for (const [groupKey, lines] of groups) {
      const companyId = groupKey.split('::')[0];
      const billingPolicy = groupKey.split('::')[1];
      const groupTotal = Math.round(
        lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100,
      ) / 100;
      const groupTax = Math.round(
        lines.reduce((sum, line) => sum + line.taxAmount, 0) * 100,
      ) / 100;
      const groupSubtotal = Math.round((groupTotal - groupTax) * 100) / 100;
      const groupTenders = tenderAllocations.get(groupKey) || [];
      const groupPaymentMethods = new Set(groupTenders.map((tender) => tender.method));
      const groupPaymentMethod = groupPaymentMethods.size === 1
        ? groupTenders[0].method
        : 'MIXED';
      const groupCashTendered = money(groupTenders
        .filter((tender) => tender.method === 'CASH')
        .reduce((sum, tender) => sum + tender.tenderedAmount, 0));
      const groupCashChange = money(groupTenders
        .filter((tender) => tender.method === 'CASH')
        .reduce((sum, tender) => sum + tender.changeAmount, 0));
      const firstLine = lines[0];
      let resolution = null;
      if (billingPolicy === 'ELECTRONIC_INVOICE') {
        const resolutionResult = await client.query(
          `SELECT id, prefix
           FROM billing_resolutions
           WHERE company_id = $1 AND branch_id = $2 AND active = TRUE
             AND CURRENT_DATE BETWEEN valid_from AND valid_until
             AND current_number <= number_to
           ORDER BY valid_until, created_at
           LIMIT 1
           FOR UPDATE`,
          [companyId, firstLine.warehouse_branch_id],
        );
        resolution = resolutionResult.rows[0] || null;
        if (!resolution) {
          throw new AppError(
            'La empresa vendedora no tiene una resolución de facturación electrónica vigente para esta sucursal. Configúrala antes de confirmar la venta.',
            409,
            'BILLING_RESOLUTION_REQUIRED',
          );
        }
      }
      const saleResult = await client.query(
        `INSERT INTO sales(
           tenant_id, company_id, seller_company_id, cash_session_id,
           warehouse_id, payment_method, subtotal, tax_total, total,
           cash_received, cash_change, created_by, sale_terms,
           document_type, billing_resolution_id,customer_id,
           sale_group_id, applied_billing_policy,
           manual_discount_amount, manual_discount_reason, idempotency_key
         )
         VALUES($1,$1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'IMMEDIATE',$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id, sequence_number, status, payment_method, subtotal,
                   tax_total, total, cash_received, cash_change,
                   document_type, created_at`,
        [
          companyId,
          cashSessionId,
          firstLine.warehouse_id,
          groupPaymentMethod,
          groupSubtotal,
          groupTax,
          groupTotal,
          groupCashTendered || null,
          groupCashChange,
          req.context.userId,
          billingPolicy === 'ELECTRONIC_INVOICE'
            ? 'ELECTRONIC_INVOICE'
            : billingPolicy === 'EQUIVALENT_DOCUMENT_POS'
              ? 'EQUIVALENT_DOCUMENT'
              : 'INTERNAL_RECEIPT',
          resolution?.id || null,
          companyId === req.context.tenantId ? customerId : null,
          saleGroupId,
          billingPolicy,
          money(lines.reduce((sum, line) => sum + line.manualDiscountAmount, 0)),
          requestedDiscount.reason,
          // La empresa vendedora puede aparecer dos veces en el mismo cobro con
          // políticas de facturación distintas, y cada aparición es una venta.
          // La política desempata la clave sin romper la unicidad por empresa.
          `${idempotencyKey}::${billingPolicy}`,
        ],
      );
      const sale = saleResult.rows[0];
      for (const tender of groupTenders) {
        await client.query(
          `INSERT INTO sale_payment_tenders(
             sale_id, seller_company_id, receiving_company_id, bank_account_id,
             method, amount, tendered_amount, change_amount, reference,
             reconciliation_status, recorded_by
           )
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            sale.id,
            companyId,
            tender.method === 'TRANSFER' ? tender.receivingCompanyId : companyId,
            tender.method === 'TRANSFER' ? tender.bankAccountId : null,
            tender.method,
            tender.amount,
            tender.method === 'CASH' ? tender.tenderedAmount : null,
            tender.changeAmount,
            tender.reference,
            tender.method === 'TRANSFER' ? 'PENDING' : 'NOT_APPLICABLE',
            req.context.userId,
          ],
        );
      }
      let billingDocument = null;
      if (billingPolicy === 'ELECTRONIC_INVOICE') {
        let documentNumber = null;
        if (resolution) {
          const numberResult = await client.query(
            `UPDATE billing_resolutions
             SET current_number = current_number + 1, updated_at = now()
             WHERE id = $1 AND company_id = $2 AND current_number <= number_to
             RETURNING current_number - 1 document_number`,
            [resolution.id, companyId],
          );
          documentNumber = numberResult.rows[0]?.document_number || null;
        }
        const documentResult = await client.query(
          `INSERT INTO electronic_documents(
             company_id, sale_id, billing_resolution_id, document_type,
             prefix, document_number, status, failure_reason
           )
           VALUES($1,$2,$3,'ELECTRONIC_INVOICE',$4,$5,'PENDING',$6)
           RETURNING id, document_type, prefix, document_number, status, failure_reason`,
          [
            companyId,
            sale.id,
            resolution?.id || null,
            resolution?.prefix || null,
            documentNumber,
            resolution
              ? 'Pendiente de transmisión al proveedor tecnológico.'
              : 'Falta configurar una resolución de facturación vigente.',
          ],
        );
        billingDocument = documentResult.rows[0];
      }
      for (const line of lines) {
        const balance = await client.query(
          `UPDATE inventory_balances
           SET on_hand = on_hand - $1, updated_at = now()
           WHERE tenant_id = $2 AND product_id = $3 AND warehouse_id = $4
             AND on_hand - reserved >= $1
           RETURNING on_hand`,
          [line.quantity, companyId, line.id, line.warehouse_id],
        );
        if (!balance.rowCount) {
          throw new AppError(
            `No hay existencias suficientes de ${line.name}.`,
            409,
            'INSUFFICIENT_STOCK',
          );
        }
        await client.query(
          `INSERT INTO sale_items(
             tenant_id, sale_id, product_id, sku_snapshot, name_snapshot,
             quantity, unit_price, unit_cost, tax_rate, tax_amount, line_total,
             discount_amount, list_unit_price,pricing_source,pricing_label
           )
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            companyId, sale.id, line.id, line.sku, line.name, line.quantity,
            line.unitPrice, line.cost, line.taxRate, line.taxAmount, line.lineTotal,
            line.manualDiscountAmount || 0,
            line.pricing.basePrice,line.pricing.source,line.pricing.label,
          ],
        );
        await client.query(
          `INSERT INTO inventory_movements(
             tenant_id, product_id, warehouse_id, movement_type, quantity,
             unit_cost, reference_type, reference_id, reason, created_by
           )
           VALUES($1,$2,$3,'SALE',$4,$5,'SALE',$6,$7,$8)`,
          [
            companyId, line.id, line.warehouse_id, -line.quantity, line.cost,
            sale.id, `Venta POS multiempresa #${sale.sequence_number}`,
            req.context.userId,
          ],
        );
      }
      const groupTransferTenders = groupTenders
        .filter((tender) => tender.method === 'TRANSFER');
      if (groupTransferTenders.length) {
        const transferTender = groupTransferTenders[0];
        
        // ONLY insert bank reconciliation records for the first/largest receipt
        // to avoid duplicating transactions in bank recon
        if (isFirstReceipt) {
          await client.query(
            `INSERT INTO sale_payment_records(
               sale_id, seller_company_id, receiving_company_id, payment_method,
               amount, reference, reconciliation_status, recorded_by
             )
             VALUES($1,$2,$3,'TRANSFER',$4,$5,'CONFIRMED',$6)`,
            [
              sale.id,
              companyId,
              transferTender.receivingCompanyId,
              // Summing ALL transfers for this method from all groups for bank recon
              tenders.filter(t => t.method === 'TRANSFER').reduce((s, t) => s + t.amount, 0),
              transferTender.reference,
              req.context.userId,
            ],
          );
        }
      }
      isFirstReceipt = false;
      // La empresa vendedora puede no ser la empresa activa del cajero. El
      // asiento es suyo, así que se declara mientras se contabiliza.
      await withDeclaredTenant(client, companyId, () => postSaleAccounting(client, {
        tenantId: companyId,
        saleId: sale.id,
        userId: req.context.userId,
      }));
      await writeAudit(client, {
        tenantId: companyId,
        userId: req.context.userId,
        action: 'sale.completed',
        entityType: 'sale',
        entityId: sale.id,
        after: {
          ...sale,
          items: lines.length,
          sharedCashSessionId: cashSessionId,
          manualDiscountAmount: money(lines.reduce((sum, line) => sum + line.manualDiscountAmount, 0)),
          discountReason: requestedDiscount.reason,
        },
        reason: manualDiscountAmount
          ? `Venta confirmada desde caja multiempresa con descuento: ${requestedDiscount.reason}`
          : 'Venta confirmada desde caja multiempresa',
      });
      receipts.push({
        ...sale,
        companyId,
        companyName: firstLine.seller_company_name,
        receiptNumber: billingDocument?.document_number
          ? `${billingDocument.prefix || ''}${billingDocument.document_number}`
          : `POS-${String(sale.sequence_number).padStart(6, '0')}`,
        billingDocument,
        customer: null,
        manualDiscountAmount: money(lines.reduce((sum, line) => sum + line.manualDiscountAmount, 0)),
        discountReason: requestedDiscount.reason,
        payments: groupTenders.map((tender) => ({
          method: tender.method,
          amount: tender.amount,
          tenderedAmount: tender.method === 'CASH' ? tender.tenderedAmount : null,
          changeAmount: tender.changeAmount,
          receivingCompanyId: tender.receivingCompanyId,
          bankAccountId: tender.bankAccountId,
          bankName: tender.bankName,
          accountName: tender.accountName,
          maskedAccount: tender.maskedAccount,
          reference: tender.reference,
        })),
        items: lines.map((line) => ({
          productId: line.id,
          name: line.name,
          sku: line.sku,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          taxAmount: line.taxAmount,
          discountAmount: line.manualDiscountAmount || 0,
          lineTotal: line.lineTotal,
        })),
      });
    }
    return {
      grouped: true,
      receipts,
      documentCount: receipts.length,
      subtotal: Math.round((grandTotal - grandTax) * 100) / 100,
      tax_total: grandTax,
      total: grandTotal,
      manualDiscountAmount,
      discountReason: requestedDiscount.reason,
      payment_method: checkoutPaymentMethod,
      payments: tenders.map((tender) => ({
        method: tender.method,
        amount: tender.amount,
        tenderedAmount: tender.tenderedAmount,
        changeAmount: tender.method === 'CASH'
          ? money(tender.tenderedAmount - tender.amount)
          : 0,
        receivingCompanyId: tender.receivingCompanyId,
        bankAccountId: tender.bankAccountId,
        bankName: tender.bankName,
        accountName: tender.accountName,
        maskedAccount: tender.maskedAccount,
        reference: tender.reference,
      })),
      cash_received: tenders
        .filter((tender) => tender.method === 'CASH')
        .reduce((sum, tender) => sum + tender.tenderedAmount, 0) || null,
      cash_change: tenders
        .filter((tender) => tender.method === 'CASH')
        .reduce((sum, tender) => sum + money(tender.tenderedAmount - tender.amount), 0),
      sale_terms: 'IMMEDIATE',
      customer: null,
      items: receipts.flatMap((receipt) => receipt.items),
    };
  });

  let purchase;
  try {
    purchase = await registerGroupedSale();
  } catch (error) {
    if (!isIdempotencyConflict(error, 'sale_groups_company_idempotency_unique')) throw error;
    // El grupo se inserta antes de descontar inventario y de consumir
    // consecutivos, así que un reintento choca aquí sin haber movido nada. A
    // diferencia del cobro de una sola empresa, el recibo agrupado no se puede
    // reconstruir sin recalcular repartos de pago, y devolver cifras recalculadas
    // sería peor que decir la verdad: el cobro ya está registrado.
    const registered = await query(
      `SELECT id FROM sale_groups
       WHERE tenant_id = $1 AND idempotency_key = $2`,
      [req.context.tenantId, idempotencyKey],
    );
    const conflict = new AppError(
      'Este cobro ya fue registrado. Consúltalo en el historial del turno; no se creó una segunda venta.',
      409,
      'SALE_ALREADY_REGISTERED',
    );
    conflict.details = { saleGroupId: registered.rows[0]?.id || null };
    throw conflict;
  }

  for (const receipt of purchase.receipts || []) {
    if (receipt.billingDocument?.id) {
      const updatedBilling = await autoProcessElectronicDocument({
        tenantId: receipt.companyId || req.context.tenantId,
        userId: req.context.userId,
        documentId: receipt.billingDocument.id,
      });
      if (updatedBilling) {
        receipt.billingDocument = {
          ...receipt.billingDocument,
          ...updatedBilling,
        };
      }
    }
  }

  res.status(201).json(purchase);
}));

router.get('/sales/:id/internal-receipt-qr', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError('La venta debe tener un UUID válido.', 422, 'INVALID_SALE_ID');
  }
  const result = await query(
    `SELECT sale.id, sale.company_id, sale.sequence_number, sale.document_type,
            sale.total, sale.created_at, sale.status,
            company.trade_name company_name
     FROM sales sale
     JOIN tenants company ON company.id = sale.company_id
     JOIN cash_sessions session ON session.id = sale.cash_session_id
     JOIN cash_registers register ON register.id = session.cash_register_id
     WHERE sale.id = $1 AND sale.tenant_id = $2
       AND ($3::uuid IS NULL OR register.branch_id = $3)`,
    [req.params.id, req.context.tenantId, req.context.branchId],
  );
  if (!result.rowCount) {
    throw new AppError('No encontramos la venta.', 404, 'SALE_NOT_FOUND');
  }
  const sale = result.rows[0];
  if (sale.document_type === 'ELECTRONIC_INVOICE') {
    throw new AppError(
      'Las facturas electrónicas deben usar exclusivamente el QR oficial de Factus/DIAN.',
      409,
      'OFFICIAL_QR_REQUIRED',
    );
  }
  const receiptNumber = `POS-${String(sale.sequence_number).padStart(6, '0')}`;
  const receiptIdentity = {
    kind: 'NUBIXOR_INTERNAL_RECEIPT',
    companyId: sale.company_id,
    saleId: sale.id,
    receiptNumber,
    issuedAt: sale.created_at,
    total: money(sale.total).toFixed(2),
  };
  const controlCode = internalReceiptControlCode(receiptIdentity);
  const qrPayload = [
    'NUBIXOR - COMPROBANTE INTERNO',
    `Empresa: ${sale.company_name}`,
    `Comprobante: ${receiptNumber}`,
    `Venta: ${sale.id}`,
    `Fecha: ${new Date(sale.created_at).toISOString()}`,
    `Total: COP ${receiptIdentity.total}`,
    `Control: ${controlCode}`,
    'No es factura electrónica ni reemplaza el documento validado por la DIAN.',
  ].join('\n');
  const dataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: { dark: '#10257f', light: '#ffffff' },
  });
  res.json({
    kind: 'INTERNAL_RECEIPT',
    dataUrl,
    controlCode,
    receiptNumber,
    disclaimer: 'QR de control Nubixor. No es un QR DIAN ni contiene CUFE.',
  });
}));

// El recibo se arma igual lo consulte el cajero, lo pida la impresión o lo
// devuelva un reintento del cobro. Tenerlo en un solo lugar es lo que permite
// que una venta repetida responda exactamente lo mismo que la original.
async function loadSaleReceipt(req, saleId) {
  const [saleResult, itemsResult, tenderResult] = await Promise.all([
    query(
      `SELECT s.id, s.company_id, s.sequence_number, s.status, s.payment_method,
              s.subtotal, s.tax_total, s.total, s.cash_received, s.cash_change,
              s.returned_total, s.return_status,
              s.customer_id, s.sale_terms, s.due_date, s.created_at,
              s.document_type sale_document_type,
              c.name customer_name, c.document_type customer_document_type,
              c.document_number customer_document_number,
              ai.id ar_invoice_id, ai.invoice_number, ai.status receivable_status,
              ed.id electronic_document_id, ed.status electronic_document_status,
              ed.prefix billing_prefix, ed.document_number billing_number,
              ed.cufe, ed.qr_url,
              ed.pdf_document_id electronic_pdf_document_id,
              ed.failure_reason billing_failure_reason,
              payment.reference payment_reference,
              receiver.trade_name receiving_company_name
       FROM sales s
       JOIN cash_sessions cs ON cs.id = s.cash_session_id
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       LEFT JOIN customers c ON c.id = s.customer_id AND c.tenant_id = s.tenant_id
       LEFT JOIN ar_invoices ai ON ai.id = s.ar_invoice_id AND ai.tenant_id = s.tenant_id
       LEFT JOIN electronic_documents ed
         ON ed.sale_id = s.id AND ed.company_id = s.company_id
       LEFT JOIN sale_payment_records payment ON payment.sale_id = s.id
       LEFT JOIN tenants receiver ON receiver.id = payment.receiving_company_id
       WHERE s.id = $1 AND s.tenant_id = $2
         AND ($3::uuid IS NULL OR cr.branch_id = $3)`,
      [saleId, req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT item.id, item.product_id, item.sku_snapshot sku,
              item.name_snapshot name, item.quantity,
              unit_price "unitPrice", tax_rate "taxRate",
              tax_amount "taxAmount", line_total "lineTotal",
              COALESCE(returned.quantity, 0) "returnedQuantity",
              item.quantity - COALESCE(returned.quantity, 0) "returnableQuantity"
       FROM sale_items item
       LEFT JOIN LATERAL (
         SELECT SUM(return_item.quantity) quantity
         FROM sale_return_items return_item
         JOIN sale_returns header
           ON header.id = return_item.sale_return_id
          AND header.company_id = return_item.company_id
          AND header.status = 'COMPLETED'
         WHERE return_item.sale_item_id = item.id
           AND return_item.company_id = item.seller_company_id
       ) returned ON TRUE
       WHERE item.sale_id = $1 AND item.tenant_id = $2
       ORDER BY item.id`,
      [saleId, req.context.tenantId],
    ),
    query(
      `SELECT tender.method, tender.amount, tender.tendered_amount "tenderedAmount",
              tender.change_amount "changeAmount", tender.reference,
              tender.reconciliation_status "reconciliationStatus",
              account.id "bankAccountId", account.bank_name "bankName",
              account.account_name "accountName", account.masked_account "maskedAccount",
              receiver.trade_name "receivingCompanyName"
       FROM sale_payment_tenders tender
       LEFT JOIN bank_accounts account
         ON account.id = tender.bank_account_id
        AND account.tenant_id = tender.receiving_company_id
       JOIN tenants receiver ON receiver.id = tender.receiving_company_id
       WHERE tender.sale_id = $1 AND tender.seller_company_id = $2
         AND tender.reconciliation_status <> 'REVERSED'
       ORDER BY tender.recorded_at, tender.id`,
      [saleId, req.context.tenantId],
    ),
  ]);
  if (!saleResult.rowCount) return null;
  const sale = saleResult.rows[0];
  return {
    ...sale,
    receiptNumber: sale.billing_number
      ? `${sale.billing_prefix || ''}${sale.billing_number}`
      : `POS-${String(sale.sequence_number).padStart(6, '0')}`,
    customer: sale.customer_id ? {
      id: sale.customer_id,
      name: sale.customer_name,
      document_type: sale.customer_document_type,
      document_number: sale.customer_document_number,
    } : null,
    receivable: sale.ar_invoice_id ? {
      id: sale.ar_invoice_id,
      invoice_number: sale.invoice_number,
      status: sale.receivable_status,
    } : null,
    payments: tenderResult.rows,
    items: itemsResult.rows,
  };
}

router.get('/sales/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'La venta debe tener un UUID válido.' });
  }
  const receipt = await loadSaleReceipt(req, req.params.id);
  if (!receipt) {
    throw new AppError('No encontramos la venta.', 404, 'SALE_NOT_FOUND');
  }
  res.json(receipt);
}));

router.post('/sales', asyncHandler(async (req, res) => {
  const {
    cashSessionId,
    warehouseId,
    paymentMethod,
    cashReceived,
    transferReceivingCompanyId = null,
    transferBankAccountId = null,
    paymentReference = null,
    customerId = null,
    saleTerms = 'IMMEDIATE',
    dueDate = null,
    manualDiscount = null,
    items,
  } = req.body;
  const requestedPayment = typeof paymentMethod === 'string'
    ? paymentMethod.trim().toUpperCase()
    : '';
  const normalizedTerms = typeof saleTerms === 'string'
    ? saleTerms.trim().toUpperCase()
    : '';
  const normalizedPayment = normalizedTerms === 'CREDIT' ? 'CREDIT' : requestedPayment;
  const allowedPayments = ['CASH', 'CARD', 'TRANSFER'];

  if (
    !cashSessionId ||
    !warehouseId ||
    !normalizedTerms ||
    (normalizedTerms === 'IMMEDIATE' && !requestedPayment) ||
    !Array.isArray(items) ||
    !items.length
  ) {
    return res.status(422).json({
      error: 'cashSessionId, warehouseId, paymentMethod e items son obligatorios.',
    });
  }
  if (![cashSessionId, warehouseId].every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) {
    return res.status(422).json({ error: 'La caja y la bodega deben tener UUID válidos.' });
  }
  if (!['IMMEDIATE', 'CREDIT'].includes(normalizedTerms)) {
    return res.status(422).json({ error: 'El tipo de venta no es válido.' });
  }
  if (normalizedTerms === 'IMMEDIATE' && !allowedPayments.includes(normalizedPayment)) {
    return res.status(422).json({ error: 'El medio de pago no es válido.' });
  }
  if (customerId && (typeof customerId !== 'string' || !UUID_PATTERN.test(customerId))) {
    return res.status(422).json({ error: 'El cliente no es válido.' });
  }
  if (
    normalizedTerms === 'CREDIT' &&
    (!customerId || !validDate(dueDate) || dueDate < new Date().toISOString().slice(0, 10))
  ) {
    return res.status(422).json({
      error: 'La venta a crédito requiere un cliente y una fecha de vencimiento válida.',
    });
  }
  const normalizedCashReceived = Number(cashReceived);
  const normalizedPaymentReference = normalizedText(paymentReference, 120);
  if (
    normalizedPayment === 'TRANSFER' &&
    (
      transferReceivingCompanyId !== req.context.tenantId ||
      typeof transferBankAccountId !== 'string' ||
      !UUID_PATTERN.test(transferBankAccountId) ||
      !normalizedPaymentReference
    )
  ) {
    return res.status(422).json({
      error: 'Confirma la cuenta receptora y la referencia de la transferencia.',
    });
  }
  if (
    normalizedPayment === 'CASH' &&
    (!Number.isFinite(normalizedCashReceived) || normalizedCashReceived < 0)
  ) {
    return res.status(422).json({
      error: 'Registra el efectivo recibido antes de confirmar la venta.',
    });
  }
  if (items.length > 100 || items.some((item) =>
    !item || typeof item.productId !== 'string' || !UUID_PATTERN.test(item.productId) ||
    !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
    return res.status(422).json({ error: 'Los productos y cantidades de la venta no son válidos.' });
  }
  const requestedDiscount = normalizeManualDiscount(manualDiscount);
  const idempotencyKey = resolveIdempotencyKey(req);

  const consolidatedItems = new Map();
  for (const item of items) {
    const quantity = Number(item.quantity);
    consolidatedItems.set(
      item.productId,
      (consolidatedItems.get(item.productId) || 0) + quantity,
    );
  }

  const registerSale = async () => withTransaction(async (client) => {
    const alreadyRegistered = await findSaleByIdempotencyKey(
      (text, values) => client.query(text, values),
      req.context.tenantId,
      idempotencyKey,
    );
    // Un cobro ya registrado no se vuelve a procesar: se responde el mismo
    // recibo. Devolver un error obligaría al cajero a comprobar a mano si la
    // venta entró, que es justo lo que esto evita.
    if (alreadyRegistered) return { replayedSaleId: alreadyRegistered };

    const session = await client.query(
      `SELECT cs.id, cr.branch_id
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
         AND ($3::uuid IS NULL OR cr.branch_id = $3)
       FOR UPDATE OF cs`,
      [cashSessionId, req.context.tenantId, req.context.branchId],
    );
    if (!session.rowCount) {
      throw new AppError('La venta requiere un turno de caja abierto.', 409, 'CASH_SESSION_REQUIRED');
    }
    if (requestedDiscount.amount > 0) {
      const discountPermission = await client.query(
        `SELECT 1
         FROM tenant_users membership
         JOIN role_permissions permission
           ON permission.tenant_id = membership.tenant_id
          AND permission.role_id = membership.role_id
          AND permission.permission_code = 'sale.discount.apply'
         WHERE membership.tenant_id = $1
           AND membership.user_id = $2
           AND membership.status = 'ACTIVE'
         LIMIT 1`,
        [req.context.tenantId, req.context.userId],
      );
      if (!discountPermission.rowCount) {
        throw new AppError('Tu perfil no tiene autorización para aplicar descuentos.', 403, 'DISCOUNT_PERMISSION_DENIED');
      }
    }
    const fiscalProfile = await client.query(
      `SELECT electronic_invoicing_required, default_document_type
       FROM company_tax_profiles
       WHERE company_id = $1 AND active = TRUE
       FOR SHARE`,
      [req.context.tenantId],
    );
    const documentType =
      fiscalProfile.rows[0]?.default_document_type || 'INTERNAL_RECEIPT';
    let billingResolution = null;
    if (documentType === 'ELECTRONIC_INVOICE') {
      const resolution = await client.query(
        `SELECT id, prefix
         FROM billing_resolutions
         WHERE company_id = $1 AND branch_id = $2 AND active = TRUE
           AND CURRENT_DATE BETWEEN valid_from AND valid_until
           AND current_number <= number_to
         ORDER BY valid_until, created_at
         LIMIT 1
         FOR UPDATE`,
        [req.context.tenantId, session.rows[0].branch_id],
      );
      billingResolution = resolution.rows[0] || null;
      if (!billingResolution) {
        throw new AppError(
          'La empresa no tiene una resolución de facturación electrónica vigente para esta sucursal. Configúrala antes de confirmar la venta.',
          409,
          'BILLING_RESOLUTION_REQUIRED',
        );
      }
    }
    let customer = null;
    if (customerId) {
      const customerResult = await client.query(
        `SELECT id, name, document_type, document_number, phone
         FROM customers
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
        [customerId, req.context.tenantId],
      );
      if (!customerResult.rowCount) {
        throw new AppError(
          'El cliente no pertenece a la empresa activa.',
          404,
          'CUSTOMER_NOT_FOUND',
        );
      }
      customer = customerResult.rows[0];
    }
    const warehouse = await client.query(
      `SELECT id, warehouse_type
       FROM warehouses
       WHERE id = $1 AND tenant_id = $2 AND branch_id = $3 AND active = TRUE`,
      [warehouseId, req.context.tenantId, session.rows[0].branch_id],
    );
    if (!warehouse.rowCount) {
      throw new AppError(
        'La bodega debe pertenecer a la misma sucursal de la caja.',
        422,
        'WAREHOUSE_BRANCH_MISMATCH',
      );
    }
    if (
      req.context.user?.role_code === 'CASHIER' &&
      warehouse.rows[0].warehouse_type !== 'DISPLAY'
    ) {
      throw new AppError(
        'El perfil de Caja solo puede vender existencias de exhibición.',
        403,
        'CASHIER_DISPLAY_ONLY',
      );
    }

    const productIds = [...consolidatedItems.keys()];
    const productResult = await client.query(
      `SELECT p.id, p.sku, p.name, p.cost, p.sale_price,
              p.tax_review_status, COALESCE(tc.rate, 0) tax_rate
       FROM products p
       LEFT JOIN tax_categories tc ON tc.id = p.sales_tax_category_id
       WHERE p.tenant_id = $1 AND p.id = ANY($2::uuid[]) AND p.deleted_at IS NULL
       FOR SHARE OF p`,
      [req.context.tenantId, productIds],
    );
    if (productResult.rowCount !== productIds.length) {
      throw new AppError('Uno o más productos no pertenecen a la empresa.', 422, 'SALE_PRODUCT_INVALID');
    }

    const commercialPricing = await loadCommercialPricing(
      client,
      productResult.rows,
      customerId,
    );
    const lines = [];
    let total = 0;
    let taxTotal = 0;
    for (const product of productResult.rows) {
      if (product.tax_review_status !== 'REVIEWED') {
        throw new AppError(
          `Revisa el impuesto de ${product.name} antes de venderlo.`,
          409,
          'PRODUCT_TAX_PENDING',
        );
      }
      const quantity = consolidatedItems.get(product.id);
      const appliedPrice = resolveCommercialPrice(
        product,
        quantity,
        commercialPricing.get(product.id),
      );
      const unitPrice = appliedPrice.unitPrice;
      const taxRate = Number(product.tax_rate);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      const lineTax = taxRate > 0
        ? Math.round((lineTotal * taxRate / (100 + taxRate)) * 100) / 100
        : 0;
      total += lineTotal;
      taxTotal += lineTax;
      lines.push({
        ...product,
        quantity,
        unitPrice,
        taxRate,
        lineTotal,
        lineTax,
        pricing: appliedPrice,
      });
    }
    const manualDiscountAmount = applyManualDiscount(lines, requestedDiscount);
    total = money(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    taxTotal = money(lines.reduce((sum, line) => sum + line.lineTax, 0));
    const subtotal = Math.round((total - taxTotal) * 100) / 100;
    const saleTenders = normalizedTerms === 'IMMEDIATE'
      ? normalizeSaleTenders({
        paymentMethod: normalizedPayment,
        cashReceived: normalizedCashReceived,
        transferReceivingCompanyId,
        transferBankAccountId,
        paymentReference: normalizedPaymentReference,
      }, total)
      : [];
    if (normalizedPayment === 'TRANSFER') {
      const bank = await client.query(
        `SELECT id FROM bank_accounts
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE
         FOR SHARE`,
        [transferBankAccountId, req.context.tenantId],
      );
      if (!bank.rowCount) {
        throw new AppError(
          'La cuenta bancaria no pertenece a la empresa activa.',
          422,
          'TRANSFER_ACCOUNT_INVALID',
        );
      }
    }
    const cashTender = saleTenders.find((tender) => tender.method === 'CASH');
    const tendered = cashTender?.tenderedAmount || null;
    const change = cashTender ? money(cashTender.tenderedAmount - cashTender.amount) : null;

    const saleResult = await client.query(
      `INSERT INTO sales(
         tenant_id, cash_session_id, warehouse_id, payment_method,
         subtotal, tax_total, total, cash_received, cash_change, created_by,
         customer_id, sale_terms, due_date, document_type, billing_resolution_id,
         manual_discount_amount, manual_discount_reason, idempotency_key
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, sequence_number, status, payment_method,
                 subtotal, tax_total, total, cash_received, cash_change,
                 customer_id, sale_terms, due_date, document_type,
                 billing_resolution_id, created_at`,
      [
        req.context.tenantId,
        cashSessionId,
        warehouseId,
        normalizedPayment,
        subtotal,
        taxTotal,
        total,
        tendered,
        change,
        req.context.userId,
        customer?.id || null,
        normalizedTerms,
        normalizedTerms === 'CREDIT' ? dueDate : null,
        documentType,
        billingResolution?.id || null,
        manualDiscountAmount,
        requestedDiscount.reason,
        idempotencyKey,
      ],
    );
    const sale = saleResult.rows[0];
    for (const tender of saleTenders) {
      await client.query(
        `INSERT INTO sale_payment_tenders(
           sale_id, seller_company_id, receiving_company_id, bank_account_id,
           method, amount, tendered_amount, change_amount, reference,
           reconciliation_status, recorded_by
         )
         VALUES($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          sale.id,
          req.context.tenantId,
          tender.method === 'TRANSFER' ? transferBankAccountId : null,
          tender.method,
          tender.amount,
          tender.method === 'CASH' ? tender.tenderedAmount : null,
          tender.method === 'CASH'
            ? money(tender.tenderedAmount - tender.amount)
            : 0,
          tender.reference,
          tender.method === 'TRANSFER' ? 'PENDING' : 'NOT_APPLICABLE',
          req.context.userId,
        ],
      );
    }
    let billingDocument = null;
    if (documentType === 'ELECTRONIC_INVOICE') {
      let billingNumber = null;
      if (billingResolution) {
        const number = await client.query(
          `UPDATE billing_resolutions
           SET current_number = current_number + 1, updated_at = now()
           WHERE id = $1 AND company_id = $2 AND current_number <= number_to
           RETURNING current_number - 1 document_number`,
          [billingResolution.id, req.context.tenantId],
        );
        billingNumber = number.rows[0]?.document_number || null;
      }
      const document = await client.query(
        `INSERT INTO electronic_documents(
           company_id, sale_id, billing_resolution_id, document_type,
           prefix, document_number, status, failure_reason
         )
         VALUES($1,$2,$3,$4,$5,$6,'PENDING',$7)
         RETURNING id, document_type, prefix, document_number, status, failure_reason`,
        [
          req.context.tenantId,
          sale.id,
          billingResolution?.id || null,
          documentType,
          billingResolution?.prefix || null,
          billingNumber,
          billingResolution
            ? 'Pendiente de transmisión al proveedor tecnológico.'
            : 'Falta configurar una resolución de facturación vigente.',
        ],
      );
      billingDocument = document.rows[0];
    }

    for (const line of lines) {
      const balance = await client.query(
        `UPDATE inventory_balances
         SET on_hand = on_hand - $1, updated_at = now()
         WHERE tenant_id = $2 AND product_id = $3 AND warehouse_id = $4
           AND on_hand - reserved >= $1
         RETURNING on_hand, reserved`,
        [line.quantity, req.context.tenantId, line.id, warehouseId],
      );
      if (!balance.rowCount) {
        throw new AppError(
          `No hay existencias suficientes de ${line.name}.`,
          409,
          'INSUFFICIENT_STOCK',
        );
      }
      await client.query(
        `INSERT INTO sale_items(
           tenant_id, sale_id, product_id, sku_snapshot, name_snapshot,
           quantity, unit_price, unit_cost, tax_rate, tax_amount, line_total, discount_amount,
           list_unit_price,pricing_source,pricing_label
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          req.context.tenantId,
          sale.id,
          line.id,
          line.sku,
          line.name,
          line.quantity,
          line.unitPrice,
          line.cost,
          line.taxRate,
          line.lineTax,
          line.lineTotal,
          line.manualDiscountAmount || 0,
          line.pricing.basePrice,
          line.pricing.source,
          line.pricing.label,
        ],
      );
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, product_id, warehouse_id, movement_type, quantity,
           unit_cost, reference_type, reference_id, reason, created_by
         )
         VALUES($1,$2,$3,'SALE',$4,$5,'SALE',$6,$7,$8)`,
        [
          req.context.tenantId,
          line.id,
          warehouseId,
          -line.quantity,
          line.cost,
          sale.id,
          `Venta POS #${sale.sequence_number}`,
          req.context.userId,
        ],
      );
    }

    let receivable = null;
    if (normalizedTerms === 'CREDIT') {
      const invoiceResult = await client.query(
        `INSERT INTO ar_invoices(
           tenant_id, customer_id, branch_id, external_reference,
           issue_date, due_date, subtotal, tax_total, total, notes, created_by
         )
         VALUES($1,$2,$3,$4,CURRENT_DATE,$5,$6,$7,$8,$9,$10)
         RETURNING id, invoice_number, due_date, total, paid_amount, status`,
        [
          req.context.tenantId,
          customer.id,
          session.rows[0].branch_id,
          `POS-${String(sale.sequence_number).padStart(6, '0')}`,
          dueDate,
          subtotal,
          taxTotal,
          total,
          `Venta a crédito originada en Caja & POS #${sale.sequence_number}`,
          req.context.userId,
        ],
      );
      receivable = invoiceResult.rows[0];
      for (const line of lines) {
        const lineSubtotal = Math.round((line.lineTotal - line.lineTax) * 100) / 100;
        const netUnitPrice = Math.round((lineSubtotal / line.quantity) * 100) / 100;
        await client.query(
          `INSERT INTO ar_invoice_items(
             tenant_id, invoice_id, description, quantity, unit_price, tax_rate,
             subtotal, tax_amount, line_total
           )
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            req.context.tenantId,
            receivable.id,
            `${line.name} · ${line.sku}`,
            line.quantity,
            netUnitPrice,
            line.taxRate,
            lineSubtotal,
            line.lineTax,
            line.lineTotal,
          ],
        );
      }
      await client.query(
        `UPDATE sales SET ar_invoice_id = $1 WHERE id = $2`,
        [receivable.id, sale.id],
      );
      sale.ar_invoice_id = receivable.id;
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'receivable.invoice_created_from_pos',
        entityType: 'ar_invoice',
        entityId: receivable.id,
        after: { ...receivable, saleId: sale.id, customerId: customer.id },
        reason: 'Cuenta por cobrar creada automáticamente desde Caja & POS',
      });
    }

    let transferRecord = null;
    if (normalizedPayment === 'TRANSFER') {
      await client.query(
        `INSERT INTO sale_payment_records(
           sale_id, seller_company_id, receiving_company_id, payment_method,
           amount, reference, reconciliation_status, recorded_by
         )
         VALUES($1,$2,$2,'TRANSFER',$3,$4,'CONFIRMED',$5)`,
        [
          sale.id,
          req.context.tenantId,
          total,
          normalizedPaymentReference,
          req.context.userId,
        ],
      );
      const receiver = await client.query(
        'SELECT trade_name FROM tenants WHERE id = $1',
        [req.context.tenantId],
      );
      transferRecord = {
        payment_reference: normalizedPaymentReference,
        receiving_company_name: receiver.rows[0]?.trade_name || 'Empresa receptora',
      };
    }

    await postSaleAccounting(client, {
      tenantId: req.context.tenantId,
      saleId: sale.id,
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'sale.completed',
      entityType: 'sale',
      entityId: sale.id,
      after: { ...sale, items: lines.length, manualDiscountAmount, discountReason: requestedDiscount.reason },
      reason: manualDiscountAmount
        ? `Venta confirmada desde Caja & POS con descuento: ${requestedDiscount.reason}`
        : 'Venta confirmada desde Caja & POS',
    });

    return {
      ...sale,
      receiptNumber: billingDocument?.document_number
        ? `${billingDocument.prefix || ''}${billingDocument.document_number}`
        : `POS-${String(sale.sequence_number).padStart(6, '0')}`,
      billingDocument,
      ...transferRecord,
      customer: customer || null,
      receivable,
      manualDiscountAmount,
      discountReason: requestedDiscount.reason,
      payments: saleTenders.map((tender) => ({
        method: tender.method,
        amount: tender.amount,
        tenderedAmount: tender.tenderedAmount,
        changeAmount: tender.method === 'CASH'
          ? money(tender.tenderedAmount - tender.amount)
          : 0,
        bankAccountId: tender.bankAccountId,
        reference: tender.reference,
      })),
      items: lines.map((line) => ({
        productId: line.id,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        taxAmount: line.lineTax,
        discountAmount: line.manualDiscountAmount || 0,
        lineTotal: line.lineTotal,
      })),
    };
  });

  let receipt;
  try {
    receipt = await registerSale();
  } catch (error) {
    // Dos peticiones idénticas al mismo tiempo: una registra la venta y la otra
    // choca contra el índice único. La segunda no es un fallo, es la misma venta
    // vista dos veces, así que responde el recibo de la que ganó.
    if (!isIdempotencyConflict(error, 'sales_company_idempotency_unique')) throw error;
    receipt = { replayedSaleId: null };
  }

  if ('replayedSaleId' in receipt) {
    const registeredId = receipt.replayedSaleId
      || await findSaleByIdempotencyKey(query, req.context.tenantId, idempotencyKey);
    const priorReceipt = registeredId ? await loadSaleReceipt(req, registeredId) : null;
    if (!priorReceipt) {
      throw new AppError(
        'Esta venta ya fue registrada, pero no pudimos recuperar el recibo. Búscala en el historial del turno.',
        409,
        'SALE_ALREADY_REGISTERED',
      );
    }
    res.setHeader('Idempotency-Replayed', 'true');
    return res.status(200).json({ ...priorReceipt, replayed: true });
  }

  if (receipt.billingDocument?.id) {
    const updatedBilling = await autoProcessElectronicDocument({
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      documentId: receipt.billingDocument.id,
    });
    if (updatedBilling) {
      receipt.billingDocument = {
        ...receipt.billingDocument,
        ...updatedBilling,
      };
    }
  }

  res.status(201).json(receipt);
}));

export default router;
