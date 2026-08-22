-- Kardex real: cada movimiento dice de cuánto venía y en cuánto quedó.
--
-- Hasta ahora un movimiento guardaba la cantidad movida pero no el saldo
-- anterior ni el resultante, así que no se podía reconstruir la historia de un
-- producto ni detectar que el acumulado de movimientos y el saldo se hubieran
-- separado. Tampoco guardaba la sucursal: había que deducirla por la bodega.
--
-- El saldo lo calcula la propia base al insertar, encadenando cada movimiento
-- con el anterior de esa combinación de empresa, producto y bodega. Se hace en
-- un disparador y no en la aplicación porque el orden entre actualizar el saldo
-- e insertar el movimiento no es el mismo en todos los módulos: unos actualizan
-- primero y otros después, y cualquier cálculo hecho desde la aplicación
-- dependería de ese orden.

ALTER TABLE inventory_movements
  ADD COLUMN branch_id UUID REFERENCES branches(id),
  ADD COLUMN balance_before NUMERIC(18,4),
  ADD COLUMN balance_after NUMERIC(18,4);

UPDATE inventory_movements movement
SET branch_id = warehouse.branch_id
FROM warehouses warehouse
WHERE warehouse.id = movement.warehouse_id
  AND movement.branch_id IS NULL;

-- La historia existente se reconstruye de una vez, en el mismo orden en que
-- ocurrió. A partir de aquí el disparador continúa la cadena.
WITH acumulado AS (
  SELECT id,
         SUM(quantity) OVER (
           PARTITION BY tenant_id, product_id, warehouse_id
           ORDER BY created_at, id
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
         ) resultante,
         quantity
  FROM inventory_movements
)
UPDATE inventory_movements movement
SET balance_after = acumulado.resultante,
    balance_before = acumulado.resultante - acumulado.quantity
FROM acumulado
WHERE acumulado.id = movement.id;

CREATE OR REPLACE FUNCTION seal_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  anterior NUMERIC(18,4);
BEGIN
  IF NEW.branch_id IS NULL THEN
    SELECT branch_id INTO NEW.branch_id
    FROM warehouses
    WHERE id = NEW.warehouse_id;
  END IF;

  -- El bloqueo sobre el último movimiento serializa el kardex de esa
  -- combinación: dos movimientos simultáneos del mismo producto en la misma
  -- bodega no pueden partir del mismo saldo anterior.
  SELECT balance_after INTO anterior
  FROM inventory_movements
  WHERE tenant_id = NEW.tenant_id
    AND product_id = NEW.product_id
    AND warehouse_id = NEW.warehouse_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
  FOR UPDATE;

  NEW.balance_before := COALESCE(anterior, 0);
  NEW.balance_after := NEW.balance_before + NEW.quantity;
  RETURN NEW;
END;
$$;

CREATE TRIGGER inventory_movements_seal
BEFORE INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION seal_inventory_movement();

-- Un movimiento es un hecho ocurrido. Corregirlo se hace con otro movimiento,
-- nunca reescribiendo el original: si la historia se puede editar, deja de ser
-- historia.
CREATE OR REPLACE FUNCTION reject_inventory_movement_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'Los movimientos de inventario no se modifican ni se borran. '
    'Registra un movimiento de ajuste con su motivo.';
END;
$$;

CREATE TRIGGER inventory_movements_append_only
BEFORE UPDATE OR DELETE ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION reject_inventory_movement_mutation();

ALTER TABLE inventory_movements
  ALTER COLUMN balance_before SET NOT NULL,
  ALTER COLUMN balance_after SET NOT NULL;

COMMENT ON COLUMN inventory_movements.balance_before IS
  'Saldo de la bodega antes de este movimiento, encadenado con el anterior.';
COMMENT ON COLUMN inventory_movements.balance_after IS
  'Saldo resultante. Si se separa de inventory_balances, alguien movió stock sin registrar el movimiento.';

-- El inventario en negativo se impedía consulta por consulta: la venta lo
-- comprobaba, el ajuste también, y cada ruta nueva tenía que acordarse. Ahora la
-- regla vive en la tabla, que es donde no se puede olvidar.
DO $$
DECLARE
  negativos INTEGER;
BEGIN
  SELECT COUNT(*) INTO negativos
  FROM inventory_balances
  WHERE on_hand < 0 OR reserved < 0;

  IF negativos > 0 THEN
    RAISE EXCEPTION
      'Hay % saldos de inventario en negativo. Corrígelos con un ajuste antes de '
      'aplicar esta migración: SELECT tenant_id, product_id, warehouse_id, on_hand, '
      'reserved FROM inventory_balances WHERE on_hand < 0 OR reserved < 0;', negativos;
  END IF;
END
$$;

ALTER TABLE inventory_balances
  ADD CONSTRAINT inventory_balances_on_hand_not_negative CHECK(on_hand >= 0),
  ADD CONSTRAINT inventory_balances_reserved_not_negative CHECK(reserved >= 0);
