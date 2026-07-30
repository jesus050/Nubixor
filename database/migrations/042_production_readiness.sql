-- Preparación para operación real: recuperación de acceso, archivos privados y
-- validación tributaria independiente por empresa.

ALTER TABLE user_access_tokens
  DROP CONSTRAINT user_access_tokens_purpose_check,
  ADD CONSTRAINT user_access_tokens_purpose_check
    CHECK(purpose IN ('SET_PASSWORD', 'RESET_PASSWORD')),
  ADD COLUMN requested_ip_hash TEXT,
  ADD COLUMN requested_user_agent TEXT,
  ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED'
    CHECK(delivery_status IN ('NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED')),
  ADD COLUMN delivered_at TIMESTAMPTZ;

CREATE TABLE secure_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK(category IN (
    'RUT', 'TAX', 'ACCOUNTING', 'BANK', 'PURCHASE', 'SALE', 'AUDIT', 'OTHER'
  )),
  original_name TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK(content_type IN (
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
  )),
  byte_size INTEGER NOT NULL CHECK(byte_size > 0 AND byte_size <= 8388608),
  sha256 TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id, tenant_id)
);

CREATE INDEX secure_documents_tenant_created
  ON secure_documents(tenant_id, created_at DESC);

ALTER TABLE company_tax_profiles
  ADD COLUMN validation_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(validation_status IN ('PENDING', 'VALIDATED', 'OBSERVED')),
  ADD COLUMN validation_notes TEXT,
  ADD COLUMN validated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN validated_at TIMESTAMPTZ,
  ADD COLUMN rut_document_id UUID,
  ADD CONSTRAINT company_tax_profile_rut_document_fk
    FOREIGN KEY(rut_document_id, company_id)
    REFERENCES secure_documents(id, tenant_id),
  ADD CONSTRAINT company_tax_profile_validation_check CHECK(
    validation_status = 'PENDING' OR
    (validated_by IS NOT NULL AND validated_at IS NOT NULL
      AND NULLIF(BTRIM(COALESCE(validation_notes, '')), '') IS NOT NULL)
  );

UPDATE product_images
SET public_url = '/api/assets/product-images/' || id::text;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, 'documents.manage'
FROM roles role
WHERE role.code IN ('OWNER', 'ADMIN', 'AUDITOR')
ON CONFLICT DO NOTHING;
