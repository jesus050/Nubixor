-- Define cuánto producto debe mantenerse en exhibición y desde qué bodega
-- debe reponerse. La regla solo genera una recomendación; el traslado sigue
-- siendo una operación explícita y auditada.

CREATE TABLE inventory_replenishment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id),
  source_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  display_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  minimum_quantity NUMERIC(18,4) NOT NULL DEFAULT 2
    CHECK(minimum_quantity >= 0),
  maximum_quantity NUMERIC(18,4) NOT NULL DEFAULT 5
    CHECK(maximum_quantity > minimum_quantity),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, product_id, display_warehouse_id),
  CHECK(source_warehouse_id <> display_warehouse_id)
);

CREATE INDEX inventory_replenishment_rules_tenant_active_idx
  ON inventory_replenishment_rules(tenant_id, active, display_warehouse_id);

INSERT INTO inventory_replenishment_rules(
  tenant_id,
  product_id,
  source_warehouse_id,
  display_warehouse_id,
  minimum_quantity,
  maximum_quantity
)
SELECT
  display_balance.tenant_id,
  display_balance.product_id,
  source.id,
  display_balance.warehouse_id,
  2,
  GREATEST(display_balance.on_hand, 5)
FROM inventory_balances display_balance
JOIN warehouses display
  ON display.id = display_balance.warehouse_id
 AND display.tenant_id = display_balance.tenant_id
 AND display.warehouse_type = 'DISPLAY'
JOIN LATERAL (
  SELECT warehouse.id
  FROM warehouses warehouse
  WHERE warehouse.tenant_id = display_balance.tenant_id
    AND warehouse.branch_id = display.branch_id
    AND warehouse.warehouse_type = 'AVAILABLE'
    AND warehouse.active = TRUE
  ORDER BY warehouse.name, warehouse.id
  LIMIT 1
) source ON TRUE
ON CONFLICT(tenant_id, product_id, display_warehouse_id) DO NOTHING;
