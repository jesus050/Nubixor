import { closeDatabase, query, withTransaction } from '../src/db.js';
import {
  postCashMovementAccounting,
  postCashSessionClosingAccounting,
  postCashSessionOpeningAccounting,
  postPayableInvoiceAccounting,
  postPayablePaymentAccounting,
  postPurchaseReceiptAccounting,
  postReceivableInvoiceAccounting,
  postReceivablePaymentAccounting,
  postSaleAccounting,
} from '../src/accounting.js';

const candidates = await query(
  `WITH sources AS (
     SELECT company_id tenant_id, 'SALE' source_type, id source_id,
            created_at occurred_at, created_by user_id
     FROM sales WHERE status = 'COMPLETED'
     UNION ALL
     SELECT tenant_id, 'CASH_OPEN', id, opened_at, opened_by
     FROM cash_sessions WHERE opening_amount > 0
     UNION ALL
     SELECT tenant_id, 'CASH_MOVEMENT', id, created_at, created_by
     FROM cash_movements
     UNION ALL
     SELECT tenant_id, 'CASH_CLOSE', id, closed_at, closed_by
     FROM cash_sessions
     WHERE status = 'CLOSED'
       AND (closing_amount > 0 OR COALESCE(difference, 0) <> 0)
     UNION ALL
     SELECT tenant_id, 'AR_INVOICE', id, issue_date::timestamptz, created_by
     FROM ar_invoices WHERE status <> 'VOID'
     UNION ALL
     SELECT tenant_id, 'AR_PAYMENT', id, payment_date::timestamptz, created_by
     FROM ar_payments
     UNION ALL
     SELECT tenant_id, 'PURCHASE_RECEIPT', id, received_at, received_by
     FROM purchase_receipts
     UNION ALL
     SELECT tenant_id, 'AP_INVOICE', id, issue_date::timestamptz, created_by
     FROM ap_invoices WHERE status <> 'VOID'
     UNION ALL
     SELECT tenant_id, 'AP_PAYMENT', id, payment_date::timestamptz, created_by
     FROM ap_payments
   )
   SELECT source.*
   FROM sources source
   LEFT JOIN journal_entries entry
     ON entry.tenant_id = source.tenant_id
    AND entry.source_type = source.source_type
    AND entry.source_id = source.source_id::text
   WHERE entry.id IS NULL
   ORDER BY source.occurred_at, source.source_type, source.source_id`,
);

for (const source of candidates.rows) {
  await withTransaction(async (client) => {
    const common = {
      tenantId: source.tenant_id,
      userId: source.user_id,
    };
    if (source.source_type === 'SALE') {
      await postSaleAccounting(client, { ...common, saleId: source.source_id });
    } else if (source.source_type === 'CASH_OPEN') {
      const session = await client.query(
        `SELECT * FROM cash_sessions WHERE id = $1 AND tenant_id = $2`,
        [source.source_id, source.tenant_id],
      );
      await postCashSessionOpeningAccounting(client, {
        ...common,
        session: session.rows[0],
      });
    } else if (source.source_type === 'CASH_MOVEMENT') {
      const movement = await client.query(
        `SELECT * FROM cash_movements WHERE id = $1 AND tenant_id = $2`,
        [source.source_id, source.tenant_id],
      );
      await postCashMovementAccounting(client, {
        ...common,
        movement: movement.rows[0],
      });
    } else if (source.source_type === 'CASH_CLOSE') {
      const session = await client.query(
        `SELECT * FROM cash_sessions WHERE id = $1 AND tenant_id = $2`,
        [source.source_id, source.tenant_id],
      );
      await postCashSessionClosingAccounting(client, {
        ...common,
        session: session.rows[0],
      });
    } else if (source.source_type === 'AR_INVOICE') {
      await postReceivableInvoiceAccounting(client, {
        ...common,
        invoiceId: source.source_id,
      });
    } else if (source.source_type === 'AR_PAYMENT') {
      const payment = await client.query(
        `SELECT * FROM ar_payments WHERE id = $1 AND tenant_id = $2`,
        [source.source_id, source.tenant_id],
      );
      await postReceivablePaymentAccounting(client, {
        ...common,
        payment: payment.rows[0],
      });
    } else if (source.source_type === 'PURCHASE_RECEIPT') {
      await postPurchaseReceiptAccounting(client, {
        ...common,
        receiptId: source.source_id,
      });
    } else if (source.source_type === 'AP_INVOICE') {
      await postPayableInvoiceAccounting(client, {
        ...common,
        invoiceId: source.source_id,
      });
    } else if (source.source_type === 'AP_PAYMENT') {
      const payment = await client.query(
        `SELECT * FROM ap_payments WHERE id = $1 AND tenant_id = $2`,
        [source.source_id, source.tenant_id],
      );
      await postPayablePaymentAccounting(client, {
        ...common,
        payment: payment.rows[0],
      });
    }
  });
  console.info(`Contabilizado ${source.source_type} ${source.source_id}`);
}

console.info(`Backfill contable completo: ${candidates.rowCount} operaciones.`);
await closeDatabase();
