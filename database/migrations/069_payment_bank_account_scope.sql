-- Los recaudos y pagos que pasan por banco deben conservar la cuenta exacta
-- para conciliación, trazabilidad contable y aislamiento multiempresa.

ALTER TABLE ar_payments
  ADD COLUMN bank_account_id UUID;

ALTER TABLE ap_payments
  ADD COLUMN bank_account_id UUID;

ALTER TABLE ar_payments
  ADD CONSTRAINT ar_payments_bank_account_tenant_fk
  FOREIGN KEY(bank_account_id, tenant_id)
  REFERENCES bank_accounts(id, tenant_id)
  ON DELETE RESTRICT;

ALTER TABLE ap_payments
  ADD CONSTRAINT ap_payments_bank_account_tenant_fk
  FOREIGN KEY(bank_account_id, tenant_id)
  REFERENCES bank_accounts(id, tenant_id)
  ON DELETE RESTRICT;

ALTER TABLE ar_payments
  ADD CONSTRAINT ar_payment_bank_method_integrity CHECK(
    (payment_method IN ('BANK_TRANSFER', 'CARD') AND bank_account_id IS NOT NULL)
    OR
    (payment_method NOT IN ('BANK_TRANSFER', 'CARD') AND bank_account_id IS NULL)
  ) NOT VALID;

ALTER TABLE ap_payments
  ADD CONSTRAINT ap_payment_bank_method_integrity CHECK(
    (payment_method IN ('BANK_TRANSFER', 'CARD', 'CHECK') AND bank_account_id IS NOT NULL)
    OR
    (payment_method NOT IN ('BANK_TRANSFER', 'CARD', 'CHECK') AND bank_account_id IS NULL)
  ) NOT VALID;

CREATE INDEX ar_payments_bank_account
  ON ar_payments(tenant_id, bank_account_id, payment_date DESC)
  WHERE bank_account_id IS NOT NULL;

CREATE INDEX ap_payments_bank_account
  ON ap_payments(tenant_id, bank_account_id, payment_date DESC)
  WHERE bank_account_id IS NOT NULL;
