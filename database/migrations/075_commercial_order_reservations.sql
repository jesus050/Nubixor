-- Reservas de inventario creadas al confirmar pedidos comerciales.
CREATE TABLE commercial_order_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  commercial_document_id UUID NOT NULL
    REFERENCES commercial_sales_documents(id) ON DELETE RESTRICT,
  document_item_id UUID NOT NULL
    REFERENCES commercial_sales_document_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  released_at TIMESTAMPTZ,
  release_reason TEXT CHECK(release_reason IN ('INVOICED','CANCELLED','EXPIRED','MANUAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_item_id, warehouse_id),
  CHECK((released_at IS NULL) = (release_reason IS NULL))
);

CREATE INDEX commercial_order_reservations_active
  ON commercial_order_reservations(company_id, product_id, warehouse_id)
  WHERE released_at IS NULL;
