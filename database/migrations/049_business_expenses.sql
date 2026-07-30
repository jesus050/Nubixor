-- Gastos operativos y centros de costos. Las compras que incrementan
-- inventario continúan en purchases; esta estructura registra consumos,
-- servicios y demás salidas que no crean existencias.

CREATE SEQUENCE business_expense_number_seq;

CREATE UNIQUE INDEX IF NOT EXISTS branches_id_tenant_unique
  ON branches(id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_id_tenant_unique
  ON suppliers(id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_id_tenant_unique
  ON cash_sessions(id, tenant_id);

CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  monthly_budget NUMERIC(18,2)
    CHECK(monthly_budget IS NULL OR monthly_budget >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, tenant_id)
    REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, code),
  UNIQUE(id, tenant_id)
);

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  accounting_account_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  requires_support BOOLEAN NOT NULL DEFAULT TRUE,
  approval_threshold NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK(approval_threshold >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(accounting_account_id, tenant_id)
    REFERENCES accounting_accounts(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, code),
  UNIQUE(id, tenant_id)
);

CREATE TABLE business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  expense_number TEXT NOT NULL DEFAULT (
    'GST-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('business_expense_number_seq')::text, 6, '0')
  ),
  branch_id UUID NOT NULL,
  cost_center_id UUID NOT NULL,
  category_id UUID NOT NULL,
  supplier_id UUID,
  support_document_id UUID,
  beneficiary_name TEXT,
  supplier_document_number TEXT,
  description TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency CHAR(3) NOT NULL DEFAULT 'COP',
  subtotal NUMERIC(18,2) NOT NULL CHECK(subtotal >= 0),
  tax_total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(tax_total >= 0),
  total NUMERIC(18,2) NOT NULL CHECK(total > 0),
  paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0
    CHECK(paid_amount >= 0 AND paid_amount <= total),
  status TEXT NOT NULL DEFAULT 'SUBMITTED'
    CHECK(status IN (
      'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED',
      'PARTIAL', 'PAID', 'VOID'
    )),
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT
    CHECK(recurrence_rule IS NULL OR recurrence_rule IN ('MONTHLY','BIMONTHLY','QUARTERLY','ANNUAL')),
  submitted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  rejected_at TIMESTAMPTZ,
  decision_notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, tenant_id)
    REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(cost_center_id, tenant_id)
    REFERENCES cost_centers(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(category_id, tenant_id)
    REFERENCES expense_categories(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(supplier_id, tenant_id)
    REFERENCES suppliers(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(support_document_id, tenant_id)
    REFERENCES secure_documents(id, tenant_id) ON DELETE RESTRICT,
  CHECK(due_date IS NULL OR due_date >= issue_date),
  CHECK(
    (supplier_id IS NOT NULL) OR
    NULLIF(BTRIM(COALESCE(beneficiary_name, '')), '') IS NOT NULL
  ),
  CHECK(
    recurring = FALSE OR recurrence_rule IS NOT NULL
  ),
  CHECK(
    status <> 'SUBMITTED' OR
    (submitted_by IS NOT NULL AND submitted_at IS NOT NULL)
  ),
  CHECK(
    status NOT IN ('APPROVED','PARTIAL','PAID') OR
    (approved_by IS NOT NULL AND approved_at IS NOT NULL)
  ),
  CHECK(
    status <> 'REJECTED' OR
    (rejected_by IS NOT NULL AND rejected_at IS NOT NULL
      AND NULLIF(BTRIM(COALESCE(decision_notes, '')), '') IS NOT NULL)
  ),
  UNIQUE(tenant_id, expense_number),
  UNIQUE(id, tenant_id)
);

CREATE TABLE expense_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  expense_id UUID NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(18,2) NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL
    CHECK(payment_method IN ('CASH','BANK_TRANSFER','CARD','CHECK','OTHER')),
  bank_account_id UUID,
  cash_session_id UUID,
  reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(expense_id, tenant_id)
    REFERENCES business_expenses(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(bank_account_id, tenant_id)
    REFERENCES bank_accounts(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(cash_session_id, tenant_id)
    REFERENCES cash_sessions(id, tenant_id) ON DELETE RESTRICT,
  CHECK(
    (payment_method = 'CASH' AND cash_session_id IS NOT NULL AND bank_account_id IS NULL)
    OR
    (payment_method IN ('BANK_TRANSFER','CARD','CHECK')
      AND bank_account_id IS NOT NULL AND cash_session_id IS NULL)
    OR
    (payment_method = 'OTHER' AND cash_session_id IS NULL)
  )
);

CREATE INDEX business_expenses_tenant_status_date
  ON business_expenses(tenant_id, status, issue_date DESC);
CREATE INDEX business_expenses_cost_center
  ON business_expenses(tenant_id, cost_center_id, issue_date DESC);
CREATE INDEX expense_payments_expense
  ON expense_payments(tenant_id, expense_id, payment_date DESC);

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.permission_code
FROM roles role
CROSS JOIN (
  VALUES
    ('expenses.view'),
    ('expenses.manage'),
    ('expenses.approve'),
    ('expenses.pay')
) permission(permission_code)
WHERE role.code IN ('OWNER', 'ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.permission_code
FROM roles role
CROSS JOIN (
  VALUES ('expenses.view'), ('expenses.manage')
) permission(permission_code)
WHERE role.code = 'OPERATIONS'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, 'expenses.view'
FROM roles role
WHERE role.code = 'AUDITOR'
ON CONFLICT DO NOTHING;

INSERT INTO cost_centers(tenant_id, code, name)
SELECT tenant.id, 'GENERAL', 'Administración general'
FROM tenants tenant
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories(
  tenant_id, accounting_account_id, code, name, requires_support
)
SELECT tenant.id, mapping.account_id, seed.code, seed.name, seed.requires_support
FROM tenants tenant
JOIN accounting_account_mappings mapping
  ON mapping.tenant_id = tenant.id AND mapping.purpose = 'GENERAL_EXPENSE'
CROSS JOIN (
  VALUES
    ('ARRIENDO', 'Arriendo', TRUE),
    ('SERVICIOS', 'Servicios públicos e internet', TRUE),
    ('TRANSPORTE', 'Transporte y mensajería', TRUE),
    ('PUBLICIDAD', 'Publicidad y mercadeo', TRUE),
    ('MANTENIMIENTO', 'Mantenimiento y reparaciones', TRUE),
    ('PAPELERIA', 'Papelería y suministros', TRUE),
    ('OTROS', 'Otros gastos operativos', TRUE)
) seed(code, name, requires_support)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION seed_expense_management_for_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  general_expense_account UUID;
BEGIN
  SELECT account_id INTO general_expense_account
  FROM accounting_account_mappings
  WHERE tenant_id = NEW.id AND purpose = 'GENERAL_EXPENSE';

  INSERT INTO cost_centers(tenant_id, code, name)
  VALUES(NEW.id, 'GENERAL', 'Administración general')
  ON CONFLICT DO NOTHING;

  IF general_expense_account IS NOT NULL THEN
    INSERT INTO expense_categories(
      tenant_id, accounting_account_id, code, name, requires_support
    )
    VALUES
      (NEW.id, general_expense_account, 'ARRIENDO', 'Arriendo', TRUE),
      (NEW.id, general_expense_account, 'SERVICIOS', 'Servicios públicos e internet', TRUE),
      (NEW.id, general_expense_account, 'TRANSPORTE', 'Transporte y mensajería', TRUE),
      (NEW.id, general_expense_account, 'PUBLICIDAD', 'Publicidad y mercadeo', TRUE),
      (NEW.id, general_expense_account, 'MANTENIMIENTO', 'Mantenimiento y reparaciones', TRUE),
      (NEW.id, general_expense_account, 'PAPELERIA', 'Papelería y suministros', TRUE),
      (NEW.id, general_expense_account, 'OTROS', 'Otros gastos operativos', TRUE)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_seed_expense_management
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION seed_expense_management_for_tenant();
