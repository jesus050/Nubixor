-- Contingencias operativas de facturación. No reemplazan ni simulan una
-- aceptación DIAN: documentan por qué la transmisión estuvo suspendida.

CREATE TABLE electronic_billing_contingencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  billing_account_id UUID REFERENCES electronic_billing_accounts(id)
    ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN', 'CLOSED')),
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  closed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(
    (status = 'OPEN' AND ended_at IS NULL AND closed_by IS NULL) OR
    (status = 'CLOSED' AND ended_at IS NOT NULL AND closed_by IS NOT NULL)
  )
);

CREATE UNIQUE INDEX electronic_billing_one_open_contingency
  ON electronic_billing_contingencies(company_id)
  WHERE status = 'OPEN';

CREATE INDEX electronic_billing_contingencies_company
  ON electronic_billing_contingencies(company_id, started_at DESC);

CREATE UNIQUE INDEX electronic_transmission_one_active_attempt
  ON electronic_document_transmissions(electronic_document_id)
  WHERE status IN ('QUEUED', 'SENDING');
