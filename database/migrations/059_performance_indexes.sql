-- Migration 059: Performance indexes for multi-tenant sales, inventory movements, and audit logs

CREATE INDEX IF NOT EXISTS idx_sales_tenant_warehouse_date
  ON sales(tenant_id, warehouse_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_wh_date
  ON inventory_movements(tenant_id, warehouse_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_date
  ON audit_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_balances_tenant_wh_prod
  ON inventory_balances(tenant_id, warehouse_id, product_id);
