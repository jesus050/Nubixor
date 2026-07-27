ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS cash_received NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS cash_change NUMERIC(18,2);

UPDATE sales
SET cash_received = total,
    cash_change = 0
WHERE payment_method = 'CASH'
  AND cash_received IS NULL;

ALTER TABLE sales
  ADD CONSTRAINT sales_cash_received_nonnegative CHECK(cash_received IS NULL OR cash_received >= 0),
  ADD CONSTRAINT sales_cash_change_nonnegative CHECK(cash_change IS NULL OR cash_change >= 0);
