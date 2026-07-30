-- Registro canónico de terceros. Conserva las tablas customers y suppliers
-- como perfiles operativos para no romper Caja, Cartera, Compras ni CxP.

CREATE UNIQUE INDEX IF NOT EXISTS customers_id_tenant_unique
  ON customers(id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_id_tenant_unique
  ON suppliers(id, tenant_id);

CREATE TABLE third_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  party_type TEXT NOT NULL DEFAULT 'ORGANIZATION'
    CHECK(party_type IN ('PERSON','ORGANIZATION')),
  name TEXT NOT NULL,
  trade_name TEXT,
  document_type TEXT NOT NULL DEFAULT 'NIT'
    CHECK(document_type IN ('NIT','CC','CE','PASSPORT','OTHER')),
  document_number TEXT,
  verification_digit TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  municipality_code TEXT,
  notes TEXT,
  is_customer BOOLEAN NOT NULL DEFAULT FALSE,
  is_supplier BOOLEAN NOT NULL DEFAULT FALSE,
  customer_id UUID,
  supplier_id UUID,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(customer_id, tenant_id)
    REFERENCES customers(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(supplier_id, tenant_id)
    REFERENCES suppliers(id, tenant_id) ON DELETE RESTRICT,
  CHECK(is_customer OR is_supplier),
  CHECK((is_customer AND customer_id IS NOT NULL) OR
        (NOT is_customer AND customer_id IS NULL)),
  CHECK((is_supplier AND supplier_id IS NOT NULL) OR
        (NOT is_supplier AND supplier_id IS NULL)),
  UNIQUE(id, tenant_id),
  UNIQUE(customer_id),
  UNIQUE(supplier_id)
);

CREATE UNIQUE INDEX third_parties_tenant_document
  ON third_parties(tenant_id, document_type, document_number)
  WHERE document_number IS NOT NULL;
CREATE INDEX third_parties_tenant_name
  ON third_parties(tenant_id, active DESC, name);
CREATE INDEX third_parties_tenant_roles
  ON third_parties(tenant_id, is_customer, is_supplier);

INSERT INTO third_parties(
  tenant_id, party_type, name, document_type, document_number,
  email, phone, address, is_customer, customer_id, active,
  created_at, updated_at
)
SELECT
  customer.tenant_id,
  CASE WHEN customer.document_type IN ('CC','CE','PASSPORT')
    THEN 'PERSON' ELSE 'ORGANIZATION' END,
  customer.name,
  customer.document_type,
  customer.document_number,
  customer.email,
  customer.phone,
  customer.address,
  TRUE,
  customer.id,
  customer.active,
  customer.created_at,
  customer.updated_at
FROM customers customer;

UPDATE third_parties party
SET is_supplier = TRUE,
    supplier_id = supplier.id,
    name = COALESCE(NULLIF(BTRIM(party.name), ''), supplier.name),
    email = COALESCE(party.email, supplier.email),
    phone = COALESCE(party.phone, supplier.phone),
    address = COALESCE(party.address, supplier.address),
    active = party.active OR supplier.active,
    updated_at = GREATEST(party.updated_at, supplier.updated_at)
FROM suppliers supplier
WHERE party.tenant_id = supplier.tenant_id
  AND party.document_type = COALESCE(NULLIF(UPPER(BTRIM(supplier.document_type)), ''), 'NIT')
  AND party.document_number = supplier.tax_id
  AND supplier.tax_id IS NOT NULL;

INSERT INTO third_parties(
  tenant_id, party_type, name, document_type, document_number,
  email, phone, address, is_supplier, supplier_id, active,
  created_at, updated_at
)
SELECT
  supplier.tenant_id,
  CASE WHEN supplier.document_type IN ('CC','CE','PASSPORT')
    THEN 'PERSON' ELSE 'ORGANIZATION' END,
  supplier.name,
  COALESCE(NULLIF(UPPER(BTRIM(supplier.document_type)), ''), 'NIT'),
  supplier.tax_id,
  supplier.email,
  supplier.phone,
  supplier.address,
  TRUE,
  supplier.id,
  supplier.active,
  supplier.created_at,
  supplier.updated_at
FROM suppliers supplier
WHERE NOT EXISTS (
  SELECT 1
  FROM third_parties party
  WHERE party.supplier_id = supplier.id
);

CREATE OR REPLACE FUNCTION sync_customer_third_party()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  party_id UUID;
BEGIN
  SELECT id INTO party_id
  FROM third_parties
  WHERE customer_id = NEW.id;

  IF party_id IS NULL AND NEW.document_number IS NOT NULL THEN
    SELECT id INTO party_id
    FROM third_parties
    WHERE tenant_id = NEW.tenant_id
      AND document_type = NEW.document_type
      AND document_number = NEW.document_number
    FOR UPDATE;
  END IF;

  IF party_id IS NULL THEN
    INSERT INTO third_parties(
      tenant_id, party_type, name, document_type, document_number,
      email, phone, address, is_customer, customer_id, active
    )
    VALUES(
      NEW.tenant_id,
      CASE WHEN NEW.document_type IN ('CC','CE','PASSPORT')
        THEN 'PERSON' ELSE 'ORGANIZATION' END,
      NEW.name, NEW.document_type, NEW.document_number,
      NEW.email, NEW.phone, NEW.address, TRUE, NEW.id, NEW.active
    );
  ELSE
    UPDATE third_parties
    SET name = NEW.name,
        document_type = NEW.document_type,
        document_number = NEW.document_number,
        email = COALESCE(NEW.email, email),
        phone = COALESCE(NEW.phone, phone),
        address = COALESCE(NEW.address, address),
        is_customer = TRUE,
        customer_id = NEW.id,
        active = NEW.active OR is_supplier,
        updated_at = now()
    WHERE id = party_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_supplier_third_party()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  party_id UUID;
  normalized_document_type TEXT;
BEGIN
  normalized_document_type :=
    COALESCE(NULLIF(UPPER(BTRIM(NEW.document_type)), ''), 'NIT');

  SELECT id INTO party_id
  FROM third_parties
  WHERE supplier_id = NEW.id;

  IF party_id IS NULL AND NEW.tax_id IS NOT NULL THEN
    SELECT id INTO party_id
    FROM third_parties
    WHERE tenant_id = NEW.tenant_id
      AND document_type = normalized_document_type
      AND document_number = NEW.tax_id
    FOR UPDATE;
  END IF;

  IF party_id IS NULL THEN
    INSERT INTO third_parties(
      tenant_id, party_type, name, document_type, document_number,
      email, phone, address, is_supplier, supplier_id, active
    )
    VALUES(
      NEW.tenant_id,
      CASE WHEN normalized_document_type IN ('CC','CE','PASSPORT')
        THEN 'PERSON' ELSE 'ORGANIZATION' END,
      NEW.name, normalized_document_type, NEW.tax_id,
      NEW.email, NEW.phone, NEW.address, TRUE, NEW.id, NEW.active
    );
  ELSE
    UPDATE third_parties
    SET name = NEW.name,
        document_type = normalized_document_type,
        document_number = NEW.tax_id,
        email = COALESCE(NEW.email, email),
        phone = COALESCE(NEW.phone, phone),
        address = COALESCE(NEW.address, address),
        is_supplier = TRUE,
        supplier_id = NEW.id,
        active = NEW.active OR is_customer,
        updated_at = now()
    WHERE id = party_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_sync_third_party
AFTER INSERT OR UPDATE OF
  name, document_type, document_number, email, phone, address, active
ON customers
FOR EACH ROW EXECUTE FUNCTION sync_customer_third_party();

CREATE TRIGGER suppliers_sync_third_party
AFTER INSERT OR UPDATE OF
  name, document_type, tax_id, email, phone, address, active
ON suppliers
FOR EACH ROW EXECUTE FUNCTION sync_supplier_third_party();

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.permission_code
FROM roles role
CROSS JOIN (
  VALUES ('parties.view'), ('parties.manage')
) permission(permission_code)
WHERE role.code IN ('OWNER','ADMIN','OPERATIONS')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, 'parties.view'
FROM roles role
WHERE role.code = 'AUDITOR'
ON CONFLICT DO NOTHING;
