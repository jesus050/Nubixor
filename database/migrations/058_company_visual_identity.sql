-- Identidad visual independiente por empresa. El logo no comparte el campo
-- destinado al soporte RUT y permanece dentro del almacenamiento privado.

ALTER TABLE tenants
  ADD COLUMN logo_document_id UUID;

ALTER TABLE tenants
  ADD CONSTRAINT tenants_logo_document_company_fk
  FOREIGN KEY(logo_document_id, id)
  REFERENCES secure_documents(id, tenant_id)
  ON DELETE RESTRICT;

CREATE INDEX tenants_logo_document
  ON tenants(logo_document_id)
  WHERE logo_document_id IS NOT NULL;
