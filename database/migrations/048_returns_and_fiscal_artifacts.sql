-- Devoluciones de Caja y expediente fiscal duradero.
-- Una devolución nunca modifica las líneas originales: registra líneas
-- negativas independientes, reintegra inventario y conserva el reembolso.

ALTER TABLE secure_documents
  DROP CONSTRAINT secure_documents_content_type_check,
  ADD CONSTRAINT secure_documents_content_type_check CHECK(content_type IN (
    'application/pdf', 'application/xml', 'text/xml',
    'image/jpeg', 'image/png', 'image/webp'
  ));

ALTER TABLE electronic_documents
  ADD COLUMN pdf_document_id UUID REFERENCES secure_documents(id) ON DELETE RESTRICT,
  ADD COLUMN xml_document_id UUID REFERENCES secure_documents(id) ON DELETE RESTRICT,
  ADD COLUMN artifacts_synced_at TIMESTAMPTZ;

ALTER TABLE electronic_adjustment_notes
  ADD COLUMN pdf_document_id UUID REFERENCES secure_documents(id) ON DELETE RESTRICT,
  ADD COLUMN xml_document_id UUID REFERENCES secure_documents(id) ON DELETE RESTRICT,
  ADD COLUMN artifacts_synced_at TIMESTAMPTZ;

ALTER TABLE sales
  ADD COLUMN returned_total NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK(returned_total >= 0 AND returned_total <= total),
  ADD COLUMN return_status TEXT NOT NULL DEFAULT 'NONE'
    CHECK(return_status IN ('NONE', 'PARTIAL', 'FULL'));

CREATE SEQUENCE sale_return_number_seq;

CREATE TABLE sale_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  sale_id UUID NOT NULL,
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE RESTRICT,
  return_number TEXT NOT NULL DEFAULT (
    'DEV-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('sale_return_number_seq')::text, 6, '0')
  ),
  status TEXT NOT NULL DEFAULT 'COMPLETED'
    CHECK(status IN ('COMPLETED', 'VOIDED')),
  refund_method TEXT NOT NULL
    CHECK(refund_method IN ('CASH', 'CARD', 'TRANSFER')),
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_total NUMERIC(18,2) NOT NULL CHECK(tax_total >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total > 0),
  refund_reference TEXT,
  bank_account_id UUID,
  reason TEXT NOT NULL,
  electronic_adjustment_note_id UUID
    REFERENCES electronic_adjustment_notes(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(sale_id, company_id) REFERENCES sales(id, company_id),
  FOREIGN KEY(bank_account_id, company_id)
    REFERENCES bank_accounts(id, tenant_id),
  UNIQUE(company_id, return_number),
  UNIQUE(company_id, idempotency_key),
  CHECK(
    (refund_method = 'TRANSFER'
      AND bank_account_id IS NOT NULL
      AND NULLIF(BTRIM(refund_reference), '') IS NOT NULL)
    OR
    (refund_method = 'CARD'
      AND bank_account_id IS NULL
      AND NULLIF(BTRIM(refund_reference), '') IS NOT NULL)
    OR
    (refund_method = 'CASH' AND bank_account_id IS NULL)
  )
);

ALTER TABLE sale_returns
  ADD CONSTRAINT sale_returns_id_company_unique UNIQUE(id, company_id);

CREATE TABLE sale_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  sale_return_id UUID NOT NULL REFERENCES sale_returns(id) ON DELETE RESTRICT,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK(unit_price >= 0),
  unit_cost NUMERIC(18,4) NOT NULL CHECK(unit_cost >= 0),
  tax_rate NUMERIC(7,4) NOT NULL CHECK(tax_rate BETWEEN 0 AND 100),
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_amount NUMERIC(18,2) NOT NULL CHECK(tax_amount >= 0),
  line_total NUMERIC(18,2) NOT NULL CHECK(line_total > 0),
  FOREIGN KEY(sale_return_id, company_id)
    REFERENCES sale_returns(id, company_id),
  FOREIGN KEY(warehouse_id, company_id)
    REFERENCES warehouses(id, tenant_id)
);

CREATE INDEX sale_returns_sale_created
  ON sale_returns(company_id, sale_id, created_at DESC);

CREATE INDEX sale_return_items_sale_item
  ON sale_return_items(company_id, sale_item_id);

CREATE OR REPLACE FUNCTION validate_sale_return_quantities()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sold_quantity NUMERIC(18,4);
  returned_quantity NUMERIC(18,4);
BEGIN
  SELECT quantity INTO sold_quantity
  FROM sale_items
  WHERE id = NEW.sale_item_id
    AND seller_company_id = NEW.company_id;

  SELECT COALESCE(SUM(item.quantity), 0)
  INTO returned_quantity
  FROM sale_return_items item
  JOIN sale_returns header
    ON header.id = item.sale_return_id
   AND header.company_id = item.company_id
  WHERE item.company_id = NEW.company_id
    AND item.sale_item_id = NEW.sale_item_id
    AND header.status = 'COMPLETED'
    AND item.id <> NEW.id;

  IF sold_quantity IS NULL OR returned_quantity + NEW.quantity > sold_quantity THEN
    RAISE EXCEPTION 'La devolución supera las unidades vendidas.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sale_return_quantity_guard
BEFORE INSERT OR UPDATE OF quantity, sale_item_id, company_id
ON sale_return_items
FOR EACH ROW
EXECUTE FUNCTION validate_sale_return_quantities();

COMMENT ON TABLE sale_returns IS
  'Cabecera inalterable de devoluciones y reembolsos originados desde Caja.';

COMMENT ON TABLE sale_return_items IS
  'Unidades devueltas contra líneas históricas de venta.';
