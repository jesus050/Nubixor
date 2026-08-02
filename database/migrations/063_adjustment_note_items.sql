-- Una nota parcial debe conservar las líneas de la factura original. Nunca se
-- reconstruye desde un total digitado manualmente.
CREATE TABLE electronic_adjustment_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  adjustment_note_id UUID NOT NULL REFERENCES electronic_adjustment_notes(id) ON DELETE RESTRICT,
  original_sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sku_snapshot TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK(unit_price >= 0),
  tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  line_total NUMERIC(18,2) NOT NULL CHECK(line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(adjustment_note_id, original_sale_item_id)
);

CREATE INDEX electronic_adjustment_note_items_note
  ON electronic_adjustment_note_items(company_id, adjustment_note_id);
