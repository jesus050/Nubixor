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
         SELECT SUM(s.total)
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= CURRENT_DATE
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0) sales_today,
       COALESCE((
         SELECT SUM(s.total)
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= date_trunc('month', CURRENT_DATE)
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0) sales_month,
       COALESCE((
         SELECT SUM(si.line_total - (si.unit_cost * si.quantity))
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE si.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= date_trunc('month', CURRENT_DATE)
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0) gross_margin_month,
       COALESCE((
         SELECT COUNT(*)
         FROM inventory_balances ib
         JOIN warehouses w
           ON w.id = ib.warehouse_id AND w.tenant_id = ib.tenant_id
         WHERE ib.tenant_id = $1
           AND ib.on_hand > 0
           AND ib.on_hand - ib.reserved <= 5
           AND ($2::uuid IS NULL OR w.branch_id = $2)
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
           AND ($2::uuid IS NULL OR p.branch_id = $2)
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
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
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
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0) open_cash_position,
       COALESCE((
         SELECT SUM(total - paid_amount)
         FROM ar_invoices
         WHERE tenant_id = $1
           AND status IN ('ISSUED','PARTIAL')
           AND due_date <= CURRENT_DATE + 30
           AND ($2::uuid IS NULL OR branch_id = $2)
       ), 0) receivables_30_days,
       COALESCE((
         SELECT SUM(api.total - api.paid_amount)
         FROM ap_invoices api
         LEFT JOIN purchases p
           ON p.id = api.purchase_id AND p.tenant_id = api.tenant_id
         WHERE api.tenant_id = $1
           AND api.status IN ('ISSUED','PARTIAL')
           AND api.due_date <= CURRENT_DATE + 30
           AND ($2::uuid IS NULL OR p.branch_id = $2)
       ), 0) payables_30_days`,
    [req.context.tenantId, req.context.branchId],
  );
  const summary = result.rows[0];
  summary.projected_cash_30_days =
    Number(summary.open_cash_position) +
    Number(summary.receivables_30_days) -
    Number(summary.payables_30_days);
  res.json(summary);
}));

export default router;
