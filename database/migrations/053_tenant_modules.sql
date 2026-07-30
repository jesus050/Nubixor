CREATE TABLE tenant_modules (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  module_code TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, module_code),
  CHECK(module_code ~ '^[A-Z][A-Z0-9_]{1,39}$')
);

INSERT INTO tenant_modules(tenant_id, module_code, enabled, enabled_at)
SELECT id, 'LOGISTICS', TRUE, now()
FROM tenants
ON CONFLICT(tenant_id, module_code) DO NOTHING;

CREATE OR REPLACE FUNCTION seed_tenant_modules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO tenant_modules(tenant_id, module_code, enabled, enabled_at)
  VALUES(NEW.id, 'LOGISTICS', TRUE, now())
  ON CONFLICT(tenant_id, module_code) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_seed_optional_modules
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION seed_tenant_modules();
