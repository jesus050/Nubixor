-- Descuentos manuales aplicados en Caja: siempre quedan trazables.
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS manual_discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK (manual_discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS manual_discount_reason TEXT;

CREATE INDEX IF NOT EXISTS sales_manual_discount_audit
  ON sales(tenant_id, created_at DESC)
  WHERE manual_discount_amount > 0;
