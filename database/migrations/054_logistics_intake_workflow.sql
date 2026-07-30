CREATE SEQUENCE logistics_intake_number_seq;

CREATE TABLE logistics_intake_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  branch_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_id UUID REFERENCES purchases(id) ON DELETE RESTRICT,
  supplier_invoice_number TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COUNTING'
    CHECK(status IN ('COUNTING','PRICING','APPROVAL','COMPLETED','REJECTED')),
  notes TEXT,
  received_on DATE NOT NULL DEFAULT CURRENT_DATE,
  counted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  priced_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  count_completed_at TIMESTAMPTZ,
  pricing_completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, batch_number),
  FOREIGN KEY(branch_id, tenant_id)
    REFERENCES branches(id, tenant_id),
  FOREIGN KEY(warehouse_id, tenant_id, branch_id)
    REFERENCES warehouses(id, tenant_id, branch_id)
);

CREATE TABLE logistics_intake_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES logistics_intake_batches(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  expected_quantity NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(expected_quantity >= 0),
  counted_quantity NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(counted_quantity >= 0),
  movement_mode TEXT NOT NULL DEFAULT 'ADD' CHECK(movement_mode IN ('ADD','REPLACE')),
  unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(unit_cost >= 0),
  proposed_price NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(proposed_price >= 0),
  approved_price NUMERIC(18,4) CHECK(approved_price >= 0),
  label_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(label_status IN ('PENDING','PRINTED')),
  print_count INTEGER NOT NULL DEFAULT 0 CHECK(print_count >= 0),
  last_printed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_id, sku)
);

CREATE TABLE logistics_intake_comments (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES logistics_intake_batches(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  comment TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'COMMENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX logistics_batches_work_queue
  ON logistics_intake_batches(tenant_id, status, updated_at DESC);
CREATE INDEX logistics_batches_warehouse
  ON logistics_intake_batches(tenant_id, warehouse_id, received_on DESC);
CREATE INDEX logistics_items_batch
  ON logistics_intake_items(tenant_id, batch_id, created_at);
CREATE INDEX logistics_items_product
  ON logistics_intake_items(tenant_id, product_id, created_at DESC);
CREATE INDEX logistics_comments_batch
  ON logistics_intake_comments(tenant_id, batch_id, created_at DESC);

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.code
FROM roles role
CROSS JOIN (
  VALUES
    ('logistics.view'),
    ('logistics.count'),
    ('logistics.price'),
    ('logistics.approve'),
    ('logistics.labels')
) permission(code)
WHERE role.code IN ('OWNER','ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.code
FROM roles role
CROSS JOIN (
  VALUES
    ('logistics.view'),
    ('logistics.count'),
    ('logistics.price'),
    ('logistics.labels')
) permission(code)
WHERE role.code = 'OPERATIONS'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, 'logistics.view'
FROM roles role
WHERE role.code = 'AUDITOR'
ON CONFLICT DO NOTHING;
