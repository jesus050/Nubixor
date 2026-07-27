ALTER TABLE sales
  DROP CONSTRAINT sales_payment_method_check,
  ADD CONSTRAINT sales_payment_method_check
    CHECK(payment_method IN ('CASH','CARD','TRANSFER','CREDIT')),
  ADD COLUMN customer_id UUID REFERENCES customers(id),
  ADD COLUMN sale_terms TEXT NOT NULL DEFAULT 'IMMEDIATE'
    CHECK(sale_terms IN ('IMMEDIATE','CREDIT')),
  ADD COLUMN due_date DATE,
  ADD COLUMN ar_invoice_id UUID REFERENCES ar_invoices(id);

ALTER TABLE sales
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

CREATE INDEX sales_customer_created
  ON sales(tenant_id, customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;
