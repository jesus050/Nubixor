CREATE TABLE sales_price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code),
  UNIQUE(id, tenant_id)
);

CREATE TABLE sales_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  price_list_id UUID NOT NULL,
  product_id UUID NOT NULL,
  min_quantity NUMERIC(18,4) NOT NULL DEFAULT 1 CHECK(min_quantity > 0),
  unit_price NUMERIC(18,4) NOT NULL CHECK(unit_price >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(price_list_id, tenant_id)
    REFERENCES sales_price_lists(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, price_list_id, product_id, min_quantity)
);

CREATE TABLE sales_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL
    CHECK(discount_type IN ('PERCENT','FIXED_PRICE')),
  discount_value NUMERIC(18,4) NOT NULL CHECK(discount_value >= 0),
  min_quantity NUMERIC(18,4) NOT NULL DEFAULT 1 CHECK(min_quantity > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  CHECK(ends_at > starts_at),
  CHECK(discount_type <> 'PERCENT' OR discount_value <= 100)
);

ALTER TABLE customers
ADD COLUMN sales_price_list_id UUID;

ALTER TABLE customers
ADD CONSTRAINT customers_sales_price_list_same_tenant_fk
FOREIGN KEY(sales_price_list_id, tenant_id)
REFERENCES sales_price_lists(id, tenant_id) ON DELETE RESTRICT;

ALTER TABLE sale_items
ADD COLUMN list_unit_price NUMERIC(18,4),
ADD COLUMN pricing_source TEXT NOT NULL DEFAULT 'BASE'
  CHECK(pricing_source IN ('BASE','PRICE_LIST','PROMOTION')),
ADD COLUMN pricing_label TEXT;

CREATE INDEX sales_product_prices_lookup
  ON sales_product_prices(tenant_id, product_id, price_list_id, min_quantity DESC)
  WHERE active=TRUE;

CREATE INDEX sales_promotions_active_lookup
  ON sales_promotions(tenant_id, product_id, starts_at, ends_at)
  WHERE active=TRUE;

INSERT INTO sales_price_lists(tenant_id,code,name,description,priority)
SELECT tenant.id, seed.code, seed.name, seed.description, seed.priority
FROM tenants tenant
CROSS JOIN (
  VALUES
    ('RETAIL','Detal','Precio normal por unidad',100),
    ('WHOLESALE','Mayorista','Precio especial para compras frecuentes o por volumen',200),
    ('DISTRIBUTOR','Distribuidor','Precio para clientes de gran volumen',300)
) seed(code,name,description,priority)
ON CONFLICT(tenant_id,code) DO NOTHING;

CREATE OR REPLACE FUNCTION ensure_sales_price_lists_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sales_price_lists(tenant_id,code,name,description,priority)
  VALUES
    (NEW.id,'RETAIL','Detal','Precio normal por unidad',100),
    (NEW.id,'WHOLESALE','Mayorista','Precio especial para compras frecuentes o por volumen',200),
    (NEW.id,'DISTRIBUTOR','Distribuidor','Precio para clientes de gran volumen',300)
  ON CONFLICT(tenant_id,code) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_seed_sales_price_lists
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION ensure_sales_price_lists_for_tenant();
