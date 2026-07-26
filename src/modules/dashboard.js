import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';

const router = Router();

router.use(requireTenant);

router.get('/executive', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COALESCE((
         SELECT SUM(total) FROM sales
         WHERE tenant_id = $1
           AND status = 'COMPLETED'
           AND created_at >= CURRENT_DATE
       ), 0) sales_today,
       COALESCE((
         SELECT SUM(total) FROM sales
         WHERE tenant_id = $1
           AND status = 'COMPLETED'
           AND created_at >= date_trunc('month', CURRENT_DATE)
       ), 0) sales_month,
       COALESCE((
         SELECT SUM(si.line_total - (si.unit_cost * si.quantity))
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
         WHERE si.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= date_trunc('month', CURRENT_DATE)
       ), 0) gross_margin_month,
       COALESCE((
         SELECT COUNT(*)
         FROM inventory_balances ib
         WHERE ib.tenant_id = $1
           AND ib.on_hand > 0
           AND ib.on_hand - ib.reserved <= 5
       ), 0)::integer low_stock_balances,
       COALESCE((
         SELECT SUM(
           GREATEST(pi.ordered_quantity - pi.received_quantity, 0) * pi.unit_cost
         )
         FROM purchases p
         JOIN purchase_items pi
           ON pi.purchase_id = p.id AND pi.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1
           AND p.status IN ('ORDERED','PARTIAL')
       ), 0) pending_purchase_value,
       COALESCE((
         SELECT SUM(
           cs.opening_amount
           + COALESCE(sale_totals.cash_sales, 0)
           + COALESCE(movement_totals.income, 0)
           - COALESCE(movement_totals.expense, 0)
           - COALESCE(movement_totals.withdrawal, 0)
         )
         FROM cash_sessions cs
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(total), 0) cash_sales
           FROM sales
           WHERE cash_session_id = cs.id
             AND tenant_id = cs.tenant_id
             AND payment_method = 'CASH'
             AND status = 'COMPLETED'
         ) sale_totals ON TRUE
         LEFT JOIN LATERAL (
           SELECT
             COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
             COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
             COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
           FROM cash_movements
           WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
         ) movement_totals ON TRUE
         WHERE cs.tenant_id = $1 AND cs.status = 'OPEN'
       ), 0) open_cash_position,
       COALESCE((
         SELECT SUM(total - paid_amount)
         FROM ar_invoices
         WHERE tenant_id = $1
           AND status IN ('ISSUED','PARTIAL')
           AND due_date <= CURRENT_DATE + 30
       ), 0) receivables_30_days,
       COALESCE((
         SELECT SUM(total - paid_amount)
         FROM ap_invoices
         WHERE tenant_id = $1
           AND status IN ('ISSUED','PARTIAL')
           AND due_date <= CURRENT_DATE + 30
       ), 0) payables_30_days`,
    [req.context.tenantId],
  );
  const summary = result.rows[0];
  summary.projected_cash_30_days =
    Number(summary.open_cash_position) +
    Number(summary.receivables_30_days) -
    Number(summary.payables_30_days);
  res.json(summary);
}));

export default router;
