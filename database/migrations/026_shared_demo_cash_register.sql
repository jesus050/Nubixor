-- Una caja física puede vender productos de las dos empresas sin cambiar el
-- contexto visual. Cada producto conserva su bodega, impuesto y documento.

INSERT INTO cash_register_companies(
  cash_register_id, company_id, default_warehouse_id
)
VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    '21935393-1ae3-48f2-9467-13fa37620fe2',
    '3efdba57-797c-4748-a849-f6d2328ac028'
  ),
  (
    '71000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001'
  )
ON CONFLICT(cash_register_id, company_id) DO UPDATE
SET default_warehouse_id = EXCLUDED.default_warehouse_id,
    active = TRUE;
