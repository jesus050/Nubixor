-- Traslados que requieren despacho y aceptación. Mientras no se reciben, las
-- unidades permanecen en una ubicación TRANSIT y no están disponibles.

CREATE TABLE inventory_transfer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  source_warehouse_id UUID NOT NULL,
  transit_warehouse_id UUID NOT NULL,
  destination_warehouse_id UUID NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(unit_cost >= 0),
  status TEXT NOT NULL DEFAULT 'DISPATCHED'
    CHECK(status IN ('DISPATCHED', 'RECEIVED', 'CANCELLED')),
  reason TEXT NOT NULL,
  dispatch_reference TEXT,
  reception_notes TEXT,
  dispatched_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  received_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  cancelled_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(source_warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id),
  FOREIGN KEY(transit_warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id),
  FOREIGN KEY(destination_warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id),
  CHECK(source_warehouse_id <> destination_warehouse_id)
);

CREATE INDEX inventory_transfer_orders_company_status
  ON inventory_transfer_orders(company_id, status, dispatched_at DESC);
