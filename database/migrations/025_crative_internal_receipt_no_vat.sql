-- Ajuste fiscal solicitado para el escenario local de Crative.
-- Crative vende con comprobante interno y sus productos no cobran IVA.
-- Esta configuración es independiente de MegaSuite Demo, que conserva su
-- flujo de factura electrónica pendiente de conexión real.

UPDATE company_tax_profiles
SET taxpayer_type = 'NATURAL_PERSON',
    electronic_invoicing_required = FALSE,
    default_document_type = 'INTERNAL_RECEIPT',
    vat_responsibility = 'NOT_RESPONSIBLE_FOR_VAT',
    tax_regime = 'TO_CONFIRM_WITH_ACCOUNTANT',
    updated_at = now()
WHERE company_id = '21935393-1ae3-48f2-9467-13fa37620fe2';

INSERT INTO tax_categories(
  id, tenant_id, code, name, treatment, rate, dian_code
)
VALUES(
  '31000000-0000-0000-0000-000000000003',
  '21935393-1ae3-48f2-9467-13fa37620fe2',
  'NOIVA',
  'No cobra IVA',
  'NON_TAXED',
  0,
  NULL
)
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    treatment = EXCLUDED.treatment,
    rate = EXCLUDED.rate,
    dian_code = EXCLUDED.dian_code,
    active = TRUE;

-- Oculta IVA 19% en Crative para evitar seleccionarlo accidentalmente. La
-- categoría excluida permanece disponible para una futura clasificación
-- contable más específica.
UPDATE tax_categories
SET active = FALSE
WHERE tenant_id = '21935393-1ae3-48f2-9467-13fa37620fe2'
  AND code IN ('IVA19', 'IVA5');

UPDATE products product
SET sales_tax_category_id = tax.id,
    tax_review_status = 'REVIEWED',
    active = TRUE,
    updated_at = now()
FROM tax_categories tax
WHERE product.tenant_id = '21935393-1ae3-48f2-9467-13fa37620fe2'
  AND product.sku IN ('LAAA-103', 'LAAA-1032')
  AND tax.tenant_id = product.tenant_id
  AND tax.code = 'NOIVA';
