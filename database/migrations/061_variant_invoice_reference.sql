-- Las variantes mantienen un SKU operativo único para inventario, escáner y trazabilidad.
-- La referencia fiscal puede ser la misma del producto principal para que colores/tallas
-- se agrupen comercialmente en la factura electrónica.
UPDATE products child
SET metadata = jsonb_set(
      COALESCE(child.metadata, '{}'::jsonb),
      '{invoiceCode}',
      to_jsonb(parent.sku),
      TRUE
    ),
    updated_at = now()
FROM products parent
WHERE child.tenant_id = parent.tenant_id
  AND child.parent_product_id = parent.id
  AND child.product_kind = 'VARIANT'
  AND child.deleted_at IS NULL
  AND COALESCE(child.metadata ->> 'invoiceCode', '') = '';
