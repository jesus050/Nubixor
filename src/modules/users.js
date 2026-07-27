import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { requirePermission } from '../authorization.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';
import { createUserAccessToken } from '../authentication.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_COLORS = new Set(['BLUE', 'PURPLE', 'CYAN', 'AMBER', 'ROSE', 'GREEN']);

export const permissionCatalog = [
  { code: 'dashboard.view', group: 'General', name: 'Ver dashboard', description: 'Consulta indicadores generales.' },
  { code: 'companies.manage', group: 'Administración', name: 'Gestionar empresas', description: 'Crea y actualiza empresas.' },
  { code: 'branches.manage', group: 'Administración', name: 'Gestionar sucursales', description: 'Administra sedes y sucursales.' },
  { code: 'warehouses.manage', group: 'Administración', name: 'Gestionar bodegas', description: 'Administra ubicaciones de inventario.' },
  { code: 'catalog.manage', group: 'Inventario', name: 'Gestionar catálogo', description: 'Crea productos, categorías, marcas e imágenes.' },
  { code: 'inventory.view', group: 'Inventario', name: 'Consultar inventario', description: 'Consulta saldos y movimientos.' },
  { code: 'inventory.adjust', group: 'Inventario', name: 'Ajustar inventario', description: 'Realiza ajustes, transferencias y conteos.' },
  { code: 'purchases.manage', group: 'Abastecimiento', name: 'Gestionar compras', description: 'Crea órdenes y recibe mercancía.' },
  { code: 'sales.operate', group: 'Ventas', name: 'Operar caja y ventas', description: 'Abre caja, cobra y registra ventas.' },
  { code: 'receivables.manage', group: 'Finanzas', name: 'Gestionar cuentas por cobrar', description: 'Registra facturas y recaudos.' },
  { code: 'payables.manage', group: 'Finanzas', name: 'Gestionar cuentas por pagar', description: 'Registra obligaciones y pagos.' },
  { code: 'users.manage', group: 'Seguridad', name: 'Gestionar usuarios y roles', description: 'Invita personas y define sus accesos.' },
  { code: 'audit.view', group: 'Seguridad', name: 'Consultar auditoría', description: 'Consulta trazabilidad de cambios.' },
];

const permissionCodes = new Set(permissionCatalog.map((permission) => permission.code));

router.use(requireTenant);
router.use(requirePermission('users.manage'));

function normalizedText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo supera ${maxLength} caracteres.`,
      422,
      'FIELD_TOO_LONG',
    );
  }
  return normalized;
}

function uuidOrNull(value, fieldName) {
  if (value === null || value === undefined || value === '') return null;
  if (!UUID_PATTERN.test(value)) {
    throw new AppError(
      `${fieldName} debe tener un UUID válido.`,
      422,
      'INVALID_USER_REFERENCE',
    );
  }
  return value;
}

function validatePermissions(value) {
  if (!Array.isArray(value) || !value.length) {
    throw new AppError(
      'Selecciona al menos un permiso para el rol.',
      422,
      'ROLE_PERMISSIONS_REQUIRED',
    );
  }
  const unique = [...new Set(value)];
  if (unique.some((code) => !permissionCodes.has(code))) {
    throw new AppError(
      'El rol contiene un permiso desconocido.',
      422,
      'INVALID_ROLE_PERMISSION',
    );
  }
  return unique;
}

async function assertRoleAndBranch(client, tenantId, roleId, branchId) {
  const role = await client.query(
    `SELECT id, code, name
     FROM roles
     WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
    [roleId, tenantId],
  );
  if (!role.rowCount) {
    throw new AppError(
      'El rol no pertenece a la empresa activa.',
      404,
      'ROLE_NOT_FOUND',
    );
  }
  if (branchId) {
    const branch = await client.query(
      `SELECT id FROM branches
       WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
      [branchId, tenantId],
    );
    if (!branch.rowCount) {
      throw new AppError(
        'La sucursal no pertenece a la empresa activa.',
        404,
        'BRANCH_NOT_FOUND',
      );
    }
  }
  return role.rows[0];
}

async function protectLastOwner(client, tenantId, membership, nextRoleCode, nextStatus) {
  if (membership.role_code !== 'OWNER' || membership.status !== 'ACTIVE') return;
  if (nextRoleCode === 'OWNER' && nextStatus === 'ACTIVE') return;
  const owners = await client.query(
    `SELECT COUNT(*)::integer count
     FROM tenant_users tu
     JOIN roles r ON r.id = tu.role_id AND r.tenant_id = tu.tenant_id
     WHERE tu.tenant_id = $1
       AND tu.status = 'ACTIVE'
       AND r.code = 'OWNER'`,
    [tenantId],
  );
  if (Number(owners.rows[0].count) <= 1) {
    throw new AppError(
      'La empresa debe conservar al menos un propietario activo.',
      409,
      'LAST_OWNER_PROTECTED',
    );
  }
}

router.get('/permissions', (_req, res) => {
  res.json(permissionCatalog);
});

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       COUNT(*)::integer total_members,
       COUNT(*) FILTER (WHERE tu.status = 'ACTIVE')::integer active_members,
       COUNT(*) FILTER (WHERE tu.status = 'INVITED')::integer pending_invites,
       COUNT(*) FILTER (WHERE tu.status = 'SUSPENDED')::integer suspended_members,
       COUNT(DISTINCT tu.role_id)::integer roles_in_use
     FROM tenant_users tu
     WHERE tu.tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/roles', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT r.id, r.code, r.name, r.description, r.color, r.is_system,
            r.active, r.created_at,
            COUNT(DISTINCT tu.user_id)::integer member_count,
            COALESCE(
              json_agg(rp.permission_code ORDER BY rp.permission_code)
                FILTER (WHERE rp.permission_code IS NOT NULL),
              '[]'::json
            ) permissions
     FROM roles r
     LEFT JOIN role_permissions rp
       ON rp.role_id = r.id AND rp.tenant_id = r.tenant_id
     LEFT JOIN tenant_users tu
       ON tu.role_id = r.id AND tu.tenant_id = r.tenant_id
     WHERE r.tenant_id = $1 AND r.active = TRUE
     GROUP BY r.id
     ORDER BY r.is_system DESC,
       CASE r.code
         WHEN 'OWNER' THEN 1 WHEN 'ADMIN' THEN 2 WHEN 'OPERATIONS' THEN 3
         WHEN 'CASHIER' THEN 4 WHEN 'AUDITOR' THEN 5 ELSE 6
       END,
       r.name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.job_title, u.phone,
            u.last_login_at, u.created_at, tu.status, tu.invited_at,
            tu.joined_at, tu.branch_id, b.name branch_name,
            r.id role_id, r.code role_code, r.name role_name, r.color role_color
     FROM tenant_users tu
     JOIN users u ON u.id = tu.user_id
     JOIN roles r ON r.id = tu.role_id AND r.tenant_id = tu.tenant_id
     LEFT JOIN branches b ON b.id = tu.branch_id AND b.tenant_id = tu.tenant_id
     WHERE tu.tenant_id = $1
     ORDER BY
       CASE tu.status WHEN 'ACTIVE' THEN 1 WHEN 'INVITED' THEN 2 ELSE 3 END,
       u.full_name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/invite', asyncHandler(async (req, res) => {
  const email = normalizedText(req.body.email, 254)?.toLowerCase();
  const fullName = normalizedText(req.body.fullName, 160);
  const jobTitle = normalizedText(req.body.jobTitle, 120);
  const phone = normalizedText(req.body.phone, 40);
  const roleId = uuidOrNull(req.body.roleId, 'El rol');
  const branchId = uuidOrNull(req.body.branchId, 'La sucursal');
  if (!email || !EMAIL_PATTERN.test(email) || !fullName || !roleId) {
    throw new AppError(
      'Nombre, correo válido y rol son obligatorios.',
      422,
      'INVALID_USER_INVITATION',
    );
  }
  const invited = await withTransaction(async (client) => {
    const role = await assertRoleAndBranch(
      client,
      req.context.tenantId,
      roleId,
      branchId,
    );
    let user = await client.query(
      'SELECT * FROM users WHERE lower(email) = $1 FOR UPDATE',
      [email],
    );
    if (!user.rowCount) {
      user = await client.query(
        `INSERT INTO users(email, full_name, job_title, phone, status)
         VALUES($1,$2,$3,$4,'INVITED')
         RETURNING *`,
        [email, fullName, jobTitle, phone],
      );
    }
    const existing = await client.query(
      `SELECT 1 FROM tenant_users
       WHERE tenant_id = $1 AND user_id = $2`,
      [req.context.tenantId, user.rows[0].id],
    );
    if (existing.rowCount) {
      throw new AppError(
        'Esta persona ya pertenece a la empresa.',
        409,
        'USER_ALREADY_MEMBER',
      );
    }
    await client.query(
      `INSERT INTO tenant_users(
         tenant_id, user_id, role_code, role_id, status, branch_id, invited_at
       )
       VALUES($1,$2,$3,$4,'INVITED',$5,now())`,
      [
        req.context.tenantId,
        user.rows[0].id,
        role.code,
        role.id,
        branchId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'user.invited',
      entityType: 'tenant_user',
      entityId: user.rows[0].id,
      after: {
        email,
        fullName,
        roleCode: role.code,
        branchId,
        status: 'INVITED',
      },
      reason: normalizedText(req.body.reason, 300) || 'Invitación desde Usuarios',
    });
    const activationToken = await createUserAccessToken(client, {
      userId: user.rows[0].id,
      createdBy: req.context.userId,
    });
    return {
      ...user.rows[0],
      role_id: role.id,
      role_code: role.code,
      role_name: role.name,
      branch_id: branchId,
      membership_status: 'INVITED',
      activationToken,
    };
  });
  res.status(201).json(invited);
}));

router.post('/:id/access-link', asyncHandler(async (req, res) => {
  const userId = uuidOrNull(req.params.id, 'El usuario');
  const result = await withTransaction(async (client) => {
    const membership = await client.query(
      `SELECT u.id, u.email, u.full_name, tu.status
       FROM tenant_users tu
       JOIN users u ON u.id = tu.user_id
       WHERE tu.tenant_id = $1 AND tu.user_id = $2
       FOR UPDATE`,
      [req.context.tenantId, userId],
    );
    if (!membership.rowCount || membership.rows[0].status === 'SUSPENDED') {
      throw new AppError(
        'Activa la membresía antes de generar un acceso.',
        409,
        'USER_ACCESS_LINK_UNAVAILABLE',
      );
    }
    const activationToken = await createUserAccessToken(client, {
      userId,
      createdBy: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'user.access_link_created',
      entityType: 'tenant_user',
      entityId: userId,
      after: { expiresInHours: 72 },
      reason: normalizedText(req.body.reason, 300) || 'Recuperación de acceso',
    });
    return { ...membership.rows[0], activationToken };
  });
  res.status(201).json(result);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const userId = uuidOrNull(req.params.id, 'El usuario');
  const roleId = uuidOrNull(req.body.roleId, 'El rol');
  const branchId = uuidOrNull(req.body.branchId, 'La sucursal');
  const fullName = normalizedText(req.body.fullName, 160);
  const jobTitle = normalizedText(req.body.jobTitle, 120);
  const phone = normalizedText(req.body.phone, 40);
  const status = normalizedText(req.body.status, 20)?.toUpperCase();
  if (!userId || !roleId || !fullName || !['INVITED', 'ACTIVE', 'SUSPENDED'].includes(status)) {
    throw new AppError(
      'Nombre, rol y estado son obligatorios.',
      422,
      'INVALID_USER_UPDATE',
    );
  }
  const updated = await withTransaction(async (client) => {
    const membership = await client.query(
      `SELECT tu.*, r.code role_code
       FROM tenant_users tu
       JOIN roles r ON r.id = tu.role_id AND r.tenant_id = tu.tenant_id
       WHERE tu.tenant_id = $1 AND tu.user_id = $2
       FOR UPDATE`,
      [req.context.tenantId, userId],
    );
    if (!membership.rowCount) {
      throw new AppError(
        'El usuario no pertenece a la empresa activa.',
        404,
        'USER_NOT_FOUND',
      );
    }
    const role = await assertRoleAndBranch(
      client,
      req.context.tenantId,
      roleId,
      branchId,
    );
    await protectLastOwner(
      client,
      req.context.tenantId,
      membership.rows[0],
      role.code,
      status,
    );
    const before = membership.rows[0];
    await client.query(
      `UPDATE users
       SET full_name = $2, job_title = $3, phone = $4,
           status = CASE WHEN $5 = 'ACTIVE' THEN 'ACTIVE' ELSE status END,
           updated_at = now()
       WHERE id = $1`,
      [userId, fullName, jobTitle, phone, status],
    );
    const result = await client.query(
      `UPDATE tenant_users
       SET role_id = $3, role_code = $4, branch_id = $5, status = $6,
           joined_at = CASE
             WHEN $6 = 'ACTIVE' THEN COALESCE(joined_at, now())
             ELSE joined_at
           END,
           updated_at = now()
       WHERE tenant_id = $1 AND user_id = $2
       RETURNING *`,
      [
        req.context.tenantId,
        userId,
        role.id,
        role.code,
        branchId,
        status,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'user.membership_updated',
      entityType: 'tenant_user',
      entityId: userId,
      before,
      after: result.rows[0],
      reason: normalizedText(req.body.reason, 300) || 'Actualización de acceso',
    });
    return result.rows[0];
  });
  res.json(updated);
}));

router.post('/roles', asyncHandler(async (req, res) => {
  const name = normalizedText(req.body.name, 100);
  const description = normalizedText(req.body.description, 300);
  const color = normalizedText(req.body.color, 20)?.toUpperCase() || 'BLUE';
  const permissions = validatePermissions(req.body.permissions);
  if (!name || !ROLE_COLORS.has(color)) {
    throw new AppError(
      'Nombre y color válido son obligatorios.',
      422,
      'INVALID_ROLE',
    );
  }
  const role = await withTransaction(async (client) => {
    const code = `CUSTOM_${Date.now().toString(36).toUpperCase()}`;
    const created = await client.query(
      `INSERT INTO roles(
         tenant_id, code, name, description, color, is_system
       )
       VALUES($1,$2,$3,$4,$5,FALSE)
       RETURNING *`,
      [req.context.tenantId, code, name, description, color],
    );
    for (const permission of permissions) {
      await client.query(
        `INSERT INTO role_permissions(tenant_id, role_id, permission_code)
         VALUES($1,$2,$3)`,
        [req.context.tenantId, created.rows[0].id, permission],
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'role.created',
      entityType: 'role',
      entityId: created.rows[0].id,
      after: { ...created.rows[0], permissions },
      reason: description,
    });
    return { ...created.rows[0], permissions, member_count: 0 };
  });
  res.status(201).json(role);
}));

router.patch('/roles/:id', asyncHandler(async (req, res) => {
  const roleId = uuidOrNull(req.params.id, 'El rol');
  const name = normalizedText(req.body.name, 100);
  const description = normalizedText(req.body.description, 300);
  const color = normalizedText(req.body.color, 20)?.toUpperCase() || 'BLUE';
  const permissions = validatePermissions(req.body.permissions);
  if (!roleId || !name || !ROLE_COLORS.has(color)) {
    throw new AppError(
      'Nombre, color y permisos válidos son obligatorios.',
      422,
      'INVALID_ROLE',
    );
  }
  const role = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM roles
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [roleId, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError('No encontramos el rol.', 404, 'ROLE_NOT_FOUND');
    }
    if (current.rows[0].is_system) {
      throw new AppError(
        'Los roles base están protegidos. Crea uno personalizado.',
        409,
        'SYSTEM_ROLE_PROTECTED',
      );
    }
    const updated = await client.query(
      `UPDATE roles
       SET name = $3, description = $4, color = $5, updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [roleId, req.context.tenantId, name, description, color],
    );
    await client.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND tenant_id = $2',
      [roleId, req.context.tenantId],
    );
    for (const permission of permissions) {
      await client.query(
        `INSERT INTO role_permissions(tenant_id, role_id, permission_code)
         VALUES($1,$2,$3)`,
        [req.context.tenantId, roleId, permission],
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'role.updated',
      entityType: 'role',
      entityId: roleId,
      before: current.rows[0],
      after: { ...updated.rows[0], permissions },
      reason: description,
    });
    return { ...updated.rows[0], permissions };
  });
  res.json(role);
}));

export default router;
