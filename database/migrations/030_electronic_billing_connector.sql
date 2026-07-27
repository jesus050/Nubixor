-- Núcleo desacoplado para integrar un proveedor tecnológico sin acoplar las
-- ventas ni los documentos tributarios a una API específica.

ALTER TABLE electronic_billing_accounts
  ALTER COLUMN encrypted_credentials DROP NOT NULL,
  ADD COLUMN display_name TEXT,
  ADD COLUMN base_url TEXT,
  ADD COLUMN connection_status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(connection_status IN (
      'DRAFT', 'CONFIGURED', 'TESTING', 'READY', 'ERROR', 'DISABLED'
    )),
  ADD COLUMN provider_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN credentials_key_version TEXT,
  ADD COLUMN last_tested_at TIMESTAMPTZ,
  ADD COLUMN last_success_at TIMESTAMPTZ,
  ADD COLUMN last_error TEXT;

UPDATE electronic_billing_accounts
SET display_name = provider_code,
    connection_status = CASE
      WHEN encrypted_credentials IS NOT NULL THEN 'CONFIGURED'
      ELSE 'DRAFT'
    END;

ALTER TABLE electronic_billing_accounts
  ALTER COLUMN display_name SET NOT NULL;

ALTER TABLE electronic_documents
  ADD COLUMN cufe TEXT,
  ADD COLUMN provider_document_id TEXT,
  ADD COLUMN xml_url TEXT,
  ADD COLUMN pdf_url TEXT,
  ADD COLUMN qr_url TEXT,
  ADD COLUMN submitted_at TIMESTAMPTZ,
  ADD COLUMN last_synced_at TIMESTAMPTZ,
  ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0 CHECK(retry_count >= 0);

CREATE TABLE electronic_document_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  electronic_document_id UUID NOT NULL REFERENCES electronic_documents(id)
    ON DELETE RESTRICT,
  billing_account_id UUID NOT NULL REFERENCES electronic_billing_accounts(id)
    ON DELETE RESTRICT,
  attempt_number INTEGER NOT NULL CHECK(attempt_number > 0),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN (
      'QUEUED', 'SENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED',
      'RETRYABLE', 'FAILED', 'CANCELLED'
    )),
  request_hash TEXT,
  payload_snapshot JSONB,
  provider_reference TEXT,
  provider_status TEXT,
  http_status INTEGER,
  response_summary JSONB,
  error_code TEXT,
  error_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(electronic_document_id, attempt_number),
  UNIQUE(billing_account_id, idempotency_key)
);

CREATE INDEX electronic_document_transmissions_queue
  ON electronic_document_transmissions(status, next_attempt_at, queued_at)
  WHERE status IN ('QUEUED', 'RETRYABLE');

CREATE INDEX electronic_document_transmissions_company
  ON electronic_document_transmissions(company_id, queued_at DESC);

CREATE OR REPLACE FUNCTION enforce_transmission_company()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM electronic_documents document
    JOIN electronic_billing_accounts account
      ON account.id = NEW.billing_account_id
     AND account.company_id = document.company_id
    WHERE document.id = NEW.electronic_document_id
      AND document.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'La transmisión mezcla documentos o cuentas de otra empresa.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER electronic_transmission_company_guard
BEFORE INSERT OR UPDATE OF
  company_id, electronic_document_id, billing_account_id
ON electronic_document_transmissions
FOR EACH ROW
EXECUTE FUNCTION enforce_transmission_company();

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, 'billing.manage'
FROM roles role
WHERE role.code IN ('OWNER', 'ADMIN')
ON CONFLICT DO NOTHING;
