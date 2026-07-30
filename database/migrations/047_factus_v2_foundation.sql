-- Configuración explícita para Factus API V2. Ningún código o rango del
-- proveedor se presume: todos deben quedar asociados a una empresa.

ALTER TABLE billing_resolutions
  ADD COLUMN provider_numbering_range_id BIGINT,
  ADD COLUMN provider_document_code TEXT,
  ADD COLUMN provider_synced_at TIMESTAMPTZ,
  ADD COLUMN provider_snapshot JSONB;

CREATE UNIQUE INDEX billing_resolutions_provider_range_company
  ON billing_resolutions(company_id, provider_numbering_range_id)
  WHERE provider_numbering_range_id IS NOT NULL;

ALTER TABLE products
  ADD COLUMN electronic_unit_measure_code TEXT,
  ADD COLUMN electronic_standard_code TEXT;

ALTER TABLE customers
  ADD COLUMN electronic_identification_code TEXT,
  ADD COLUMN electronic_legal_organization_code TEXT,
  ADD COLUMN electronic_tribute_code TEXT,
  ADD COLUMN municipality_code TEXT,
  ADD COLUMN country_code TEXT;

CREATE TABLE electronic_billing_reference_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  provider_code TEXT NOT NULL,
  environment TEXT NOT NULL CHECK(environment IN ('TEST','PRODUCTION')),
  catalog_type TEXT NOT NULL CHECK(catalog_type IN (
    'PAYMENT_FORM', 'PAYMENT_METHOD', 'DOCUMENT_TYPE', 'OPERATION_TYPE',
    'IDENTIFICATION_DOCUMENT', 'LEGAL_ORGANIZATION', 'TRIBUTE',
    'TAX', 'UNIT_MEASURE', 'STANDARD_CODE', 'MUNICIPALITY', 'COUNTRY'
  )),
  internal_code TEXT NOT NULL,
  provider_value TEXT NOT NULL,
  provider_label TEXT,
  source_url TEXT NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, provider_code, environment, catalog_type, internal_code)
);

CREATE INDEX electronic_billing_reference_mappings_company
  ON electronic_billing_reference_mappings(company_id, provider_code, environment);
