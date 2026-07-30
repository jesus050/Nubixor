ALTER TABLE logistics_intake_items
ADD COLUMN label_quantity_printed INTEGER NOT NULL DEFAULT 0
  CHECK(label_quantity_printed >= 0);

UPDATE tenant_modules
SET settings = jsonb_set(
  settings,
  '{labels}',
  '{
    "widthMm": 50,
    "heightMm": 25,
    "showCompany": true,
    "showProduct": true,
    "showPrice": true,
    "showSku": true,
    "showBarcode": true,
    "footerText": "Gracias por su compra"
  }'::jsonb,
  TRUE
)
WHERE module_code='LOGISTICS'
  AND NOT (settings ? 'labels');
