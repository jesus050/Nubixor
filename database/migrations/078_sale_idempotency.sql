-- Idempotencia real para la venta del punto de venta.
--
-- La tabla ya tenía idempotency_key y una restricción única, pero incluía
-- checkout_cart_id, que en una venta de POS siempre es NULL. En PostgreSQL dos
-- NULL nunca son iguales, así que la restricción jamás llegaba a evaluarse: un
-- doble clic en "Cobrar", un reintento tras un timeout o una segunda pestaña
-- creaban dos ventas, con doble descuento de inventario y dos consecutivos
-- consumidos.
--
-- Este índice cubre la venta con independencia del carrito. La restricción
-- anterior se conserva: es redundante frente a esta, pero eliminarla es un
-- cambio destructivo que no aporta nada.

-- Una empresa que ya tuviera dos ventas con la misma clave haría fallar la
-- creación del índice con un error de PostgreSQL difícil de interpretar en
-- pleno despliegue. Mejor decir exactamente qué pasa y qué revisar.
DO $$
DECLARE
  duplicadas INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicadas
  FROM (
    SELECT company_id, idempotency_key
    FROM sales
    GROUP BY company_id, idempotency_key
    HAVING COUNT(*) > 1
  ) repetidas;

  IF duplicadas > 0 THEN
    RAISE EXCEPTION
      'Hay % combinaciones de empresa y clave de idempotencia repetidas en sales. '
      'Revísalas antes de aplicar esta migración: '
      'SELECT company_id, idempotency_key, COUNT(*) FROM sales '
      'GROUP BY 1,2 HAVING COUNT(*) > 1;', duplicadas;
  END IF;
END
$$;

CREATE UNIQUE INDEX sales_company_idempotency_unique
  ON sales(company_id, idempotency_key);

COMMENT ON INDEX sales_company_idempotency_unique IS
  'Impide que un reintento del punto de venta cree una segunda venta. '
  'La clave la genera el cliente y viaja en la cabecera Idempotency-Key.';

-- El cobro multiempresa crea una venta por cada empresa vendedora dentro de la
-- misma petición, así que la clave del cliente no puede guardarse tal cual en
-- cada una. Se ancla al grupo, que sí es uno por cobro, y que además se inserta
-- antes de tocar inventario: un reintento choca ahí y no alcanza a descontar
-- existencias ni a consumir consecutivos.
ALTER TABLE sale_groups
  ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX sale_groups_company_idempotency_unique
  ON sale_groups(tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN sale_groups.idempotency_key IS
  'Clave enviada por el punto de venta en la cabecera Idempotency-Key. '
  'NULL en los grupos creados antes de esta migración.';
