-- Cotizaciones y pedidos no consumen numeración fiscal. Las notas fiscales
-- conservan la relación con el documento electrónico original.

CREATE SEQUENCE billing_quote_number_seq;
CREATE SEQUENCE billing_order_number_seq;

CREATE TABLE commercial_sales_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  source_document_id UUID REFERENCES commercial_sales_documents(id)
    ON DELETE RESTRICT,
  document_type TEXT NOT NULL CHECK(document_type IN ('QUOTE', 'ORDER')),
  document_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN (
    'DRAFT', 'SENT', 'ACCEPTED', 'CONFIRMED', 'READY_TO_INVOICE',
    'CONVERTED', 'INVOICED', 'EXPIRED', 'CANCELLED'
  )),
  valid_until DATE,
  expected_date DATE,
  currency CHAR(3) NOT NULL DEFAULT 'COP',
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_total NUMERIC(18,2) NOT NULL CHECK(tax_total >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total >= 0),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, company_id)
    REFERENCES branches(id, tenant_id),
  UNIQUE(company_id, document_number),
  CHECK(
    (document_type = 'QUOTE' AND valid_until IS NOT NULL) OR
    (document_type = 'ORDER')
  )
);

CREATE TABLE commercial_sales_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  commercial_document_id UUID NOT NULL
    REFERENCES commercial_sales_documents(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sku_snapshot TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK(unit_price >= 0),
  tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK(tax_rate BETWEEN 0 AND 100),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  line_total NUMERIC(18,2) NOT NULL CHECK(line_total >= 0)
);

CREATE INDEX commercial_sales_documents_company
  ON commercial_sales_documents(company_id, document_type, created_at DESC);
CREATE INDEX commercial_sales_document_items_document
  ON commercial_sales_document_items(company_id, commercial_document_id);

CREATE TABLE electronic_adjustment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  original_document_id UUID NOT NULL REFERENCES electronic_documents(id)
    ON DELETE RESTRICT,
  note_type TEXT NOT NULL CHECK(note_type IN ('CREDIT_NOTE', 'DEBIT_NOTE')),
  reason_code TEXT NOT NULL,
  reason TEXT NOT NULL,
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_total NUMERIC(18,2) NOT NULL CHECK(tax_total >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total > 0),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','QUEUED','SUBMITTED','ACCEPTED','REJECTED')),
  provider_reference TEXT,
  cude TEXT,
  qr_url TEXT,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK(retry_count >= 0),
  next_attempt_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX electronic_adjustment_notes_company_status
  ON electronic_adjustment_notes(company_id, status, created_at DESC);

CREATE TABLE electronic_note_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  adjustment_note_id UUID NOT NULL REFERENCES electronic_adjustment_notes(id)
    ON DELETE RESTRICT,
  billing_account_id UUID NOT NULL REFERENCES electronic_billing_accounts(id)
    ON DELETE RESTRICT,
  attempt_number INTEGER NOT NULL CHECK(attempt_number > 0),
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN (
      'QUEUED','SENDING','SUBMITTED','ACCEPTED','REJECTED',
      'RETRYABLE','FAILED','CANCELLED'
    )),
  idempotency_key TEXT NOT NULL,
  payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_summary JSONB,
  error_code TEXT,
  error_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(adjustment_note_id, attempt_number),
  UNIQUE(billing_account_id, idempotency_key)
);

CREATE UNIQUE INDEX electronic_note_one_active_attempt
  ON electronic_note_transmissions(adjustment_note_id)
  WHERE status IN ('QUEUED','SENDING');

CREATE INDEX electronic_note_retry_queue
  ON electronic_note_transmissions(status, next_attempt_at, queued_at)
  WHERE status IN ('QUEUED','RETRYABLE');
