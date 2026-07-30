CREATE OR REPLACE FUNCTION seed_default_warehouse_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO warehouse_locations(
    tenant_id, warehouse_id, code, name, zone_type, sellable, active
  )
  VALUES (
    NEW.tenant_id,
    NEW.id,
    'GENERAL',
    'Ubicación general',
    CASE
      WHEN NEW.warehouse_type = 'DISPLAY' THEN 'DISPLAY'
      ELSE 'STORAGE'
    END,
    NEW.warehouse_type = 'DISPLAY',
    TRUE
  )
  ON CONFLICT (tenant_id, warehouse_id, code) DO NOTHING;
  RETURN NEW;
END;
$$;
