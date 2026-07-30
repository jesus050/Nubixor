ALTER TABLE products
ADD COLUMN product_kind TEXT NOT NULL DEFAULT 'SIMPLE'
  CHECK(product_kind IN ('SIMPLE','VARIANT_PARENT','VARIANT','COMBO')),
ADD COLUMN parent_product_id UUID,
ADD COLUMN variant_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE products
ADD CONSTRAINT products_parent_same_tenant_fk
FOREIGN KEY(parent_product_id, tenant_id)
REFERENCES products(id, tenant_id) ON DELETE RESTRICT;

CREATE INDEX products_parent_variants
  ON products(tenant_id, parent_product_id, name)
  WHERE parent_product_id IS NOT NULL;

CREATE TABLE product_combo_components (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  combo_product_id UUID NOT NULL,
  component_product_id UUID NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, combo_product_id, component_product_id),
  FOREIGN KEY(combo_product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(component_product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  CHECK(combo_product_id <> component_product_id)
);

CREATE TABLE product_combo_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  combo_product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  component_snapshot JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(combo_product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT
);

CREATE INDEX product_combo_components_component
  ON product_combo_components(tenant_id, component_product_id);
CREATE INDEX product_combo_assemblies_product
  ON product_combo_assemblies(tenant_id, combo_product_id, created_at DESC);
