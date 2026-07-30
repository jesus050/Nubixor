import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requirePermission } from '../authorization.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import {
  postBusinessExpenseAccounting,
  postBusinessExpensePaymentAccounting,
} from '../accounting.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_METHODS = new Set([
  'CASH', 'BANK_TRANSFER', 'CARD', 'CHECK', 'OTHER',
]);
const RECURRENCE_RULES = new Set([
  'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'ANNUAL',
]);

router.use(requireTenant);

function cleanText(value, maxLength, { required = false } = {}) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (required && !normalized) {
    throw new AppError(
      'Completa todos los campos obligatorios.',
      422,
      'EXPENSE_REQUIRED_FIELD',
    );
  }
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo supera ${maxLength} caracteres.`,
      422,
      'EXPENSE_FIELD_TOO_LONG',
    );
  }
  return normalized || null;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function requireUuid(value, message) {
  if (!UUID_PATTERN.test(value || '')) {
    throw new AppError(message, 422, 'INVALID_EXPENSE_REFERENCE');
  }
}

function money(value, { allowZero = true } = {}) {
  const result = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(result) || result < 0 || (!allowZero && result <= 0)) {
    throw new AppError(
      'Los valores monetarios del gasto no son válidos.',
      422,
      'INVALID_EXPENSE_AMOUNT',
    );
  }
  return result;
}

router.get('/setup', asyncHandler(async (req, res) => {
  const tenantId = req.context.tenantId;
  const branchFilter = req.context.branchId || null;
  const [
    branches,
    suppliers,
    categories,
    centers,
    bankAccounts,
    cashSessions,
    documents,
    expenseAccounts,
  ] =
    await Promise.all([
      query(
        `SELECT id, code, name
         FROM branches
         WHERE tenant_id = $1 AND active = TRUE
           AND ($2::uuid IS NULL OR id = $2)
         ORDER BY name`,
        [tenantId, branchFilter],
      ),
      query(
        `SELECT id, name, tax_id
         FROM suppliers
         WHERE tenant_id = $1 AND active = TRUE
         ORDER BY name`,
        [tenantId],
      ),
      query(
        `SELECT category.id, category.code, category.name,
                category.requires_support, category.approval_threshold,
                category.accounting_account_id, account.code account_code,
                account.name account_name
         FROM expense_categories category
         JOIN accounting_accounts account
           ON account.id = category.accounting_account_id
          AND account.tenant_id = category.tenant_id
         WHERE category.tenant_id = $1 AND category.active = TRUE
         ORDER BY category.name`,
        [tenantId],
      ),
      query(
        `SELECT center.id, center.code, center.name, center.branch_id,
                center.monthly_budget, branch.name branch_name
         FROM cost_centers center
         LEFT JOIN branches branch
           ON branch.id = center.branch_id AND branch.tenant_id = center.tenant_id
         WHERE center.tenant_id = $1 AND center.active = TRUE
           AND ($2::uuid IS NULL OR center.branch_id IS NULL OR center.branch_id = $2)
         ORDER BY center.name`,
        [tenantId, branchFilter],
      ),
      query(
        `SELECT id, bank_name, account_name, masked_account
         FROM bank_accounts
         WHERE tenant_id = $1 AND active = TRUE
         ORDER BY bank_name, account_name`,
        [tenantId],
      ),
      query(
        `SELECT session.id, session.cash_register_id, register.name register_name,
                branch.name branch_name, session.opened_at
         FROM cash_sessions session
         JOIN cash_registers register
           ON register.id = session.cash_register_id
          AND register.tenant_id = session.tenant_id
         JOIN branches branch
           ON branch.id = register.branch_id
          AND branch.tenant_id = register.tenant_id
         WHERE session.tenant_id = $1 AND session.status = 'OPEN'
           AND ($2::uuid IS NULL OR register.branch_id = $2)
         ORDER BY session.opened_at DESC`,
        [tenantId, branchFilter],
      ),
      query(
        `SELECT id, original_name, category, created_at
         FROM secure_documents
         WHERE tenant_id = $1 AND category IN ('ACCOUNTING','PURCHASE','OTHER')
         ORDER BY created_at DESC
         LIMIT 100`,
        [tenantId],
      ),
      query(
        `SELECT id, code, name
         FROM accounting_accounts
         WHERE tenant_id = $1 AND active = TRUE AND allows_posting = TRUE
           AND account_type = 'EXPENSE'
         ORDER BY code`,
        [tenantId],
      ),
    ]);
  res.json({
    branches: branches.rows,
    suppliers: suppliers.rows,
    categories: categories.rows,
    costCenters: centers.rows,
    bankAccounts: bankAccounts.rows,
    cashSessions: cashSessions.rows,
    documents: documents.rows,
    expenseAccounts: expenseAccounts.rows,
  });
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const branchId = req.context.branchId || req.query.branchId || null;
  if (branchId) requireUuid(branchId, 'La sucursal no es válida.');
  const result = await query(
    `SELECT
       COALESCE(SUM(total)
         FILTER (WHERE issue_date >= date_trunc('month', CURRENT_DATE)::date
           AND status NOT IN ('REJECTED','VOID')), 0) month_total,
       COALESCE(SUM(total - paid_amount)
         FILTER (WHERE status IN ('APPROVED','PARTIAL')), 0) pending_payment,
       COUNT(*) FILTER (WHERE status = 'SUBMITTED')::integer pending_approval,
       COALESCE(SUM(total)
         FILTER (WHERE recurring = TRUE
           AND status NOT IN ('REJECTED','VOID')), 0) recurring_total,
       COALESCE(SUM(total)
         FILTER (WHERE issue_date >= date_trunc('month', CURRENT_DATE)::date
           AND status IN ('APPROVED','PARTIAL','PAID')
           AND support_document_id IS NULL
           AND NULLIF(BTRIM(COALESCE(supplier_document_number, '')), '') IS NULL), 0)
         unsupported_total
     FROM business_expenses
     WHERE tenant_id = $1
       AND ($2::uuid IS NULL OR branch_id = $2)`,
    [req.context.tenantId, branchId],
  );
  res.json(result.rows[0]);
}));

router.get('/', asyncHandler(async (req, res) => {
  const status = cleanText(req.query.status, 20)?.toUpperCase() || 'ALL';
  const search = cleanText(req.query.search, 120);
  const branchId = req.context.branchId || req.query.branchId || null;
  if (![
    'ALL', 'SUBMITTED', 'APPROVED', 'PARTIAL', 'PAID', 'REJECTED',
  ].includes(status)) {
    throw new AppError(
      'El filtro de gastos no es válido.',
      422,
      'INVALID_EXPENSE_STATUS_FILTER',
    );
  }
  if (branchId) requireUuid(branchId, 'La sucursal no es válida.');
  const result = await query(
    `SELECT expense.id, expense.expense_number, expense.description,
            expense.issue_date, expense.due_date, expense.subtotal,
            expense.tax_total, expense.total, expense.paid_amount,
            expense.total - expense.paid_amount balance, expense.status,
            expense.recurring, expense.recurrence_rule,
            expense.supplier_document_number, expense.beneficiary_name,
            expense.support_document_id, category.name category_name,
            category.code category_code, center.name cost_center_name,
            center.code cost_center_code, branch.name branch_name,
            supplier.name supplier_name,
            COALESCE(supplier.name, expense.beneficiary_name) beneficiary
     FROM business_expenses expense
     JOIN expense_categories category
       ON category.id = expense.category_id
      AND category.tenant_id = expense.tenant_id
     JOIN cost_centers center
       ON center.id = expense.cost_center_id
      AND center.tenant_id = expense.tenant_id
     JOIN branches branch
       ON branch.id = expense.branch_id
      AND branch.tenant_id = expense.tenant_id
     LEFT JOIN suppliers supplier
       ON supplier.id = expense.supplier_id
      AND supplier.tenant_id = expense.tenant_id
     WHERE expense.tenant_id = $1
       AND ($2::uuid IS NULL OR expense.branch_id = $2)
       AND ($3 = 'ALL' OR expense.status = $3)
       AND ($4::text IS NULL
         OR expense.expense_number ILIKE '%' || $4 || '%'
         OR expense.description ILIKE '%' || $4 || '%'
         OR category.name ILIKE '%' || $4 || '%'
         OR center.name ILIKE '%' || $4 || '%'
         OR supplier.name ILIKE '%' || $4 || '%'
         OR expense.beneficiary_name ILIKE '%' || $4 || '%')
     ORDER BY expense.issue_date DESC, expense.created_at DESC`,
    [req.context.tenantId, branchId, status, search],
  );
  res.json(result.rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'El gasto debe tener un UUID válido.');
  const branchId = req.context.branchId || null;
  const [expense, payments] = await Promise.all([
    query(
      `SELECT expense.*, expense.total - expense.paid_amount balance,
              category.name category_name, category.code category_code,
              category.requires_support, category.approval_threshold,
              account.code account_code, account.name account_name,
              center.name cost_center_name, center.code cost_center_code,
              branch.name branch_name, supplier.name supplier_name,
              supplier.tax_id supplier_tax_id,
              creator.full_name created_by_name,
              approver.full_name approved_by_name,
              rejector.full_name rejected_by_name,
              document.original_name support_document_name,
              CASE WHEN document.id IS NULL THEN NULL
                ELSE '/api/assets/documents/' || document.id::text END support_url
       FROM business_expenses expense
       JOIN expense_categories category
         ON category.id = expense.category_id
        AND category.tenant_id = expense.tenant_id
       JOIN accounting_accounts account
         ON account.id = category.accounting_account_id
        AND account.tenant_id = category.tenant_id
       JOIN cost_centers center
         ON center.id = expense.cost_center_id
        AND center.tenant_id = expense.tenant_id
       JOIN branches branch
         ON branch.id = expense.branch_id
        AND branch.tenant_id = expense.tenant_id
       LEFT JOIN suppliers supplier
         ON supplier.id = expense.supplier_id
        AND supplier.tenant_id = expense.tenant_id
       LEFT JOIN users creator ON creator.id = expense.created_by
       LEFT JOIN users approver ON approver.id = expense.approved_by
       LEFT JOIN users rejector ON rejector.id = expense.rejected_by
       LEFT JOIN secure_documents document
         ON document.id = expense.support_document_id
        AND document.tenant_id = expense.tenant_id
       WHERE expense.id = $1 AND expense.tenant_id = $2
         AND ($3::uuid IS NULL OR expense.branch_id = $3)`,
      [req.params.id, req.context.tenantId, branchId],
    ),
    query(
      `SELECT payment.*, bank.bank_name, bank.masked_account,
              register.name cash_register_name, actor.full_name created_by_name
       FROM expense_payments payment
       LEFT JOIN bank_accounts bank
         ON bank.id = payment.bank_account_id
        AND bank.tenant_id = payment.tenant_id
       LEFT JOIN cash_sessions session
         ON session.id = payment.cash_session_id
        AND session.tenant_id = payment.tenant_id
       LEFT JOIN cash_registers register
         ON register.id = session.cash_register_id
        AND register.tenant_id = session.tenant_id
       LEFT JOIN users actor ON actor.id = payment.created_by
       WHERE payment.expense_id = $1 AND payment.tenant_id = $2
       ORDER BY payment.payment_date DESC, payment.created_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
  ]);
  if (!expense.rowCount) {
    throw new AppError(
      'No encontramos el gasto.',
      404,
      'EXPENSE_NOT_FOUND',
    );
  }
  res.json({ ...expense.rows[0], payments: payments.rows });
}));

router.post('/cost-centers', requirePermission('expenses.manage'), asyncHandler(async (req, res) => {
  const code = cleanText(req.body.code, 30, { required: true }).toUpperCase();
  const name = cleanText(req.body.name, 120, { required: true });
  const branchId = req.body.branchId || null;
  const monthlyBudget = req.body.monthlyBudget === '' || req.body.monthlyBudget == null
    ? null
    : money(req.body.monthlyBudget);
  if (branchId) requireUuid(branchId, 'La sucursal del centro de costos no es válida.');
  const center = await withTransaction(async (client) => {
    if (branchId) {
      const branch = await client.query(
        `SELECT 1 FROM branches
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
        [branchId, req.context.tenantId],
      );
      if (!branch.rowCount) {
        throw new AppError(
          'La sucursal no pertenece a la empresa activa.',
          404,
          'EXPENSE_BRANCH_NOT_FOUND',
        );
      }
    }
    const result = await client.query(
      `INSERT INTO cost_centers(
         tenant_id, branch_id, code, name, monthly_budget, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        req.context.tenantId,
        branchId,
        code,
        name,
        monthlyBudget,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'expense.cost_center_created',
      entityType: 'cost_center',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: name,
    });
    return result.rows[0];
  });
  res.status(201).json(center);
}));

router.post('/categories', requirePermission('expenses.manage'), asyncHandler(async (req, res) => {
  const code = cleanText(req.body.code, 30, { required: true }).toUpperCase();
  const name = cleanText(req.body.name, 120, { required: true });
  const accountingAccountId = req.body.accountingAccountId;
  const threshold = money(req.body.approvalThreshold || 0);
  requireUuid(accountingAccountId, 'Selecciona una cuenta contable válida.');
  const category = await withTransaction(async (client) => {
    const account = await client.query(
      `SELECT 1 FROM accounting_accounts
       WHERE id = $1 AND tenant_id = $2 AND active = TRUE
         AND allows_posting = TRUE AND account_type = 'EXPENSE'`,
      [accountingAccountId, req.context.tenantId],
    );
    if (!account.rowCount) {
      throw new AppError(
        'La cuenta contable de gasto no está disponible.',
        404,
        'EXPENSE_ACCOUNT_NOT_FOUND',
      );
    }
    const result = await client.query(
      `INSERT INTO expense_categories(
         tenant_id, accounting_account_id, code, name, requires_support,
         approval_threshold, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        req.context.tenantId,
        accountingAccountId,
        code,
        name,
        req.body.requiresSupport !== false,
        threshold,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'expense.category_created',
      entityType: 'expense_category',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: name,
    });
    return result.rows[0];
  });
  res.status(201).json(category);
}));

router.post('/', requirePermission('expenses.manage'), asyncHandler(async (req, res) => {
  const branchId = req.body.branchId;
  const costCenterId = req.body.costCenterId;
  const categoryId = req.body.categoryId;
  const supplierId = req.body.supplierId || null;
  const supportDocumentId = req.body.supportDocumentId || null;
  const beneficiaryName = cleanText(req.body.beneficiaryName, 160);
  const documentNumber = cleanText(req.body.supplierDocumentNumber, 80);
  const description = cleanText(req.body.description, 500, { required: true });
  const issueDate = req.body.issueDate;
  const dueDate = req.body.dueDate || null;
  const subtotal = money(req.body.subtotal);
  const taxTotal = money(req.body.taxTotal || 0);
  const total = Math.round((subtotal + taxTotal) * 100) / 100;
  const recurring = req.body.recurring === true;
  const recurrenceRule = recurring
    ? cleanText(req.body.recurrenceRule, 20)?.toUpperCase()
    : null;

  requireUuid(branchId, 'Selecciona una sucursal válida.');
  requireUuid(costCenterId, 'Selecciona un centro de costos válido.');
  requireUuid(categoryId, 'Selecciona una categoría válida.');
  if (supplierId) requireUuid(supplierId, 'El proveedor no es válido.');
  if (supportDocumentId) requireUuid(supportDocumentId, 'El soporte no es válido.');
  if (!supplierId && !beneficiaryName) {
    throw new AppError(
      'Selecciona un proveedor o escribe el beneficiario.',
      422,
      'EXPENSE_BENEFICIARY_REQUIRED',
    );
  }
  if (!validDate(issueDate) || (dueDate && (!validDate(dueDate) || dueDate < issueDate))) {
    throw new AppError(
      'La fecha de emisión o vencimiento no es válida.',
      422,
      'INVALID_EXPENSE_DATES',
    );
  }
  if (total <= 0) {
    throw new AppError(
      'El total del gasto debe ser mayor que cero.',
      422,
      'INVALID_EXPENSE_TOTAL',
    );
  }
  if (recurring && !RECURRENCE_RULES.has(recurrenceRule)) {
    throw new AppError(
      'Selecciona una periodicidad válida.',
      422,
      'INVALID_EXPENSE_RECURRENCE',
    );
  }

  const expense = await withTransaction(async (client) => {
    const scope = await client.query(
      `SELECT
         EXISTS(SELECT 1 FROM branches
           WHERE id = $1 AND tenant_id = $4 AND active = TRUE) branch_ok,
         EXISTS(SELECT 1 FROM cost_centers
           WHERE id = $2 AND tenant_id = $4 AND active = TRUE
             AND (branch_id IS NULL OR branch_id = $1)) center_ok,
         EXISTS(SELECT 1 FROM expense_categories
           WHERE id = $3 AND tenant_id = $4 AND active = TRUE) category_ok`,
      [branchId, costCenterId, categoryId, req.context.tenantId],
    );
    if (!scope.rows[0].branch_ok || !scope.rows[0].center_ok ||
        !scope.rows[0].category_ok) {
      throw new AppError(
        'La sucursal, categoría o centro de costos no pertenece a la empresa.',
        409,
        'EXPENSE_SCOPE_MISMATCH',
      );
    }
    if (supplierId) {
      const supplier = await client.query(
        `SELECT 1 FROM suppliers
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
        [supplierId, req.context.tenantId],
      );
      if (!supplier.rowCount) {
        throw new AppError(
          'El proveedor no pertenece a la empresa activa.',
          404,
          'EXPENSE_SUPPLIER_NOT_FOUND',
        );
      }
    }
    if (supportDocumentId) {
      const document = await client.query(
        `SELECT 1 FROM secure_documents
         WHERE id = $1 AND tenant_id = $2`,
        [supportDocumentId, req.context.tenantId],
      );
      if (!document.rowCount) {
        throw new AppError(
          'El soporte no pertenece a la empresa activa.',
          404,
          'EXPENSE_DOCUMENT_NOT_FOUND',
        );
      }
    }
    const result = await client.query(
      `INSERT INTO business_expenses(
         tenant_id, branch_id, cost_center_id, category_id, supplier_id,
         support_document_id, beneficiary_name, supplier_document_number,
         description, issue_date, due_date, subtotal, tax_total, total,
         recurring, recurrence_rule, status, submitted_by, submitted_at,
         created_by
       )
       VALUES(
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
         'SUBMITTED',$17,now(),$17
       )
       RETURNING *`,
      [
        req.context.tenantId,
        branchId,
        costCenterId,
        categoryId,
        supplierId,
        supportDocumentId,
        beneficiaryName,
        documentNumber,
        description,
        issueDate,
        dueDate,
        subtotal,
        taxTotal,
        total,
        recurring,
        recurrenceRule,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'expense.submitted',
      entityType: 'business_expense',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: description,
    });
    return result.rows[0];
  });
  res.status(201).json(expense);
}));

router.post('/:id/approve', requirePermission('expenses.approve'), asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'El gasto debe tener un UUID válido.');
  const notes = cleanText(req.body.notes, 1000, { required: true });
  const approved = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT expense.*, category.requires_support
       FROM business_expenses expense
       JOIN expense_categories category
         ON category.id = expense.category_id
        AND category.tenant_id = expense.tenant_id
       WHERE expense.id = $1 AND expense.tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError('No encontramos el gasto.', 404, 'EXPENSE_NOT_FOUND');
    }
    if (current.rows[0].status !== 'SUBMITTED') {
      throw new AppError(
        'Solo los gastos pendientes se pueden aprobar.',
        409,
        'EXPENSE_NOT_SUBMITTED',
      );
    }
    if (current.rows[0].requires_support &&
        !current.rows[0].support_document_id &&
        !current.rows[0].supplier_document_number) {
      throw new AppError(
        'La categoría exige adjuntar soporte o registrar el número del comprobante.',
        409,
        'EXPENSE_SUPPORT_REQUIRED',
      );
    }
    const result = await client.query(
      `UPDATE business_expenses
       SET status = 'APPROVED', approved_by = $3, approved_at = now(),
           decision_notes = $4, updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, req.context.tenantId, req.context.userId, notes],
    );
    await postBusinessExpenseAccounting(client, {
      tenantId: req.context.tenantId,
      expenseId: req.params.id,
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'expense.approved',
      entityType: 'business_expense',
      entityId: req.params.id,
      before: current.rows[0],
      after: result.rows[0],
      reason: notes,
    });
    return result.rows[0];
  });
  res.json(approved);
}));

router.post('/:id/reject', requirePermission('expenses.approve'), asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'El gasto debe tener un UUID válido.');
  const notes = cleanText(req.body.notes, 1000, { required: true });
  const rejected = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM business_expenses
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError('No encontramos el gasto.', 404, 'EXPENSE_NOT_FOUND');
    }
    if (current.rows[0].status !== 'SUBMITTED') {
      throw new AppError(
        'Solo los gastos pendientes se pueden rechazar.',
        409,
        'EXPENSE_NOT_SUBMITTED',
      );
    }
    const result = await client.query(
      `UPDATE business_expenses
       SET status = 'REJECTED', rejected_by = $3, rejected_at = now(),
           decision_notes = $4, updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, req.context.tenantId, req.context.userId, notes],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'expense.rejected',
      entityType: 'business_expense',
      entityId: req.params.id,
      before: current.rows[0],
      after: result.rows[0],
      reason: notes,
    });
    return result.rows[0];
  });
  res.json(rejected);
}));

router.post('/:id/payments', requirePermission('expenses.pay'), asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'El gasto debe tener un UUID válido.');
  const paymentDate = req.body.paymentDate;
  const amount = money(req.body.amount, { allowZero: false });
  const paymentMethod =
    cleanText(req.body.paymentMethod, 30, { required: true }).toUpperCase();
  const bankAccountId = req.body.bankAccountId || null;
  const cashSessionId = req.body.cashSessionId || null;
  const reference = cleanText(req.body.reference, 120);
  const notes = cleanText(req.body.notes, 500);
  if (!validDate(paymentDate) || !PAYMENT_METHODS.has(paymentMethod)) {
    throw new AppError(
      'La fecha o el medio de pago no es válido.',
      422,
      'INVALID_EXPENSE_PAYMENT',
    );
  }
  if (paymentMethod === 'CASH') {
    requireUuid(cashSessionId, 'Selecciona un turno de caja abierto.');
  } else if (['BANK_TRANSFER', 'CARD', 'CHECK'].includes(paymentMethod)) {
    requireUuid(bankAccountId, 'Selecciona la cuenta bancaria de salida.');
  }

  const result = await withTransaction(async (client) => {
    const expense = await client.query(
      `SELECT * FROM business_expenses
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!expense.rowCount) {
      throw new AppError('No encontramos el gasto.', 404, 'EXPENSE_NOT_FOUND');
    }
    if (!['APPROVED', 'PARTIAL'].includes(expense.rows[0].status)) {
      throw new AppError(
        'El gasto debe estar aprobado y conservar saldo pendiente.',
        409,
        'EXPENSE_NOT_PAYABLE',
      );
    }
    const balance =
      Number(expense.rows[0].total) - Number(expense.rows[0].paid_amount);
    if (amount > balance) {
      throw new AppError(
        `El pago supera el saldo pendiente de ${balance}.`,
        409,
        'EXPENSE_PAYMENT_EXCEEDS_BALANCE',
      );
    }
    if (bankAccountId) {
      const bank = await client.query(
        `SELECT 1 FROM bank_accounts
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
        [bankAccountId, req.context.tenantId],
      );
      if (!bank.rowCount) {
        throw new AppError(
          'La cuenta bancaria no pertenece a la empresa.',
          404,
          'EXPENSE_BANK_NOT_FOUND',
        );
      }
    }
    if (cashSessionId) {
      const session = await client.query(
        `SELECT 1 FROM cash_sessions
         WHERE id = $1 AND tenant_id = $2 AND status = 'OPEN'`,
        [cashSessionId, req.context.tenantId],
      );
      if (!session.rowCount) {
        throw new AppError(
          'El turno de caja ya no está abierto.',
          409,
          'EXPENSE_CASH_SESSION_CLOSED',
        );
      }
    }
    const payment = await client.query(
      `INSERT INTO expense_payments(
         tenant_id, expense_id, payment_date, amount, payment_method,
         bank_account_id, cash_session_id, reference, notes, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.context.tenantId,
        req.params.id,
        paymentDate,
        amount,
        paymentMethod,
        bankAccountId,
        cashSessionId,
        reference,
        notes,
        req.context.userId,
      ],
    );
    if (cashSessionId) {
      await client.query(
        `INSERT INTO cash_movements(
           tenant_id, cash_session_id, movement_type, category, amount,
           reference, notes, created_by
         )
         VALUES($1,$2,'EXPENSE',$3,$4,$5,$6,$7)`,
        [
          req.context.tenantId,
          cashSessionId,
          `Gasto ${expense.rows[0].expense_number}`,
          amount,
          reference,
          notes || expense.rows[0].description,
          req.context.userId,
        ],
      );
    }
    const paidAmount = Number(expense.rows[0].paid_amount) + amount;
    const status = paidAmount === Number(expense.rows[0].total)
      ? 'PAID'
      : 'PARTIAL';
    const updated = await client.query(
      `UPDATE business_expenses
       SET paid_amount = $3, status = $4, updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, req.context.tenantId, paidAmount, status],
    );
    await postBusinessExpensePaymentAccounting(client, {
      tenantId: req.context.tenantId,
      payment: payment.rows[0],
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'expense.payment_created',
      entityType: 'expense_payment',
      entityId: payment.rows[0].id,
      before: expense.rows[0],
      after: updated.rows[0],
      reason: notes || reference,
      metadata: { paymentMethod, bankAccountId, cashSessionId },
    });
    return { expense: updated.rows[0], payment: payment.rows[0] };
  });
  res.status(201).json(result);
}));

export default router;
