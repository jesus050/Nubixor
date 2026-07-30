import { Router } from 'express';
import { createHash } from 'node:crypto';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { csvCell } from '../shared/csv.js';
import { writeAudit } from '../audit.js';
import { requirePermission } from '../authorization.js';
import { reverseJournalEntry } from '../accounting.js';

const router = Router();
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER_PATTERN = /^\d+$/;
const REVIEW_TYPES = new Set([
  'RUT', 'TAXES', 'BILLING_RESOLUTIONS', 'ACCOUNTING_FLOW',
]);
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ACCOUNT_TYPES = new Set(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']);
const NORMAL_BALANCES = new Set(['DEBIT', 'CREDIT']);

router.use(requireTenant);

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El filtro supera ${maxLength} caracteres.`,
      422,
      'AUDIT_FILTER_TOO_LONG',
    );
  }
  return normalized;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function parseFilters(search) {
  const dateFrom = cleanText(search.dateFrom, 10);
  const dateTo = cleanText(search.dateTo, 10);
  if ((dateFrom && !validDate(dateFrom)) || (dateTo && !validDate(dateTo))) {
    throw new AppError(
      'Las fechas de auditoría deben usar el formato AAAA-MM-DD.',
      422,
      'INVALID_AUDIT_DATE',
    );
  }
  if (dateFrom && dateTo && dateTo < dateFrom) {
    throw new AppError(
      'La fecha final no puede ser anterior a la fecha inicial.',
      422,
      'INVALID_AUDIT_DATE_RANGE',
    );
  }
  const page = Number(search.page || 1);
  const pageSize = Number(search.pageSize || 30);
  if (!Number.isInteger(page) || page < 1 ||
      !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new AppError(
      'La paginación de auditoría no es válida.',
      422,
      'INVALID_AUDIT_PAGINATION',
    );
  }
  return {
    q: cleanText(search.q, 120),
    actorId: cleanText(search.actorId, 36),
    action: cleanText(search.action, 100),
    entityType: cleanText(search.entityType, 100),
    dateFrom,
    dateTo,
    page,
    pageSize,
  };
}

function parsePeriod(search) {
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = `${defaultTo.slice(0, 8)}01`;
  const dateFrom = cleanText(search.dateFrom, 10) || defaultFrom;
  const dateTo = cleanText(search.dateTo, 10) || defaultTo;
  if (!validDate(dateFrom) || !validDate(dateTo) || dateTo < dateFrom) {
    throw new AppError(
      'El período debe usar fechas válidas en formato AAAA-MM-DD.',
      422,
      'INVALID_AUDIT_PERIOD',
    );
  }
  return { dateFrom, dateTo };
}

function normalizedReviewText(value, field, maxLength, required = false) {
  const result = cleanText(value, maxLength);
  if (required && !result) {
    throw new AppError(
      `${field} es obligatorio.`,
      422,
      'AUDIT_REVIEW_FIELD_REQUIRED',
    );
  }
  return result;
}

async function calculateReadiness(tenantId, period) {
  const params = [tenantId, period.dateFrom, period.dateTo];
  const [
    companyResult,
    chainResult,
    salesResult,
    inventoryResult,
    cashResult,
    fiscalResult,
    billingResult,
    reviewsResult,
    accountingResult,
  ] = await Promise.all([
    query(
      `SELECT id, legal_name, trade_name, tax_id, status
       FROM tenants WHERE id = $1`,
      [tenantId],
    ),
    query(
      `WITH ordered AS (
         SELECT ae.*,
                lag(event_hash) OVER (PARTITION BY tenant_id ORDER BY id) expected_previous
         FROM audit_events ae
         WHERE tenant_id = $1
       )
       SELECT COUNT(*)::integer event_count,
              COUNT(*) FILTER (
                WHERE event_hash <> audit_event_hash(
                  tenant_id, id, created_at, actor_user_id, action, entity_type,
                  entity_id, before_data, after_data, reason, metadata, previous_hash
                )
                OR previous_hash IS DISTINCT FROM expected_previous
              )::integer invalid_count,
              max(id)::text last_event_id,
              (array_agg(event_hash ORDER BY id DESC))[1] chain_head_hash
       FROM ordered`,
      [tenantId],
    ),
    query(
      `SELECT COUNT(*)::integer sale_count,
              COALESCE(SUM(total), 0) sales_total,
              COALESCE(SUM(tax_total), 0) tax_total
       FROM sales
       WHERE company_id = $1 AND status = 'COMPLETED'
         AND created_at >= $2::date
         AND created_at < ($3::date + INTERVAL '1 day')`,
      params,
    ),
    query(
      `WITH sold AS (
         SELECT s.id sale_id, si.product_id, SUM(si.quantity) quantity
         FROM sales s
         JOIN sale_items si ON si.sale_id = s.id AND si.tenant_id = s.company_id
         WHERE s.company_id = $1 AND s.status = 'COMPLETED'
           AND s.created_at >= $2::date
           AND s.created_at < ($3::date + INTERVAL '1 day')
         GROUP BY s.id, si.product_id
       ), moved AS (
         SELECT reference_id sale_id, product_id, ABS(SUM(quantity)) quantity
         FROM inventory_movements
         WHERE tenant_id = $1 AND reference_type = 'SALE'
         GROUP BY reference_id, product_id
       )
       SELECT COUNT(*) FILTER (
         WHERE moved.quantity IS NULL OR moved.quantity <> sold.quantity
       )::integer mismatch_count,
       COUNT(*)::integer line_count
       FROM sold
       LEFT JOIN moved
         ON moved.sale_id = sold.sale_id::text
        AND moved.product_id = sold.product_id`,
      params,
    ),
    query(
      `SELECT COUNT(*) FILTER (
                WHERE status = 'OPEN' AND opened_at < now() - INTERVAL '24 hours'
              )::integer stale_open_sessions,
              COUNT(*) FILTER (
                WHERE status = 'CLOSED'
                  AND ABS(COALESCE(difference, 0)) > 0
                  AND NULLIF(BTRIM(COALESCE(closing_notes, '')), '') IS NULL
              )::integer unexplained_differences
       FROM cash_sessions
       WHERE tenant_id = $1
         AND opened_at < ($3::date + INTERVAL '1 day')
         AND COALESCE(closed_at, now()) >= $2::date`,
      params,
    ),
    query(
      `SELECT profile.electronic_invoicing_required,
              profile.default_document_type,
              profile.taxpayer_type,
              profile.vat_responsibility,
              profile.tax_regime,
              profile.validation_status,
              COUNT(product.id) FILTER (
                WHERE product.deleted_at IS NULL
                  AND product.tax_review_status <> 'REVIEWED'
              )::integer products_pending_tax_review
       FROM company_tax_profiles profile
       LEFT JOIN products product ON product.tenant_id = profile.company_id
       WHERE profile.company_id = $1
       GROUP BY profile.company_id`,
      [tenantId],
    ),
    query(
      `SELECT
         EXISTS(
           SELECT 1 FROM electronic_billing_accounts
           WHERE company_id = $1 AND active = TRUE
             AND connection_status = 'READY'
         ) account_ready,
         EXISTS(
           SELECT 1 FROM billing_resolutions
           WHERE company_id = $1 AND active = TRUE
             AND $3::date BETWEEN valid_from AND valid_until
             AND current_number <= number_to
         ) resolution_ready,
         COUNT(*) FILTER (
           WHERE document.status <> 'ACCEPTED'
             AND document.document_type = 'ELECTRONIC_INVOICE'
         )::integer documents_not_accepted,
         COUNT(*) FILTER (
           WHERE document.status = 'REJECTED'
         )::integer rejected_documents
       FROM electronic_documents document
       WHERE document.company_id = $1
         AND document.created_at >= $2::date
         AND document.created_at < ($3::date + INTERVAL '1 day')`,
      params,
    ),
    query(
      `SELECT review_type, status, reviewer_name, professional_card,
              reviewed_at, notes, evidence_reference
       FROM accountant_compliance_reviews
       WHERE tenant_id = $1
         AND period_start <= $2::date
         AND period_end >= $3::date
       ORDER BY review_type`,
      params,
    ),
    query(
      `WITH operational_sources AS (
         SELECT 'SALE' source_type, id::text source_id, created_at occurred_at
         FROM sales
         WHERE company_id = $1 AND status = 'COMPLETED'
         UNION ALL
         SELECT 'AR_INVOICE', id::text, issue_date::timestamptz
         FROM ar_invoices
         WHERE tenant_id = $1 AND status <> 'VOID'
         UNION ALL
         SELECT 'AR_PAYMENT', id::text, payment_date::timestamptz
         FROM ar_payments WHERE tenant_id = $1
         UNION ALL
         SELECT 'PURCHASE_RECEIPT', id::text, received_at
         FROM purchase_receipts WHERE tenant_id = $1
         UNION ALL
         SELECT 'AP_INVOICE', id::text, issue_date::timestamptz
         FROM ap_invoices
         WHERE tenant_id = $1 AND status <> 'VOID'
         UNION ALL
         SELECT 'AP_PAYMENT', id::text, payment_date::timestamptz
         FROM ap_payments WHERE tenant_id = $1
         UNION ALL
         SELECT 'CASH_MOVEMENT', id::text, created_at
         FROM cash_movements WHERE tenant_id = $1
         UNION ALL
         SELECT 'CASH_OPEN', id::text, opened_at
         FROM cash_sessions
         WHERE tenant_id = $1 AND opening_amount > 0
         UNION ALL
         SELECT 'CASH_CLOSE', id::text, closed_at
         FROM cash_sessions
         WHERE tenant_id = $1 AND status = 'CLOSED'
           AND (closing_amount > 0 OR COALESCE(difference, 0) <> 0)
       ), scoped_sources AS (
         SELECT *
         FROM operational_sources
         WHERE occurred_at >= $2::date
           AND occurred_at < ($3::date + INTERVAL '1 day')
       ), source_control AS (
         SELECT COUNT(*)::integer source_count,
                COUNT(*) FILTER (WHERE entry.id IS NULL)::integer missing_count
         FROM scoped_sources source
         LEFT JOIN journal_entries entry
           ON entry.tenant_id = $1
          AND entry.source_type = source.source_type
          AND entry.source_id = source.source_id
          AND entry.status = 'POSTED'
       ), ledger_control AS (
         SELECT COUNT(*) FILTER (WHERE status = 'POSTED')::integer posted_count,
                COUNT(*) FILTER (WHERE status = 'DRAFT')::integer draft_count,
                COUNT(*) FILTER (
                  WHERE status = 'POSTED' AND total_debit <> total_credit
                )::integer unbalanced_count,
                COALESCE(SUM(total_debit) FILTER (WHERE status = 'POSTED'), 0) debit_total,
                COALESCE(SUM(total_credit) FILTER (WHERE status = 'POSTED'), 0) credit_total
         FROM journal_entries
         WHERE tenant_id = $1
           AND entry_date >= $2::date
           AND entry_date <= $3::date
       ), chart_control AS (
         SELECT COUNT(*) FILTER (
                  WHERE active = TRUE AND accountant_review_required = TRUE
                )::integer accounts_pending_review
         FROM accounting_accounts
         WHERE tenant_id = $1
       )
       SELECT source_control.*, ledger_control.*, chart_control.*
       FROM source_control, ledger_control, chart_control`,
      params,
    ),
  ]);

  if (!companyResult.rowCount) {
    throw new AppError('No encontramos la empresa.', 404, 'COMPANY_NOT_FOUND');
  }
  const company = companyResult.rows[0];
  const chain = chainResult.rows[0];
  const sales = salesResult.rows[0];
  const inventory = inventoryResult.rows[0];
  const cash = cashResult.rows[0];
  const fiscal = fiscalResult.rows[0] || {};
  const billing = billingResult.rows[0];
  const accounting = accountingResult.rows[0];
  const reviewMap = new Map(reviewsResult.rows.map((row) => [row.review_type, row]));
  const reviewsApproved = [...REVIEW_TYPES].filter(
    (type) => reviewMap.get(type)?.status === 'APPROVED',
  ).length;
  const fiscalFieldsPending = [
    fiscal.taxpayer_type,
    fiscal.vat_responsibility,
    fiscal.tax_regime,
  ].filter((value) => !value || value === 'PENDING_ACCOUNTING_REVIEW').length;
  const taxProfileValidated = fiscal.validation_status === 'VALIDATED';

  const controls = [
    {
      id: 'AUDIT_CHAIN',
      area: 'Auditoría',
      title: 'Bitácora inalterable',
      status: Number(chain.invalid_count) === 0 ? 'PASS' : 'FAIL',
      detail: Number(chain.invalid_count) === 0
        ? `${chain.event_count} eventos encadenados y verificables.`
        : `${chain.invalid_count} eventos no superaron la verificación criptográfica.`,
      evidenceCount: Number(chain.event_count),
    },
    {
      id: 'SALES_INVENTORY',
      area: 'Operación',
      title: 'Ventas contra salidas de inventario',
      status: Number(inventory.mismatch_count) === 0 ? 'PASS' : 'FAIL',
      detail: Number(inventory.mismatch_count) === 0
        ? `${inventory.line_count} líneas conciliadas.`
        : `${inventory.mismatch_count} líneas no coinciden con sus movimientos.`,
      evidenceCount: Number(inventory.line_count),
    },
    {
      id: 'CASH_CLOSING',
      area: 'Caja',
      title: 'Turnos y diferencias explicadas',
      status: Number(cash.stale_open_sessions) === 0 &&
        Number(cash.unexplained_differences) === 0 ? 'PASS' : 'FAIL',
      detail: `${cash.stale_open_sessions} turnos abiertos por más de 24 h; ` +
        `${cash.unexplained_differences} diferencias sin explicación.`,
      evidenceCount: Number(cash.stale_open_sessions) +
        Number(cash.unexplained_differences),
    },
    {
      id: 'TAX_CONFIGURATION',
      area: 'Fiscal',
      title: 'RUT, responsabilidades e impuestos',
      status: taxProfileValidated && fiscalFieldsPending === 0 &&
        Number(fiscal.products_pending_tax_review) === 0 ? 'PASS' : 'FAIL',
      detail: `Perfil ${taxProfileValidated ? 'validado' : 'sin validación final'}; ` +
        `${fiscalFieldsPending} datos fiscales pendientes; ` +
        `${fiscal.products_pending_tax_review || 0} productos sin revisión tributaria.`,
      evidenceCount: Number(fiscal.products_pending_tax_review || 0),
    },
    {
      id: 'ELECTRONIC_BILLING',
      area: 'Facturación',
      title: 'Documentos electrónicos aceptados',
      status: !fiscal.electronic_invoicing_required
        ? 'PASS'
        : (billing.account_ready && billing.resolution_ready &&
          Number(billing.documents_not_accepted) === 0 ? 'PASS' : 'FAIL'),
      detail: !fiscal.electronic_invoicing_required
        ? 'El perfil vigente indica que la empresa no está obligada a facturar electrónicamente.'
        : `Cuenta ${billing.account_ready ? 'lista' : 'pendiente'}, resolución ` +
          `${billing.resolution_ready ? 'vigente' : 'pendiente'} y ` +
          `${billing.documents_not_accepted} documentos sin aceptación.`,
      evidenceCount: Number(billing.documents_not_accepted),
    },
    {
      id: 'ACCOUNTANT_SIGNOFF',
      area: 'Contador',
      title: 'Validación profesional del período',
      status: reviewsApproved === REVIEW_TYPES.size ? 'PASS' : 'FAIL',
      detail: `${reviewsApproved} de ${REVIEW_TYPES.size} validaciones aprobadas.`,
      evidenceCount: reviewsApproved,
    },
    {
      id: 'AUTOMATIC_ACCOUNTING',
      area: 'Contabilidad',
      title: 'Asientos automáticos conciliados',
      status: Number(accounting.missing_count) === 0 &&
        Number(accounting.draft_count) === 0 &&
        Number(accounting.unbalanced_count) === 0 ? 'PASS' : 'FAIL',
      detail: `${accounting.posted_count} asientos contabilizados; ` +
        `${accounting.missing_count} operaciones sin asiento; ` +
        `${accounting.draft_count} borradores y ${accounting.unbalanced_count} descuadrados. ` +
        `${accounting.accounts_pending_review} cuentas de la plantilla requieren visto bueno del contador.`,
      evidenceCount: Number(accounting.posted_count),
    },
  ];
  const passed = controls.filter((control) => control.status === 'PASS').length;
  const failed = controls.length - passed;
  const score = Math.round((passed / controls.length) * 100);
  return {
    company,
    period: { start: period.dateFrom, end: period.dateTo },
    status: failed === 0 ? 'PASS' : (score >= 70 ? 'WARNING' : 'FAIL'),
    score,
    controls,
    totals: {
      sales: Number(sales.sale_count),
      salesAmount: Number(sales.sales_total),
      taxAmount: Number(sales.tax_total),
      auditEvents: Number(chain.event_count),
      journalEntries: Number(accounting.posted_count),
      journalDebit: Number(accounting.debit_total),
      journalCredit: Number(accounting.credit_total),
    },
    chain: {
      headHash: chain.chain_head_hash || null,
      lastEventId: chain.last_event_id || null,
      valid: Number(chain.invalid_count) === 0,
    },
    accountantReviews: reviewsResult.rows,
    generatedAt: new Date().toISOString(),
  };
}

function buildWhere(tenantId, filters) {
  const values = [tenantId];
  const clauses = ['ae.tenant_id = $1'];
  const add = (clause, value) => {
    values.push(value);
    clauses.push(clause.replace('?', `$${values.length}`));
  };
  if (filters.q) {
    add(
      `(ae.action ILIKE '%' || ? || '%'
        OR ae.entity_type ILIKE '%' || ? || '%'
        OR COALESCE(ae.entity_id, '') ILIKE '%' || ? || '%'
        OR COALESCE(ae.reason, '') ILIKE '%' || ? || '%'
        OR COALESCE(u.full_name, '') ILIKE '%' || ? || '%'
        OR COALESCE(u.email, '') ILIKE '%' || ? || '%')`,
      filters.q,
    );
    const index = values.length;
    clauses[clauses.length - 1] = clauses[clauses.length - 1]
      .replaceAll('?', `$${index}`);
  }
  if (filters.actorId) add('ae.actor_user_id::text = ?', filters.actorId);
  if (filters.action) add('ae.action = ?', filters.action);
  if (filters.entityType) add('ae.entity_type = ?', filters.entityType);
  if (filters.dateFrom) add('ae.created_at >= ?::date', filters.dateFrom);
  if (filters.dateTo) add(`ae.created_at < (?::date + INTERVAL '1 day')`, filters.dateTo);
  return { clause: clauses.join('\n AND '), values };
}

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT COUNT(*)::integer total,
            COUNT(*) FILTER (
              WHERE created_at >= CURRENT_DATE
            )::integer today,
            COUNT(*) FILTER (
              WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
            )::integer last_7_days,
            COUNT(*) FILTER (
              WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
            )::integer last_30_days,
            COUNT(DISTINCT actor_user_id) FILTER (
              WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
            )::integer active_actors,
            COUNT(DISTINCT action)::integer action_types
     FROM audit_events
     WHERE tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/readiness', asyncHandler(async (req, res) => {
  const period = parsePeriod(req.query);
  res.json(await calculateReadiness(req.context.tenantId, period));
}));

router.get('/accounting-ledger', asyncHandler(async (req, res) => {
  const period = parsePeriod(req.query);
  const params = [req.context.tenantId, period.dateFrom, period.dateTo];
  const [summary, entries, accounts] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'POSTED')::integer posted_count,
         COUNT(*) FILTER (WHERE status = 'DRAFT')::integer draft_count,
         COALESCE(SUM(total_debit) FILTER (WHERE status = 'POSTED'), 0) debit_total,
         COALESCE(SUM(total_credit) FILTER (WHERE status = 'POSTED'), 0) credit_total,
         COUNT(DISTINCT source_type) FILTER (
           WHERE status = 'POSTED'
         )::integer source_types
       FROM journal_entries
       WHERE tenant_id = $1
         AND entry_date BETWEEN $2::date AND $3::date`,
      params,
    ),
    query(
      `SELECT entry.id, entry.entry_number, entry.entry_date,
              entry.source_type, entry.source_id, entry.description,
              entry.status, entry.total_debit, entry.total_credit,
              entry.entry_hash, entry.posted_at, entry.reversal_of,
              EXISTS(
                SELECT 1 FROM journal_entries reversal
                WHERE reversal.tenant_id = entry.tenant_id
                  AND reversal.reversal_of = entry.id
              ) has_reversal,
              COALESCE(actor.full_name, actor.email, 'Sistema') actor_name,
              COUNT(line.id)::integer line_count
       FROM journal_entries entry
       LEFT JOIN users actor ON actor.id = entry.created_by
       LEFT JOIN journal_entry_lines line
         ON line.journal_entry_id = entry.id
        AND line.tenant_id = entry.tenant_id
       WHERE entry.tenant_id = $1
         AND entry.entry_date BETWEEN $2::date AND $3::date
       GROUP BY entry.id, actor.full_name, actor.email
       ORDER BY entry.entry_date DESC, entry.entry_number DESC
       LIMIT 30`,
      params,
    ),
    query(
      `SELECT COUNT(*)::integer active_count,
              COUNT(*) FILTER (
                WHERE accountant_review_required = TRUE
              )::integer pending_review
       FROM accounting_accounts
       WHERE tenant_id = $1 AND active = TRUE`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    period: { start: period.dateFrom, end: period.dateTo },
    summary: {
      ...summary.rows[0],
      active_accounts: accounts.rows[0].active_count,
      accounts_pending_review: accounts.rows[0].pending_review,
      balanced: Number(summary.rows[0].debit_total) ===
        Number(summary.rows[0].credit_total),
    },
    entries: entries.rows,
  });
}));

router.get('/accounting-governance', asyncHandler(async (req, res) => {
  const [accounts, mappings, periods] = await Promise.all([
    query(
      `SELECT account.id, account.code, account.name, account.account_type,
              account.normal_balance, account.allows_posting, account.active,
              account.accountant_review_required,
              account.accountant_reviewed_at, account.accountant_review_notes,
              COALESCE(reviewer.full_name, reviewer.email) reviewer_name,
              COUNT(line.id)::integer usage_count
       FROM accounting_accounts account
       LEFT JOIN users reviewer ON reviewer.id = account.accountant_reviewed_by
       LEFT JOIN journal_entry_lines line
         ON line.account_id = account.id AND line.tenant_id = account.tenant_id
       WHERE account.tenant_id = $1
       GROUP BY account.id, reviewer.full_name, reviewer.email
       ORDER BY account.code`,
      [req.context.tenantId],
    ),
    query(
      `SELECT mapping.purpose, account.id account_id,
              account.code, account.name
       FROM accounting_account_mappings mapping
       JOIN accounting_accounts account
         ON account.id = mapping.account_id
        AND account.tenant_id = mapping.tenant_id
       WHERE mapping.tenant_id = $1
       ORDER BY mapping.purpose`,
      [req.context.tenantId],
    ),
    query(
      `SELECT period.id, period.period_start, period.period_end, period.status,
              period.closed_at, period.closing_notes,
              period.permanently_locked, period.permanently_locked_at,
              period.permanent_lock_hash,
              COALESCE(closer.full_name, closer.email) closed_by_name,
              COUNT(entry.id)::integer entry_count,
              COALESCE(SUM(entry.total_debit)
                FILTER (WHERE entry.status = 'POSTED'), 0) debit_total,
              COALESCE(SUM(entry.total_credit)
                FILTER (WHERE entry.status = 'POSTED'), 0) credit_total
       FROM accounting_periods period
       LEFT JOIN users closer ON closer.id = period.closed_by
       LEFT JOIN journal_entries entry
         ON entry.period_id = period.id AND entry.tenant_id = period.tenant_id
       WHERE period.tenant_id = $1
       GROUP BY period.id, closer.full_name, closer.email
       ORDER BY period.period_start DESC`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    accounts: accounts.rows,
    mappings: mappings.rows,
    periods: periods.rows,
  });
}));

router.get('/accounting/trial-balance', asyncHandler(async (req, res) => {
  const period = parsePeriod(req.query);
  const result = await query(
    `SELECT account.id, account.code, account.name, account.account_type,
            account.normal_balance,
            COALESCE(SUM(line.debit) FILTER (
              WHERE entry.entry_date < $2::date AND entry.status = 'POSTED'
            ), 0) opening_debit,
            COALESCE(SUM(line.credit) FILTER (
              WHERE entry.entry_date < $2::date AND entry.status = 'POSTED'
            ), 0) opening_credit,
            COALESCE(SUM(line.debit) FILTER (
              WHERE entry.entry_date BETWEEN $2::date AND $3::date
                AND entry.status = 'POSTED'
            ), 0) movement_debit,
            COALESCE(SUM(line.credit) FILTER (
              WHERE entry.entry_date BETWEEN $2::date AND $3::date
                AND entry.status = 'POSTED'
            ), 0) movement_credit,
            COALESCE(SUM(line.debit) FILTER (
              WHERE entry.entry_date <= $3::date AND entry.status = 'POSTED'
            ), 0) ending_debit,
            COALESCE(SUM(line.credit) FILTER (
              WHERE entry.entry_date <= $3::date AND entry.status = 'POSTED'
            ), 0) ending_credit
     FROM accounting_accounts account
     LEFT JOIN journal_entry_lines line
       ON line.account_id = account.id AND line.tenant_id = account.tenant_id
     LEFT JOIN journal_entries entry
       ON entry.id = line.journal_entry_id AND entry.tenant_id = line.tenant_id
     WHERE account.tenant_id = $1 AND account.active = TRUE
     GROUP BY account.id
     ORDER BY account.code`,
    [req.context.tenantId, period.dateFrom, period.dateTo],
  );
  const totals = result.rows.reduce((summary, row) => ({
    openingDebit: summary.openingDebit + Number(row.opening_debit),
    openingCredit: summary.openingCredit + Number(row.opening_credit),
    movementDebit: summary.movementDebit + Number(row.movement_debit),
    movementCredit: summary.movementCredit + Number(row.movement_credit),
    endingDebit: summary.endingDebit + Number(row.ending_debit),
    endingCredit: summary.endingCredit + Number(row.ending_credit),
  }), {
    openingDebit: 0,
    openingCredit: 0,
    movementDebit: 0,
    movementCredit: 0,
    endingDebit: 0,
    endingCredit: 0,
  });
  res.json({
    period: { start: period.dateFrom, end: period.dateTo },
    totals,
    balanced: Math.abs(totals.endingDebit - totals.endingCredit) < 0.01,
    accounts: result.rows,
  });
}));

router.get('/accounting/auxiliary/:accountId', asyncHandler(async (req, res) => {
  const period = parsePeriod(req.query);
  if (!UUID_PATTERN.test(req.params.accountId)) {
    throw new AppError('La cuenta contable no es válida.', 422, 'INVALID_ACCOUNT_ID');
  }
  const account = await query(
    `SELECT id, code, name, normal_balance
     FROM accounting_accounts
     WHERE id = $1 AND tenant_id = $2`,
    [req.params.accountId, req.context.tenantId],
  );
  if (!account.rowCount) {
    throw new AppError('No encontramos la cuenta contable.', 404, 'ACCOUNT_NOT_FOUND');
  }
  const [opening, movements] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(line.debit - line.credit), 0) balance
       FROM journal_entry_lines line
       JOIN journal_entries entry
         ON entry.id = line.journal_entry_id
        AND entry.tenant_id = line.tenant_id
       WHERE line.tenant_id = $1 AND line.account_id = $2
         AND entry.status = 'POSTED' AND entry.entry_date < $3::date`,
      [req.context.tenantId, req.params.accountId, period.dateFrom],
    ),
    query(
      `SELECT entry.id, entry.entry_number, entry.entry_date,
              entry.description entry_description, entry.source_type,
              line.description, line.debit, line.credit,
              line.third_party_type, line.third_party_id
       FROM journal_entry_lines line
       JOIN journal_entries entry
         ON entry.id = line.journal_entry_id
        AND entry.tenant_id = line.tenant_id
       WHERE line.tenant_id = $1 AND line.account_id = $2
         AND entry.status = 'POSTED'
         AND entry.entry_date BETWEEN $3::date AND $4::date
       ORDER BY entry.entry_date, entry.entry_number, line.line_number`,
      [
        req.context.tenantId,
        req.params.accountId,
        period.dateFrom,
        period.dateTo,
      ],
    ),
  ]);
  let runningBalance = Number(opening.rows[0].balance);
  const items = movements.rows.map((movement) => {
    runningBalance += Number(movement.debit) - Number(movement.credit);
    return { ...movement, running_balance: runningBalance };
  });
  res.json({
    account: account.rows[0],
    period: { start: period.dateFrom, end: period.dateTo },
    openingBalance: Number(opening.rows[0].balance),
    endingBalance: runningBalance,
    items,
  });
}));

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

router.get('/accounting/entries/:id/voucher.html', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError('El comprobante no es válido.', 422, 'INVALID_JOURNAL_ENTRY_ID');
  }
  const [entry, lines, company] = await Promise.all([
    query(
      `SELECT entry.*, COALESCE(actor.full_name, actor.email, 'Sistema') actor_name
       FROM journal_entries entry
       LEFT JOIN users actor ON actor.id = entry.created_by
       WHERE entry.id = $1 AND entry.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT line.line_number, account.code, account.name,
              line.description, line.debit, line.credit,
              line.third_party_type, line.third_party_id
       FROM journal_entry_lines line
       JOIN accounting_accounts account
         ON account.id = line.account_id AND account.tenant_id = line.tenant_id
       WHERE line.journal_entry_id = $1 AND line.tenant_id = $2
       ORDER BY line.line_number`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT legal_name, trade_name, tax_id FROM tenants WHERE id = $1`,
      [req.context.tenantId],
    ),
  ]);
  if (!entry.rowCount) {
    throw new AppError('No encontramos el comprobante.', 404, 'JOURNAL_ENTRY_NOT_FOUND');
  }
  const record = entry.rows[0];
  const rows = lines.rows.map((line) => `
    <tr><td>${line.line_number}</td><td>${htmlEscape(line.code)}</td>
    <td>${htmlEscape(line.name)}<small>${htmlEscape(line.description)}</small></td>
    <td>${htmlEscape(line.third_party_id || '—')}</td>
    <td>${Number(line.debit).toLocaleString('es-CO')}</td>
    <td>${Number(line.credit).toLocaleString('es-CO')}</td></tr>`).join('');
  res.type('text/html; charset=utf-8').send(`<!doctype html><html lang="es"><head>
    <meta charset="utf-8"><title>Comprobante ${record.entry_number}</title>
    <style>body{font:14px system-ui;color:#192584;margin:32px}header{display:flex;justify-content:space-between}
    h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border-bottom:1px solid #dfe4f5;text-align:left}
    td:nth-last-child(-n+2),th:nth-last-child(-n+2){text-align:right}small{display:block;color:#74706d}
    footer{margin-top:30px;padding-top:16px;border-top:2px solid #192584}.hash{word-break:break-all;font-size:11px}
    @media print{button{display:none}}</style></head><body><header><div><h1>${htmlEscape(company.rows[0]?.trade_name || company.rows[0]?.legal_name)}</h1>
    <p>NIT ${htmlEscape(company.rows[0]?.tax_id || '—')}</p></div><div><strong>Comprobante contable #${record.entry_number}</strong>
    <p>${htmlEscape(record.entry_date)} · ${htmlEscape(record.status)}</p></div></header>
    <h2>${htmlEscape(record.description)}</h2><p>Origen: ${htmlEscape(record.source_type)} / ${htmlEscape(record.source_id)}</p>
    <table><thead><tr><th>#</th><th>Cuenta</th><th>Detalle</th><th>Tercero</th><th>Débito</th><th>Crédito</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><th colspan="4">Totales</th><th>${Number(record.total_debit).toLocaleString('es-CO')}</th>
    <th>${Number(record.total_credit).toLocaleString('es-CO')}</th></tr></tfoot></table>
    <footer><p>Preparado por: ${htmlEscape(record.actor_name)} · Contabilizado: ${htmlEscape(record.posted_at || '—')}</p>
    <p class="hash">Sello SHA-256: ${htmlEscape(record.entry_hash || 'BORRADOR SIN SELLO')}</p>
    <button onclick="window.print()">Imprimir comprobante</button></footer></body></html>`);
}));

router.get('/accounting/bank-reconciliation', asyncHandler(async (req, res) => {
  const period = parsePeriod(req.query);
  const [accounts, transactions, runs] = await Promise.all([
    query(
      `SELECT bank.*, account.code accounting_code, account.name accounting_name
       FROM bank_accounts bank
       JOIN accounting_accounts account
         ON account.id = bank.accounting_account_id
        AND account.tenant_id = bank.tenant_id
       WHERE bank.tenant_id = $1 AND bank.active = TRUE
       ORDER BY bank.bank_name, bank.account_name`,
      [req.context.tenantId],
    ),
    query(
      `SELECT transaction.*, bank.bank_name, bank.masked_account,
              entry.entry_number, entry.description entry_description
       FROM bank_statement_transactions transaction
       JOIN bank_accounts bank
         ON bank.id = transaction.bank_account_id
        AND bank.tenant_id = transaction.tenant_id
       LEFT JOIN journal_entries entry
         ON entry.id = transaction.matched_journal_entry_id
        AND entry.tenant_id = transaction.tenant_id
       WHERE transaction.tenant_id = $1
         AND transaction.transaction_date BETWEEN $2::date AND $3::date
       ORDER BY transaction.transaction_date DESC, transaction.created_at DESC
       LIMIT 200`,
      [req.context.tenantId, period.dateFrom, period.dateTo],
    ),
    query(
      `SELECT run.*, bank.bank_name, bank.masked_account,
              COALESCE(user_account.full_name, user_account.email) completed_by_name
       FROM bank_reconciliation_runs run
       JOIN bank_accounts bank
         ON bank.id = run.bank_account_id AND bank.tenant_id = run.tenant_id
       LEFT JOIN users user_account ON user_account.id = run.completed_by
       WHERE run.tenant_id = $1
       ORDER BY run.period_end DESC, run.created_at DESC
       LIMIT 50`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    period: { start: period.dateFrom, end: period.dateTo },
    accounts: accounts.rows,
    transactions: transactions.rows,
    runs: runs.rows,
    summary: {
      total: transactions.rowCount,
      matched: transactions.rows.filter((item) => item.status === 'MATCHED').length,
      unmatched: transactions.rows.filter((item) => item.status === 'UNMATCHED').length,
      ignored: transactions.rows.filter((item) => item.status === 'IGNORED').length,
    },
  });
}));

router.post(
  '/accounting/bank-accounts',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    const accountingAccountId = req.body?.accountingAccountId;
    const bankName = cleanText(req.body?.bankName, 120);
    const accountName = cleanText(req.body?.accountName, 120);
    const maskedAccount = cleanText(req.body?.maskedAccount, 40);
    const openingBalance = Number(req.body?.openingBalance || 0);
    if (!UUID_PATTERN.test(accountingAccountId || '') || !bankName ||
        !accountName || !maskedAccount || !Number.isFinite(openingBalance)) {
      throw new AppError(
        'Cuenta contable, banco, nombre, número enmascarado y saldo son obligatorios.',
        422,
        'INVALID_BANK_ACCOUNT',
      );
    }
    const account = await withTransaction(async (client) => {
      const saved = await client.query(
        `INSERT INTO bank_accounts(
           tenant_id, accounting_account_id, bank_name, account_name,
           masked_account, opening_balance, created_by
         )
         SELECT $1, id, $3, $4, $5, $6, $7
         FROM accounting_accounts
         WHERE id = $2 AND tenant_id = $1 AND active = TRUE
           AND account_type = 'ASSET'
         RETURNING *`,
        [
          req.context.tenantId,
          accountingAccountId,
          bankName,
          accountName,
          maskedAccount,
          openingBalance,
          req.context.userId,
        ],
      );
      if (!saved.rowCount) {
        throw new AppError('La cuenta contable bancaria no es válida.', 422, 'BANK_LEDGER_ACCOUNT_REQUIRED');
      }
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.bank_account_created',
        entityType: 'bank_account',
        entityId: saved.rows[0].id,
        after: saved.rows[0],
        reason: 'Cuenta habilitada para conciliación bancaria',
      });
      return saved.rows[0];
    });
    res.status(201).json(account);
  }),
);

router.post(
  '/accounting/bank-transactions',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    const bankAccountId = req.body?.bankAccountId;
    const transactionDate = req.body?.transactionDate;
    const reference = cleanText(req.body?.reference, 120);
    const description = cleanText(req.body?.description, 500);
    const amount = Number(req.body?.amount);
    const statementBalance = req.body?.statementBalance === '' ||
      req.body?.statementBalance == null ? null : Number(req.body.statementBalance);
    if (!UUID_PATTERN.test(bankAccountId || '') || !validDate(transactionDate) ||
        !reference || !description || !Number.isFinite(amount) || amount === 0 ||
        (statementBalance !== null && !Number.isFinite(statementBalance))) {
      throw new AppError(
        'Banco, fecha, referencia, descripción y valor diferente de cero son obligatorios.',
        422,
        'INVALID_BANK_TRANSACTION',
      );
    }
    const saved = await withTransaction(async (client) => {
      const transaction = await client.query(
        `INSERT INTO bank_statement_transactions(
           tenant_id, bank_account_id, transaction_date, reference,
           description, amount, statement_balance, external_id, created_by
         )
         SELECT $1, id, $3, $4, $5, $6, $7, $8, $9
         FROM bank_accounts
         WHERE id = $2 AND tenant_id = $1 AND active = TRUE
         RETURNING *`,
        [
          req.context.tenantId,
          bankAccountId,
          transactionDate,
          reference,
          description,
          amount,
          statementBalance,
          cleanText(req.body?.externalId, 160),
          req.context.userId,
        ],
      );
      if (!transaction.rowCount) {
        throw new AppError('La cuenta bancaria no existe.', 404, 'BANK_ACCOUNT_NOT_FOUND');
      }
      const tender = amount > 0
        ? await client.query(
          `WITH candidate AS (
             SELECT id
             FROM sale_payment_tenders
             WHERE receiving_company_id = $1
               AND bank_account_id = $2
               AND method = 'TRANSFER'
               AND reconciliation_status = 'PENDING'
               AND amount = $3
               AND LOWER(BTRIM(reference)) = LOWER(BTRIM($4))
             ORDER BY recorded_at
             LIMIT 1
             FOR UPDATE
           )
           UPDATE sale_payment_tenders payment
           SET reconciliation_status = 'MATCHED',
               matched_bank_transaction_id = $5,
               matched_by = $6,
               matched_at = now()
           FROM candidate
           WHERE payment.id = candidate.id
           RETURNING payment.*`,
          [
            req.context.tenantId,
            bankAccountId,
            amount,
            reference,
            transaction.rows[0].id,
            req.context.userId,
          ],
        )
        : { rows: [], rowCount: 0 };
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: tender.rowCount
          ? 'accounting.bank_transaction_auto_matched'
          : 'accounting.bank_transaction_created',
        entityType: 'bank_statement_transaction',
        entityId: transaction.rows[0].id,
        after: {
          ...transaction.rows[0],
          matchedSaleTenderId: tender.rows[0]?.id || null,
        },
        reason: tender.rowCount
          ? 'Referencia y valor coinciden con transferencia registrada en caja'
          : 'Movimiento de extracto registrado para conciliación',
      });
      return {
        ...transaction.rows[0],
        matched_sale_tender_id: tender.rows[0]?.id || null,
      };
    });
    res.status(201).json(saved);
  }),
);

router.post(
  '/accounting/bank-transactions/:id/match',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    const journalEntryId = req.body?.journalEntryId || null;
    const entryNumber = Number(req.body?.entryNumber);
    if (!UUID_PATTERN.test(req.params.id) ||
        (!UUID_PATTERN.test(journalEntryId || '') &&
          (!Number.isInteger(entryNumber) || entryNumber <= 0))) {
      throw new AppError(
        'El movimiento y el número de comprobante deben ser válidos.',
        422,
        'INVALID_BANK_MATCH',
      );
    }
    const notes = cleanText(req.body?.notes, 500);
    const matched = await withTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE bank_statement_transactions transaction
         SET status = 'MATCHED', matched_journal_entry_id = entry.id,
             matched_by = $4, matched_at = now(), match_notes = $5
         FROM journal_entries entry, bank_accounts bank
         WHERE transaction.id = $1 AND transaction.tenant_id = $2
           AND transaction.status = 'UNMATCHED'
           AND bank.id = transaction.bank_account_id
           AND bank.tenant_id = transaction.tenant_id
           AND (($3::uuid IS NOT NULL AND entry.id = $3) OR
                ($6::bigint IS NOT NULL AND entry.entry_number = $6))
           AND entry.tenant_id = transaction.tenant_id
           AND entry.status = 'POSTED'
           AND EXISTS(
             SELECT 1 FROM journal_entry_lines line
             WHERE line.journal_entry_id = entry.id
               AND line.tenant_id = entry.tenant_id
               AND line.account_id = bank.accounting_account_id
           )
         RETURNING transaction.*`,
        [
          req.params.id,
          req.context.tenantId,
          UUID_PATTERN.test(journalEntryId || '') ? journalEntryId : null,
          req.context.userId,
          notes,
          Number.isInteger(entryNumber) && entryNumber > 0 ? entryNumber : null,
        ],
      );
      if (!updated.rowCount) {
        throw new AppError(
          'El comprobante no está contabilizado en la cuenta bancaria seleccionada.',
          409,
          'BANK_MATCH_NOT_ALLOWED',
        );
      }
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.bank_transaction_matched',
        entityType: 'bank_statement_transaction',
        entityId: req.params.id,
        after: updated.rows[0],
        reason: notes || 'Movimiento bancario conciliado con comprobante',
      });
      return updated.rows[0];
    });
    res.json(matched);
  }),
);

router.post(
  '/accounting/bank-reconciliations/complete',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    const period = parsePeriod({
      dateFrom: req.body?.periodStart,
      dateTo: req.body?.periodEnd,
    });
    const bankAccountId = req.body?.bankAccountId;
    const statementEndingBalance = Number(req.body?.statementEndingBalance);
    const notes = cleanText(req.body?.notes, 1000);
    if (!UUID_PATTERN.test(bankAccountId || '') ||
        !Number.isFinite(statementEndingBalance) || !notes) {
      throw new AppError(
        'Cuenta, saldo final del extracto y observaciones son obligatorios.',
        422,
        'INVALID_BANK_RECONCILIATION',
      );
    }
    const run = await withTransaction(async (client) => {
      const ledger = await client.query(
        `SELECT bank.opening_balance +
                COALESCE(SUM(line.debit - line.credit)
                  FILTER (WHERE entry.id IS NOT NULL), 0) ledger_balance
         FROM bank_accounts bank
         LEFT JOIN journal_entry_lines line
           ON line.account_id = bank.accounting_account_id
          AND line.tenant_id = bank.tenant_id
         LEFT JOIN journal_entries entry
           ON entry.id = line.journal_entry_id
          AND entry.tenant_id = line.tenant_id
          AND entry.status = 'POSTED'
          AND entry.entry_date <= $3::date
         WHERE bank.id = $1 AND bank.tenant_id = $2
         GROUP BY bank.id`,
        [bankAccountId, req.context.tenantId, period.dateTo],
      );
      if (!ledger.rowCount) {
        throw new AppError('La cuenta bancaria no existe.', 404, 'BANK_ACCOUNT_NOT_FOUND');
      }
      const unmatched = await client.query(
        `SELECT COUNT(*)::integer total
         FROM bank_statement_transactions
         WHERE tenant_id = $1 AND bank_account_id = $2
           AND transaction_date BETWEEN $3::date AND $4::date
           AND status = 'UNMATCHED'`,
        [
          req.context.tenantId,
          bankAccountId,
          period.dateFrom,
          period.dateTo,
        ],
      );
      const ledgerBalance = Number(ledger.rows[0].ledger_balance);
      const difference = Math.round(
        (statementEndingBalance - ledgerBalance) * 100,
      ) / 100;
      const evidence = {
        tenantId: req.context.tenantId,
        bankAccountId,
        period,
        statementEndingBalance,
        ledgerBalance,
        difference,
        unmatchedCount: unmatched.rows[0].total,
      };
      const evidenceHash = createHash('sha256')
        .update(JSON.stringify(evidence))
        .digest('hex');
      const existing = await client.query(
        `SELECT id
         FROM bank_reconciliation_runs
         WHERE tenant_id = $1 AND bank_account_id = $2
           AND period_start = $3::date AND period_end = $4::date`,
        [
          req.context.tenantId,
          bankAccountId,
          period.dateFrom,
          period.dateTo,
        ],
      );
      if (existing.rowCount) {
        throw new AppError(
          'Este período bancario ya fue conciliado y su evidencia es inmutable.',
          409,
          'BANK_RECONCILIATION_ALREADY_COMPLETED',
        );
      }
      const saved = await client.query(
        `INSERT INTO bank_reconciliation_runs(
           tenant_id, bank_account_id, period_start, period_end,
           statement_ending_balance, ledger_ending_balance, difference,
           unmatched_count, status, completed_by, completed_at,
           evidence_hash, notes
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,'COMPLETED',$9,now(),$10,$11)
         RETURNING *`,
        [
          req.context.tenantId,
          bankAccountId,
          period.dateFrom,
          period.dateTo,
          statementEndingBalance,
          ledgerBalance,
          difference,
          unmatched.rows[0].total,
          req.context.userId,
          evidenceHash,
          notes,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.bank_reconciliation_completed',
        entityType: 'bank_reconciliation_run',
        entityId: saved.rows[0].id,
        after: saved.rows[0],
        reason: notes,
        metadata: { evidenceHash },
      });
      return saved.rows[0];
    });
    res.status(201).json(run);
  }),
);

router.post(
  '/accounting/accounts',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    const code = cleanText(req.body?.code, 20)?.toUpperCase();
    const name = cleanText(req.body?.name, 160);
    const accountType = cleanText(req.body?.accountType, 20)?.toUpperCase();
    const normalBalance = cleanText(req.body?.normalBalance, 10)?.toUpperCase();
    if (!code || !/^[A-Z0-9.-]{2,20}$/.test(code) || !name ||
        !ACCOUNT_TYPES.has(accountType) || !NORMAL_BALANCES.has(normalBalance)) {
      throw new AppError(
        'Código, nombre, tipo y naturaleza contable son obligatorios.',
        422,
        'INVALID_ACCOUNTING_ACCOUNT',
      );
    }
    const account = await withTransaction(async (client) => {
      const created = await client.query(
        `INSERT INTO accounting_accounts(
           tenant_id, code, name, account_type, normal_balance
         )
         VALUES($1,$2,$3,$4,$5)
         RETURNING *`,
        [req.context.tenantId, code, name, accountType, normalBalance],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.account_created',
        entityType: 'accounting_account',
        entityId: created.rows[0].id,
        after: created.rows[0],
        reason: cleanText(req.body?.reason, 500) || 'Creación de cuenta contable',
      });
      return created.rows[0];
    });
    res.status(201).json(account);
  }),
);

router.put(
  '/accounting/mappings/:purpose',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    const purpose = cleanText(req.params.purpose, 60)?.toUpperCase();
    const accountId = req.body?.accountId;
    const reason = cleanText(req.body?.reason, 500);
    if (!purpose || !UUID_PATTERN.test(accountId || '') || !reason) {
      throw new AppError(
        'La cuenta y el motivo del cambio son obligatorios.',
        422,
        'INVALID_ACCOUNTING_MAPPING',
      );
    }
    const mapping = await withTransaction(async (client) => {
      const account = await client.query(
        `SELECT id, code, name
         FROM accounting_accounts
         WHERE id = $1 AND tenant_id = $2
           AND active = TRUE AND allows_posting = TRUE`,
        [accountId, req.context.tenantId],
      );
      if (!account.rowCount) {
        throw new AppError(
          'La cuenta seleccionada no está disponible.',
          404,
          'ACCOUNTING_ACCOUNT_NOT_FOUND',
        );
      }
      const before = await client.query(
        `SELECT purpose, account_id
         FROM accounting_account_mappings
         WHERE tenant_id = $1 AND purpose = $2`,
        [req.context.tenantId, purpose],
      );
      if (!before.rowCount) {
        throw new AppError(
          'La finalidad contable no está reconocida.',
          404,
          'ACCOUNTING_PURPOSE_NOT_FOUND',
        );
      }
      const updated = await client.query(
        `UPDATE accounting_account_mappings
         SET account_id = $3, updated_by = $4, updated_at = now()
         WHERE tenant_id = $1 AND purpose = $2
         RETURNING *`,
        [req.context.tenantId, purpose, accountId, req.context.userId],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.mapping_updated',
        entityType: 'accounting_mapping',
        entityId: purpose,
        before: before.rows[0],
        after: { ...updated.rows[0], account: account.rows[0] },
        reason,
      });
      return { ...updated.rows[0], account: account.rows[0] };
    });
    res.json(mapping);
  }),
);

router.post(
  '/accounting/accounts/:id/review',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError('La cuenta no es válida.', 422, 'INVALID_ACCOUNTING_ACCOUNT_ID');
    }
    const notes = cleanText(req.body?.notes, 1000);
    if (!notes) {
      throw new AppError(
        'Registra la conclusión de la revisión profesional.',
        422,
        'ACCOUNTING_REVIEW_NOTES_REQUIRED',
      );
    }
    const account = await withTransaction(async (client) => {
      const before = await client.query(
        `SELECT * FROM accounting_accounts
         WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [req.params.id, req.context.tenantId],
      );
      if (!before.rowCount) {
        throw new AppError('No encontramos la cuenta.', 404, 'ACCOUNTING_ACCOUNT_NOT_FOUND');
      }
      const updated = await client.query(
        `UPDATE accounting_accounts
         SET accountant_review_required = FALSE,
             accountant_reviewed_by = $3,
             accountant_reviewed_at = now(),
             accountant_review_notes = $4,
             updated_at = now()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.context.tenantId, req.context.userId, notes],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.account_reviewed',
        entityType: 'accounting_account',
        entityId: req.params.id,
        before: before.rows[0],
        after: updated.rows[0],
        reason: notes,
      });
      return updated.rows[0];
    });
    res.json(account);
  }),
);

router.post(
  '/accounting/periods/:id/close',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError('El período no es válido.', 422, 'INVALID_ACCOUNTING_PERIOD_ID');
    }
    const notes = cleanText(req.body?.notes, 1000);
    if (!notes) {
      throw new AppError('Explica el cierre del período.', 422, 'CLOSING_NOTES_REQUIRED');
    }
    const period = await withTransaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM accounting_periods
         WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [req.params.id, req.context.tenantId],
      );
      if (!current.rowCount) {
        throw new AppError('No encontramos el período.', 404, 'ACCOUNTING_PERIOD_NOT_FOUND');
      }
      if (current.rows[0].status === 'CLOSED') {
        throw new AppError('El período ya está cerrado.', 409, 'ACCOUNTING_PERIOD_ALREADY_CLOSED');
      }
      const updated = await client.query(
        `UPDATE accounting_periods
         SET status = 'CLOSED', closed_by = $3, closed_at = now(),
             closing_notes = $4
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.context.tenantId, req.context.userId, notes],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.period_closed',
        entityType: 'accounting_period',
        entityId: req.params.id,
        before: current.rows[0],
        after: updated.rows[0],
        reason: notes,
      });
      return updated.rows[0];
    });
    res.json(period);
  }),
);

router.post(
  '/accounting/periods/:id/reopen',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError('El período no es válido.', 422, 'INVALID_ACCOUNTING_PERIOD_ID');
    }
    const reason = cleanText(req.body?.reason, 1000);
    if (!reason) {
      throw new AppError('Explica la reapertura.', 422, 'REOPEN_REASON_REQUIRED');
    }
    const period = await withTransaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM accounting_periods
         WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [req.params.id, req.context.tenantId],
      );
      if (!current.rowCount || current.rows[0].status !== 'CLOSED') {
        throw new AppError(
          'Solo se puede reabrir un período cerrado.',
          409,
          'ACCOUNTING_PERIOD_NOT_CLOSED',
        );
      }
      if (current.rows[0].permanently_locked) {
        throw new AppError(
          'El período tiene bloqueo definitivo y no puede reabrirse.',
          409,
          'ACCOUNTING_PERIOD_PERMANENTLY_LOCKED',
        );
      }
      const updated = await client.query(
        `UPDATE accounting_periods
         SET status = 'OPEN', closed_by = NULL, closed_at = NULL,
             closing_notes = NULL
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.context.tenantId],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.period_reopened',
        entityType: 'accounting_period',
        entityId: req.params.id,
        before: current.rows[0],
        after: updated.rows[0],
        reason,
      });
      return updated.rows[0];
    });
    res.json(period);
  }),
);

router.post(
  '/accounting/periods/:id/final-lock',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError('El período no es válido.', 422, 'INVALID_ACCOUNTING_PERIOD_ID');
    }
    const confirmation = cleanText(req.body?.confirmation, 40);
    const notes = cleanText(req.body?.notes, 1000);
    if (confirmation !== 'BLOQUEAR DEFINITIVAMENTE' || !notes) {
      throw new AppError(
        'Confirma “BLOQUEAR DEFINITIVAMENTE” y documenta el motivo.',
        422,
        'FINAL_LOCK_CONFIRMATION_REQUIRED',
      );
    }
    const period = await withTransaction(async (client) => {
      const current = await client.query(
        `SELECT *
         FROM accounting_periods
         WHERE id = $1 AND tenant_id = $2
         FOR UPDATE`,
        [req.params.id, req.context.tenantId],
      );
      if (!current.rowCount || current.rows[0].status !== 'CLOSED' ||
          current.rows[0].permanently_locked) {
        throw new AppError(
          'Solo puede bloquearse una vez un período cerrado y aún reversible.',
          409,
          'ACCOUNTING_PERIOD_NOT_LOCKABLE',
        );
      }
      const entrySummary = await client.query(
        `SELECT COUNT(*)::integer entry_count,
                COALESCE(SUM(total_debit)
                  FILTER (WHERE status = 'POSTED'), 0) debit_total,
                COALESCE(SUM(total_credit)
                  FILTER (WHERE status = 'POSTED'), 0) credit_total
         FROM journal_entries
         WHERE period_id = $1 AND tenant_id = $2`,
        [req.params.id, req.context.tenantId],
      );
      const bankControls = await client.query(
        `SELECT COUNT(*)::integer account_count,
                COUNT(*) FILTER (
                  WHERE reconciliation.status = 'COMPLETED'
                )::integer reconciled_count,
                COUNT(*) FILTER (
                  WHERE reconciliation.status = 'COMPLETED'
                    AND ABS(reconciliation.difference) > 0.009
                )::integer difference_count
         FROM bank_accounts bank
         LEFT JOIN bank_reconciliation_runs reconciliation
           ON reconciliation.bank_account_id = bank.id
          AND reconciliation.tenant_id = bank.tenant_id
          AND reconciliation.period_start = $2::date
          AND reconciliation.period_end = $3::date
         WHERE bank.tenant_id = $1 AND bank.active = TRUE`,
        [
          req.context.tenantId,
          current.rows[0].period_start,
          current.rows[0].period_end,
        ],
      );
      const bank = bankControls.rows[0];
      if (Number(bank.account_count) > Number(bank.reconciled_count) ||
          Number(bank.difference_count) > 0) {
        throw new AppError(
          'Todas las cuentas bancarias deben estar conciliadas sin diferencias.',
          409,
          'BANK_RECONCILIATION_REQUIRED_FOR_FINAL_LOCK',
        );
      }
      const lockPayload = {
        tenantId: req.context.tenantId,
        periodId: req.params.id,
        periodStart: current.rows[0].period_start,
        periodEnd: current.rows[0].period_end,
        entryCount: entrySummary.rows[0].entry_count,
        debitTotal: entrySummary.rows[0].debit_total,
        creditTotal: entrySummary.rows[0].credit_total,
        bankReconciliations: Number(bank.reconciled_count),
        notes,
      };
      const lockHash = createHash('sha256')
        .update(JSON.stringify(lockPayload))
        .digest('hex');
      const updated = await client.query(
        `UPDATE accounting_periods
         SET permanently_locked = TRUE, permanently_locked_by = $3,
             permanently_locked_at = now(), permanent_lock_hash = $4
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [
          req.params.id,
          req.context.tenantId,
          req.context.userId,
          lockHash,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'accounting.period_permanently_locked',
        entityType: 'accounting_period',
        entityId: req.params.id,
        before: current.rows[0],
        after: updated.rows[0],
        reason: notes,
        metadata: { lockHash },
      });
      return updated.rows[0];
    });
    res.json(period);
  }),
);

router.post(
  '/accounting/entries/:id/reverse',
  requirePermission('accounting.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError('El asiento no es válido.', 422, 'INVALID_JOURNAL_ENTRY_ID');
    }
    const entryDate = req.body?.entryDate;
    const reason = cleanText(req.body?.reason, 1000);
    if (!validDate(entryDate) || !reason) {
      throw new AppError(
        'La fecha y el motivo del contraasiento son obligatorios.',
        422,
        'INVALID_JOURNAL_REVERSAL',
      );
    }
    const reversed = await withTransaction((client) => reverseJournalEntry(client, {
      tenantId: req.context.tenantId,
      entryId: req.params.id,
      entryDate,
      reason,
      userId: req.context.userId,
    }));
    res.status(201).json(reversed);
  }),
);

router.post('/reviews', asyncHandler(async (req, res) => {
  const period = parsePeriod({
    dateFrom: req.body?.periodStart,
    dateTo: req.body?.periodEnd,
  });
  const reviewType = normalizedReviewText(
    req.body?.reviewType,
    'El tipo de revisión',
    40,
    true,
  )?.toUpperCase();
  const status = normalizedReviewText(
    req.body?.status,
    'El resultado',
    20,
    true,
  )?.toUpperCase();
  const reviewerName = normalizedReviewText(
    req.body?.reviewerName,
    'El nombre del contador',
    160,
    true,
  );
  const reviewerDocument = normalizedReviewText(
    req.body?.reviewerDocument,
    'El documento',
    40,
  );
  const professionalCard = normalizedReviewText(
    req.body?.professionalCard,
    'La tarjeta profesional',
    60,
  );
  const notes = normalizedReviewText(
    req.body?.notes,
    'Las observaciones',
    2000,
    true,
  );
  const evidenceReference = normalizedReviewText(
    req.body?.evidenceReference,
    'La referencia de evidencia',
    500,
  );
  if (!REVIEW_TYPES.has(reviewType)) {
    throw new AppError(
      'El tipo de validación contable no es válido.',
      422,
      'INVALID_ACCOUNTANT_REVIEW_TYPE',
    );
  }
  if (!['APPROVED', 'OBSERVED'].includes(status)) {
    throw new AppError(
      'El resultado debe ser aprobado u observado.',
      422,
      'INVALID_ACCOUNTANT_REVIEW_STATUS',
    );
  }
  if (status === 'APPROVED' && !professionalCard) {
    throw new AppError(
      'La tarjeta profesional es obligatoria para aprobar una validación.',
      422,
      'PROFESSIONAL_CARD_REQUIRED',
    );
  }

  const review = await withTransaction(async (client) => {
    const previous = await client.query(
      `SELECT *
       FROM accountant_compliance_reviews
       WHERE tenant_id = $1 AND period_start = $2 AND period_end = $3
         AND review_type = $4
       FOR UPDATE`,
      [
        req.context.tenantId,
        period.dateFrom,
        period.dateTo,
        reviewType,
      ],
    );
    const result = await client.query(
      `INSERT INTO accountant_compliance_reviews(
         tenant_id, period_start, period_end, review_type, status,
         reviewer_name, reviewer_document, professional_card, notes,
         evidence_reference, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT(tenant_id, period_start, period_end, review_type)
       DO UPDATE SET
         status = EXCLUDED.status,
         reviewer_name = EXCLUDED.reviewer_name,
         reviewer_document = EXCLUDED.reviewer_document,
         professional_card = EXCLUDED.professional_card,
         notes = EXCLUDED.notes,
         evidence_reference = EXCLUDED.evidence_reference,
         reviewed_at = now(),
         created_by = EXCLUDED.created_by
       RETURNING *`,
      [
        req.context.tenantId,
        period.dateFrom,
        period.dateTo,
        reviewType,
        status,
        reviewerName,
        reviewerDocument,
        professionalCard,
        notes,
        evidenceReference,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: previous.rowCount
        ? 'accountant_review.replaced'
        : 'accountant_review.created',
      entityType: 'accountant_compliance_review',
      entityId: result.rows[0].id,
      before: previous.rows[0] || null,
      after: result.rows[0],
      reason: notes,
      metadata: {
        periodStart: period.dateFrom,
        periodEnd: period.dateTo,
        reviewType,
      },
    });
    return result.rows[0];
  });
  res.status(201).json(review);
}));

router.post('/control-runs', asyncHandler(async (req, res) => {
  const period = parsePeriod({
    dateFrom: req.body?.dateFrom,
    dateTo: req.body?.dateTo,
  });
  const readiness = await calculateReadiness(req.context.tenantId, period);
  const snapshot = JSON.stringify(readiness);
  const evidenceHash = createHash('sha256').update(snapshot).digest('hex');
  const run = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO audit_control_runs(
         tenant_id, period_start, period_end, status, score, controls,
         evidence_hash, chain_head_hash, generated_by
       )
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
       RETURNING *`,
      [
        req.context.tenantId,
        period.dateFrom,
        period.dateTo,
        readiness.status,
        readiness.score,
        JSON.stringify(readiness.controls),
        evidenceHash,
        readiness.chain.headHash,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'audit_control_run.sealed',
      entityType: 'audit_control_run',
      entityId: result.rows[0].id,
      after: {
        period,
        status: readiness.status,
        score: readiness.score,
        evidenceHash,
        chainHeadHash: readiness.chain.headHash,
      },
      reason: 'Ejecución de controles y sellado del expediente de auditoría',
    });
    return result.rows[0];
  });
  res.status(201).json({ ...run, readiness });
}));

router.get('/evidence.json', asyncHandler(async (req, res) => {
  const period = parsePeriod(req.query);
  const readiness = await calculateReadiness(req.context.tenantId, period);
  const [events, documents, payments, runs] = await Promise.all([
    query(
      `SELECT ae.id, ae.created_at, ae.actor_user_id, u.full_name actor_name,
              u.email actor_email, ae.action, ae.entity_type, ae.entity_id,
              ae.before_data, ae.after_data, ae.reason, ae.metadata,
              ae.previous_hash, ae.event_hash, ae.integrity_version
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_user_id
       WHERE ae.tenant_id = $1
         AND ae.created_at >= $2::date
         AND ae.created_at < ($3::date + INTERVAL '1 day')
       ORDER BY ae.id`,
      [req.context.tenantId, period.dateFrom, period.dateTo],
    ),
    query(
      `SELECT id, sale_id, document_type, prefix, document_number, status,
              provider_reference, cufe, submitted_at, accepted_at, failure_reason,
              payload_hash, created_at
       FROM electronic_documents
       WHERE company_id = $1
         AND created_at >= $2::date
         AND created_at < ($3::date + INTERVAL '1 day')
       ORDER BY created_at`,
      [req.context.tenantId, period.dateFrom, period.dateTo],
    ),
    query(
      `SELECT record.id, record.sale_id, record.payment_method, record.amount,
              record.reference, record.reconciliation_status, record.recorded_at
       FROM sale_payment_records record
       WHERE record.seller_company_id = $1
         AND record.recorded_at >= $2::date
         AND record.recorded_at < ($3::date + INTERVAL '1 day')
       ORDER BY record.recorded_at`,
      [req.context.tenantId, period.dateFrom, period.dateTo],
    ),
    query(
      `SELECT id, period_start, period_end, status, score, evidence_hash,
              chain_head_hash, generated_at
       FROM audit_control_runs
       WHERE tenant_id = $1
         AND period_start = $2::date AND period_end = $3::date
       ORDER BY generated_at DESC`,
      [req.context.tenantId, period.dateFrom, period.dateTo],
    ),
  ]);
  const payload = {
    schema: 'megasuite.audit-evidence.v1',
    notice: 'Expediente técnico. Debe ser revisado por el contador y conservarse con sus soportes originales.',
    readiness,
    auditEvents: events.rows,
    electronicDocuments: documents.rows,
    transferAndSalePayments: payments.rows,
    sealedControlRuns: runs.rows,
  };
  const content = JSON.stringify(payload, null, 2);
  const digest = createHash('sha256').update(content).digest('hex');
  res
    .type('application/json; charset=utf-8')
    .set('X-MegaSuite-Evidence-SHA256', digest)
    .set(
      'Content-Disposition',
      `attachment; filename="megasuite-expediente-${period.dateFrom}-${period.dateTo}.json"`,
    )
    .send(content);
}));

router.get('/accounting/monthly-package.json', asyncHandler(async (req, res) => {
  const month = cleanText(req.query.month, 7);
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(
      'El mes debe usar el formato AAAA-MM.',
      422,
      'INVALID_ACCOUNTING_MONTH',
    );
  }
  const start = `${month}-01`;
  const nextMonth = new Date(`${start}T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const endDate = new Date(nextMonth);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  const end = endDate.toISOString().slice(0, 10);
  const readiness = await calculateReadiness(
    req.context.tenantId,
    { dateFrom: start, dateTo: end },
  );
  const [company, entries, trialBalance, reconciliations, periods, documents] =
    await Promise.all([
      query(
        `SELECT tenant.legal_name, tenant.trade_name, tenant.tax_id,
                profile.default_document_type,
                profile.electronic_invoicing_required,
                profile.vat_responsibility,
                profile.tax_regime,
                profile.validation_status,
                profile.validated_at,
                profile.rut_document_id
         FROM tenants tenant
         LEFT JOIN company_tax_profiles profile
           ON profile.company_id = tenant.id AND profile.active = TRUE
         WHERE tenant.id = $1`,
        [req.context.tenantId],
      ),
      query(
        `SELECT entry.id, entry.entry_number, entry.entry_date,
                entry.source_type, entry.source_id, entry.description,
                entry.total_debit, entry.total_credit, entry.entry_hash,
                entry.posted_at,
                json_agg(json_build_object(
                  'line', line.line_number, 'accountCode', account.code,
                  'accountName', account.name, 'description', line.description,
                  'debit', line.debit, 'credit', line.credit,
                  'thirdPartyType', line.third_party_type,
                  'thirdPartyId', line.third_party_id
                ) ORDER BY line.line_number) lines
         FROM journal_entries entry
         JOIN journal_entry_lines line
           ON line.journal_entry_id = entry.id
          AND line.tenant_id = entry.tenant_id
         JOIN accounting_accounts account
           ON account.id = line.account_id AND account.tenant_id = line.tenant_id
         WHERE entry.tenant_id = $1 AND entry.status = 'POSTED'
           AND entry.entry_date BETWEEN $2::date AND $3::date
         GROUP BY entry.id
         ORDER BY entry.entry_date, entry.entry_number`,
        [req.context.tenantId, start, end],
      ),
      query(
        `SELECT account.code, account.name, account.account_type,
                account.normal_balance,
                COALESCE(SUM(line.debit)
                  FILTER (WHERE entry.id IS NOT NULL), 0) debit,
                COALESCE(SUM(line.credit)
                  FILTER (WHERE entry.id IS NOT NULL), 0) credit
         FROM accounting_accounts account
         LEFT JOIN journal_entry_lines line
           ON line.account_id = account.id AND line.tenant_id = account.tenant_id
         LEFT JOIN journal_entries entry
           ON entry.id = line.journal_entry_id AND entry.tenant_id = line.tenant_id
          AND entry.status = 'POSTED' AND entry.entry_date <= $2::date
         WHERE account.tenant_id = $1 AND account.active = TRUE
         GROUP BY account.id
         ORDER BY account.code`,
        [req.context.tenantId, end],
      ),
      query(
        `SELECT reconciliation.*, bank.bank_name, bank.masked_account
         FROM bank_reconciliation_runs reconciliation
         JOIN bank_accounts bank
           ON bank.id = reconciliation.bank_account_id
          AND bank.tenant_id = reconciliation.tenant_id
         WHERE reconciliation.tenant_id = $1
           AND reconciliation.period_start = $2::date
           AND reconciliation.period_end = $3::date
         ORDER BY bank.bank_name`,
        [req.context.tenantId, start, end],
      ),
      query(
        `SELECT id, period_start, period_end, status, closed_at,
                permanently_locked, permanently_locked_at,
                permanent_lock_hash, closing_notes
         FROM accounting_periods
         WHERE tenant_id = $1
           AND period_start <= $3::date AND period_end >= $2::date
         ORDER BY period_start`,
        [req.context.tenantId, start, end],
      ),
      query(
        `SELECT id, document_type, prefix, document_number, status,
                provider_reference, cufe, created_at, submitted_at, accepted_at
         FROM electronic_documents
         WHERE company_id = $1
           AND created_at >= $2::date
           AND created_at < ($3::date + INTERVAL '1 day')
         ORDER BY created_at`,
        [req.context.tenantId, start, end],
      ),
    ]);
  const packagePayload = {
    schema: 'megasuite.monthly-accounting-package.v1',
    generatedAt: new Date().toISOString(),
    notice: 'Expediente auxiliar para revisión profesional. Conservar junto con extractos y soportes originales.',
    company: company.rows[0],
    period: { month, start, end },
    readiness,
    accountingPeriods: periods.rows,
    trialBalance: trialBalance.rows,
    journalEntries: entries.rows,
    bankReconciliations: reconciliations.rows,
    electronicDocuments: documents.rows,
  };
  const withoutHash = JSON.stringify(packagePayload, null, 2);
  const packageHash = createHash('sha256').update(withoutHash).digest('hex');
  const content = JSON.stringify({ ...packagePayload, packageHash }, null, 2);
  res
    .type('application/json; charset=utf-8')
    .set('X-MegaSuite-Package-SHA256', packageHash)
    .set(
      'Content-Disposition',
      `attachment; filename="megasuite-expediente-contable-${month}.json"`,
    )
    .send(content);
}));

router.get('/facets', asyncHandler(async (req, res) => {
  const [actions, entities, actors] = await Promise.all([
    query(
      `SELECT action, COUNT(*)::integer event_count
       FROM audit_events
       WHERE tenant_id = $1
       GROUP BY action
       ORDER BY action`,
      [req.context.tenantId],
    ),
    query(
      `SELECT entity_type, COUNT(*)::integer event_count
       FROM audit_events
       WHERE tenant_id = $1
       GROUP BY entity_type
       ORDER BY entity_type`,
      [req.context.tenantId],
    ),
    query(
      `SELECT u.id, u.full_name, u.email, COUNT(*)::integer event_count
       FROM audit_events ae
       JOIN users u ON u.id = ae.actor_user_id
       WHERE ae.tenant_id = $1
       GROUP BY u.id, u.full_name, u.email
       ORDER BY u.full_name`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    actions: actions.rows,
    entities: entities.rows,
    actors: actors.rows,
  });
}));

router.get('/events', asyncHandler(async (req, res) => {
  const filters = parseFilters(req.query);
  const where = buildWhere(req.context.tenantId, filters);
  const offset = (filters.page - 1) * filters.pageSize;
  const [events, total] = await Promise.all([
    query(
      `SELECT ae.id, ae.action, ae.entity_type, ae.entity_id, ae.reason,
              ae.metadata, ae.created_at, ae.actor_user_id, ae.event_hash,
              u.full_name actor_name, u.email actor_email
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_user_id
       WHERE ${where.clause}
       ORDER BY ae.created_at DESC, ae.id DESC
       LIMIT $${where.values.length + 1}
       OFFSET $${where.values.length + 2}`,
      [...where.values, filters.pageSize, offset],
    ),
    query(
      `SELECT COUNT(*)::integer total
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_user_id
       WHERE ${where.clause}`,
      where.values,
    ),
  ]);
  const totalItems = total.rows[0].total;
  res.json({
    items: events.rows,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / filters.pageSize)),
    },
  });
}));

router.get('/export.csv', asyncHandler(async (req, res) => {
  const filters = parseFilters({ ...req.query, page: 1, pageSize: 100 });
  const where = buildWhere(req.context.tenantId, filters);
  const result = await query(
    `SELECT ae.id, ae.created_at, COALESCE(u.full_name, 'Sistema') actor_name,
            u.email actor_email, ae.action, ae.entity_type, ae.entity_id,
            ae.reason, ae.before_data, ae.after_data, ae.metadata,
            ae.previous_hash, ae.event_hash, ae.integrity_version
     FROM audit_events ae
     LEFT JOIN users u ON u.id = ae.actor_user_id
     WHERE ${where.clause}
     ORDER BY ae.created_at DESC, ae.id DESC
     LIMIT 5000`,
    where.values,
  );
  const headings = [
    'ID', 'Fecha', 'Actor', 'Correo', 'Acción', 'Entidad', 'Identificador',
    'Motivo', 'Antes', 'Después', 'Metadatos', 'Hash anterior', 'Hash del evento',
    'Versión de integridad',
  ];
  const lines = [
    headings.map(csvCell).join(','),
    ...result.rows.map((row) => [
      row.id,
      row.created_at?.toISOString?.() || row.created_at,
      row.actor_name,
      row.actor_email,
      row.action,
      row.entity_type,
      row.entity_id,
      row.reason,
      row.before_data,
      row.after_data,
      row.metadata,
      row.previous_hash,
      row.event_hash,
      row.integrity_version,
    ].map(csvCell).join(',')),
  ];
  const filename = `megasuite-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  res
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${filename}"`)
    .send(`\uFEFF${lines.join('\n')}`);
}));

router.get('/events/:id', asyncHandler(async (req, res) => {
  if (!INTEGER_PATTERN.test(req.params.id)) {
    throw new AppError(
      'El evento de auditoría debe tener un identificador numérico.',
      422,
      'INVALID_AUDIT_EVENT_ID',
    );
  }
  const result = await query(
    `SELECT ae.id, ae.action, ae.entity_type, ae.entity_id, ae.reason,
            ae.before_data, ae.after_data, ae.metadata, ae.created_at,
            ae.previous_hash, ae.event_hash, ae.integrity_version,
            ae.actor_user_id, u.full_name actor_name, u.email actor_email
     FROM audit_events ae
     LEFT JOIN users u ON u.id = ae.actor_user_id
     WHERE ae.id = $1 AND ae.tenant_id = $2`,
    [req.params.id, req.context.tenantId],
  );
  if (!result.rowCount) {
    throw new AppError(
      'No encontramos el evento de auditoría.',
      404,
      'AUDIT_EVENT_NOT_FOUND',
    );
  }
  res.json(result.rows[0]);
}));

export { parseFilters };
export default router;
