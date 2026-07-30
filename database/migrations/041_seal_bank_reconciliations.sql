-- Una conciliación terminada constituye evidencia de auditoría: no se
-- sobrescribe, edita ni elimina. Un movimiento ya conciliado conserva su
-- vínculo con el comprobante que lo justificó.

CREATE OR REPLACE FUNCTION guard_completed_bank_reconciliation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'COMPLETED' THEN
    RAISE EXCEPTION
      'Una conciliación bancaria completada es inmutable.'
      USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER bank_reconciliation_runs_guard_completed
BEFORE UPDATE OR DELETE ON bank_reconciliation_runs
FOR EACH ROW
EXECUTE FUNCTION guard_completed_bank_reconciliation();

CREATE OR REPLACE FUNCTION guard_matched_bank_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'MATCHED' THEN
    RAISE EXCEPTION
      'Un movimiento bancario conciliado es inmutable.'
      USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER bank_statement_transactions_guard_matched
BEFORE UPDATE OR DELETE ON bank_statement_transactions
FOR EACH ROW
EXECUTE FUNCTION guard_matched_bank_transaction();
