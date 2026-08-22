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
         SELECT COUNT(*)
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= CURRENT_DATE
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0)::integer sales_today_count,
       COALESCE((
         SELECT AVG(s.total)
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= CURRENT_DATE
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0) average_ticket_today,
       COALESCE((
         SELECT SUM(s.total)
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
           AND s.created_at <
             date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
             + EXTRACT(DAY FROM CURRENT_DATE) * INTERVAL '1 day'
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0) sales_previous_month_to_date,
       COALESCE((
         SELECT json_agg(
           json_build_object(
             'date', calendar.day,
             'total', COALESCE((
               SELECT SUM(s.total)
               FROM sales s
               JOIN cash_sessions cs ON cs.id = s.cash_session_id
               JOIN cash_registers cr ON cr.id = cs.cash_register_id
               WHERE s.tenant_id = $1
                 AND s.status = 'COMPLETED'
                 AND s.created_at >= calendar.day
                 AND s.created_at < calendar.day + INTERVAL '1 day'
                 AND ($2::uuid IS NULL OR cr.branch_id = $2)
             ), 0)
           )
           ORDER BY calendar.day
         )
         FROM generate_series(
           CURRENT_DATE - INTERVAL '6 days',
           CURRENT_DATE,
           INTERVAL '1 day'
         ) calendar(day)
       ), '[]'::json) sales_last_7_days,
       -- Los precios del punto de venta son IVA incluido, así que line_total
       -- trae el impuesto dentro. Restarlo es lo que separa el margen del
       -- dinero que solo está de paso hacia la DIAN.
       COALESCE((
         SELECT SUM(si.line_total - si.tax_amount - (si.unit_cost * si.quantity))
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE si.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND s.created_at >= date_trunc('month', CURRENT_DATE)
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ), 0)
       - COALESCE((
         -- Una devolución deshace la venta y su margen; dejarla fuera dejaría el
         -- mes contando utilidad de mercancía que volvió a la bodega.
         SELECT SUM(ri.subtotal - (ri.unit_cost * ri.quantity))
         FROM sale_return_items ri
         JOIN sale_returns r
           ON r.id = ri.sale_return_id AND r.company_id = ri.company_id
         JOIN sales s ON s.id = r.sale_id AND s.company_id = r.company_id
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE ri.company_id = $1
           AND r.status = 'COMPLETED'
           AND r.created_at >= date_trunc('month', CURRENT_DATE)
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
         SELECT SUM(total - paid_amount)
         FROM ar_invoices
         WHERE tenant_id = $1
           AND status IN ('ISSUED','PARTIAL')
           AND due_date < CURRENT_DATE
           AND ($2::uuid IS NULL OR branch_id = $2)
       ), 0) overdue_receivables,
       COALESCE((
         SELECT COUNT(*)
         FROM ar_invoices
         WHERE tenant_id = $1
           AND status IN ('ISSUED','PARTIAL')
           AND due_date < CURRENT_DATE
           AND ($2::uuid IS NULL OR branch_id = $2)
       ), 0)::integer overdue_receivables_count,
       COALESCE((
         SELECT SUM(api.total - api.paid_amount)
         FROM ap_invoices api
         LEFT JOIN purchases p
           ON p.id = api.purchase_id AND p.tenant_id = api.tenant_id
         WHERE api.tenant_id = $1
           AND api.status IN ('ISSUED','PARTIAL')
           AND api.due_date < CURRENT_DATE
           AND ($2::uuid IS NULL OR p.branch_id = $2)
       ), 0) overdue_payables,
       COALESCE((
         SELECT COUNT(*)
         FROM ap_invoices api
         LEFT JOIN purchases p
           ON p.id = api.purchase_id AND p.tenant_id = api.tenant_id
         WHERE api.tenant_id = $1
           AND api.status IN ('ISSUED','PARTIAL')
           AND api.due_date < CURRENT_DATE
           AND ($2::uuid IS NULL OR p.branch_id = $2)
       ), 0)::integer overdue_payables_count,
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

router.get('/onboarding', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       tenant.legal_name,
       tenant.trade_name,
       tenant.tax_id,
       profile.validation_status,
       profile.electronic_invoicing_required,
       profile.default_document_type,
       (SELECT COUNT(*)::integer
          FROM branches
         WHERE tenant_id = tenant.id AND active = TRUE) branch_count,
       (SELECT COUNT(*)::integer
          FROM warehouses
         WHERE tenant_id = tenant.id AND active = TRUE
           AND warehouse_type = 'AVAILABLE') storage_count,
       (SELECT COUNT(*)::integer
          FROM warehouses
         WHERE tenant_id = tenant.id AND active = TRUE
           AND warehouse_type = 'DISPLAY') display_count,
       (SELECT COUNT(*)::integer
          FROM cash_registers
         WHERE tenant_id = tenant.id AND active = TRUE) register_count,
       (SELECT COUNT(*)::integer
          FROM products
         WHERE tenant_id = tenant.id AND deleted_at IS NULL) product_count,
       COALESCE((
         SELECT SUM(on_hand)
           FROM inventory_balances
          WHERE tenant_id = tenant.id
       ), 0) inventory_units,
       (SELECT COUNT(*)::integer
          FROM bank_accounts
         WHERE tenant_id = tenant.id AND active = TRUE) bank_account_count,
       (SELECT COUNT(*)::integer
          FROM tenant_users
         WHERE tenant_id = tenant.id AND status = 'ACTIVE') active_user_count,
       EXISTS(
         SELECT 1
           FROM electronic_billing_accounts
          WHERE company_id = tenant.id
            AND active = TRUE
            AND connection_status = 'READY'
       ) billing_connection_ready,
       EXISTS(
         SELECT 1
           FROM billing_resolutions
          WHERE company_id = tenant.id
            AND active = TRUE
            AND CURRENT_DATE BETWEEN valid_from AND valid_until
            AND current_number <= number_to
       ) billing_resolution_ready,
       (SELECT COUNT(*)::integer
          FROM sales
         WHERE tenant_id = tenant.id AND status = 'COMPLETED') completed_sale_count
     FROM tenants tenant
     LEFT JOIN company_tax_profiles profile ON profile.company_id = tenant.id
     WHERE tenant.id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0] || null);
}));

export default router;
