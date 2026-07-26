CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
  opening_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(opening_amount >= 0),
  closing_amount NUMERIC(18,2) CHECK(closing_amount >= 0),
  opened_by UUID REFERENCES users(id),
  closed_by UUID REFERENCES users(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX cash_sessions_one_open_per_register
  ON cash_sessions(cash_register_id)
  WHERE status = 'OPEN';

CREATE INDEX cash_sessions_tenant_status
  ON cash_sessions(tenant_id, status, opened_at DESC);

INSERT INTO cash_registers(id, tenant_id, branch_id, name, code)
VALUES(
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Caja principal',
  'CAJA-01'
)
ON CONFLICT DO NOTHING;

