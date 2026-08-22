import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { csvCell } from '../shared/csv.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

router.use(requireTenant);

const reportDefinitions = {
  sales: {
    name: 'Ventas y margen',
    filename: 'ventas-margen',
    columns: [
      ['sale_date', 'Fecha', 'dateTime'],
      ['receipt_number', 'Comprobante', 'text'],
      ['branch_name', 'Sucursal', 'text'],
      ['payment_method', 'Medio de pago', 'status'],
      ['receiving_company', 'Cuenta receptora', 'text'],
      ['payment_reference', 'Referencia de pago', 'text'],
      ['units', 'Unidades', 'number'],
      ['revenue', 'Venta', 'currency'],
      ['net_revenue', 'Venta sin IVA', 'currency'],
      ['cost', 'Costo', 'currency'],
      ['margin', 'Margen bruto', 'currency'],
      ['margin_percent', 'Margen %', 'percent'],
    ],
    orderBy: 'sale_date DESC, receipt_number DESC',
    sql: `
      SELECT s.id, s.created_at sale_date,
             'POS-' || LPAD(s.sequence_number::text, 8, '0') receipt_number,
             b.name branch_name, s.payment_method,
             COALESCE(receiver.trade_name, '—') receiving_company,
             COALESCE(payment.reference, '—') payment_reference,
             COALESCE(SUM(si.quantity), 0) units,
             s.total revenue,
             -- Los precios son IVA incluido: s.total es lo que pagó el cliente,
             -- pero el impuesto no es ingreso de la empresa. El margen se mide
             -- contra la venta sin IVA o cuenta como utilidad dinero ajeno.
             s.subtotal net_revenue,
             COALESCE(SUM(si.unit_cost * si.quantity), 0) cost,
             s.subtotal - COALESCE(SUM(si.unit_cost * si.quantity), 0) margin,
             CASE WHEN s.subtotal > 0 THEN
               ((s.subtotal - COALESCE(SUM(si.unit_cost * si.quantity), 0)) / s.subtotal) * 100
             ELSE 0 END margin_percent
      FROM sales s
      JOIN warehouses w ON w.id = s.warehouse_id AND w.tenant_id = s.tenant_id
      JOIN branches b ON b.id = w.branch_id AND b.tenant_id = s.tenant_id
      LEFT JOIN sale_items si ON si.sale_id = s.id AND si.tenant_id = s.tenant_id
      LEFT JOIN sale_payment_records payment ON payment.sale_id = s.id
      LEFT JOIN tenants receiver ON receiver.id = payment.receiving_company_id
      WHERE s.tenant_id = $1
        AND s.status = 'COMPLETED'
        AND ($2::uuid IS NULL OR b.id = $2)
        AND ($3::date IS NULL OR s.created_at >= $3::date)
        AND ($4::date IS NULL OR s.created_at < $4::date + INTERVAL '1 day')
        AND ($5::text IS NULL OR
          ('POS-' || LPAD(s.sequence_number::text, 8, '0')) ILIKE '%' || $5 || '%'
          OR b.name ILIKE '%' || $5 || '%'
          OR s.payment_method ILIKE '%' || $5 || '%')
      GROUP BY s.id, b.name, receiver.trade_name, payment.reference`,
  },
  inventory: {
    name: 'Inventario valorizado',
    filename: 'inventario-valorizado',
    columns: [
      ['sku', 'SKU', 'text'],
      ['product_name', 'Producto', 'text'],
      ['branch_name', 'Sucursal', 'text'],
      ['warehouse_name', 'Bodega', 'text'],
      ['on_hand', 'Existencia', 'number'],
      ['available', 'Disponible', 'number'],
      ['unit_cost', 'Costo unitario', 'currency'],
      ['stock_value', 'Valor inventario', 'currency'],
      ['stock_state', 'Estado', 'status'],
    ],
    orderBy: 'stock_value DESC, product_name',
    sql: `
      SELECT p.id, p.sku, p.name product_name, b.name branch_name,
             w.name warehouse_name, ib.on_hand,
             ib.on_hand - ib.reserved available, p.cost unit_cost,
             ib.on_hand * p.cost stock_value,
             CASE
               WHEN ib.on_hand - ib.reserved <= 0 THEN 'SIN_STOCK'
               WHEN ib.on_hand - ib.reserved <= 5 THEN 'BAJO'
               ELSE 'SALUDABLE'
             END stock_state
      FROM inventory_balances ib
      JOIN products p ON p.id = ib.product_id AND p.tenant_id = ib.tenant_id
      JOIN warehouses w ON w.id = ib.warehouse_id AND w.tenant_id = ib.tenant_id
      JOIN branches b ON b.id = w.branch_id AND b.tenant_id = ib.tenant_id
      WHERE ib.tenant_id = $1
        AND p.deleted_at IS NULL
        AND ($2::uuid IS NULL OR b.id = $2)
        AND COALESCE($3::date, CURRENT_DATE) IS NOT NULL
        AND COALESCE($4::date, CURRENT_DATE) IS NOT NULL
        AND ($5::text IS NULL OR p.sku ILIKE '%' || $5 || '%'
          OR p.name ILIKE '%' || $5 || '%'
          OR w.name ILIKE '%' || $5 || '%'
          OR b.name ILIKE '%' || $5 || '%')`,
  },
  purchases: {
    name: 'Compras y recepciones',
    filename: 'compras-recepciones',
    columns: [
      ['issue_date', 'Fecha', 'date'],
      ['order_number', 'Orden', 'text'],
      ['supplier_name', 'Proveedor', 'text'],
      ['branch_name', 'Sucursal', 'text'],
      ['status', 'Estado', 'status'],
      ['ordered_units', 'Pedidas', 'number'],
      ['received_units', 'Recibidas', 'number'],
      ['pending_units', 'Pendientes', 'number'],
      ['total', 'Total orden', 'currency'],
      ['pending_value', 'Valor pendiente', 'currency'],
    ],
    orderBy: 'issue_date DESC, order_number DESC',
    sql: `
      SELECT p.id, p.issue_date, p.order_number, s.name supplier_name,
             b.name branch_name, p.status,
             COALESCE(SUM(pi.ordered_quantity), 0) ordered_units,
             COALESCE(SUM(pi.received_quantity), 0) received_units,
             COALESCE(SUM(pi.ordered_quantity - pi.received_quantity), 0) pending_units,
             p.total,
             COALESCE(SUM(
               (pi.ordered_quantity - pi.received_quantity) * pi.unit_cost
             ), 0) pending_value
      FROM purchases p
      JOIN suppliers s ON s.id = p.supplier_id AND s.tenant_id = p.tenant_id
      JOIN branches b ON b.id = p.branch_id AND b.tenant_id = p.tenant_id
      LEFT JOIN purchase_items pi ON pi.purchase_id = p.id AND pi.tenant_id = p.tenant_id
      WHERE p.tenant_id = $1
        AND ($2::uuid IS NULL OR b.id = $2)
        AND ($3::date IS NULL OR p.issue_date >= $3::date)
        AND ($4::date IS NULL OR p.issue_date <= $4::date)
        AND ($5::text IS NULL OR p.order_number ILIKE '%' || $5 || '%'
          OR s.name ILIKE '%' || $5 || '%'
          OR b.name ILIKE '%' || $5 || '%'
          OR p.status ILIKE '%' || $5 || '%')
      GROUP BY p.id, s.name, b.name`,
  },
  receivables: {
    name: 'Cartera por edades',
    filename: 'cuentas-por-cobrar',
    columns: [
      ['due_date', 'Vencimiento', 'date'],
      ['invoice_number', 'Factura', 'text'],
      ['customer_name', 'Cliente', 'text'],
      ['branch_name', 'Sucursal', 'text'],
      ['status', 'Estado', 'status'],
      ['total', 'Total', 'currency'],
      ['paid_amount', 'Abonado', 'currency'],
      ['balance', 'Saldo', 'currency'],
      ['days_overdue', 'Días vencida', 'number'],
      ['aging_bucket', 'Edad', 'status'],
    ],
    orderBy: 'due_date, invoice_number',
    sql: `
      SELECT ai.id, ai.due_date, ai.invoice_number, c.name customer_name,
             COALESCE(b.name, 'Sin sucursal') branch_name, ai.status,
             ai.total, ai.paid_amount, ai.total - ai.paid_amount balance,
             GREATEST(CURRENT_DATE - ai.due_date, 0) days_overdue,
             CASE
               WHEN ai.status = 'PAID' THEN 'PAGADA'
               WHEN ai.due_date >= CURRENT_DATE THEN 'VIGENTE'
               WHEN CURRENT_DATE - ai.due_date <= 30 THEN '1_30'
               WHEN CURRENT_DATE - ai.due_date <= 60 THEN '31_60'
               ELSE '61_MAS'
             END aging_bucket
      FROM ar_invoices ai
      JOIN customers c ON c.id = ai.customer_id AND c.tenant_id = ai.tenant_id
      LEFT JOIN branches b ON b.id = ai.branch_id AND b.tenant_id = ai.tenant_id
      WHERE ai.tenant_id = $1
        AND ai.status <> 'VOID'
        AND ($2::uuid IS NULL OR ai.branch_id = $2)
        AND ($3::date IS NULL OR ai.issue_date >= $3::date)
        AND ($4::date IS NULL OR ai.issue_date <= $4::date)
        AND ($5::text IS NULL OR ai.invoice_number ILIKE '%' || $5 || '%'
          OR c.name ILIKE '%' || $5 || '%'
          OR COALESCE(b.name, '') ILIKE '%' || $5 || '%'
          OR ai.status ILIKE '%' || $5 || '%')`,
  },
  payables: {
    name: 'Proveedores por edades',
    filename: 'cuentas-por-pagar',
    columns: [
      ['due_date', 'Vencimiento', 'date'],
      ['payable_number', 'Obligación', 'text'],
      ['supplier_name', 'Proveedor', 'text'],
      ['order_number', 'Orden origen', 'text'],
      ['status', 'Estado', 'status'],
      ['total', 'Total', 'currency'],
      ['paid_amount', 'Pagado', 'currency'],
      ['balance', 'Saldo', 'currency'],
      ['days_overdue', 'Días vencida', 'number'],
      ['aging_bucket', 'Edad', 'status'],
    ],
    orderBy: 'due_date, payable_number',
    sql: `
      SELECT ai.id, ai.due_date, ai.payable_number, s.name supplier_name,
             COALESCE(p.order_number, 'Registro manual') order_number,
             ai.status, ai.total, ai.paid_amount,
             ai.total - ai.paid_amount balance,
             GREATEST(CURRENT_DATE - ai.due_date, 0) days_overdue,
             CASE
               WHEN ai.status = 'PAID' THEN 'PAGADA'
               WHEN ai.due_date >= CURRENT_DATE THEN 'VIGENTE'
               WHEN CURRENT_DATE - ai.due_date <= 30 THEN '1_30'
               WHEN CURRENT_DATE - ai.due_date <= 60 THEN '31_60'
               ELSE '61_MAS'
             END aging_bucket
      FROM ap_invoices ai
      JOIN suppliers s ON s.id = ai.supplier_id AND s.tenant_id = ai.tenant_id
      LEFT JOIN purchases p ON p.id = ai.purchase_id AND p.tenant_id = ai.tenant_id
      WHERE ai.tenant_id = $1
        AND ai.status <> 'VOID'
        AND ($2::uuid IS NULL OR p.branch_id = $2)
        AND ($3::date IS NULL OR ai.issue_date >= $3::date)
        AND ($4::date IS NULL OR ai.issue_date <= $4::date)
        AND ($5::text IS NULL OR ai.payable_number ILIKE '%' || $5 || '%'
          OR COALESCE(ai.supplier_invoice_number, '') ILIKE '%' || $5 || '%'
          OR s.name ILIKE '%' || $5 || '%'
          OR COALESCE(p.order_number, '') ILIKE '%' || $5 || '%'
          OR ai.status ILIKE '%' || $5 || '%')`,
  },
  cash_closures: {
    name: 'Cierres detallados de caja',
    filename: 'cierres-caja',
    columns: [
      ['opened_at', 'Apertura', 'dateTime'], ['closed_at', 'Cierre', 'dateTime'],
      ['register_name', 'Caja', 'text'], ['branch_name', 'Sucursal', 'text'],
      ['opened_by_name', 'Abrió', 'text'], ['closed_by_name', 'Cerró', 'text'],
      ['status', 'Estado', 'status'], ['sale_count', 'Ventas', 'number'],
      ['sales_total', 'Ventas total', 'currency'],
      ['manual_income', 'Ingresos manuales', 'currency'],
      ['manual_expenses', 'Gastos y retiros', 'currency'],
      ['expected_cash', 'Efectivo esperado', 'currency'],
      ['closing_amount', 'Efectivo contado', 'currency'],
      ['difference', 'Diferencia', 'currency'],
    ],
    orderBy: 'opened_at DESC',
    sql: `
      SELECT cs.id, cs.opened_at, cs.closed_at, cr.name register_name,
             b.name branch_name,
             COALESCE(opener.full_name, opener.email, '—') opened_by_name,
             COALESCE(closer.full_name, closer.email, '—') closed_by_name,
             cs.status, COALESCE(sales.sale_count, 0)::integer sale_count,
             COALESCE(sales.sales_total, 0) sales_total,
             COALESCE(movements.manual_income, 0) manual_income,
             COALESCE(movements.manual_expenses, 0) manual_expenses,
             cs.expected_cash, cs.closing_amount, cs.difference
      FROM cash_sessions cs
      JOIN cash_registers cr ON cr.id = cs.cash_register_id AND cr.tenant_id = cs.tenant_id
      JOIN branches b ON b.id = cr.branch_id AND b.tenant_id = cs.tenant_id
      LEFT JOIN users opener ON opener.id = cs.opened_by
      LEFT JOIN users closer ON closer.id = cs.closed_by
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer sale_count, COALESCE(SUM(total), 0) sales_total
        FROM sales
        WHERE tenant_id = cs.tenant_id AND cash_session_id = cs.id AND status = 'COMPLETED'
      ) sales ON TRUE
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) manual_income,
               COALESCE(SUM(amount) FILTER (WHERE movement_type IN ('EXPENSE', 'WITHDRAWAL')), 0) manual_expenses
        FROM cash_movements
        WHERE tenant_id = cs.tenant_id AND cash_session_id = cs.id
      ) movements ON TRUE
      WHERE cs.tenant_id = $1
        AND ($2::uuid IS NULL OR b.id = $2)
        AND ($3::date IS NULL OR cs.opened_at >= $3::date)
        AND ($4::date IS NULL OR cs.opened_at < $4::date + INTERVAL '1 day')
        AND ($5::text IS NULL OR cr.name ILIKE '%' || $5 || '%' OR b.name ILIKE '%' || $5 || '%' OR cs.status ILIKE '%' || $5 || '%')`,
  },
  rotation: {
    name: 'Rotación de mercancía',
    filename: 'rotacion-mercancia',
    columns: [
      ['sku', 'SKU', 'text'], ['product_name', 'Producto', 'text'],
      ['branch_name', 'Sucursal', 'text'], ['warehouse_name', 'Bodega', 'text'],
      ['units_sold', 'Unidades vendidas', 'number'], ['current_stock', 'Existencia actual', 'number'],
      ['rotation_times', 'Rotación (veces)', 'number'], ['revenue', 'Ventas generadas', 'currency'],
    ],
    orderBy: 'rotation_times DESC NULLS LAST, units_sold DESC, product_name',
    sql: `
      WITH sold AS (
        SELECT si.product_id, s.warehouse_id, SUM(si.quantity) units_sold, SUM(si.line_total) revenue
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id AND si.tenant_id = s.tenant_id
        WHERE s.tenant_id = $1 AND s.status = 'COMPLETED'
          AND ($3::date IS NULL OR s.created_at >= $3::date)
          AND ($4::date IS NULL OR s.created_at < $4::date + INTERVAL '1 day')
        GROUP BY si.product_id, s.warehouse_id
      )
      SELECT p.sku, p.name product_name, b.name branch_name, w.name warehouse_name,
             sold.units_sold, COALESCE(ib.on_hand - ib.reserved, 0) current_stock,
             ROUND((sold.units_sold / NULLIF(ib.on_hand - ib.reserved, 0))::numeric, 2) rotation_times,
             sold.revenue
      FROM sold
      JOIN products p ON p.id = sold.product_id AND p.tenant_id = $1 AND p.deleted_at IS NULL
      JOIN warehouses w ON w.id = sold.warehouse_id AND w.tenant_id = $1
      JOIN branches b ON b.id = w.branch_id AND b.tenant_id = $1
      LEFT JOIN inventory_balances ib ON ib.product_id = sold.product_id AND ib.warehouse_id = sold.warehouse_id AND ib.tenant_id = $1
      WHERE ($2::uuid IS NULL OR b.id = $2)
        AND ($5::text IS NULL OR p.sku ILIKE '%' || $5 || '%' OR p.name ILIKE '%' || $5 || '%')`,
  },
};

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(`El filtro supera ${maxLength} caracteres.`, 422, 'REPORT_FILTER_TOO_LONG');
  }
  return normalized;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function parseReportRequest(req) {
  const definition = reportDefinitions[req.params.type];
  if (!definition) {
    throw new AppError('El tipo de reporte no es válido.', 422, 'INVALID_REPORT_TYPE');
  }
  const dateFrom = cleanText(req.query.dateFrom, 10);
  const dateTo = cleanText(req.query.dateTo, 10);
  if ((dateFrom && !validDate(dateFrom)) || (dateTo && !validDate(dateTo))) {
    throw new AppError('Las fechas deben usar el formato AAAA-MM-DD.', 422, 'INVALID_REPORT_DATE');
  }
  if (dateFrom && dateTo && dateTo < dateFrom) {
    throw new AppError('La fecha final no puede ser anterior a la inicial.', 422, 'INVALID_REPORT_RANGE');
  }
  const branchId = cleanText(req.query.branchId, 36);
  if (branchId && !UUID_PATTERN.test(branchId)) {
    throw new AppError('La sucursal debe tener un UUID válido.', 422, 'INVALID_REPORT_BRANCH');
  }
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 50);
  if (!Number.isInteger(page) || page < 1 ||
      !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
    throw new AppError('La paginación del reporte no es válida.', 422, 'INVALID_REPORT_PAGINATION');
  }
  return {
    definition,
    filters: {
      branchId: req.context.branchId || branchId,
      dateFrom,
      dateTo,
      q: cleanText(req.query.q, 120),
      page,
      pageSize,
    },
  };
}

function reportValues(req, filters) {
  return [
    req.context.tenantId,
    filters.branchId,
    filters.dateFrom,
    filters.dateTo,
    filters.q,
  ];
}

router.get('/overview', asyncHandler(async (req, res) => {
  const branchId = req.context.branchId ||
    (UUID_PATTERN.test(req.query.branchId || '') ? req.query.branchId : null);
  if (req.query.branchId && !UUID_PATTERN.test(req.query.branchId)) {
    throw new AppError('La sucursal debe tener un UUID válido.', 422, 'INVALID_REPORT_BRANCH');
  }
  const result = await query(
    `SELECT
       COALESCE((
         SELECT SUM(s.total)
         FROM sales s
         JOIN warehouses w ON w.id = s.warehouse_id AND w.tenant_id = s.tenant_id
         WHERE s.tenant_id = $1 AND s.status = 'COMPLETED'
           AND s.created_at >= date_trunc('month', CURRENT_DATE)
           AND ($2::uuid IS NULL OR w.branch_id = $2)
       ), 0) sales_month,
       COALESCE((
         SELECT SUM(ib.on_hand * p.cost)
         FROM inventory_balances ib
         JOIN products p ON p.id = ib.product_id AND p.tenant_id = ib.tenant_id
         JOIN warehouses w ON w.id = ib.warehouse_id AND w.tenant_id = ib.tenant_id
         WHERE ib.tenant_id = $1 AND p.deleted_at IS NULL
           AND ($2::uuid IS NULL OR w.branch_id = $2)
       ), 0) inventory_value,
       COALESCE((
         SELECT SUM((pi.ordered_quantity - pi.received_quantity) * pi.unit_cost)
         FROM purchases p
         JOIN purchase_items pi ON pi.purchase_id = p.id AND pi.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1 AND p.status IN ('ORDERED','PARTIAL')
           AND ($2::uuid IS NULL OR p.branch_id = $2)
       ), 0) pending_purchases,
       COALESCE((
         SELECT SUM(total - paid_amount)
         FROM ar_invoices
         WHERE tenant_id = $1 AND status IN ('ISSUED','PARTIAL')
           AND ($2::uuid IS NULL OR branch_id = $2)
       ), 0) receivables,
       COALESCE((
         SELECT SUM(ai.total - ai.paid_amount)
         FROM ap_invoices ai
         LEFT JOIN purchases p ON p.id = ai.purchase_id AND p.tenant_id = ai.tenant_id
         WHERE ai.tenant_id = $1 AND ai.status IN ('ISSUED','PARTIAL')
           AND ($2::uuid IS NULL OR p.branch_id = $2)
       ), 0) payables`,
    [req.context.tenantId, branchId],
  );
  res.json(result.rows[0]);
}));

router.get('/facets', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, name, code
     FROM branches
     WHERE tenant_id = $1 AND active = TRUE
       AND ($2::uuid IS NULL OR id = $2)
     ORDER BY name`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json({
    reports: Object.entries(reportDefinitions).map(([code, definition]) => ({
      code,
      name: definition.name,
    })),
    branches: result.rows,
    branchLocked: Boolean(req.context.branchId),
  });
}));

router.get('/:type/export.csv', asyncHandler(async (req, res) => {
  const { definition, filters } = parseReportRequest(req);
  const result = await query(
    `WITH report_rows AS (${definition.sql})
     SELECT * FROM report_rows
     ORDER BY ${definition.orderBy}
     LIMIT 5000`,
    reportValues(req, filters),
  );
  const headings = definition.columns.map(([, label]) => label);
  const lines = [
    headings.map(csvCell).join(','),
    ...result.rows.map((row) =>
      definition.columns.map(([key]) => csvCell(row[key])).join(',')),
  ];
  const filename =
    `megasuite-${definition.filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  res
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${filename}"`)
    .send(`\uFEFF${lines.join('\n')}`);
}));

router.get('/:type', asyncHandler(async (req, res) => {
  const { definition, filters } = parseReportRequest(req);
  const offset = (filters.page - 1) * filters.pageSize;
  const result = await query(
    `WITH report_rows AS (${definition.sql})
     SELECT report_rows.*, COUNT(*) OVER()::integer total_rows
     FROM report_rows
     ORDER BY ${definition.orderBy}
     LIMIT $6 OFFSET $7`,
    [...reportValues(req, filters), filters.pageSize, offset],
  );
  const total = result.rows[0]?.total_rows || 0;
  const items = result.rows.map(({ total_rows: _totalRows, ...row }) => row);
  res.json({
    report: { name: definition.name, columns: definition.columns },
    items,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  });
}));

export { parseReportRequest };
export default router;
