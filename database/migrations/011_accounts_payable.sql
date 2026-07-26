CREATE SEQUENCE ap_invoice_number_seq;

CREATE TABLE ap_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  purchase_id UUID REFERENCES purchases(id),
  payable_number TEXT NOT NULL UNIQUE DEFAULT (
    'CXP-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('ap_invoice_number_seq')::text, 6, '0')
  ),
  supplier_invoice_number TEXT,
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

CREATE UNIQUE INDEX ap_invoices_purchase_once
  ON ap_invoices(tenant_id, purchase_id)
  WHERE purchase_id IS NOT NULL AND status <> 'VOID';
CREATE INDEX ap_invoices_tenant_status_due
  ON ap_invoices(tenant_id, status, due_date);
CREATE INDEX ap_invoices_supplier
  ON ap_invoices(tenant_id, supplier_id, created_at DESC);

CREATE TABLE ap_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES ap_invoices(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL
    CHECK(payment_method IN ('CASH','BANK_TRANSFER','CARD','CHECK','OTHER')),
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ap_payments_invoice
  ON ap_payments(tenant_id, invoice_id, payment_date DESC, created_at DESC);
