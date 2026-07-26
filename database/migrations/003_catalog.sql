CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE products
  ADD COLUMN category_id UUID REFERENCES categories(id),
  ADD COLUMN brand_id UUID REFERENCES brands(id);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost NUMERIC(18,4) NOT NULL DEFAULT 0,
  sale_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, sku)
);

CREATE INDEX categories_tenant_name ON categories(tenant_id, name);
CREATE INDEX brands_tenant_name ON brands(tenant_id, name);
CREATE INDEX products_catalog_lookup ON products(tenant_id, category_id, brand_id);
CREATE INDEX product_variants_product_lookup ON product_variants(tenant_id, product_id);

