CREATE SEQUENCE inventory_count_number_seq;

CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  count_number TEXT NOT NULL UNIQUE DEFAULT (
    'CNT-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('inventory_count_number_seq')::text, 6, '0')
  ),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','IN_PROGRESS','REVIEW','COMPLETED','CANCELLED')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  started_by UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX inventory_counts_tenant_status
  ON inventory_counts(tenant_id, status, created_at DESC);
CREATE UNIQUE INDEX inventory_counts_one_active_warehouse
  ON inventory_counts(tenant_id, warehouse_id)
  WHERE status IN ('DRAFT','IN_PROGRESS','REVIEW');

CREATE TABLE inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id),
  sku_snapshot TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  expected_quantity NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(expected_quantity >= 0),
  counted_quantity NUMERIC(18,4) CHECK(counted_quantity >= 0),
  notes TEXT,
  counted_by UUID REFERENCES users(id),
  counted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(count_id, product_id)
);

CREATE INDEX inventory_count_items_count
  ON inventory_count_items(tenant_id, count_id, name_snapshot);
