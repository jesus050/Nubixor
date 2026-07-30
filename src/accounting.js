import { AppError } from './shared/errors.js';
import { writeAudit } from './audit.js';

function money(value) {
  const normalized = Math.round(Number(value || 0) * 100) / 100;
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new AppError(
      'El valor contable no es válido.',
      422,
      'INVALID_ACCOUNTING_AMOUNT',
    );
  }
  return normalized;
}

function isoDate(value = new Date()) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function monthBounds(value) {
  const date = isoDate(value);
  const [year, month] = date.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { start, end };
}

async function ensureOpenPeriod(client, tenantId, entryDate) {
  const bounds = monthBounds(entryDate);
  await client.query(
    `INSERT INTO accounting_periods(tenant_id, period_start, period_end)
     VALUES($1,$2,$3)
     ON CONFLICT(tenant_id, period_start, period_end) DO NOTHING`,
    [tenantId, bounds.start, bounds.end],
  );
  const result = await client.query(
    `SELECT id, status
     FROM accounting_periods
     WHERE tenant_id = $1 AND period_start = $2 AND period_end = $3
     FOR UPDATE`,
    [tenantId, bounds.start, bounds.end],
  );
  if (result.rows[0]?.status !== 'OPEN') {
    throw new AppError(
      `El período contable ${bounds.start} a ${bounds.end} no está abierto.`,
      409,
      'ACCOUNTING_PERIOD_CLOSED',
    );
  }
  return result.rows[0];
}

async function mappedAccounts(client, tenantId, purposes) {
  const uniquePurposes = [...new Set(purposes)];
  const result = await client.query(
    `SELECT mapping.purpose, account.id, account.code, account.name,
            account.active, account.allows_posting
     FROM accounting_account_mappings mapping
     JOIN accounting_accounts account
       ON account.id = mapping.account_id
      AND account.tenant_id = mapping.tenant_id
     WHERE mapping.tenant_id = $1
       AND mapping.purpose = ANY($2::text[])`,
    [tenantId, uniquePurposes],
  );
  const accounts = new Map(result.rows.map((row) => [row.purpose, row]));
  const missing = uniquePurposes.filter((purpose) => {
    const account = accounts.get(purpose);
    return !account || !account.active || !account.allows_posting;
  });
  if (missing.length) {
    throw new AppError(
      `Falta configurar una cuenta contable activa para: ${missing.join(', ')}.`,
      409,
      'ACCOUNTING_MAPPING_REQUIRED',
    );
  }
  return accounts;
}

export async function postJournalEntry(client, {
  tenantId,
  entryDate = new Date(),
  sourceType,
  sourceId,
  description,
  createdBy,
  reversalOf = null,
  lines,
}) {
  const normalizedLines = lines
    .map((line) => ({
      ...line,
      debit: money(line.debit),
      credit: money(line.credit),
    }))
    .filter((line) => line.debit > 0 || line.credit > 0);
  if (normalizedLines.length < 2) {
    throw new AppError(
      'El asiento requiere al menos dos líneas con valor.',
      422,
      'ACCOUNTING_LINES_REQUIRED',
    );
  }
  const debit = money(normalizedLines.reduce((sum, line) => sum + line.debit, 0));
  const credit = money(normalizedLines.reduce((sum, line) => sum + line.credit, 0));
  if (debit !== credit || debit <= 0) {
    throw new AppError(
      `El asiento está descuadrado: débitos ${debit}, créditos ${credit}.`,
      422,
      'UNBALANCED_JOURNAL_ENTRY',
    );
  }

  const existing = await client.query(
    `SELECT *
     FROM journal_entries
     WHERE tenant_id = $1 AND source_type = $2 AND source_id = $3`,
    [tenantId, sourceType, String(sourceId)],
  );
  if (existing.rowCount) return existing.rows[0];

  const period = await ensureOpenPeriod(client, tenantId, entryDate);
  const accounts = await mappedAccounts(
    client,
    tenantId,
    normalizedLines.filter((line) => !line.accountId).map((line) => line.purpose),
  );
  const directAccountIds = [
    ...new Set(normalizedLines.map((line) => line.accountId).filter(Boolean)),
  ];
  const directAccounts = directAccountIds.length
    ? await client.query(
        `SELECT id FROM accounting_accounts
         WHERE tenant_id = $1 AND id = ANY($2::uuid[])
           AND active = TRUE AND allows_posting = TRUE`,
        [tenantId, directAccountIds],
      )
    : { rows: [] };
  if (directAccounts.rows.length !== directAccountIds.length) {
    throw new AppError(
      'Una cuenta del asiento no está activa o no pertenece a la empresa.',
      409,
      'ACCOUNTING_ACCOUNT_INVALID',
    );
  }
  await client.query(
    `INSERT INTO accounting_entry_counters(tenant_id)
     VALUES($1)
     ON CONFLICT DO NOTHING`,
    [tenantId],
  );
  const counter = await client.query(
    `UPDATE accounting_entry_counters
     SET next_number = next_number + 1
     WHERE tenant_id = $1
     RETURNING next_number - 1 entry_number`,
    [tenantId],
  );
  const entry = await client.query(
    `INSERT INTO journal_entries(
       tenant_id, period_id, entry_number, entry_date, source_type,
       source_id, description, created_by, reversal_of
     )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      tenantId,
      period.id,
      counter.rows[0].entry_number,
      isoDate(entryDate),
      sourceType,
      String(sourceId),
      description,
      createdBy,
      reversalOf,
    ],
  );
  for (const [index, line] of normalizedLines.entries()) {
    await client.query(
      `INSERT INTO journal_entry_lines(
         tenant_id, journal_entry_id, line_number, account_id, description,
         debit, credit, third_party_type, third_party_id
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        tenantId,
        entry.rows[0].id,
        index + 1,
        line.accountId || accounts.get(line.purpose).id,
        line.description || description,
        line.debit,
        line.credit,
        line.thirdPartyType || null,
        line.thirdPartyId ? String(line.thirdPartyId) : null,
      ],
    );
  }
  const posted = await client.query(
    `UPDATE journal_entries
     SET status = 'POSTED'
     WHERE id = $1 AND tenant_id = $2 AND status = 'DRAFT'
     RETURNING *`,
    [entry.rows[0].id, tenantId],
  );
  await writeAudit(client, {
    tenantId,
    userId: createdBy,
    action: 'accounting.entry_posted',
    entityType: 'journal_entry',
    entityId: posted.rows[0].id,
    after: {
      entryNumber: posted.rows[0].entry_number,
      entryDate: posted.rows[0].entry_date,
      sourceType,
      sourceId: String(sourceId),
      totalDebit: posted.rows[0].total_debit,
      totalCredit: posted.rows[0].total_credit,
      entryHash: posted.rows[0].entry_hash,
    },
    reason: description,
  });
  return posted.rows[0];
}

export async function reverseJournalEntry(client, {
  tenantId,
  entryId,
  entryDate = new Date(),
  reason,
  userId,
}) {
  const originalResult = await client.query(
    `SELECT *
     FROM journal_entries
     WHERE id = $1 AND tenant_id = $2
     FOR SHARE`,
    [entryId, tenantId],
  );
  const original = originalResult.rows[0];
  if (!original || original.status !== 'POSTED') {
    throw new AppError(
      'Solo se puede revertir un asiento contabilizado.',
      409,
      'JOURNAL_ENTRY_NOT_REVERSIBLE',
    );
  }
  const existing = await client.query(
    `SELECT id FROM journal_entries
     WHERE tenant_id = $1 AND reversal_of = $2`,
    [tenantId, entryId],
  );
  if (existing.rowCount) {
    throw new AppError(
      'Este asiento ya tiene un contraasiento.',
      409,
      'JOURNAL_ENTRY_ALREADY_REVERSED',
    );
  }
  const lines = await client.query(
    `SELECT account_id, description, debit, credit,
            third_party_type, third_party_id
     FROM journal_entry_lines
     WHERE journal_entry_id = $1 AND tenant_id = $2
     ORDER BY line_number`,
    [entryId, tenantId],
  );
  const reversed = await postJournalEntry(client, {
    tenantId,
    entryDate,
    sourceType: 'REVERSAL',
    sourceId: original.id,
    description: `Reversión asiento #${original.entry_number}: ${reason}`,
    createdBy: userId,
    reversalOf: original.id,
    lines: lines.rows.map((line) => ({
      accountId: line.account_id,
      description: `Reversión: ${line.description}`,
      debit: line.credit,
      credit: line.debit,
      thirdPartyType: line.third_party_type,
      thirdPartyId: line.third_party_id,
    })),
  });
  await writeAudit(client, {
    tenantId,
    userId,
    action: 'accounting.entry_reversed',
    entityType: 'journal_entry',
    entityId: original.id,
    before: {
      status: original.status,
      entryNumber: original.entry_number,
      totalDebit: original.total_debit,
      totalCredit: original.total_credit,
    },
    after: {
      reversalId: reversed.id,
      reversalNumber: reversed.entry_number,
      reversalDate: reversed.entry_date,
    },
    reason,
  });
  return reversed;
}

function paymentPurpose(method, { registerCash = false } = {}) {
  if (method === 'CASH') return registerCash ? 'CASH_REGISTER' : 'CASH_MAIN';
  return 'BANK';
}

export async function postSaleAccounting(client, { tenantId, saleId, userId }) {
  const [result, tenderResult] = await Promise.all([
    client.query(
    `SELECT sale.id, sale.sequence_number, sale.created_at, sale.payment_method,
            sale.sale_terms, sale.subtotal, sale.tax_total, sale.total,
            sale.customer_id,
            COALESCE(SUM(item.quantity * item.unit_cost), 0) cost_total
     FROM sales sale
     LEFT JOIN sale_items item
       ON item.sale_id = sale.id AND item.tenant_id = sale.company_id
     WHERE sale.id = $1 AND sale.company_id = $2
     GROUP BY sale.id`,
    [saleId, tenantId],
    ),
    client.query(
      `SELECT method, amount, reference
       FROM sale_payment_tenders
       WHERE sale_id = $1 AND seller_company_id = $2
         AND reconciliation_status <> 'REVERSED'
       ORDER BY recorded_at, id`,
      [saleId, tenantId],
    ),
  ]);
  if (!result.rowCount) {
    throw new AppError('No encontramos la venta para contabilizar.', 404, 'SALE_NOT_FOUND');
  }
  const sale = result.rows[0];
  const customerLine = {
    thirdPartyType: sale.customer_id ? 'CUSTOMER' : null,
    thirdPartyId: sale.customer_id,
  };
  const paymentLines = sale.sale_terms === 'CREDIT'
    ? [{
      purpose: 'RECEIVABLES',
      debit: sale.total,
      credit: 0,
      description: 'Cuenta por cobrar originada en venta',
      ...customerLine,
    }]
    : tenderResult.rowCount
      ? tenderResult.rows.map((tender) => ({
        purpose: paymentPurpose(tender.method, { registerCash: true }),
        debit: tender.amount,
        credit: 0,
        description: `Pago recibido por ${tender.method}` +
          (tender.reference ? ` · ${tender.reference}` : ''),
        ...customerLine,
      }))
      : [{
        purpose: paymentPurpose(sale.payment_method, { registerCash: true }),
        debit: sale.total,
        credit: 0,
        description: `Pago recibido por ${sale.payment_method}`,
        ...customerLine,
      }];
  const lines = [
    ...paymentLines,
    {
      purpose: 'SALES_REVENUE',
      debit: 0,
      credit: sale.subtotal,
      description: 'Ingreso por venta',
    },
    {
      purpose: 'OUTPUT_TAX',
      debit: 0,
      credit: sale.tax_total,
      description: 'Impuesto generado en venta',
    },
  ];
  const cost = money(sale.cost_total);
  if (cost > 0) {
    lines.push(
      {
        purpose: 'COST_OF_SALES',
        debit: cost,
        credit: 0,
        description: 'Costo de mercancía vendida',
      },
      {
        purpose: 'INVENTORY',
        debit: 0,
        credit: cost,
        description: 'Salida contable de inventario',
      },
    );
  }
  return postJournalEntry(client, {
    tenantId,
    entryDate: sale.created_at,
    sourceType: 'SALE',
    sourceId: sale.id,
    description: `Venta POS #${sale.sequence_number}`,
    createdBy: userId,
    lines,
  });
}

export async function postSaleReturnAccounting(client, {
  tenantId,
  saleReturnId,
  userId,
}) {
  const result = await client.query(
    `SELECT header.id, header.return_number, header.created_at,
            header.refund_method, header.subtotal, header.tax_total,
            header.total, sale.customer_id,
            COALESCE(SUM(item.quantity * item.unit_cost), 0) cost_total
     FROM sale_returns header
     JOIN sales sale
       ON sale.id = header.sale_id AND sale.company_id = header.company_id
     LEFT JOIN sale_return_items item
       ON item.sale_return_id = header.id AND item.company_id = header.company_id
     WHERE header.id = $1 AND header.company_id = $2
     GROUP BY header.id, sale.customer_id`,
    [saleReturnId, tenantId],
  );
  if (!result.rowCount) {
    throw new AppError(
      'No encontramos la devolución para contabilizar.',
      404,
      'SALE_RETURN_NOT_FOUND',
    );
  }
  const saleReturn = result.rows[0];
  const lines = [
    {
      purpose: 'SALES_REVENUE',
      debit: saleReturn.subtotal,
      credit: 0,
      description: 'Reversión de ingreso por devolución',
    },
    {
      purpose: 'OUTPUT_TAX',
      debit: saleReturn.tax_total,
      credit: 0,
      description: 'Reversión de impuesto por devolución',
    },
    {
      purpose: paymentPurpose(saleReturn.refund_method, { registerCash: true }),
      debit: 0,
      credit: saleReturn.total,
      description: `Reembolso por ${saleReturn.refund_method}`,
      thirdPartyType: saleReturn.customer_id ? 'CUSTOMER' : null,
      thirdPartyId: saleReturn.customer_id,
    },
  ];
  const cost = money(saleReturn.cost_total);
  if (cost > 0) {
    lines.push(
      {
        purpose: 'INVENTORY',
        debit: cost,
        credit: 0,
        description: 'Reintegro contable de inventario',
      },
      {
        purpose: 'COST_OF_SALES',
        debit: 0,
        credit: cost,
        description: 'Reversión del costo de venta',
      },
    );
  }
  return postJournalEntry(client, {
    tenantId,
    entryDate: saleReturn.created_at,
    sourceType: 'SALE_RETURN',
    sourceId: saleReturn.id,
    description: `Devolución ${saleReturn.return_number}`,
    createdBy: userId,
    lines,
  });
}

export async function postCashSessionOpeningAccounting(
  client,
  { tenantId, session, userId },
) {
  const amount = money(session.opening_amount);
  if (amount <= 0) return null;
  return postJournalEntry(client, {
    tenantId,
    entryDate: session.opened_at,
    sourceType: 'CASH_OPEN',
    sourceId: session.id,
    description: 'Traslado de fondo inicial a caja registradora',
    createdBy: userId,
    lines: [
      { purpose: 'CASH_REGISTER', debit: amount, credit: 0 },
      { purpose: 'CASH_MAIN', debit: 0, credit: amount },
    ],
  });
}

export async function postCashMovementAccounting(
  client,
  { tenantId, movement, userId },
) {
  const amount = money(movement.amount);
  const lines = movement.movement_type === 'INCOME'
    ? [
        { purpose: 'CASH_REGISTER', debit: amount, credit: 0 },
        { purpose: 'OTHER_INCOME', debit: 0, credit: amount },
      ]
    : movement.movement_type === 'EXPENSE'
      ? [
          { purpose: 'GENERAL_EXPENSE', debit: amount, credit: 0 },
          { purpose: 'CASH_REGISTER', debit: 0, credit: amount },
        ]
      : [
          { purpose: 'CASH_MAIN', debit: amount, credit: 0 },
          { purpose: 'CASH_REGISTER', debit: 0, credit: amount },
        ];
  return postJournalEntry(client, {
    tenantId,
    entryDate: movement.created_at,
    sourceType: 'CASH_MOVEMENT',
    sourceId: movement.id,
    description: `${movement.category}: ${movement.notes}`,
    createdBy: userId,
    lines,
  });
}

export async function postCashSessionClosingAccounting(
  client,
  { tenantId, session, userId },
) {
  const actual = money(session.closing_amount);
  const difference = Math.round(Number(session.difference || 0) * 100) / 100;
  const lines = [];
  if (difference > 0) {
    lines.push(
      { purpose: 'CASH_REGISTER', debit: difference, credit: 0, description: 'Sobrante de caja' },
      { purpose: 'OTHER_INCOME', debit: 0, credit: difference, description: 'Sobrante de caja' },
    );
  } else if (difference < 0) {
    const shortage = Math.abs(difference);
    lines.push(
      { purpose: 'CASH_OVER_SHORT', debit: shortage, credit: 0, description: 'Faltante de caja' },
      { purpose: 'CASH_REGISTER', debit: 0, credit: shortage, description: 'Faltante de caja' },
    );
  }
  if (actual > 0) {
    lines.push(
      { purpose: 'CASH_MAIN', debit: actual, credit: 0, description: 'Entrega de efectivo al cierre' },
      { purpose: 'CASH_REGISTER', debit: 0, credit: actual, description: 'Cierre de caja registradora' },
    );
  }
  if (!lines.length) return null;
  return postJournalEntry(client, {
    tenantId,
    entryDate: session.closed_at,
    sourceType: 'CASH_CLOSE',
    sourceId: session.id,
    description: session.closing_notes || 'Cierre de turno sin diferencias',
    createdBy: userId,
    lines,
  });
}

export async function postReceivableInvoiceAccounting(
  client,
  { tenantId, invoiceId, userId },
) {
  const result = await client.query(
    `SELECT * FROM ar_invoices WHERE id = $1 AND tenant_id = $2`,
    [invoiceId, tenantId],
  );
  const invoice = result.rows[0];
  if (!invoice) throw new AppError('No encontramos la cuenta por cobrar.', 404, 'AR_NOT_FOUND');
  return postJournalEntry(client, {
    tenantId,
    entryDate: invoice.issue_date,
    sourceType: 'AR_INVOICE',
    sourceId: invoice.id,
    description: `Cuenta por cobrar ${invoice.invoice_number}`,
    createdBy: userId,
    lines: [
      {
        purpose: 'RECEIVABLES',
        debit: invoice.total,
        credit: 0,
        thirdPartyType: 'CUSTOMER',
        thirdPartyId: invoice.customer_id,
      },
      { purpose: 'SALES_REVENUE', debit: 0, credit: invoice.subtotal },
      { purpose: 'OUTPUT_TAX', debit: 0, credit: invoice.tax_total },
    ],
  });
}

export async function postReceivablePaymentAccounting(
  client,
  { tenantId, payment, userId },
) {
  const invoice = await client.query(
    `SELECT customer_id, invoice_number
     FROM ar_invoices WHERE id = $1 AND tenant_id = $2`,
    [payment.invoice_id, tenantId],
  );
  const customer = invoice.rows[0];
  return postJournalEntry(client, {
    tenantId,
    entryDate: payment.payment_date,
    sourceType: 'AR_PAYMENT',
    sourceId: payment.id,
    description: `Recaudo de ${customer.invoice_number}`,
    createdBy: userId,
    lines: [
      {
        purpose: paymentPurpose(payment.payment_method),
        debit: payment.amount,
        credit: 0,
      },
      {
        purpose: 'RECEIVABLES',
        debit: 0,
        credit: payment.amount,
        thirdPartyType: 'CUSTOMER',
        thirdPartyId: customer.customer_id,
      },
    ],
  });
}

export async function postPurchaseReceiptAccounting(
  client,
  { tenantId, receiptId, userId },
) {
  const result = await client.query(
    `SELECT receipt.id, receipt.received_at, receipt.receipt_number,
            COALESCE(SUM(item.quantity * item.unit_cost), 0) inventory_value
     FROM purchase_receipts receipt
     JOIN purchase_receipt_items item
       ON item.receipt_id = receipt.id AND item.tenant_id = receipt.tenant_id
     WHERE receipt.id = $1 AND receipt.tenant_id = $2
     GROUP BY receipt.id`,
    [receiptId, tenantId],
  );
  const receipt = result.rows[0];
  if (!receipt) throw new AppError('No encontramos la recepción.', 404, 'RECEIPT_NOT_FOUND');
  const amount = money(receipt.inventory_value);
  return postJournalEntry(client, {
    tenantId,
    entryDate: receipt.received_at,
    sourceType: 'PURCHASE_RECEIPT',
    sourceId: receipt.id,
    description: `Recepción de inventario ${receipt.receipt_number}`,
    createdBy: userId,
    lines: [
      { purpose: 'INVENTORY', debit: amount, credit: 0 },
      { purpose: 'RECEIVED_NOT_INVOICED', debit: 0, credit: amount },
    ],
  });
}

export async function postPayableInvoiceAccounting(
  client,
  { tenantId, invoiceId, userId },
) {
  const result = await client.query(
    `SELECT * FROM ap_invoices WHERE id = $1 AND tenant_id = $2`,
    [invoiceId, tenantId],
  );
  const invoice = result.rows[0];
  if (!invoice) throw new AppError('No encontramos la cuenta por pagar.', 404, 'AP_NOT_FOUND');
  return postJournalEntry(client, {
    tenantId,
    entryDate: invoice.issue_date,
    sourceType: 'AP_INVOICE',
    sourceId: invoice.id,
    description: `Cuenta por pagar ${invoice.payable_number}`,
    createdBy: userId,
    lines: [
      {
        purpose: invoice.purchase_id ? 'RECEIVED_NOT_INVOICED' : 'GENERAL_EXPENSE',
        debit: invoice.subtotal,
        credit: 0,
        thirdPartyType: 'SUPPLIER',
        thirdPartyId: invoice.supplier_id,
      },
      {
        purpose: 'INPUT_TAX',
        debit: invoice.tax_total,
        credit: 0,
        thirdPartyType: 'SUPPLIER',
        thirdPartyId: invoice.supplier_id,
      },
      {
        purpose: 'PAYABLES',
        debit: 0,
        credit: invoice.total,
        thirdPartyType: 'SUPPLIER',
        thirdPartyId: invoice.supplier_id,
      },
    ],
  });
}

export async function postPayablePaymentAccounting(
  client,
  { tenantId, payment, userId },
) {
  const invoice = await client.query(
    `SELECT supplier_id, payable_number
     FROM ap_invoices WHERE id = $1 AND tenant_id = $2`,
    [payment.invoice_id, tenantId],
  );
  const supplier = invoice.rows[0];
  return postJournalEntry(client, {
    tenantId,
    entryDate: payment.payment_date,
    sourceType: 'AP_PAYMENT',
    sourceId: payment.id,
    description: `Pago de ${supplier.payable_number}`,
    createdBy: userId,
    lines: [
      {
        purpose: 'PAYABLES',
        debit: payment.amount,
        credit: 0,
        thirdPartyType: 'SUPPLIER',
        thirdPartyId: supplier.supplier_id,
      },
      {
        purpose: paymentPurpose(payment.payment_method),
        debit: 0,
        credit: payment.amount,
      },
    ],
  });
}

export async function postBusinessExpenseAccounting(
  client,
  { tenantId, expenseId, userId },
) {
  const result = await client.query(
    `SELECT expense.*, category.accounting_account_id, category.name category_name
     FROM business_expenses expense
     JOIN expense_categories category
       ON category.id = expense.category_id
      AND category.tenant_id = expense.tenant_id
     WHERE expense.id = $1 AND expense.tenant_id = $2`,
    [expenseId, tenantId],
  );
  const expense = result.rows[0];
  if (!expense) {
    throw new AppError(
      'No encontramos el gasto para contabilizar.',
      404,
      'EXPENSE_NOT_FOUND',
    );
  }
  const thirdPartyType = expense.supplier_id ? 'SUPPLIER' : 'BENEFICIARY';
  const thirdPartyId = expense.supplier_id || expense.beneficiary_name;
  return postJournalEntry(client, {
    tenantId,
    entryDate: expense.issue_date,
    sourceType: 'BUSINESS_EXPENSE',
    sourceId: expense.id,
    description: `${expense.expense_number}: ${expense.description}`,
    createdBy: userId,
    lines: [
      {
        accountId: expense.accounting_account_id,
        debit: expense.subtotal,
        credit: 0,
        description: expense.category_name,
        thirdPartyType,
        thirdPartyId,
      },
      {
        purpose: 'INPUT_TAX',
        debit: expense.tax_total,
        credit: 0,
        thirdPartyType,
        thirdPartyId,
      },
      {
        purpose: 'PAYABLES',
        debit: 0,
        credit: expense.total,
        thirdPartyType,
        thirdPartyId,
      },
    ],
  });
}

export async function postBusinessExpensePaymentAccounting(
  client,
  { tenantId, payment, userId },
) {
  const result = await client.query(
    `SELECT expense.expense_number, expense.supplier_id,
            expense.beneficiary_name, bank.accounting_account_id
     FROM business_expenses expense
     LEFT JOIN bank_accounts bank
       ON bank.id = $3 AND bank.tenant_id = expense.tenant_id
     WHERE expense.id = $1 AND expense.tenant_id = $2`,
    [payment.expense_id, tenantId, payment.bank_account_id],
  );
  const expense = result.rows[0];
  if (!expense) {
    throw new AppError(
      'No encontramos el gasto pagado.',
      404,
      'EXPENSE_NOT_FOUND',
    );
  }
  const thirdPartyType = expense.supplier_id ? 'SUPPLIER' : 'BENEFICIARY';
  const thirdPartyId = expense.supplier_id || expense.beneficiary_name;
  const creditLine = payment.payment_method === 'CASH'
    ? { purpose: 'CASH_REGISTER', debit: 0, credit: payment.amount }
    : expense.accounting_account_id
      ? { accountId: expense.accounting_account_id, debit: 0, credit: payment.amount }
      : { purpose: 'BANK', debit: 0, credit: payment.amount };
  return postJournalEntry(client, {
    tenantId,
    entryDate: payment.payment_date,
    sourceType: 'EXPENSE_PAYMENT',
    sourceId: payment.id,
    description: `Pago de gasto ${expense.expense_number}`,
    createdBy: userId,
    lines: [
      {
        purpose: 'PAYABLES',
        debit: payment.amount,
        credit: 0,
        thirdPartyType,
        thirdPartyId,
      },
      creditLine,
    ],
  });
}
