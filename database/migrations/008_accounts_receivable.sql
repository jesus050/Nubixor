CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'NIT'
    CHECK(document_type IN ('NIT','CC','CE','PASSPORT','OTHER')),
  document_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customers_tenant_document
  ON customers(tenant_id, document_type, document_number)
  WHERE document_number IS NOT NULL;
CREATE INDEX customers_tenant_name ON customers(tenant_id, name);

CREATE SEQUENCE ar_invoice_number_seq;

CREATE TABLE ar_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  branch_id UUID REFERENCES branches(id),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT (
    'CXC-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('ar_invoice_number_seq')::text, 6, '0')
  ),
  external_reference TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'COP',
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_total >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total > 0),
  paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK(paid_amount >= 0 AND paid_amount <= total),
  status TEXT NOT NULL DEFAULT 'ISSUED'
    CHECK(status IN ('ISSUED','PARTIAL','PAID','VOID')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(due_date >= issue_date)
);

CREATE INDEX ar_invoices_tenant_status_due
  ON ar_invoices(tenant_id, status, due_date);
CREATE INDEX ar_invoices_customer
  ON ar_invoices(tenant_id, customer_id, created_at DESC);

CREATE TABLE ar_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES ar_invoices(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK(unit_price >= 0),
  tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK(tax_rate >= 0 AND tax_rate <= 100),
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  line_total NUMERIC(18,2) NOT NULL CHECK(line_total >= 0)
);

CREATE INDEX ar_invoice_items_invoice
  ON ar_invoice_items(tenant_id, invoice_id);

CREATE TABLE ar_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES ar_invoices(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL
    CHECK(payment_method IN ('CASH','BANK_TRANSFER','CARD','OTHER')),
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ar_payments_invoice
  ON ar_payments(tenant_id, invoice_id, payment_date DESC, created_at DESC);
