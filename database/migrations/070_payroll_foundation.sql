-- Fase inicial de nómina: información laboral y novedades internas.
-- No transmite documentos a DIAN ni calcula seguridad social de forma automática.

CREATE SEQUENCE payroll_period_number_seq;

CREATE TABLE payroll_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID,
  document_type TEXT NOT NULL CHECK(document_type IN ('CC','CE','PASSPORT','PPT','OTHER')),
  document_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  second_last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, document_type, document_number),
  UNIQUE(id, tenant_id)
);

CREATE TABLE payroll_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL,
  contract_type TEXT NOT NULL CHECK(contract_type IN ('INDEFINITE','FIXED_TERM','WORK_OR_LABOR','APPRENTICESHIP','OTHER')),
  start_date DATE NOT NULL,
  end_date DATE,
  base_salary NUMERIC(18,2) NOT NULL CHECK(base_salary >= 0),
  payment_frequency TEXT NOT NULL DEFAULT 'MONTHLY' CHECK(payment_frequency IN ('MONTHLY','BIWEEKLY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('DRAFT','ACTIVE','SUSPENDED','TERMINATED')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(employee_id, tenant_id) REFERENCES payroll_employees(id, tenant_id) ON DELETE RESTRICT,
  CHECK(end_date IS NULL OR end_date >= start_date),
  UNIQUE(id, tenant_id)
);

CREATE UNIQUE INDEX payroll_active_contract_per_employee
  ON payroll_contracts(tenant_id, employee_id)
  WHERE status = 'ACTIVE';

CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_number TEXT NOT NULL DEFAULT (
    'NOM-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('payroll_period_number_seq')::text, 6, '0')
  ),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('MONTHLY','BIWEEKLY')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','APPROVED','CLOSED')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(end_date >= start_date),
  CHECK(payment_date >= start_date),
  CHECK(status NOT IN ('APPROVED','CLOSED') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  UNIQUE(tenant_id, period_number),
  UNIQUE(tenant_id, start_date, end_date, frequency),
  UNIQUE(id, tenant_id)
);

CREATE TABLE payroll_novelties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  payroll_period_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  novelty_type TEXT NOT NULL CHECK(novelty_type IN ('EARNING','DEDUCTION','ABSENCE','OVERTIME','LEAVE','OTHER')),
  concept_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,4),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(amount >= 0),
  effective_date DATE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','APPROVED','VOID')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(payroll_period_id, tenant_id) REFERENCES payroll_periods(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(employee_id, tenant_id) REFERENCES payroll_employees(id, tenant_id) ON DELETE RESTRICT,
  CHECK(status <> 'APPROVED' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  UNIQUE(id, tenant_id)
);

CREATE INDEX payroll_employees_directory ON payroll_employees(tenant_id, active, last_name, first_name);
CREATE INDEX payroll_periods_current ON payroll_periods(tenant_id, end_date DESC);
CREATE INDEX payroll_novelties_period ON payroll_novelties(tenant_id, payroll_period_id, employee_id);

INSERT INTO tenant_modules(tenant_id, module_code, enabled)
SELECT id, 'PAYROLL', FALSE FROM tenants
ON CONFLICT(tenant_id, module_code) DO NOTHING;

CREATE OR REPLACE FUNCTION seed_tenant_modules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO tenant_modules(tenant_id, module_code, enabled, enabled_at)
  VALUES(NEW.id, 'LOGISTICS', TRUE, now()),
        (NEW.id, 'PAYROLL', FALSE, NULL)
  ON CONFLICT(tenant_id, module_code) DO NOTHING;
  RETURN NEW;
END;
$$;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.code
FROM roles role
CROSS JOIN (VALUES ('payroll.view'), ('payroll.manage'), ('payroll.approve')) AS permission(code)
WHERE role.code IN ('OWNER','ADMIN')
ON CONFLICT DO NOTHING;
