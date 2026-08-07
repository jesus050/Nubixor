-- Migración: Actualizar nombre del tenant demo canónico al nombre real del negocio
-- Fecha: 2026-08-07

UPDATE tenants
SET
  legal_name = 'BODEGA MAYORISTA EL MEJOR PRECIO',
  trade_name = 'BODEGA MAYORISTA EL MEJOR PRECIO',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND legal_name = 'Empresa demostración';

-- Actualizar perfil tributario: Persona Jurídica, No responsable IVA, Régimen Simple
UPDATE company_tax_profiles
SET
  taxpayer_type = 'LEGAL_ENTITY',
  vat_responsibility = 'NOT_RESPONSIBLE',
  tax_regime = 'SIMPLE',
  electronic_invoicing_required = true,
  default_document_type = 'ELECTRONIC_INVOICE',
  updated_at = now()
WHERE company_id = '00000000-0000-0000-0000-000000000001';
