-- Trazabilidad del dinero recibido por transferencia. Una venta conserva la
-- empresa que vende y, de forma independiente, la empresa cuya cuenta recibió
-- el pago.

CREATE TABLE sale_payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  seller_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  receiving_company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('TRANSFER')),
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  reference TEXT NOT NULL,
  reconciliation_status TEXT NOT NULL DEFAULT 'CONFIRMED'
    CHECK(reconciliation_status IN ('PENDING','CONFIRMED','REVERSED')),
  recorded_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(sale_id, seller_company_id)
    REFERENCES sales(id, company_id),
  UNIQUE(sale_id)
);

CREATE INDEX sale_payment_records_receiver_created
  ON sale_payment_records(receiving_company_id, recorded_at DESC);

CREATE INDEX sale_payment_records_seller_created
  ON sale_payment_records(seller_company_id, recorded_at DESC);

INSERT INTO sale_payment_records(
  sale_id, seller_company_id, receiving_company_id, payment_method,
  amount, reference, reconciliation_status, recorded_by, recorded_at
)
SELECT
  sale.id,
  sale.company_id,
  sale.company_id,
  'TRANSFER',
  sale.total,
  'Transferencia histórica sin referencia',
  'CONFIRMED',
  sale.created_by,
  sale.created_at
FROM sales sale
WHERE sale.payment_method = 'TRANSFER'
ON CONFLICT(sale_id) DO NOTHING;
