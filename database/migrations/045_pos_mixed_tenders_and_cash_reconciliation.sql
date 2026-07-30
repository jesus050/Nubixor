-- Pagos mixtos y trazabilidad bancaria por venta.
-- Cada línea representa dinero realmente aplicado a una venta; en efectivo,
-- tendered_amount y change_amount conservan lo entregado y el cambio.

ALTER TABLE sales
  DROP CONSTRAINT sales_payment_method_check,
  DROP CONSTRAINT sales_credit_integrity,
  ADD CONSTRAINT sales_payment_method_check
    CHECK(payment_method IN ('CASH','CARD','TRANSFER','MIXED','CREDIT')),
  ADD CONSTRAINT sales_credit_integrity CHECK(
    (
      sale_terms = 'CREDIT'
      AND payment_method = 'CREDIT'
      AND customer_id IS NOT NULL
      AND due_date IS NOT NULL
      AND cash_received IS NULL
      AND cash_change IS NULL
    )
    OR
    (
      sale_terms = 'IMMEDIATE'
      AND payment_method <> 'CREDIT'
      AND due_date IS NULL
    )
  );

CREATE TABLE sale_payment_tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  seller_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  receiving_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  bank_account_id UUID,
  method TEXT NOT NULL CHECK(method IN ('CASH','CARD','TRANSFER')),
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  tendered_amount NUMERIC(18,2),
  change_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(change_amount >= 0),
  reference TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE'
    CHECK(reconciliation_status IN ('NOT_APPLICABLE','PENDING','MATCHED','REVERSED')),
  recorded_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(sale_id, seller_company_id)
    REFERENCES sales(id, company_id) ON DELETE RESTRICT,
  FOREIGN KEY(bank_account_id, receiving_company_id)
    REFERENCES bank_accounts(id, tenant_id) ON DELETE RESTRICT,
  CHECK(
    (
      method = 'CASH'
      AND bank_account_id IS NULL
      AND tendered_amount IS NOT NULL
      AND tendered_amount >= amount
      AND change_amount = tendered_amount - amount
    )
    OR
    (
      method = 'CARD'
      AND bank_account_id IS NULL
      AND tendered_amount IS NULL
      AND change_amount = 0
    )
    OR
    (
      method = 'TRANSFER'
      AND bank_account_id IS NOT NULL
      AND tendered_amount IS NULL
      AND change_amount = 0
      AND NULLIF(BTRIM(reference), '') IS NOT NULL
    )
  )
);

CREATE INDEX sale_payment_tenders_sale
  ON sale_payment_tenders(seller_company_id, sale_id, recorded_at);

CREATE INDEX sale_payment_tenders_bank_pending
  ON sale_payment_tenders(receiving_company_id, bank_account_id, recorded_at DESC)
  WHERE method = 'TRANSFER' AND reconciliation_status = 'PENDING';

CREATE OR REPLACE FUNCTION validate_sale_tender_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_sale_id UUID;
  target_company_id UUID;
  sale_total NUMERIC(18,2);
  tender_total NUMERIC(18,2);
BEGIN
  target_sale_id := COALESCE(NEW.sale_id, OLD.sale_id);
  target_company_id := COALESCE(NEW.seller_company_id, OLD.seller_company_id);

  SELECT total INTO sale_total
  FROM sales
  WHERE id = target_sale_id AND company_id = target_company_id;

  SELECT COALESCE(SUM(amount), 0) INTO tender_total
  FROM sale_payment_tenders
  WHERE sale_id = target_sale_id
    AND seller_company_id = target_company_id
    AND reconciliation_status <> 'REVERSED';

  IF sale_total IS NOT NULL AND tender_total <> sale_total THEN
    RAISE EXCEPTION
      'Los pagos de la venta (%) deben sumar exactamente el total (%).',
      tender_total,
      sale_total
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER sale_payment_tenders_balance
AFTER INSERT OR UPDATE OR DELETE
ON sale_payment_tenders
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_sale_tender_totals();

-- Conserva el histórico previo. Las transferencias antiguas quedan pendientes
-- de asociar a extracto porque no siempre existe una cuenta bancaria configurada.
INSERT INTO sale_payment_tenders(
  sale_id, seller_company_id, receiving_company_id, bank_account_id,
  method, amount, tendered_amount, change_amount, reference,
  reconciliation_status, recorded_by, recorded_at
)
SELECT
  sale.id,
  sale.company_id,
  COALESCE(record.receiving_company_id, sale.company_id),
  NULL,
  sale.payment_method,
  sale.total,
  CASE WHEN sale.payment_method = 'CASH'
    THEN COALESCE(sale.cash_received, sale.total)
    ELSE NULL
  END,
  CASE WHEN sale.payment_method = 'CASH'
    THEN COALESCE(sale.cash_change, 0)
    ELSE 0
  END,
  CASE WHEN sale.payment_method = 'TRANSFER'
    THEN COALESCE(record.reference, 'Transferencia histórica pendiente de cuenta')
    ELSE NULL
  END,
  CASE WHEN sale.payment_method = 'TRANSFER' THEN 'PENDING' ELSE 'NOT_APPLICABLE' END,
  sale.created_by,
  sale.created_at
FROM sales sale
LEFT JOIN sale_payment_records record ON record.sale_id = sale.id
WHERE sale.sale_terms = 'IMMEDIATE'
  AND sale.payment_method IN ('CASH','CARD')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE sale_payment_tenders IS
  'Desglose auditable de pagos aplicados a cada venta de contado.';
