-- Sistema general de medios y evidencias operativas.
-- No guarda binarios en PostgreSQL: solo metadatos y referencias al proveedor.

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  storage_provider TEXT NOT NULL DEFAULT 'local'
    CHECK(storage_provider IN ('local', 's3')),
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL
    CHECK(mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK(size_bytes > 0),
  width INTEGER CHECK(width IS NULL OR width > 0),
  height INTEGER CHECK(height IS NULL OR height > 0),
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, id),
  UNIQUE(company_id, storage_key)
);

CREATE INDEX media_assets_company_created
  ON media_assets(company_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX media_assets_company_hash
  ON media_assets(company_id, sha256)
  WHERE deleted_at IS NULL;

CREATE TABLE media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL CHECK(entity_type IN (
    'PRODUCT',
    'PRODUCT_VARIANT',
    'GOODS_RECEIPT',
    'GOODS_RECEIPT_ITEM',
    'INVENTORY_COUNT',
    'INVENTORY_COUNT_LINE',
    'INVENTORY_ADJUSTMENT',
    'RETURN',
    'TRANSFER',
    'PURCHASE'
  )),
  entity_id UUID NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN (
    'PRIMARY_IMAGE',
    'GALLERY',
    'DAMAGE_EVIDENCE',
    'COUNT_EVIDENCE',
    'RECEIPT_EVIDENCE',
    'DIFFERENCE_EVIDENCE',
    'RETURN_EVIDENCE',
    'GENERAL_EVIDENCE'
  )),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, media_id, entity_type, entity_id, purpose)
);

ALTER TABLE media_links
  ADD CONSTRAINT media_links_same_company_fk
  FOREIGN KEY(company_id, media_id)
  REFERENCES media_assets(company_id, id)
  ON DELETE RESTRICT;

CREATE INDEX media_links_entity_lookup
  ON media_links(company_id, entity_type, entity_id, purpose, created_at DESC);

CREATE UNIQUE INDEX media_links_one_primary_per_entity
  ON media_links(company_id, entity_type, entity_id, purpose)
  WHERE is_primary = TRUE AND purpose = 'PRIMARY_IMAGE';

CREATE TABLE inventory_evidence_policies (
  company_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE RESTRICT,
  require_on_damage BOOLEAN NOT NULL DEFAULT TRUE,
  require_on_receipt_difference BOOLEAN NOT NULL DEFAULT TRUE,
  require_on_manual_adjustment BOOLEAN NOT NULL DEFAULT FALSE,
  require_on_count_difference BOOLEAN NOT NULL DEFAULT FALSE,
  adjustment_threshold_quantity NUMERIC(18,4),
  adjustment_threshold_value NUMERIC(18,2),
  require_supervisor_approval BOOLEAN NOT NULL DEFAULT FALSE,
  require_different_user_for_recount BOOLEAN NOT NULL DEFAULT FALSE,
  blind_count_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.permission_code
FROM roles role
CROSS JOIN (
  VALUES
    ('media.upload'),
    ('media.delete'),
    ('product.image.manage'),
    ('inventory.evidence.view'),
    ('inventory.evidence.upload'),
    ('inventory.adjustment.approve'),
    ('inventory.count.perform'),
    ('inventory.count.recount'),
    ('inventory.count.view_expected_stock')
) permission(permission_code)
WHERE role.code IN ('OWNER', 'ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.permission_code
FROM roles role
CROSS JOIN (
  VALUES
    ('media.upload'),
    ('product.image.manage'),
    ('inventory.evidence.view'),
    ('inventory.evidence.upload'),
    ('inventory.count.perform'),
    ('inventory.count.recount')
) permission(permission_code)
WHERE role.code = 'OPERATIONS'
ON CONFLICT DO NOTHING;
