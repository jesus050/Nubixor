-- Inventario especializado: ubicaciones internas, unidades, variantes, lotes,
-- series, reservas, etiquetas, permisos y cierres de valoración.

CREATE UNIQUE INDEX IF NOT EXISTS products_id_tenant_unique
  ON products(id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS warehouses_id_tenant_unique
  ON warehouses(id, tenant_id);

CREATE TABLE units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'UNIT'
    CHECK(category IN ('UNIT','WEIGHT','LENGTH','VOLUME','AREA','TIME','OTHER')),
  dian_code TEXT,
  allows_decimals BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code),
  UNIQUE(id, tenant_id)
);

INSERT INTO units_of_measure(tenant_id, code, name, symbol, category, dian_code, allows_decimals)
SELECT tenant.id, seed.code, seed.name, seed.symbol, seed.category, seed.dian_code, seed.decimals
FROM tenants tenant
CROSS JOIN (
  VALUES
    ('UND','Unidad','und','UNIT','94',FALSE),
    ('CAJA','Caja','cja','UNIT',NULL,FALSE),
    ('PAQ','Paquete','paq','UNIT',NULL,FALSE),
    ('KG','Kilogramo','kg','WEIGHT','KGM',TRUE),
    ('G','Gramo','g','WEIGHT','GRM',TRUE),
    ('M','Metro','m','LENGTH','MTR',TRUE),
    ('L','Litro','l','VOLUME','LTR',TRUE)
) seed(code,name,symbol,category,dian_code,decimals)
ON CONFLICT DO NOTHING;

ALTER TABLE products
  ADD COLUMN base_uom_id UUID,
  ADD COLUMN track_lots BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN track_serials BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN track_expiration BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN warranty_days INTEGER NOT NULL DEFAULT 0 CHECK(warranty_days >= 0),
  ADD COLUMN minimum_stock NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(minimum_stock >= 0),
  ADD COLUMN maximum_stock NUMERIC(18,4) CHECK(maximum_stock IS NULL OR maximum_stock > minimum_stock);

UPDATE products product
SET base_uom_id = unit.id
FROM units_of_measure unit
WHERE unit.tenant_id = product.tenant_id
  AND unit.code = 'UND'
  AND product.base_uom_id IS NULL;

ALTER TABLE products
  ALTER COLUMN base_uom_id SET NOT NULL,
  ADD CONSTRAINT products_base_uom_company_fk
    FOREIGN KEY(base_uom_id, tenant_id)
    REFERENCES units_of_measure(id, tenant_id) ON DELETE RESTRICT;

CREATE TABLE product_unit_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  uom_id UUID NOT NULL,
  conversion_factor NUMERIC(18,6) NOT NULL CHECK(conversion_factor > 0),
  purchase_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sale_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  barcode TEXT,
  price NUMERIC(18,4) CHECK(price IS NULL OR price >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(uom_id, tenant_id)
    REFERENCES units_of_measure(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, product_id, uom_id),
  UNIQUE(tenant_id, barcode),
  UNIQUE(id, tenant_id)
);

ALTER TABLE product_variants
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ALTER COLUMN cost DROP NOT NULL,
  ALTER COLUMN sale_price DROP NOT NULL;

CREATE UNIQUE INDEX product_variants_tenant_barcode_unique
  ON product_variants(tenant_id, barcode)
  WHERE barcode IS NOT NULL;

CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'STORAGE'
    CHECK(zone_type IN (
      'RECEIVING','STORAGE','PICKING','DISPLAY','QUARANTINE',
      'DAMAGED','DISPATCH','RETURNS'
    )),
  aisle TEXT,
  rack TEXT,
  level TEXT,
  position TEXT,
  sellable BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, warehouse_id, code),
  UNIQUE(id, tenant_id)
);

INSERT INTO warehouse_locations(
  tenant_id, warehouse_id, code, name, zone_type, sellable
)
SELECT
  warehouse.tenant_id,
  warehouse.id,
  'GENERAL',
  'Ubicación general',
  CASE warehouse.warehouse_type
    WHEN 'DISPLAY' THEN 'DISPLAY'
    WHEN 'QUARANTINE' THEN 'QUARANTINE'
    WHEN 'DAMAGED' THEN 'DAMAGED'
    WHEN 'TRANSIT' THEN 'DISPATCH'
    ELSE 'STORAGE'
  END,
  warehouse.warehouse_type = 'DISPLAY'
FROM warehouses warehouse
ON CONFLICT DO NOTHING;

CREATE TABLE inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  variant_id UUID,
  warehouse_id UUID NOT NULL,
  location_id UUID,
  lot_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiration_date DATE,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  on_hand NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(on_hand >= 0),
  reserved NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(reserved >= 0 AND reserved <= on_hand),
  unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK(unit_cost >= 0),
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK(status IN ('AVAILABLE','QUARANTINE','BLOCKED','DEPLETED','EXPIRED')),
  supplier_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(variant_id, tenant_id)
    REFERENCES product_variants(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(location_id, tenant_id)
    REFERENCES warehouse_locations(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(supplier_id, tenant_id)
    REFERENCES suppliers(id, tenant_id) ON DELETE RESTRICT,
  CHECK(expiration_date IS NULL OR manufacturing_date IS NULL OR expiration_date >= manufacturing_date),
  UNIQUE(tenant_id, product_id, warehouse_id, lot_number),
  UNIQUE(id, tenant_id)
);

CREATE INDEX inventory_lots_expiration
  ON inventory_lots(tenant_id, status, expiration_date)
  WHERE on_hand > 0;

CREATE TABLE inventory_serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  variant_id UUID,
  warehouse_id UUID NOT NULL,
  location_id UUID,
  lot_id UUID,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK(status IN (
      'AVAILABLE','RESERVED','SOLD','RETURNED','WARRANTY',
      'QUARANTINE','DAMAGED','LOST'
    )),
  warranty_until DATE,
  sale_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(variant_id, tenant_id)
    REFERENCES product_variants(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(location_id, tenant_id)
    REFERENCES warehouse_locations(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(lot_id, tenant_id)
    REFERENCES inventory_lots(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, serial_number),
  UNIQUE(id, tenant_id)
);

CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  variant_id UUID,
  warehouse_id UUID NOT NULL,
  lot_id UUID,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','FULFILLED','RELEASED','EXPIRED')),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  released_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(variant_id, tenant_id)
    REFERENCES product_variants(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(lot_id, tenant_id)
    REFERENCES inventory_lots(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, reference_type, reference_id, product_id, warehouse_id),
  UNIQUE(id, tenant_id)
);

CREATE INDEX inventory_reservations_active
  ON inventory_reservations(tenant_id, warehouse_id, product_id)
  WHERE status = 'ACTIVE';

CREATE TABLE inventory_label_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  variant_id UUID,
  lot_id UUID,
  serial_id UUID,
  label_type TEXT NOT NULL
    CHECK(label_type IN ('PRODUCT','PRICE','LOCATION','LOT','SERIAL')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 1000),
  barcode_value TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','PRINTED','CANCELLED')),
  requested_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  printed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  printed_at TIMESTAMPTZ,
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(variant_id, tenant_id)
    REFERENCES product_variants(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(lot_id, tenant_id)
    REFERENCES inventory_lots(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(serial_id, tenant_id)
    REFERENCES inventory_serial_numbers(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(id, tenant_id)
);

CREATE TABLE warehouse_user_permissions (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_adjust BOOLEAN NOT NULL DEFAULT FALSE,
  can_dispatch BOOLEAN NOT NULL DEFAULT FALSE,
  can_receive BOOLEAN NOT NULL DEFAULT FALSE,
  can_sell BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  PRIMARY KEY(tenant_id, warehouse_id, user_id)
);

CREATE TABLE inventory_valuation_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  closure_date DATE NOT NULL,
  valuation_method TEXT NOT NULL DEFAULT 'WEIGHTED_AVERAGE'
    CHECK(valuation_method IN ('WEIGHTED_AVERAGE','FIFO')),
  total_units NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'FINAL'
    CHECK(status IN ('DRAFT','FINAL','VOID')),
  notes TEXT,
  closed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, closure_date),
  UNIQUE(id, tenant_id)
);

CREATE TABLE inventory_valuation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  closure_id UUID NOT NULL,
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity NUMERIC(18,4) NOT NULL,
  unit_cost NUMERIC(18,4) NOT NULL,
  total_value NUMERIC(18,2) NOT NULL,
  FOREIGN KEY(closure_id, tenant_id)
    REFERENCES inventory_valuation_closures(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(product_id, tenant_id)
    REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id)
    REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION seed_inventory_units_for_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO units_of_measure(
    tenant_id, code, name, symbol, category, dian_code, allows_decimals
  )
  VALUES
    (NEW.id,'UND','Unidad','und','UNIT','94',FALSE),
    (NEW.id,'CAJA','Caja','cja','UNIT',NULL,FALSE),
    (NEW.id,'PAQ','Paquete','paq','UNIT',NULL,FALSE),
    (NEW.id,'KG','Kilogramo','kg','WEIGHT','KGM',TRUE),
    (NEW.id,'M','Metro','m','LENGTH','MTR',TRUE),
    (NEW.id,'L','Litro','l','VOLUME','LTR',TRUE)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_seed_inventory_units
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION seed_inventory_units_for_tenant();

CREATE OR REPLACE FUNCTION assign_default_product_uom()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.base_uom_id IS NULL THEN
    SELECT id
      INTO NEW.base_uom_id
      FROM units_of_measure
     WHERE tenant_id = NEW.tenant_id
       AND code = 'UND'
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_assign_default_uom
BEFORE INSERT ON products
FOR EACH ROW EXECUTE FUNCTION assign_default_product_uom();

CREATE OR REPLACE FUNCTION seed_default_warehouse_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO warehouse_locations(
    tenant_id, warehouse_id, code, name, zone_type, sellable, active
  )
  VALUES (
    NEW.tenant_id,
    NEW.id,
    'GENERAL',
    'Ubicación general',
    CASE
      WHEN NEW.warehouse_type = 'DISPLAY' THEN 'DISPLAY'
      ELSE 'STORAGE'
    END,
    NEW.warehouse_type = 'DISPLAY',
    TRUE
  )
  ON CONFLICT (tenant_id, warehouse_id, code) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER warehouses_seed_default_location
AFTER INSERT ON warehouses
FOR EACH ROW EXECUTE FUNCTION seed_default_warehouse_location();
