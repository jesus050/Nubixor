CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number BIGSERIAL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'VOIDED')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_total NUMERIC(18,2) NOT NULL CHECK(tax_total >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total >= 0),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sale_id UUID NOT NULL REFERENCES sales(id),
  product_id UUID NOT NULL REFERENCES products(id),
  sku_snapshot TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK(unit_price >= 0),
  unit_cost NUMERIC(18,4) NOT NULL CHECK(unit_cost >= 0),
  tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(18,2) NOT NULL CHECK(line_total >= 0)
);

CREATE INDEX sales_tenant_created ON sales(tenant_id, created_at DESC);
CREATE INDEX sale_items_sale ON sale_items(tenant_id, sale_id);

INSERT INTO inventory_movements(
  id, tenant_id, product_id, warehouse_id, movement_type,
  quantity, unit_cost, reference_type, reference_id, reason
)
SELECT
  seed.movement_id,
  '00000000-0000-0000-0000-000000000001',
  seed.product_id,
  '20000000-0000-0000-0000-000000000001',
  'ADJUSTMENT_IN',
  seed.quantity,
  seed.unit_cost,
  'DEMO_SEED',
  '007_pos_sales',
  'Inventario inicial de demostración para probar el POS'
FROM (
  VALUES
    ('80000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, 25::numeric, 42000::numeric),
    ('80000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, 40::numeric, 18500::numeric),
    ('80000000-0000-0000-0000-000000000003'::uuid, '60000000-0000-0000-0000-000000000003'::uuid, 60::numeric, 9500::numeric)
) seed(movement_id, product_id, quantity, unit_cost)
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_balances ib
  WHERE ib.tenant_id = '00000000-0000-0000-0000-000000000001'
    AND ib.product_id = seed.product_id
    AND ib.warehouse_id = '20000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

INSERT INTO inventory_balances(tenant_id, product_id, warehouse_id, on_hand)
VALUES
('00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 25),
('00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 40),
('00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 60)
ON CONFLICT DO NOTHING;

