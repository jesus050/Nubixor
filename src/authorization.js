import { query } from './db.js';
import { AppError } from './shared/errors.js';

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ALL_PERMISSIONS = [
  'dashboard.view',
  'companies.manage',
  'branches.manage',
  'warehouses.manage',
  'catalog.manage',
  'inventory.view',
  'inventory.adjust',
  'purchases.manage',
  'sales.operate',
  'receivables.manage',
  'payables.manage',
  'users.manage',
  'audit.view',
];

const BASE_ROLES = [
  {
    code: 'OWNER',
    name: 'Propietario',
    description: 'Control total de la empresa, el equipo y la configuración.',
    color: 'PURPLE',
    permissions: ALL_PERMISSIONS,
  },
  {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Administra la operación diaria y la mayoría de módulos.',
    color: 'BLUE',
    permissions: ALL_PERMISSIONS,
  },
  {
    code: 'OPERATIONS',
    name: 'Operaciones',
    description: 'Gestiona catálogo, inventario, compras y ventas.',
    color: 'CYAN',
    permissions: [
      'dashboard.view',
      'catalog.manage',
      'inventory.view',
      'inventory.adjust',
      'purchases.manage',
      'sales.operate',
    ],
  },
  {
    code: 'CASHIER',
    name: 'Caja',
    description: 'Opera caja, ventas y consulta existencias.',
    color: 'GREEN',
    permissions: ['dashboard.view', 'inventory.view', 'sales.operate'],
  },
  {
    code: 'AUDITOR',
    name: 'Auditor',
    description: 'Consulta información financiera, inventario y trazabilidad.',
    color: 'AMBER',
    permissions: [
      'dashboard.view',
      'inventory.view',
      'receivables.manage',
      'payables.manage',
      'audit.view',
    ],
  },
];

export async function bootstrapTenantAccess(client, { tenantId, ownerUserId }) {
  if (!UUID_PATTERN.test(ownerUserId || '')) {
    throw new AppError(
      'Debes identificar al propietario de la nueva empresa.',
      401,
      'OWNER_CONTEXT_REQUIRED',
    );
  }
  const user = await client.query(
    `SELECT id FROM users WHERE id = $1 AND status = 'ACTIVE'`,
    [ownerUserId],
  );
  if (!user.rowCount) {
    throw new AppError(
      'El propietario indicado no tiene una cuenta activa.',
      403,
      'OWNER_NOT_ACTIVE',
    );
  }
  let ownerRole;
  for (const template of BASE_ROLES) {
    const role = await client.query(
      `INSERT INTO roles(
         tenant_id, code, name, description, color, is_system
       )
       VALUES($1,$2,$3,$4,$5,TRUE)
       ON CONFLICT(tenant_id, code) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           color = EXCLUDED.color,
           active = TRUE,
           updated_at = now()
       RETURNING id, code`,
      [
        tenantId,
        template.code,
        template.name,
        template.description,
        template.color,
      ],
    );
    for (const permission of template.permissions) {
      await client.query(
        `INSERT INTO role_permissions(tenant_id, role_id, permission_code)
         VALUES($1,$2,$3)
         ON CONFLICT DO NOTHING`,
        [tenantId, role.rows[0].id, permission],
      );
    }
    if (template.code === 'OWNER') ownerRole = role.rows[0];
  }
  await client.query(
    `INSERT INTO tenant_users(
       tenant_id, user_id, role_code, role_id, status, joined_at
     )
     VALUES($1,$2,'OWNER',$3,'ACTIVE',now())
     ON CONFLICT(tenant_id, user_id) DO UPDATE
     SET role_code = 'OWNER',
         role_id = EXCLUDED.role_id,
         status = 'ACTIVE',
         joined_at = COALESCE(tenant_users.joined_at, now()),
         updated_at = now()`,
    [tenantId, ownerUserId, ownerRole.id],
  );
}

export function requirePermission(permissionCode) {
  return async function permissionGuard(req, _res, next) {
    try {
      const { tenantId, userId } = req.context || {};
      if (!userId || !UUID_PATTERN.test(userId)) {
        throw new AppError(
          'Debes identificar al usuario para realizar esta acción.',
          401,
          'USER_CONTEXT_REQUIRED',
        );
      }
      const result = await query(
        `SELECT u.id, u.full_name, u.email, tu.status membership_status,
                r.id role_id, r.code role_code, r.name role_name
         FROM tenant_users tu
         JOIN users u ON u.id = tu.user_id
         JOIN roles r
           ON r.id = tu.role_id
          AND r.tenant_id = tu.tenant_id
          AND r.active = TRUE
         JOIN role_permissions rp
           ON rp.role_id = r.id
          AND rp.tenant_id = tu.tenant_id
          AND rp.permission_code = $3
         WHERE tu.tenant_id = $1
           AND tu.user_id = $2
           AND tu.status = 'ACTIVE'
           AND u.status = 'ACTIVE'`,
        [tenantId, userId, permissionCode],
      );
      if (!result.rowCount) {
        throw new AppError(
          'Tu rol no permite realizar esta acción.',
          403,
          'PERMISSION_DENIED',
        );
      }
      req.context.user = result.rows[0];
      next();
    } catch (error) {
      next(error);
    }
  };
}
