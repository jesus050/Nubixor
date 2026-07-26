ALTER TABLE users
  ADD COLUMN job_title TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN last_login_at TIMESTAMPTZ;

ALTER TABLE users
  ADD CONSTRAINT users_status_check
  CHECK(status IN ('INVITED','ACTIVE','SUSPENDED'));

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'BLUE'
    CHECK(color IN ('BLUE','PURPLE','CYAN','AMBER','ROSE','GREEN')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE role_permissions (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  PRIMARY KEY(role_id, permission_code)
);

ALTER TABLE tenant_users
  ADD COLUMN role_id UUID REFERENCES roles(id),
  ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('INVITED','ACTIVE','SUSPENDED')),
  ADD COLUMN branch_id UUID REFERENCES branches(id),
  ADD COLUMN invited_at TIMESTAMPTZ,
  ADD COLUMN joined_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX tenant_users_tenant_status
  ON tenant_users(tenant_id, status);
CREATE INDEX role_permissions_tenant
  ON role_permissions(tenant_id, permission_code);

INSERT INTO roles(id, tenant_id, code, name, description, color, is_system)
VALUES
  (
    '51000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'OWNER',
    'Propietario',
    'Control total de la empresa, el equipo y la configuración.',
    'PURPLE',
    TRUE
  ),
  (
    '51000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'ADMIN',
    'Administrador',
    'Administra la operación diaria y la mayoría de módulos.',
    'BLUE',
    TRUE
  ),
  (
    '51000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'OPERATIONS',
    'Operaciones',
    'Gestiona catálogo, inventario, compras y ventas.',
    'CYAN',
    TRUE
  ),
  (
    '51000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'CASHIER',
    'Caja',
    'Opera caja, ventas y consulta existencias.',
    'GREEN',
    TRUE
  ),
  (
    '51000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'AUDITOR',
    'Auditor',
    'Consulta información financiera, inventario y trazabilidad.',
    'AMBER',
    TRUE
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT
  '00000000-0000-0000-0000-000000000001',
  role.id,
  permission.permission_code
FROM roles role
CROSS JOIN (
  VALUES
    ('dashboard.view'),
    ('companies.manage'),
    ('branches.manage'),
    ('warehouses.manage'),
    ('catalog.manage'),
    ('inventory.view'),
    ('inventory.adjust'),
    ('purchases.manage'),
    ('sales.operate'),
    ('receivables.manage'),
    ('payables.manage'),
    ('users.manage'),
    ('audit.view')
) permission(permission_code)
WHERE role.id IN (
  '51000000-0000-0000-0000-000000000001',
  '51000000-0000-0000-0000-000000000002'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
VALUES
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000003', 'dashboard.view'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000003', 'catalog.manage'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000003', 'inventory.view'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000003', 'inventory.adjust'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000003', 'purchases.manage'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000003', 'sales.operate'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000004', 'dashboard.view'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000004', 'inventory.view'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000004', 'sales.operate'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000005', 'dashboard.view'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000005', 'inventory.view'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000005', 'receivables.manage'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000005', 'payables.manage'),
  ('00000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000005', 'audit.view')
ON CONFLICT DO NOTHING;

INSERT INTO users(
  id, email, full_name, job_title, status, last_login_at
)
VALUES(
  '50000000-0000-0000-0000-000000000001',
  'admin@megasuite.local',
  'Administrador MegaSuite',
  'Propietario',
  'ACTIVE',
  now()
)
ON CONFLICT(email) DO NOTHING;

INSERT INTO tenant_users(
  tenant_id, user_id, role_code, role_id, status, joined_at
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'OWNER',
  '51000000-0000-0000-0000-000000000001',
  'ACTIVE',
  now()
FROM users
WHERE email = 'admin@megasuite.local'
ON CONFLICT(tenant_id, user_id) DO UPDATE
SET role_code = EXCLUDED.role_code,
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status,
    joined_at = COALESCE(tenant_users.joined_at, EXCLUDED.joined_at),
    updated_at = now();
