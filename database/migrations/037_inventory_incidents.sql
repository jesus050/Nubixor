-- Novedades operativas separadas de los ajustes manuales. Cada registro deja
-- evidencia del tipo, ubicación, cantidad y movimientos que afectaron el saldo.

CREATE TABLE inventory_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  source_warehouse_id UUID,
  destination_warehouse_id UUID,
  incident_type TEXT NOT NULL CHECK(incident_type IN (
    'CUSTOMER_RETURN',
    'SUPPLIER_RETURN',
    'DAMAGE',
    'LOSS',
    'QUARANTINE',
    'QUARANTINE_RELEASE'
  )),
  status TEXT NOT NULL DEFAULT 'RESOLVED'
    CHECK(status IN ('OPEN', 'RESOLVED', 'CANCELLED')),
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(unit_cost >= 0),
  reason TEXT NOT NULL,
  reference TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  resolved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, company_id)
    REFERENCES branches(id, tenant_id),
  FOREIGN KEY(source_warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id),
  FOREIGN KEY(destination_warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id)
);

CREATE INDEX inventory_incidents_company_created
  ON inventory_incidents(company_id, created_at DESC);

CREATE INDEX inventory_incidents_product
  ON inventory_incidents(company_id, product_id, created_at DESC);
