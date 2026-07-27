-- SUBFASE A: base relacional para Caja & POS multiempresa.
--
-- Compatibilidad:
-- - `tenants` continúa siendo la tabla física de empresas.
-- - `tenant_id` continúa siendo el alcance de seguridad de la API existente.
-- - Las columnas `company_id`, `owner_company_id` y `seller_company_id`
--   expresan la identidad legal de las operaciones nuevas.

CREATE VIEW companies AS
SELECT id, legal_name, trade_name, tax_id, status, created_at, updated_at
FROM tenants;

COMMENT ON VIEW companies IS
  'Nombre de dominio para tenants. Cada tenant representa una empresa legalmente separada.';

ALTER TABLE branches
  ADD CONSTRAINT branches_id_company_unique UNIQUE(id, tenant_id);

ALTER TABLE warehouses
  ADD CONSTRAINT warehouses_id_company_unique UNIQUE(id, tenant_id),
  ADD CONSTRAINT warehouses_id_company_branch_unique UNIQUE(id, tenant_id, branch_id);

ALTER TABLE tax_categories
  ADD CONSTRAINT tax_categories_id_company_unique UNIQUE(id, tenant_id);

ALTER TABLE products
  ADD COLUMN owner_company_id UUID REFERENCES tenants(id),
  ADD COLUMN seller_company_id UUID REFERENCES tenants(id),
  ADD COLUMN default_warehouse_id UUID,
  ADD COLUMN tax_category_id UUID,
  ADD COLUMN active BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE products product
SET owner_company_id = product.tenant_id,
    seller_company_id = product.tenant_id,
    default_warehouse_id = COALESCE(
      (
        SELECT balance.warehouse_id
        FROM inventory_balances balance
        JOIN warehouses warehouse
          ON warehouse.id = balance.warehouse_id
         AND warehouse.tenant_id = balance.tenant_id
        WHERE balance.tenant_id = product.tenant_id
          AND balance.product_id = product.id
          AND warehouse.active = TRUE
        ORDER BY (balance.on_hand - balance.reserved) DESC, warehouse.id
        LIMIT 1
      ),
      (
        SELECT warehouse.id
        FROM warehouses warehouse
        WHERE warehouse.tenant_id = product.tenant_id
          AND warehouse.active = TRUE
        ORDER BY warehouse.id
        LIMIT 1
      )
    ),
    tax_category_id = product.sales_tax_category_id,
    active = product.deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM warehouses warehouse
        WHERE warehouse.tenant_id = product.tenant_id
          AND warehouse.active = TRUE
      );

ALTER TABLE products
  ALTER COLUMN owner_company_id SET NOT NULL,
  ALTER COLUMN seller_company_id SET NOT NULL,
  ADD CONSTRAINT products_id_legal_identity_unique
    UNIQUE(id, owner_company_id, seller_company_id),
  ADD CONSTRAINT products_default_warehouse_owner_fk
    FOREIGN KEY(default_warehouse_id, owner_company_id)
    REFERENCES warehouses(id, tenant_id),
  ADD CONSTRAINT products_tax_category_seller_fk
    FOREIGN KEY(tax_category_id, seller_company_id)
    REFERENCES tax_categories(id, tenant_id),
  ADD CONSTRAINT products_tax_category_compatibility
    CHECK(tax_category_id IS NOT DISTINCT FROM sales_tax_category_id),
  ADD CONSTRAINT products_reviewed_tax_required
    CHECK(tax_review_status <> 'REVIEWED' OR tax_category_id IS NOT NULL),
  ADD CONSTRAINT products_active_warehouse_required
    CHECK(active = FALSE OR default_warehouse_id IS NOT NULL);

CREATE INDEX products_legal_owner
  ON products(owner_company_id, default_warehouse_id)
  WHERE active = TRUE AND deleted_at IS NULL;

CREATE INDEX products_legal_seller
  ON products(seller_company_id, tax_category_id)
  WHERE active = TRUE AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION sync_product_multi_company_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.owner_company_id := COALESCE(NEW.owner_company_id, NEW.tenant_id);
  NEW.seller_company_id := COALESCE(NEW.seller_company_id, NEW.tenant_id);

  IF TG_OP = 'INSERT' THEN
    NEW.tax_category_id := COALESCE(NEW.tax_category_id, NEW.sales_tax_category_id);
    NEW.sales_tax_category_id := COALESCE(NEW.sales_tax_category_id, NEW.tax_category_id);
  ELSE
    IF NEW.sales_tax_category_id IS DISTINCT FROM OLD.sales_tax_category_id
       AND NEW.tax_category_id IS NOT DISTINCT FROM OLD.tax_category_id THEN
      NEW.tax_category_id := NEW.sales_tax_category_id;
    ELSIF NEW.tax_category_id IS DISTINCT FROM OLD.tax_category_id
       AND NEW.sales_tax_category_id IS NOT DISTINCT FROM OLD.sales_tax_category_id THEN
      NEW.sales_tax_category_id := NEW.tax_category_id;
    END IF;
  END IF;

  IF NEW.default_warehouse_id IS NULL THEN
    SELECT warehouse.id
    INTO NEW.default_warehouse_id
    FROM warehouses warehouse
    WHERE warehouse.tenant_id = NEW.owner_company_id
      AND warehouse.active = TRUE
    ORDER BY warehouse.id
    LIMIT 1;
  END IF;

  IF NEW.default_warehouse_id IS NULL THEN
    NEW.active := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER products_sync_multi_company_identity
BEFORE INSERT OR UPDATE OF
  tenant_id,
  owner_company_id,
  seller_company_id,
  default_warehouse_id,
  sales_tax_category_id,
  tax_category_id,
  active
ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_multi_company_identity();

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_id_company_unique UNIQUE(id, tenant_id);

ALTER TABLE cash_registers
  ADD CONSTRAINT cash_registers_id_unique UNIQUE(id),
  ADD CONSTRAINT cash_registers_id_branch_unique UNIQUE(id, branch_id);

CREATE TABLE cash_register_companies (
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  default_warehouse_id UUID NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(cash_register_id, company_id),
  FOREIGN KEY(default_warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id)
);

INSERT INTO cash_register_companies(
  cash_register_id,
  company_id,
  default_warehouse_id
)
SELECT register.id, register.tenant_id, warehouse.id
FROM cash_registers register
JOIN LATERAL (
  SELECT candidate.id
  FROM warehouses candidate
  WHERE candidate.tenant_id = register.tenant_id
    AND candidate.branch_id = register.branch_id
    AND candidate.active = TRUE
  ORDER BY candidate.id
  LIMIT 1
) warehouse ON TRUE
ON CONFLICT DO NOTHING;

CREATE INDEX cash_register_companies_company
  ON cash_register_companies(company_id, active, cash_register_id);

CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','CLOSED','SUSPENDED')),
  CHECK(
    (status = 'CLOSED' AND closed_at IS NOT NULL)
    OR
    (status <> 'CLOSED' AND closed_at IS NULL)
  ),
  FOREIGN KEY(cash_register_id, branch_id)
    REFERENCES cash_registers(id, branch_id)
);

CREATE UNIQUE INDEX checkout_sessions_one_open_per_register
  ON checkout_sessions(cash_register_id)
  WHERE status = 'OPEN';

CREATE INDEX checkout_sessions_cashier
  ON checkout_sessions(cashier_id, opened_at DESC);

CREATE TABLE cash_session_company_balances (
  checkout_session_id UUID NOT NULL
    REFERENCES checkout_sessions(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  opening_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(opening_amount >= 0),
  cash_sales NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(cash_sales >= 0),
  card_sales NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(card_sales >= 0),
  transfer_sales NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(transfer_sales >= 0),
  other_sales NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(other_sales >= 0),
  refunds NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(refunds >= 0),
  withdrawals NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(withdrawals >= 0),
  closing_amount NUMERIC(18,2) CHECK(closing_amount >= 0),
  PRIMARY KEY(checkout_session_id, company_id)
);

CREATE OR REPLACE FUNCTION enforce_checkout_company_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM checkout_sessions session
    JOIN cash_register_companies register_company
      ON register_company.cash_register_id = session.cash_register_id
     AND register_company.company_id = NEW.company_id
     AND register_company.active = TRUE
    WHERE session.id = NEW.checkout_session_id
  ) THEN
    RAISE EXCEPTION
      'La empresa % no está autorizada para la caja de la sesión %.',
      NEW.company_id,
      NEW.checkout_session_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cash_session_company_authorized
BEFORE INSERT OR UPDATE OF checkout_session_id, company_id
ON cash_session_company_balances
FOR EACH ROW
EXECUTE FUNCTION enforce_checkout_company_authorization();

CREATE TABLE checkout_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id UUID NOT NULL
    REFERENCES checkout_sessions(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN (
      'DRAFT',
      'VALIDATING',
      'PROCESSING',
      'PARTIALLY_INVOICED',
      'COMPLETED',
      'FAILED',
      'REVERSED'
    )),
  idempotency_key TEXT NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(checkout_session_id, idempotency_key)
);

CREATE INDEX checkout_carts_session_status
  ON checkout_carts(checkout_session_id, status, created_at DESC);

CREATE TABLE checkout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_cart_id UUID NOT NULL REFERENCES checkout_carts(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  product_variant_id UUID,
  owner_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  seller_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK(unit_price >= 0),
  discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(discount_amount >= 0),
  tax_category_id UUID NOT NULL,
  tax_rate_snapshot NUMERIC(7,4) NOT NULL
    CHECK(tax_rate_snapshot >= 0 AND tax_rate_snapshot <= 100),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, owner_company_id, seller_company_id)
    REFERENCES products(id, owner_company_id, seller_company_id),
  FOREIGN KEY(product_variant_id, seller_company_id)
    REFERENCES product_variants(id, tenant_id),
  FOREIGN KEY(warehouse_id, owner_company_id)
    REFERENCES warehouses(id, tenant_id),
  FOREIGN KEY(tax_category_id, seller_company_id)
    REFERENCES tax_categories(id, tenant_id),
  CHECK(discount_amount <= unit_price * quantity),
  CHECK(total = subtotal + tax_amount)
);

CREATE INDEX checkout_items_cart_seller
  ON checkout_items(checkout_cart_id, seller_company_id);

CREATE INDEX checkout_items_stock_source
  ON checkout_items(owner_company_id, warehouse_id, product_id);

ALTER TABLE sales
  ADD COLUMN company_id UUID REFERENCES tenants(id),
  ADD COLUMN seller_company_id UUID REFERENCES tenants(id),
  ADD COLUMN checkout_cart_id UUID REFERENCES checkout_carts(id),
  ADD COLUMN idempotency_key TEXT,
  ADD COLUMN billing_resolution_id UUID,
  ADD COLUMN document_type TEXT DEFAULT 'INTERNAL_RECEIPT';

UPDATE sales
SET company_id = tenant_id,
    seller_company_id = tenant_id,
    idempotency_key = 'legacy-sale:' || id::text,
    document_type = 'INTERNAL_RECEIPT';

ALTER TABLE sales
  ALTER COLUMN company_id SET NOT NULL,
  ALTER COLUMN seller_company_id SET NOT NULL,
  ALTER COLUMN document_type SET NOT NULL,
  ADD CONSTRAINT sales_company_seller_match CHECK(company_id = seller_company_id),
  ADD CONSTRAINT sales_id_company_unique UNIQUE(id, company_id),
  ADD CONSTRAINT sales_document_type_check
    CHECK(document_type IN (
      'ELECTRONIC_INVOICE',
      'EQUIVALENT_DOCUMENT',
      'INTERNAL_RECEIPT',
      'OTHER_CONFIGURED_DOCUMENT'
    )),
  ADD CONSTRAINT sales_checkout_company_idempotency_unique
    UNIQUE(checkout_cart_id, company_id, idempotency_key);

CREATE INDEX sales_checkout_cart
  ON sales(checkout_cart_id, company_id)
  WHERE checkout_cart_id IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_sale_multi_company_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.company_id := COALESCE(NEW.company_id, NEW.tenant_id);
  NEW.seller_company_id := COALESCE(NEW.seller_company_id, NEW.company_id);
  NEW.document_type := COALESCE(NEW.document_type, 'INTERNAL_RECEIPT');
  NEW.idempotency_key := COALESCE(NEW.idempotency_key, 'legacy-sale:' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sales_sync_multi_company_identity
BEFORE INSERT OR UPDATE OF
  tenant_id,
  company_id,
  seller_company_id,
  document_type,
  idempotency_key
ON sales
FOR EACH ROW
EXECUTE FUNCTION sync_sale_multi_company_identity();

ALTER TABLE sale_items
  ADD COLUMN owner_company_id UUID REFERENCES tenants(id),
  ADD COLUMN seller_company_id UUID REFERENCES tenants(id),
  ADD COLUMN warehouse_id UUID,
  ADD COLUMN tax_category_id UUID,
  ADD COLUMN discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK(discount_amount >= 0);

UPDATE sale_items item
SET owner_company_id = product.owner_company_id,
    seller_company_id = sale.seller_company_id,
    warehouse_id = sale.warehouse_id,
    tax_category_id = product.tax_category_id
FROM products product, sales sale
WHERE product.id = item.product_id
  AND sale.id = item.sale_id;

ALTER TABLE sale_items
  ALTER COLUMN owner_company_id SET NOT NULL,
  ALTER COLUMN seller_company_id SET NOT NULL,
  ALTER COLUMN warehouse_id SET NOT NULL,
  ADD CONSTRAINT sale_items_sale_seller_fk
    FOREIGN KEY(sale_id, seller_company_id)
    REFERENCES sales(id, company_id),
  ADD CONSTRAINT sale_items_product_identity_fk
    FOREIGN KEY(product_id, owner_company_id, seller_company_id)
    REFERENCES products(id, owner_company_id, seller_company_id),
  ADD CONSTRAINT sale_items_warehouse_owner_fk
    FOREIGN KEY(warehouse_id, owner_company_id)
    REFERENCES warehouses(id, tenant_id),
  ADD CONSTRAINT sale_items_tax_seller_fk
    FOREIGN KEY(tax_category_id, seller_company_id)
    REFERENCES tax_categories(id, tenant_id);

CREATE OR REPLACE FUNCTION sync_sale_item_multi_company_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sale_record RECORD;
  product_record RECORD;
BEGIN
  SELECT company_id, warehouse_id
  INTO sale_record
  FROM sales
  WHERE id = NEW.sale_id;

  SELECT owner_company_id, seller_company_id, tax_category_id
  INTO product_record
  FROM products
  WHERE id = NEW.product_id;

  NEW.owner_company_id := COALESCE(
    NEW.owner_company_id,
    product_record.owner_company_id
  );
  NEW.seller_company_id := COALESCE(
    NEW.seller_company_id,
    sale_record.company_id,
    product_record.seller_company_id
  );
  NEW.warehouse_id := COALESCE(NEW.warehouse_id, sale_record.warehouse_id);
  NEW.tax_category_id := COALESCE(
    NEW.tax_category_id,
    product_record.tax_category_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER sale_items_sync_multi_company_identity
BEFORE INSERT OR UPDATE OF
  sale_id,
  product_id,
  owner_company_id,
  seller_company_id,
  warehouse_id,
  tax_category_id
ON sale_items
FOR EACH ROW
EXECUTE FUNCTION sync_sale_item_multi_company_identity();

ALTER TABLE inventory_movements
  ADD COLUMN company_id UUID REFERENCES tenants(id);

UPDATE inventory_movements movement
SET company_id = product.owner_company_id
FROM products product
WHERE product.id = movement.product_id;

ALTER TABLE inventory_movements
  ALTER COLUMN company_id SET NOT NULL,
  ADD CONSTRAINT inventory_movements_warehouse_company_fk
    FOREIGN KEY(warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id);

CREATE INDEX inventory_movements_company_created
  ON inventory_movements(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION sync_inventory_movement_company()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT owner_company_id
    INTO NEW.company_id
    FROM products
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER inventory_movements_sync_company
BEFORE INSERT OR UPDATE OF product_id, company_id
ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_movement_company();

ALTER TABLE audit_events
  ADD COLUMN company_id UUID REFERENCES tenants(id);

UPDATE audit_events SET company_id = tenant_id;

ALTER TABLE audit_events
  ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX audit_events_company_created
  ON audit_events(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION sync_audit_event_company()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.company_id := COALESCE(NEW.company_id, NEW.tenant_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_events_sync_company
BEFORE INSERT OR UPDATE OF tenant_id, company_id
ON audit_events
FOR EACH ROW
EXECUTE FUNCTION sync_audit_event_company();

CREATE TABLE company_tax_profiles (
  company_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE RESTRICT,
  taxpayer_type TEXT NOT NULL,
  electronic_invoicing_required BOOLEAN NOT NULL DEFAULT FALSE,
  default_document_type TEXT NOT NULL
    CHECK(default_document_type IN (
      'ELECTRONIC_INVOICE',
      'EQUIVALENT_DOCUMENT',
      'INTERNAL_RECEIPT',
      'OTHER_CONFIGURED_DOCUMENT'
    )),
  vat_responsibility TEXT NOT NULL,
  tax_regime TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO company_tax_profiles(
  company_id,
  taxpayer_type,
  electronic_invoicing_required,
  default_document_type,
  vat_responsibility,
  tax_regime
)
SELECT
  tenant.id,
  'PENDING_ACCOUNTING_REVIEW',
  FALSE,
  'INTERNAL_RECEIPT',
  'PENDING_ACCOUNTING_REVIEW',
  'PENDING_ACCOUNTING_REVIEW'
FROM tenants tenant
ON CONFLICT DO NOTHING;

CREATE TABLE electronic_billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  provider_code TEXT NOT NULL,
  environment TEXT NOT NULL CHECK(environment IN ('TEST','PRODUCTION')),
  encrypted_credentials BYTEA NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, provider_code, environment)
);

CREATE TABLE billing_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL,
  prefix TEXT NOT NULL,
  number_from BIGINT NOT NULL CHECK(number_from > 0),
  number_to BIGINT NOT NULL CHECK(number_to >= number_from),
  current_number BIGINT NOT NULL CHECK(current_number >= number_from),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, company_id)
    REFERENCES branches(id, tenant_id),
  CHECK(current_number <= number_to + 1),
  CHECK(valid_until >= valid_from),
  UNIQUE(company_id, prefix, number_from, number_to)
);

ALTER TABLE billing_resolutions
  ADD CONSTRAINT billing_resolutions_id_company_unique UNIQUE(id, company_id);

ALTER TABLE sales
  ADD CONSTRAINT sales_billing_resolution_fk
    FOREIGN KEY(billing_resolution_id, company_id)
    REFERENCES billing_resolutions(id, company_id);

CREATE UNIQUE INDEX billing_resolutions_one_active_prefix
  ON billing_resolutions(company_id, branch_id, prefix)
  WHERE active = TRUE;

CREATE TABLE electronic_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  sale_id UUID NOT NULL,
  billing_resolution_id UUID,
  document_type TEXT NOT NULL
    CHECK(document_type IN (
      'ELECTRONIC_INVOICE',
      'EQUIVALENT_DOCUMENT',
      'INTERNAL_RECEIPT',
      'OTHER_CONFIGURED_DOCUMENT'
    )),
  prefix TEXT,
  document_number BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','SUBMITTED','ACCEPTED','REJECTED','REVERSED')),
  provider_reference TEXT,
  payload_hash TEXT,
  failure_reason TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(sale_id, company_id)
    REFERENCES sales(id, company_id),
  FOREIGN KEY(billing_resolution_id, company_id)
    REFERENCES billing_resolutions(id, company_id),
  UNIQUE(sale_id, document_type),
  UNIQUE(company_id, prefix, document_number)
);

CREATE INDEX electronic_documents_pending
  ON electronic_documents(company_id, status, created_at)
  WHERE status IN ('PENDING','REJECTED');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_cart_id UUID NOT NULL REFERENCES checkout_carts(id) ON DELETE RESTRICT,
  receiving_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  payment_mode TEXT NOT NULL CHECK(payment_mode IN ('GLOBAL','BY_COMPANY')),
  method TEXT NOT NULL CHECK(method IN ('CASH','CARD','TRANSFER','OTHER')),
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  reference TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  UNIQUE(checkout_cart_id, idempotency_key)
);

CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  sale_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  allocated_amount NUMERIC(18,2) NOT NULL CHECK(allocated_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(sale_id, company_id)
    REFERENCES sales(id, company_id),
  UNIQUE(payment_id, sale_id)
);

CREATE INDEX payment_allocations_sale
  ON payment_allocations(company_id, sale_id);

CREATE OR REPLACE FUNCTION validate_payment_allocation_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_payment_id UUID;
  payment_amount NUMERIC(18,2);
  allocated_total NUMERIC(18,2);
  overallocated_sale UUID;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    target_payment_id := COALESCE(NEW.id, OLD.id);
  ELSE
    target_payment_id := COALESCE(NEW.payment_id, OLD.payment_id);
  END IF;

  SELECT amount
  INTO payment_amount
  FROM payments
  WHERE id = target_payment_id;

  IF payment_amount IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO allocated_total
  FROM payment_allocations
  WHERE payment_id = target_payment_id;

  IF allocated_total <> payment_amount THEN
    RAISE EXCEPTION
      'Las asignaciones (%) deben ser iguales al pago (%).',
      allocated_total,
      payment_amount
      USING ERRCODE = '23514';
  END IF;

  SELECT allocation.sale_id
  INTO overallocated_sale
  FROM payment_allocations allocation
  JOIN sales sale
    ON sale.id = allocation.sale_id
   AND sale.company_id = allocation.company_id
  GROUP BY allocation.sale_id, sale.total
  HAVING SUM(allocation.allocated_amount) > sale.total
  LIMIT 1;

  IF overallocated_sale IS NOT NULL THEN
    RAISE EXCEPTION
      'La venta % tiene pagos asignados por encima de su total.',
      overallocated_sale
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER payments_allocations_balance
AFTER INSERT OR UPDATE OF amount
ON payments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_payment_allocation_totals();

CREATE CONSTRAINT TRIGGER payment_allocations_balance
AFTER INSERT OR UPDATE OR DELETE
ON payment_allocations
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_payment_allocation_totals();

CREATE TABLE intercompany_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_cart_id UUID NOT NULL REFERENCES checkout_carts(id) ON DELETE RESTRICT,
  from_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  to_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  settled_amount NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK(settled_amount >= 0 AND settled_amount <= amount),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','PARTIALLY_SETTLED','SETTLED','REVERSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  CHECK(from_company_id <> to_company_id),
  CHECK(
    (status = 'SETTLED' AND settled_amount = amount AND settled_at IS NOT NULL)
    OR
    (status = 'PARTIALLY_SETTLED' AND settled_amount > 0
      AND settled_amount < amount AND settled_at IS NULL)
    OR
    (status IN ('PENDING','REVERSED') AND settled_at IS NULL)
  ),
  UNIQUE(checkout_cart_id, from_company_id, to_company_id)
);

CREATE INDEX intercompany_settlements_pending
  ON intercompany_settlements(from_company_id, to_company_id, status)
  WHERE status IN ('PENDING','PARTIALLY_SETTLED');

CREATE TABLE purchase_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_cart_id UUID NOT NULL UNIQUE
    REFERENCES checkout_carts(id) ON DELETE RESTRICT,
  total_paid NUMERIC(18,2) NOT NULL CHECK(total_paid >= 0),
  document_count INTEGER NOT NULL CHECK(document_count > 0),
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE purchase_summaries IS
  'Resumen comercial consolidado. No sustituye facturas ni documentos tributarios.';

CREATE OR REPLACE FUNCTION validate_checkout_item_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM checkout_carts cart
    JOIN checkout_sessions session ON session.id = cart.checkout_session_id
    JOIN cash_register_companies register_company
      ON register_company.cash_register_id = session.cash_register_id
     AND register_company.company_id = NEW.seller_company_id
     AND register_company.active = TRUE
    WHERE cart.id = NEW.checkout_cart_id
  ) THEN
    RAISE EXCEPTION
      'La empresa vendedora % no está autorizada para esta caja.',
      NEW.seller_company_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER checkout_items_authorized_seller
BEFORE INSERT OR UPDATE OF checkout_cart_id, seller_company_id
ON checkout_items
FOR EACH ROW
EXECUTE FUNCTION validate_checkout_item_authorization();

COMMENT ON COLUMN products.owner_company_id IS
  'Empresa legal propietaria del inventario.';
COMMENT ON COLUMN products.seller_company_id IS
  'Empresa legal que debe emitir el documento de venta.';
COMMENT ON COLUMN products.default_warehouse_id IS
  'Bodega física predeterminada; no determina el tratamiento tributario.';
COMMENT ON COLUMN products.tax_category_id IS
  'Tratamiento tributario configurado para la empresa vendedora.';
COMMENT ON COLUMN electronic_billing_accounts.encrypted_credentials IS
  'Credenciales cifradas; nunca deben enviarse al frontend ni registrarse en logs.';
