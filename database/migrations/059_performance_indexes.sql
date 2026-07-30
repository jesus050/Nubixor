-- Migration 059: Performance indexes for multi-tenant POS sales, stock movements, and audit logs

CREATE INDEX IF NOT EXISTS idx_pos_sales_company_branch_date
  ON pos_sales(company_id, branch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_company_wh_date
  ON stock_movements(company_id, warehouse_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_company_date
  ON audit_events(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_balances_company_wh_prod
  ON inventory_balances(company_id, warehouse_id, product_id);
