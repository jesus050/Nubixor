-- Evidencia de conciliación entre la transferencia registrada en caja y el
-- movimiento importado o digitado desde el extracto bancario.

ALTER TABLE sale_payment_tenders
  ADD COLUMN matched_bank_transaction_id UUID
    REFERENCES bank_statement_transactions(id) ON DELETE RESTRICT,
  ADD COLUMN matched_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN matched_at TIMESTAMPTZ;

ALTER TABLE sale_payment_tenders
  ADD CONSTRAINT sale_payment_tender_match_integrity CHECK(
    (
      reconciliation_status = 'MATCHED'
      AND method = 'TRANSFER'
      AND matched_bank_transaction_id IS NOT NULL
      AND matched_by IS NOT NULL
      AND matched_at IS NOT NULL
    )
    OR
    (
      reconciliation_status <> 'MATCHED'
      AND matched_bank_transaction_id IS NULL
      AND matched_by IS NULL
      AND matched_at IS NULL
    )
  );

CREATE INDEX sale_payment_tenders_bank_match
  ON sale_payment_tenders(receiving_company_id, matched_bank_transaction_id)
  WHERE matched_bank_transaction_id IS NOT NULL;
