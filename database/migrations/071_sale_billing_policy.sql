-- La Caja multiempresa guarda la política aplicada a cada venta para separar
-- comprobantes internos, equivalentes y facturas electrónicas. La columna se
-- usa desde el flujo POS y debe existir antes de habilitar dicho flujo.

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS applied_billing_policy VARCHAR(50);

UPDATE sales
SET applied_billing_policy = CASE document_type
  WHEN 'ELECTRONIC_INVOICE' THEN 'ELECTRONIC_INVOICE'
  WHEN 'EQUIVALENT_DOCUMENT' THEN 'EQUIVALENT_DOCUMENT_POS'
  ELSE 'INTERNAL_RECEIPT'
END
WHERE applied_billing_policy IS NULL;

ALTER TABLE sales
  ALTER COLUMN applied_billing_policy SET NOT NULL,
  ADD CONSTRAINT sales_applied_billing_policy_check
    CHECK (applied_billing_policy IN (
      'ELECTRONIC_INVOICE',
      'EQUIVALENT_DOCUMENT_POS',
      'INTERNAL_RECEIPT'
    ));
