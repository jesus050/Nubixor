-- Metadatos de sincronización. El rango y la sucursal se asocian por un
-- administrador; el proceso automático solo refresca datos del proveedor.
ALTER TABLE billing_resolutions
  ADD COLUMN provider_last_checked_at TIMESTAMPTZ,
  ADD COLUMN provider_last_sync_error TEXT;
