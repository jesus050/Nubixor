-- Configuración local solicitada para demostrar dos operaciones separadas:
-- 1. MegaSuite Demo prepara factura electrónica (sin credenciales reales).
-- 2. Crative emite comprobante interno y queda lista para vender.
--
-- Los valores fiscales siguen marcados para revisión contable. Esta migración
-- no crea credenciales de proveedor tecnológico ni inventa resoluciones DIAN.

UPDATE company_tax_profiles
SET taxpayer_type = 'LEGAL_PERSON_DEMO',
    electronic_invoicing_required = TRUE,
    default_document_type = 'ELECTRONIC_INVOICE',
    vat_responsibility = 'RESPONSIBLE_FOR_VAT_DEMO',
    tax_regime = 'ORDINARY_DEMO',
    updated_at = now()
WHERE company_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO tenants(id,legal_name,trade_name,tax_id)
VALUES ('21935393-1ae3-48f2-9467-13fa37620fe2','Vision Creativa','Crative','123456789')
ON CONFLICT(id) DO NOTHING;

INSERT INTO branches(id,tenant_id,name,code)
VALUES ('75b7b9e7-5789-4ba8-963e-6a58bc6ebcb0','21935393-1ae3-48f2-9467-13fa37620fe2','Sede Principal','MAIN-CR')
ON CONFLICT(id) DO NOTHING;

INSERT INTO warehouses(id,tenant_id,branch_id,name,code,warehouse_type)
VALUES ('3efdba57-797c-4748-a849-f6d2328ac028','21935393-1ae3-48f2-9467-13fa37620fe2','75b7b9e7-5789-4ba8-963e-6a58bc6ebcb0','Bodega Central','BOD-CR','AVAILABLE')
ON CONFLICT(id) DO NOTHING;


UPDATE company_tax_profiles
SET taxpayer_type = 'NATURAL_PERSON_DEMO',
    electronic_invoicing_required = FALSE,
    default_document_type = 'INTERNAL_RECEIPT',
    vat_responsibility = 'RESPONSIBILITY_TO_CONFIRM',
    tax_regime = 'REGIME_TO_CONFIRM',
    updated_at = now()
WHERE company_id = '21935393-1ae3-48f2-9467-13fa37620fe2';

INSERT INTO tax_categories(
  id, tenant_id, code, name, treatment, rate, dian_code
)
VALUES
  (
    '31000000-0000-0000-0000-000000000001',
    '21935393-1ae3-48f2-9467-13fa37620fe2',
    'IVA19',
    'IVA 19%',
    'TAXED',
    19,
    '01'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '21935393-1ae3-48f2-9467-13fa37620fe2',
    'EXCL',
    'Excluido',
    'EXCLUDED',
    0,
    NULL
  )
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    treatment = EXCLUDED.treatment,
    rate = EXCLUDED.rate,
    dian_code = EXCLUDED.dian_code,
    active = TRUE;

INSERT INTO categories(
  id, tenant_id, name, code, description
)
VALUES
  (
    '41000000-0000-0000-0000-000000000001',
    '21935393-1ae3-48f2-9467-13fa37620fe2',
    'Juguetería',
    'JUG',
    'Juguetes y artículos recreativos.'
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    '21935393-1ae3-48f2-9467-13fa37620fe2',
    'Accesorios',
    'ACC',
    'Accesorios personales y complementos.'
  )
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = TRUE;

INSERT INTO brands(
  id, tenant_id, name, code
)
VALUES(
  '51000000-0000-0000-0000-000000000001',
  '21935393-1ae3-48f2-9467-13fa37620fe2',
  'Marca genérica',
  'GENER'
)
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    active = TRUE;

INSERT INTO cash_registers(
  id, tenant_id, branch_id, name, code
)
SELECT
  '71000000-0000-0000-0000-000000000001',
  company.id,
  branch.id,
  'Caja principal',
  'CAJA-01'
FROM tenants company
JOIN LATERAL (
  SELECT candidate.id
  FROM branches candidate
  WHERE candidate.tenant_id = company.id AND candidate.active = TRUE
  ORDER BY candidate.id
  LIMIT 1
) branch ON TRUE
WHERE company.id = '21935393-1ae3-48f2-9467-13fa37620fe2'
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    active = TRUE;

INSERT INTO cash_register_companies(
  cash_register_id, company_id, default_warehouse_id
)
SELECT
  register.id,
  company.id,
  warehouse.id
FROM tenants company
JOIN cash_registers register
  ON register.tenant_id = company.id AND register.code = 'CAJA-01'
JOIN LATERAL (
  SELECT candidate.id
  FROM warehouses candidate
  WHERE candidate.tenant_id = company.id AND candidate.active = TRUE
  ORDER BY candidate.id
  LIMIT 1
) warehouse ON TRUE
WHERE company.id = '21935393-1ae3-48f2-9467-13fa37620fe2'
ON CONFLICT(cash_register_id, company_id) DO UPDATE
SET default_warehouse_id = EXCLUDED.default_warehouse_id,
    active = TRUE;

UPDATE products product
SET sales_tax_category_id = tax.id,
    category_id = CASE product.sku
      WHEN 'LAAA-103' THEN '41000000-0000-0000-0000-000000000001'::uuid
      ELSE '41000000-0000-0000-0000-000000000002'::uuid
    END,
    brand_id = '51000000-0000-0000-0000-000000000001',
    default_warehouse_id = '3efdba57-797c-4748-a849-f6d2328ac028',
    tax_review_status = 'REVIEWED',
    active = TRUE,
    updated_at = now()
FROM tax_categories tax
WHERE product.tenant_id = '21935393-1ae3-48f2-9467-13fa37620fe2'
  AND product.sku IN ('LAAA-103', 'LAAA-1032')
  AND tax.tenant_id = product.tenant_id
  AND tax.code = 'IVA19'
;

INSERT INTO inventory_balances(
  tenant_id, product_id, warehouse_id, on_hand, reserved
)
SELECT
  product.tenant_id,
  product.id,
  warehouse.id,
  CASE product.sku
    WHEN 'LAAA-103' THEN 20
    WHEN 'LAAA-1032' THEN 12
  END,
  0
FROM products product
JOIN LATERAL (
  SELECT candidate.id
  FROM warehouses candidate
  WHERE candidate.tenant_id = product.tenant_id AND candidate.active = TRUE
  ORDER BY candidate.id
  LIMIT 1
) warehouse ON TRUE
WHERE product.tenant_id = '21935393-1ae3-48f2-9467-13fa37620fe2'
  AND product.sku IN ('LAAA-103', 'LAAA-1032')
ON CONFLICT(tenant_id, product_id, warehouse_id) DO UPDATE
SET on_hand = EXCLUDED.on_hand,
    updated_at = now();
