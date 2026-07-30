import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import {
  postReceivableInvoiceAccounting,
  postReceivablePaymentAccounting,
} from '../accounting.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DOCUMENT_TYPES = new Set(['NIT', 'CC', 'CE', 'PASSPORT', 'OTHER']);
const PAYMENT_METHODS = new Set(['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER']);

router.use(requireTenant);

function text(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(`El campo supera ${maxLength} caracteres.`, 422, 'FIELD_TOO_LONG');
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
       COUNT(*) FILTER (WHERE status IN ('ISSUED','PARTIAL'))::int open_count,
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
         FROM ar_payments p
         WHERE p.tenant_id = $1
           AND p.payment_date >= date_trunc('month', CURRENT_DATE)::date
       ), 0) collected_month
     FROM ar_invoices
     WHERE tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const search = text(req.query.search, 120);
  const result = await query(
    `SELECT c.id, c.name, c.document_type, c.document_number, c.email,
            c.phone, c.address, c.active, c.created_at,
            COALESCE(SUM(i.total - i.paid_amount)
              FILTER (WHERE i.status IN ('ISSUED','PARTIAL')), 0) outstanding
     FROM customers c
     LEFT JOIN ar_invoices i
       ON i.customer_id = c.id AND i.tenant_id = c.tenant_id
     WHERE c.tenant_id = $1
       AND ($2::text IS NULL OR c.name ILIKE '%' || $2 || '%'
         OR c.document_number ILIKE '%' || $2 || '%')
     GROUP BY c.id
     ORDER BY c.active DESC, c.name`,
    [req.context.tenantId, search],
  );
  res.json(result.rows);
}));

router.post('/customers', asyncHandler(async (req, res) => {
  const name = text(req.body.name, 160);
  const documentType = text(req.body.documentType, 20)?.toUpperCase() || 'NIT';
  const documentNumber = text(req.body.documentNumber, 40);
  const email = text(req.body.email, 160);
  const phone = text(req.body.phone, 40);
  const address = text(req.body.address, 240);
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
    const result = await query(
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
    res.status(201).json(result.rows[0]);
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

router.get('/invoices', asyncHandler(async (req, res) => {
  const search = text(req.query.search, 120);
  const status = text(req.query.status, 20)?.toUpperCase() || 'ALL';
  if (!['ALL', 'OPEN', 'OVERDUE', 'PAID'].includes(status)) {
    return res.status(422).json({ error: 'El filtro de estado no es válido.' });
  }
  const result = await query(
    `SELECT i.id, i.invoice_number, i.external_reference, i.issue_date,
            i.due_date, i.currency, i.subtotal, i.tax_total, i.total,
            i.paid_amount, (i.total - i.paid_amount) balance, i.status,
            i.notes, i.created_at, c.id customer_id, c.name customer_name,
            c.document_type, c.document_number,
            GREATEST(CURRENT_DATE - i.due_date, 0) days_overdue
     FROM ar_invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1
       AND ($2::text IS NULL OR i.invoice_number ILIKE '%' || $2 || '%'
         OR i.external_reference ILIKE '%' || $2 || '%'
         OR c.name ILIKE '%' || $2 || '%'
         OR c.document_number ILIKE '%' || $2 || '%')
       AND (
         $3 = 'ALL'
         OR ($3 = 'OPEN' AND i.status IN ('ISSUED','PARTIAL'))
         OR ($3 = 'OVERDUE' AND i.status IN ('ISSUED','PARTIAL')
           AND i.due_date < CURRENT_DATE)
         OR ($3 = 'PAID' AND i.status = 'PAID')
       )
     ORDER BY
       CASE WHEN i.status IN ('ISSUED','PARTIAL') AND i.due_date < CURRENT_DATE
         THEN 0 ELSE 1 END,
       i.due_date, i.created_at DESC`,
    [req.context.tenantId, search, status],
  );
  res.json(result.rows);
}));

router.get('/invoices/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'La factura debe tener un UUID válido.' });
  }
  const [invoiceResult, itemsResult, paymentsResult] = await Promise.all([
    query(
      `SELECT i.*, (i.total - i.paid_amount) balance,
              c.name customer_name, c.document_type, c.document_number,
              c.email customer_email, c.phone customer_phone,
              GREATEST(CURRENT_DATE - i.due_date, 0) days_overdue
       FROM ar_invoices i
       JOIN customers c ON c.id = i.customer_id
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT id, description, quantity, unit_price, tax_rate, subtotal,
              tax_amount, line_total
       FROM ar_invoice_items
       WHERE invoice_id = $1 AND tenant_id = $2
       ORDER BY id`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT id, payment_date, amount, payment_method, reference, notes, created_at
       FROM ar_payments
       WHERE invoice_id = $1 AND tenant_id = $2
       ORDER BY payment_date DESC, created_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
  ]);
  if (!invoiceResult.rowCount) {
    throw new AppError('No encontramos la factura.', 404, 'AR_INVOICE_NOT_FOUND');
  }
  res.json({
    ...invoiceResult.rows[0],
    items: itemsResult.rows,
    payments: paymentsResult.rows,
  });
}));

router.post('/invoices', asyncHandler(async (req, res) => {
  const {
    customerId,
    branchId = null,
    issueDate,
    dueDate,
    externalReference = null,
    notes = null,
    items,
  } = req.body;
  if (!UUID_PATTERN.test(customerId || '') || (branchId && !UUID_PATTERN.test(branchId))) {
    return res.status(422).json({ error: 'El cliente o la sucursal no son válidos.' });
  }
  if (!validDate(issueDate) || !validDate(dueDate) || dueDate < issueDate) {
    return res.status(422).json({
      error: 'Las fechas son obligatorias y el vencimiento no puede ser anterior a la emisión.',
    });
  }
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    return res.status(422).json({ error: 'La factura debe tener entre 1 y 50 conceptos.' });
  }

  const normalizedItems = items.map((item) => {
    const description = text(item?.description, 240);
    const quantity = Number(item?.quantity);
    const unitPrice = Number(item?.unitPrice);
    const taxRate = Number(item?.taxRate || 0);
    if (
      !description ||
      !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(unitPrice) || unitPrice < 0 ||
      !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100
    ) {
      throw new AppError(
        'Revisa la descripción, cantidad, valor e impuesto de cada concepto.',
        422,
        'AR_ITEM_INVALID',
      );
    }
    const subtotal = Math.round(quantity * unitPrice * 100) / 100;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    return {
      description,
      quantity,
      unitPrice,
      taxRate,
      subtotal,
      taxAmount,
      lineTotal: Math.round((subtotal + taxAmount) * 100) / 100,
    };
  });
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxTotal = normalizedItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = Math.round((subtotal + taxTotal) * 100) / 100;
  if (total <= 0) {
    return res.status(422).json({ error: 'El total de la factura debe ser mayor que cero.' });
  }

  const invoice = await withTransaction(async (client) => {
    const customer = await client.query(
      `SELECT id FROM customers
       WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
      [customerId, req.context.tenantId],
    );
    if (!customer.rowCount) {
      throw new AppError('El cliente no pertenece a la empresa activa.', 404, 'CUSTOMER_NOT_FOUND');
    }
    if (branchId) {
      const branch = await client.query(
        `SELECT id FROM branches WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
        [branchId, req.context.tenantId],
      );
      if (!branch.rowCount) {
        throw new AppError('La sucursal no pertenece a la empresa activa.', 404, 'BRANCH_NOT_FOUND');
      }
    }
    const result = await client.query(
      `INSERT INTO ar_invoices(
         tenant_id, customer_id, branch_id, external_reference,
         issue_date, due_date, subtotal, tax_total, total, notes, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, invoice_number, customer_id, branch_id, issue_date,
                 due_date, currency, subtotal, tax_total, total, paid_amount,
                 status, notes, created_at`,
      [
        req.context.tenantId,
        customerId,
        branchId,
        text(externalReference, 80),
        issueDate,
        dueDate,
        Math.round(subtotal * 100) / 100,
        Math.round(taxTotal * 100) / 100,
        total,
        text(notes, 500),
        req.context.userId,
      ],
    );
    for (const item of normalizedItems) {
      await client.query(
        `INSERT INTO ar_invoice_items(
           tenant_id, invoice_id, description, quantity, unit_price, tax_rate,
           subtotal, tax_amount, line_total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          req.context.tenantId,
          result.rows[0].id,
          item.description,
          item.quantity,
          item.unitPrice,
          item.taxRate,
          item.subtotal,
          item.taxAmount,
          item.lineTotal,
        ],
      );
    }
    await postReceivableInvoiceAccounting(client, {
      tenantId: req.context.tenantId,
      invoiceId: result.rows[0].id,
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'receivable.invoice_created',
      entityType: 'ar_invoice',
      entityId: result.rows[0].id,
      after: { ...result.rows[0], itemCount: normalizedItems.length },
      reason: 'Factura por cobrar creada',
    });
    return result.rows[0];
  });
  res.status(201).json(invoice);
}));

router.post('/invoices/:id/payments', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'La factura debe tener un UUID válido.' });
  }
  const amount = Number(req.body.amount);
  const paymentDate = req.body.paymentDate;
  const paymentMethod = text(req.body.paymentMethod, 30)?.toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(422).json({ error: 'El valor del abono debe ser mayor que cero.' });
  }
  if (!validDate(paymentDate)) {
    return res.status(422).json({ error: 'La fecha del abono no es válida.' });
  }
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(422).json({ error: 'El medio de pago no es válido.' });
  }

  const payment = await withTransaction(async (client) => {
    const invoiceResult = await client.query(
      `SELECT id, invoice_number, total, paid_amount, issue_date, status
       FROM ar_invoices
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [req.params.id, req.context.tenantId],
    );
    if (!invoiceResult.rowCount) {
      throw new AppError('No encontramos la factura.', 404, 'AR_INVOICE_NOT_FOUND');
    }
    const invoice = invoiceResult.rows[0];
    if (!['ISSUED', 'PARTIAL'].includes(invoice.status)) {
      throw new AppError('Esta factura ya no admite abonos.', 409, 'AR_INVOICE_NOT_PAYABLE');
    }
    const invoiceIssueDate = invoice.issue_date instanceof Date
      ? invoice.issue_date.toISOString().slice(0, 10)
      : String(invoice.issue_date).slice(0, 10);
    if (paymentDate < invoiceIssueDate) {
      throw new AppError('El abono no puede ser anterior a la factura.', 422, 'PAYMENT_DATE_INVALID');
    }
    const balance = Math.round((Number(invoice.total) - Number(invoice.paid_amount)) * 100) / 100;
    if (amount > balance) {
      throw new AppError(
        `El abono supera el saldo pendiente de ${balance.toFixed(2)}.`,
        422,
        'PAYMENT_EXCEEDS_BALANCE',
      );
    }
    const paymentResult = await client.query(
      `INSERT INTO ar_payments(
         tenant_id, invoice_id, payment_date, amount, payment_method,
         reference, notes, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, invoice_id, payment_date, amount, payment_method,
                 reference, notes, created_at`,
      [
        req.context.tenantId,
        invoice.id,
        paymentDate,
        Math.round(amount * 100) / 100,
        paymentMethod,
        text(req.body.reference, 100),
        text(req.body.notes, 300),
        req.context.userId,
      ],
    );
    const nextPaid = Math.round((Number(invoice.paid_amount) + amount) * 100) / 100;
    const nextStatus = nextPaid === Number(invoice.total) ? 'PAID' : 'PARTIAL';
    await client.query(
      `UPDATE ar_invoices
       SET paid_amount = $1, status = $2, updated_at = now()
       WHERE id = $3`,
      [nextPaid, nextStatus, invoice.id],
    );
    await postReceivablePaymentAccounting(client, {
      tenantId: req.context.tenantId,
      payment: paymentResult.rows[0],
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'receivable.payment_recorded',
      entityType: 'ar_invoice',
      entityId: invoice.id,
      before: { paidAmount: invoice.paid_amount, status: invoice.status },
      after: { paidAmount: nextPaid, status: nextStatus },
      reason: `Abono registrado a ${invoice.invoice_number}`,
    });
    return {
      ...paymentResult.rows[0],
      invoiceStatus: nextStatus,
      remainingBalance: Math.round((Number(invoice.total) - nextPaid) * 100) / 100,
    };
  });
  res.status(201).json(payment);
}));

export default router;
