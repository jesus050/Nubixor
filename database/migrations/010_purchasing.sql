ALTER TABLE suppliers
  ADD COLUMN document_type TEXT NOT NULL DEFAULT 'NIT',
  ADD COLUMN email TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN address TEXT,
  ADD COLUMN payment_terms_days INTEGER NOT NULL DEFAULT 0
    CHECK(payment_terms_days >= 0 AND payment_terms_days <= 3650),
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX suppliers_tenant_tax_id
  ON suppliers(tenant_id, tax_id)
  WHERE tax_id IS NOT NULL;
CREATE INDEX suppliers_tenant_name ON suppliers(tenant_id, name);

CREATE SEQUENCE purchase_order_number_seq;
CREATE SEQUENCE purchase_receipt_number_seq;

ALTER TABLE purchases
  ADD COLUMN order_number TEXT,
  ADD COLUMN issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN expected_date DATE,
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'COP',
  ADD COLUMN subtotal NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(subtotal >= 0),
  ADD COLUMN tax_total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_total >= 0),
  ADD COLUMN total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(total >= 0),
  ADD COLUMN received_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE purchases
SET order_number = (
  'OC-' || to_char(issue_date, 'YYYY') || '-' ||
  lpad(nextval('purchase_order_number_seq')::text, 6, '0')
)
WHERE order_number IS NULL;

ALTER TABLE purchases
  ALTER COLUMN order_number SET NOT NULL,
  ALTER COLUMN order_number SET DEFAULT (
    'OC-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('purchase_order_number_seq')::text, 6, '0')
  );

CREATE UNIQUE INDEX purchases_order_number ON purchases(order_number);
CREATE INDEX purchases_tenant_status ON purchases(tenant_id, status, created_at DESC);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT NOT NULL,
  ordered_quantity NUMERIC(18,4) NOT NULL CHECK(ordered_quantity > 0),
  received_quantity NUMERIC(18,4) NOT NULL DEFAULT 0
    CHECK(received_quantity >= 0 AND received_quantity <= ordered_quantity),
  unit_cost NUMERIC(18,4) NOT NULL CHECK(unit_cost >= 0),
  tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK(tax_rate >= 0 AND tax_rate <= 100),
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  line_total NUMERIC(18,2) NOT NULL CHECK(line_total >= 0),
  UNIQUE(purchase_id, product_id)
);

CREATE INDEX purchase_items_purchase ON purchase_items(tenant_id, purchase_id);

CREATE TABLE purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  receipt_number TEXT NOT NULL UNIQUE DEFAULT (
    'REC-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('purchase_receipt_number_seq')::text, 6, '0')
  ),
  notes TEXT,
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX purchase_receipts_purchase
  ON purchase_receipts(tenant_id, purchase_id, received_at DESC);

CREATE TABLE purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE RESTRICT,
  purchase_item_id UUID NOT NULL REFERENCES purchase_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_cost NUMERIC(18,4) NOT NULL CHECK(unit_cost >= 0)
);

CREATE INDEX purchase_receipt_items_receipt
  ON purchase_receipt_items(tenant_id, receipt_id);
