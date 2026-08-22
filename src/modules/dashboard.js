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

// El resumen ejecutivo entrega números sueltos de hoy y del mes. Sin serie no
// hay tendencia, y sin tendencia el tablero solo confirma lo que ya se sabía.
router.get('/trends', asyncHandler(async (req, res) => {
  const [daily, monthly, comparison, byBranch] = await Promise.all([
    query(
      `WITH ventas AS (
         SELECT s.id, s.total, s.created_at
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       )
       -- generate_series rellena los días sin ventas: si se omitieran, la
       -- gráfica uniría dos fechas lejanas y dibujaría una tendencia falsa.
       SELECT dia::date day,
              COALESCE(SUM(v.total), 0) total,
              COUNT(v.id)::integer sale_count
       FROM generate_series(
              CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day'
            ) dia
       LEFT JOIN ventas v
         ON v.created_at >= dia AND v.created_at < dia + INTERVAL '1 day'
       GROUP BY dia
       ORDER BY dia`,
      [req.context.tenantId, req.context.branchId],
    ),
    query(
      `WITH ventas AS (
         SELECT s.id, s.total, s.created_at
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       )
       SELECT mes::date month,
              COALESCE(SUM(v.total), 0) total,
              COUNT(v.id)::integer sale_count
       FROM generate_series(
              date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
              date_trunc('month', CURRENT_DATE),
              INTERVAL '1 month'
            ) mes
       LEFT JOIN ventas v
         ON v.created_at >= mes AND v.created_at < mes + INTERVAL '1 month'
       GROUP BY mes
       ORDER BY mes`,
      [req.context.tenantId, req.context.branchId],
    ),
    query(
      // Comparar contra el mismo día de la semana pasada y el mismo mes del año
      // pasado evita el espejismo de medir un lunes contra un sábado.
      `WITH ventas AS (
         SELECT s.total, s.created_at
         FROM sales s
         JOIN cash_sessions cs ON cs.id = s.cash_session_id
         JOIN cash_registers cr ON cr.id = cs.cash_register_id
         WHERE s.tenant_id = $1
           AND s.status = 'COMPLETED'
           AND ($2::uuid IS NULL OR cr.branch_id = $2)
       )
       SELECT
         COALESCE(SUM(total) FILTER (
           WHERE created_at >= CURRENT_DATE
         ), 0) today,
         COALESCE(SUM(total) FILTER (
           WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
             AND created_at < CURRENT_DATE - INTERVAL '6 days'
         ), 0) same_weekday_last_week,
         COALESCE(SUM(total) FILTER (
           WHERE created_at >= date_trunc('month', CURRENT_DATE)
         ), 0) this_month,
         COALESCE(SUM(total) FILTER (
           WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 year'
             AND created_at < date_trunc('month', CURRENT_DATE) - INTERVAL '1 year'
               + (CURRENT_DATE - date_trunc('month', CURRENT_DATE)::date + 1) * INTERVAL '1 day'
         ), 0) same_month_last_year
       FROM ventas`,
      [req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT b.id branch_id, b.name branch_name,
              COALESCE(SUM(s.total) FILTER (WHERE s.created_at >= CURRENT_DATE), 0) today,
              COALESCE(SUM(s.total) FILTER (
                WHERE s.created_at >= date_trunc('month', CURRENT_DATE)
              ), 0) month,
              COUNT(s.id) FILTER (WHERE s.created_at >= CURRENT_DATE)::integer sale_count_today
       FROM branches b
       LEFT JOIN cash_registers cr ON cr.branch_id = b.id
       LEFT JOIN cash_sessions cs ON cs.cash_register_id = cr.id
       LEFT JOIN sales s
         ON s.cash_session_id = cs.id
        AND s.tenant_id = $1
        AND s.status = 'COMPLETED'
       WHERE b.tenant_id = $1
         AND b.active = TRUE
       GROUP BY b.id, b.name
       ORDER BY month DESC, b.name`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    daily: daily.rows,
    monthly: monthly.rows,
    comparison: comparison.rows[0],
    byBranch: byBranch.rows,
  });
}));

// Lo que exige una decisión hoy, junto y arriba. Repartido entre indicadores
// se pierde: un turno sin cerrar o una factura rechazada no son estadística,
// son trabajo pendiente.
router.get('/attention', asyncHandler(async (req, res) => {
  const [shifts, rejected, stock, overdue] = await Promise.all([
    query(
      `SELECT cs.id, cr.name register_name, b.name branch_name, cs.opened_at
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       WHERE cs.tenant_id = $1
         AND cs.status = 'OPEN'
         AND cs.opened_at < CURRENT_DATE
         AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ORDER BY cs.opened_at`,
      [req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT id, document_type, status, created_at
       FROM electronic_documents
       WHERE company_id = $1
         AND status = 'REJECTED'
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.context.tenantId],
    ),
    query(
      `SELECT COUNT(*)::integer total
       FROM inventory_balances ib
       JOIN warehouses w
         ON w.id = ib.warehouse_id AND w.tenant_id = ib.tenant_id
       WHERE ib.tenant_id = $1
         AND ib.on_hand > 0
         AND ib.on_hand - ib.reserved <= 5
         AND ($2::uuid IS NULL OR w.branch_id = $2)`,
      [req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT COUNT(*)::integer total,
              COALESCE(SUM(total - paid_amount), 0) amount
       FROM ar_invoices
       WHERE tenant_id = $1
         AND status IN ('ISSUED','PARTIAL')
         AND due_date < CURRENT_DATE
         AND ($2::uuid IS NULL OR branch_id = $2)`,
      [req.context.tenantId, req.context.branchId],
    ),
  ]);
  res.json({
    openShifts: shifts.rows,
    rejectedDocuments: rejected.rows,
    lowStockCount: stock.rows[0]?.total || 0,
    overdueReceivables: overdue.rows[0] || { total: 0, amount: 0 },
  });
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
