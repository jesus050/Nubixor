ALTER TABLE cash_sessions
  ADD COLUMN expected_cash NUMERIC(18,2),
  ADD COLUMN difference NUMERIC(18,2),
  ADD COLUMN closing_notes TEXT;

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  movement_type TEXT NOT NULL
    CHECK(movement_type IN ('INCOME','EXPENSE','WITHDRAWAL')),
  category TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  reference TEXT,
  notes TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cash_movements_session
  ON cash_movements(tenant_id, cash_session_id, created_at DESC);

CREATE TABLE cash_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  denomination NUMERIC(18,2) NOT NULL CHECK(denomination > 0),
  quantity INTEGER NOT NULL CHECK(quantity >= 0),
  total NUMERIC(18,2) GENERATED ALWAYS AS (denomination * quantity) STORED,
  UNIQUE(cash_session_id, denomination)
);

CREATE INDEX cash_count_lines_session
  ON cash_count_lines(tenant_id, cash_session_id);
