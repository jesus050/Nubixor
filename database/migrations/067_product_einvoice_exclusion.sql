BEGIN;

-- La política comercial ya distingue documentos electrónicos e internos. Esta
-- bandera hace explícita la decisión en el catálogo para el POS y para la
-- auditoría, sin alterar productos existentes.
ALTER TABLE products
  ADD COLUMN exclude_from_einvoice BOOLEAN NOT NULL DEFAULT FALSE;

-- Los artículos que ya usaban la remisión interna se consideran excluidos.
UPDATE products
SET exclude_from_einvoice = TRUE
WHERE billing_policy = 'INTERNAL_RECEIPT';

CREATE INDEX products_tenant_einvoice_exclusion_idx
  ON products(tenant_id, exclude_from_einvoice)
  WHERE deleted_at IS NULL;

COMMIT;
