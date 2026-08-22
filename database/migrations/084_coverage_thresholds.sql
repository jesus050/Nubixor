-- Umbrales de cobertura para la inteligencia de inventario.
--
-- La rotación se clasificaba solo por unidades vendidas en la ventana. Eso
-- responde "cuánto se vendió", que no es la pregunta que se hace un empresario
-- mirando su bodega. Las suyas son otras dos: qué se me va a acabar, y dónde
-- tengo dinero parado.
--
-- Las dos se contestan con la cobertura —cuántos días dura el inventario al
-- ritmo actual de venta—, que ya se calculaba pero no clasificaba nada. Estos
-- umbrales le ponen los cortes, y son configurables porque no significan lo
-- mismo en una ferretería que en una tienda de ropa de temporada.
ALTER TABLE commercial_rotation_settings
  ADD COLUMN coverage_risk_days INTEGER NOT NULL DEFAULT 15
    CHECK(coverage_risk_days BETWEEN 1 AND 365),
  ADD COLUMN coverage_excess_days INTEGER NOT NULL DEFAULT 120
    CHECK(coverage_excess_days BETWEEN 1 AND 3650),
  -- Por debajo de este movimiento en la ventana, sugerir un traslado entre
  -- sucursales es ruido: mover mercancía cuesta, y no se hace por una unidad.
  ADD COLUMN transfer_min_units NUMERIC(18,4) NOT NULL DEFAULT 3
    CHECK(transfer_min_units > 0);

ALTER TABLE commercial_rotation_settings
  ADD CONSTRAINT commercial_rotation_coverage_order
    CHECK(coverage_excess_days > coverage_risk_days);

COMMENT ON COLUMN commercial_rotation_settings.coverage_risk_days IS
  'Días de cobertura por debajo de los cuales el producto está en riesgo de agotarse.';
COMMENT ON COLUMN commercial_rotation_settings.coverage_excess_days IS
  'Días de cobertura por encima de los cuales el inventario es exceso: dinero parado.';
COMMENT ON COLUMN commercial_rotation_settings.transfer_min_units IS
  'Unidades mínimas para que valga la pena sugerir un traslado entre sucursales.';
