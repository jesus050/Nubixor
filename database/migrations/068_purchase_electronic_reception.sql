-- Facturas de proveedor recibidas a través del proveedor tecnológico.
-- Los identificadores tributarios se guardan por empresa y nunca se comparten.
CREATE TABLE purchase_electronic_receptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  billing_account_id UUID NOT NULL REFERENCES electronic_billing_accounts(id) ON DELETE RESTRICT,
  provider_code TEXT NOT NULL,
  track_id TEXT NOT NULL,
  provider_bill_id TEXT,
  status TEXT NOT NULL DEFAULT 'UPLOADED'
    CHECK (status IN ('UPLOADED', 'FAILED', 'EVENT_SENT', 'EVENT_REJECTED')),
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, purchase_id),
  UNIQUE(tenant_id, track_id)
);

CREATE INDEX purchase_electronic_receptions_tenant_status
  ON purchase_electronic_receptions(tenant_id, status, updated_at DESC);

CREATE TABLE purchase_electronic_reception_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  reception_id UUID NOT NULL REFERENCES purchase_electronic_receptions(id) ON DELETE RESTRICT,
  event_type CHAR(3) NOT NULL CHECK (event_type IN ('030', '031', '032', '033')),
  request_payload JSONB NOT NULL,
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('SENT', 'REJECTED')),
  error_message TEXT,
  emitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  emitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX purchase_electronic_reception_events_reception
  ON purchase_electronic_reception_events(tenant_id, reception_id, emitted_at DESC);
