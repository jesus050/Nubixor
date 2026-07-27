-- Separa el inventario físicamente disponible en bodega del inventario
-- colocado en exhibición. El total por producto no cambia.

INSERT INTO warehouses(
  id, tenant_id, branch_id, name, code, warehouse_type
)
VALUES
  (
    '22000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Exhibición principal',
    'EXH-01',
    'DISPLAY'
  ),
  (
    '72000000-0000-0000-0000-000000000001',
    '21935393-1ae3-48f2-9467-13fa37620fe2',
    '30562581-ecc8-4b16-ba47-c98498bbeee1',
    'Exhibición principal',
    'EXH-01',
    'DISPLAY'
  )
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    warehouse_type = 'DISPLAY',
    active = TRUE;

CREATE TEMP TABLE initial_display_move ON COMMIT DROP AS
SELECT
  source.tenant_id,
  source.product_id,
  source.warehouse_id source_warehouse_id,
  CASE source.tenant_id
    WHEN '00000000-0000-0000-0000-000000000001'::uuid
      THEN '22000000-0000-0000-0000-000000000001'::uuid
    ELSE '72000000-0000-0000-0000-000000000001'::uuid
  END display_warehouse_id,
  LEAST(source.on_hand - source.reserved, 5)::numeric quantity,
  product.cost
FROM inventory_balances source
JOIN products product
  ON product.id = source.product_id
 AND product.tenant_id = source.tenant_id
WHERE (
    (
      source.tenant_id = '00000000-0000-0000-0000-000000000001'
      AND source.warehouse_id = '20000000-0000-0000-0000-000000000001'
    ) OR (
      source.tenant_id = '21935393-1ae3-48f2-9467-13fa37620fe2'
      AND source.warehouse_id = '3efdba57-797c-4748-a849-f6d2328ac028'
    )
  )
  AND source.on_hand - source.reserved > 0;

INSERT INTO inventory_balances(
  tenant_id, product_id, warehouse_id, on_hand, reserved
)
SELECT tenant_id, product_id, display_warehouse_id, quantity, 0
FROM initial_display_move
ON CONFLICT(tenant_id, product_id, warehouse_id) DO UPDATE
SET on_hand = EXCLUDED.on_hand,
    updated_at = now();

INSERT INTO inventory_movements(
  tenant_id, product_id, warehouse_id, movement_type, quantity, unit_cost,
  reference_type, reference_id, reason
)
SELECT
  tenant_id, product_id, source_warehouse_id, 'TRANSFER_OUT', -quantity, cost,
  'INITIAL_DISPLAY', '028_display_inventory_locations',
  'Traslado inicial desde bodega hacia exhibición'
FROM initial_display_move
UNION ALL
SELECT
  tenant_id, product_id, display_warehouse_id, 'TRANSFER_IN', quantity, cost,
  'INITIAL_DISPLAY', '028_display_inventory_locations',
  'Ingreso inicial a exhibición'
FROM initial_display_move;

UPDATE inventory_balances source
SET on_hand = source.on_hand - movement.quantity,
    updated_at = now()
FROM initial_display_move movement
WHERE source.tenant_id = movement.tenant_id
  AND source.product_id = movement.product_id
  AND source.warehouse_id = movement.source_warehouse_id;

UPDATE cash_register_companies
SET default_warehouse_id = CASE company_id
  WHEN '00000000-0000-0000-0000-000000000001'::uuid
    THEN '22000000-0000-0000-0000-000000000001'::uuid
  ELSE '72000000-0000-0000-0000-000000000001'::uuid
END
WHERE company_id IN (
  '00000000-0000-0000-0000-000000000001',
  '21935393-1ae3-48f2-9467-13fa37620fe2'
);
