import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_METHODS = new Set([
  'CASH',
  'BANK_TRANSFER',
  'CARD',
  'CHECK',
  'OTHER',
]);

router.use(requireTenant);

function text(value, maxLength) {
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

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('ISSUED','PARTIAL'))::integer open_count,
       COALESCE(SUM(total - paid_amount)
         FILTER (WHERE status IN ('ISSUED','PARTIAL')), 0) outstanding,
       COALESCE(SUM(total - paid_amount)
         FILTER (WHERE status IN ('ISSUED','PARTIAL') AND due_date >= CURRENT_DATE), 0) current,
       COALESCE(SUM(total - paid_amount)
         FILTER (WHERE status IN ('ISSUED','PARTIAL')
           AND CURRENT_DATE - due_date BETWEEN 1 AND 30), 0) overdue_1_30,
       COALESCE(SUM(total - paid_amount)
         FILTER (WHERE status IN ('ISSUED','PARTIAL')
           AND CURRENT_DATE - due_date BETWEEN 31 AND 60), 0) overdue_31_60,
       COALESCE(SUM(total - paid_amount)
         FILTER (WHERE status IN ('ISSUED','PARTIAL')
           AND CURRENT_DATE - due_date > 60), 0) overdue_61_plus,
       COALESCE((
         SELECT SUM(p.amount)
         FROM ap_payments p
         WHERE p.tenant_id = $1
           AND p.payment_date >= date_trunc('month', CURRENT_DATE)::date
       ), 0) paid_month
     FROM ap_invoices
     WHERE tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/sources', asyncHandler(async (req, res) => {
  const [suppliers, purchases] = await Promise.all([
    query(
      `SELECT id, name, tax_id, payment_terms_days
       FROM suppliers
       WHERE tenant_id = $1 AND active = TRUE
       ORDER BY name`,
      [req.context.tenantId],
    ),
    query(
      `SELECT p.id, p.order_number, p.supplier_id, p.issue_date, p.total,
              p.subtotal, p.tax_total, p.status, s.name supplier_name,
              s.payment_terms_days
       FROM purchases p
       JOIN suppliers s ON s.id = p.supplier_id AND s.tenant_id = p.tenant_id
       LEFT JOIN ap_invoices ai
         ON ai.purchase_id = p.id
        AND ai.tenant_id = p.tenant_id
        AND ai.status <> 'VOID'
       WHERE p.tenant_id = $1
         AND p.status = 'RECEIVED'
         AND ai.id IS NULL
       ORDER BY p.received_at DESC NULLS LAST, p.created_at DESC`,
      [req.context.tenantId],
    ),
  ]);
  res.json({ suppliers: suppliers.rows, purchases: purchases.rows });
}));

router.get('/invoices', asyncHandler(async (req, res) => {
  const search = text(req.query.search, 120);
  const status = text(req.query.status, 20)?.toUpperCase() || 'ALL';
  if (!['ALL', 'OPEN', 'OVERDUE', 'PAID'].includes(status)) {
    throw new AppError(
      'El filtro de estado no es válido.',
      422,
      'INVALID_AP_STATUS_FILTER',
    );
  }
  const result = await query(
    `SELECT ai.id, ai.payable_number, ai.supplier_invoice_number,
            ai.purchase_id, ai.issue_date, ai.due_date, ai.subtotal,
            ai.tax_total, ai.total, ai.paid_amount,
            (ai.total - ai.paid_amount) balance, ai.status, ai.notes,
            ai.created_at, s.id supplier_id, s.name supplier_name, s.tax_id,
            p.order_number,
            GREATEST(CURRENT_DATE - ai.due_date, 0) days_overdue
     FROM ap_invoices ai
     JOIN suppliers s ON s.id = ai.supplier_id AND s.tenant_id = ai.tenant_id
     LEFT JOIN purchases p ON p.id = ai.purchase_id AND p.tenant_id = ai.tenant_id
     WHERE ai.tenant_id = $1
       AND ($2::text IS NULL
         OR ai.payable_number ILIKE '%' || $2 || '%'
         OR ai.supplier_invoice_number ILIKE '%' || $2 || '%'
         OR p.order_number ILIKE '%' || $2 || '%'
         OR s.name ILIKE '%' || $2 || '%')
       AND (
         $3 = 'ALL'
         OR ($3 = 'OPEN' AND ai.status IN ('ISSUED','PARTIAL'))
         OR ($3 = 'OVERDUE' AND ai.status IN ('ISSUED','PARTIAL')
           AND ai.due_date < CURRENT_DATE)
         OR ($3 = 'PAID' AND ai.status = 'PAID')
       )
     ORDER BY
       CASE WHEN ai.status IN ('ISSUED','PARTIAL') AND ai.due_date < CURRENT_DATE
         THEN 0 ELSE 1 END,
       ai.due_date, ai.created_at DESC`,
    [req.context.tenantId, search, status],
  );
  res.json(result.rows);
}));

router.get('/invoices/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError(
      'La obligación debe tener un UUID válido.',
      422,
      'INVALID_AP_INVOICE_ID',
    );
  }
  const [invoice, payments] = await Promise.all([
    query(
      `SELECT ai.*, (ai.total - ai.paid_amount) balance,
              s.name supplier_name, s.tax_id, s.email supplier_email,
              s.phone supplier_phone, p.order_number,
              GREATEST(CURRENT_DATE - ai.due_date, 0) days_overdue
       FROM ap_invoices ai
       JOIN suppliers s ON s.id = ai.supplier_id AND s.tenant_id = ai.tenant_id
       LEFT JOIN purchases p ON p.id = ai.purchase_id AND p.tenant_id = ai.tenant_id
       WHERE ai.id = $1 AND ai.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT id, payment_date, amount, payment_method, reference, notes, created_at
       FROM ap_payments
       WHERE invoice_id = $1 AND tenant_id = $2
       ORDER BY payment_date DESC, created_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
  ]);
  if (!invoice.rowCount) {
    throw new AppError(
      'No encontramos la cuenta por pagar.',
      404,
      'AP_INVOICE_NOT_FOUND',
    );
  }
  res.json({ ...invoice.rows[0], payments: payments.rows });
}));

router.post('/invoices', asyncHandler(async (req, res) => {
  const purchaseId = req.body.purchaseId || null;
  const supplierId = req.body.supplierId || null;
  const issueDate = req.body.issueDate;
  const dueDate = req.body.dueDate;
  const supplierInvoiceNumber = text(req.body.supplierInvoiceNumber, 80);
  const notes = text(req.body.notes, 500);
  if ((purchaseId && !UUID_PATTERN.test(purchaseId)) ||
      (!purchaseId && !UUID_PATTERN.test(supplierId || ''))) {
    throw new AppError(
      'Selecciona una compra recibida o un proveedor válido.',
      422,
      'INVALID_AP_SOURCE',
    );
  }
  if (!validDate(issueDate) || !validDate(dueDate) || dueDate < issueDate) {
    throw new AppError(
      'Las fechas son obligatorias y el vencimiento no puede ser anterior.',
      422,
      'INVALID_AP_DATES',
    );
  }
  const manualSubtotal = Number(req.body.subtotal);
  const manualTaxTotal = Number(req.body.taxTotal || 0);
  if (!purchaseId && (
    !Number.isFinite(manualSubtotal) || manualSubtotal < 0 ||
    !Number.isFinite(manualTaxTotal) || manualTaxTotal < 0 ||
    manualSubtotal + manualTaxTotal <= 0
  )) {
    throw new AppError(
      'Los valores de la obligación manual no son válidos.',
      422,
      'INVALID_AP_TOTALS',
    );
  }

  try {
    const created = await withTransaction(async (client) => {
      let source;
      if (purchaseId) {
        const purchase = await client.query(
          `SELECT p.id purchase_id, p.supplier_id, p.subtotal, p.tax_total, p.total,
                  p.order_number
           FROM purchases p
           WHERE p.id = $1 AND p.tenant_id = $2
             AND p.status = 'RECEIVED'
           FOR SHARE`,
          [purchaseId, req.context.tenantId],
        );
        if (!purchase.rowCount) {
          throw new AppError(
            'La compra debe estar recibida antes de crear la obligación.',
            409,
            'AP_PURCHASE_NOT_RECEIVED',
          );
        }
        source = purchase.rows[0];
      } else {
        const supplier = await client.query(
          `SELECT id supplier_id FROM suppliers
           WHERE id = $1 AND tenant_id = $2 AND active = TRUE
           FOR SHARE`,
          [supplierId, req.context.tenantId],
        );
        if (!supplier.rowCount) {
          throw new AppError(
            'El proveedor no pertenece a la empresa activa.',
            404,
            'AP_SUPPLIER_NOT_FOUND',
          );
        }
        source = {
          supplier_id: supplierId,
          purchase_id: null,
          subtotal: manualSubtotal,
          tax_total: manualTaxTotal,
          total: manualSubtotal + manualTaxTotal,
          order_number: null,
        };
      }
      const invoice = await client.query(
        `INSERT INTO ap_invoices(
           tenant_id, supplier_id, purchase_id, supplier_invoice_number,
           issue_date, due_date, subtotal, tax_total, total, notes, created_by
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          req.context.tenantId,
          source.supplier_id,
          source.purchase_id || null,
          supplierInvoiceNumber,
          issueDate,
          dueDate,
          source.subtotal,
          source.tax_total,
          source.total,
          notes,
          req.context.userId,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'payable.invoice_created',
        entityType: 'ap_invoice',
        entityId: invoice.rows[0].id,
        after: invoice.rows[0],
        reason: notes || source.order_number,
      });
      return invoice.rows[0];
    });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Esta compra ya tiene una cuenta por pagar activa.',
        409,
        'AP_PURCHASE_ALREADY_LINKED',
      );
    }
    throw error;
  }
}));

router.post('/invoices/:id/payments', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError(
      'La obligación debe tener un UUID válido.',
      422,
      'INVALID_AP_INVOICE_ID',
    );
  }
  const paymentDate = req.body.paymentDate;
  const amount = Number(req.body.amount);
  const paymentMethod =
    text(req.body.paymentMethod, 30)?.toUpperCase() || 'BANK_TRANSFER';
  const reference = text(req.body.reference, 100);
  const notes = text(req.body.notes, 500);
  if (!validDate(paymentDate) || !Number.isFinite(amount) || amount <= 0) {
    throw new AppError(
      'La fecha y el valor del pago son obligatorios.',
      422,
      'INVALID_AP_PAYMENT',
    );
  }
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    throw new AppError(
      'El medio de pago no es válido.',
      422,
      'INVALID_AP_PAYMENT_METHOD',
    );
  }

  const result = await withTransaction(async (client) => {
    const invoice = await client.query(
      `SELECT id, total, paid_amount, status
       FROM ap_invoices
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!invoice.rowCount) {
      throw new AppError(
        'No encontramos la cuenta por pagar.',
        404,
        'AP_INVOICE_NOT_FOUND',
      );
    }
    if (!['ISSUED', 'PARTIAL'].includes(invoice.rows[0].status)) {
      throw new AppError(
        'La obligación ya no admite pagos.',
        409,
        'AP_INVOICE_NOT_PAYABLE',
      );
    }
    const balance =
      Number(invoice.rows[0].total) - Number(invoice.rows[0].paid_amount);
    if (amount > balance) {
      throw new AppError(
        `El pago supera el saldo pendiente de ${balance}.`,
        409,
        'AP_PAYMENT_EXCEEDS_BALANCE',
      );
    }
    const payment = await client.query(
      `INSERT INTO ap_payments(
         tenant_id, invoice_id, payment_date, amount, payment_method,
         reference, notes, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.context.tenantId,
        req.params.id,
        paymentDate,
        amount,
        paymentMethod,
        reference,
        notes,
        req.context.userId,
      ],
    );
    const paidAmount = Number(invoice.rows[0].paid_amount) + amount;
    const status = paidAmount === Number(invoice.rows[0].total)
      ? 'PAID'
      : 'PARTIAL';
    const updated = await client.query(
      `UPDATE ap_invoices
       SET paid_amount = $3, status = $4, updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, req.context.tenantId, paidAmount, status],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'payable.payment_created',
      entityType: 'ap_payment',
      entityId: payment.rows[0].id,
      before: invoice.rows[0],
      after: updated.rows[0],
      reason: notes || reference,
    });
    return { payment: payment.rows[0], invoice: updated.rows[0] };
  });
  res.status(201).json(result);
}));

export default router;
