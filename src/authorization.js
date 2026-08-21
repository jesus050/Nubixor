import { query } from './db.js';
import { AppError } from './shared/errors.js';

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const LEGACY_PERMISSIONS = [
  'dashboard.view',
  'companies.manage',
  'branches.manage',
  'warehouses.manage',
  'catalog.manage',
  'inventory.view',
  'inventory.adjust',
  'logistics.view',
  'logistics.count',
  'logistics.price',
  'logistics.approve',
  'logistics.labels',
  'purchases.manage',
  'sales.operate',
  'receivables.manage',
  'payables.manage',
  'expenses.view',
  'expenses.manage',
  'expenses.approve',
  'expenses.pay',
  'parties.view',
  'parties.manage',
  'users.manage',
  'audit.view',
  'reports.view',
  'billing.manage',
  'accounting.manage',
  'documents.manage',
  'media.upload',
  'media.delete',
  'product.image.manage',
  'inventory.evidence.view',
  'inventory.evidence.upload',
  'inventory.adjustment.approve',
  'inventory.count.perform',
  'inventory.count.recount',
  'inventory.count.view_expected_stock',
  'payroll.view',
  'payroll.manage',
  'payroll.approve',
];

const ENTERPRISE_PERMISSION_DETAILS = [
  ['dashboard.financial.view', 'Dashboard', 'Ver indicadores financieros'],
  ['dashboard.margin.view', 'Dashboard', 'Ver márgenes'],
  ['dashboard.marketing.view', 'Dashboard', 'Ver indicadores comerciales'],
  ['dashboard.inventory.view', 'Dashboard', 'Ver indicadores de inventario'],
  ['company.view', 'Administración', 'Ver empresa'], ['branch.view', 'Administración', 'Ver sucursales'],
  ['warehouse.view', 'Administración', 'Ver bodegas'], ['warehouse.manage', 'Administración', 'Gestionar bodegas'],
  ['product.view', 'Catálogo', 'Ver productos'], ['product.create', 'Catálogo', 'Crear productos'],
  ['product.edit', 'Catálogo', 'Editar productos'], ['product.delete', 'Catálogo', 'Eliminar productos'],
  ['product.cost.view', 'Catálogo', 'Ver costos'], ['product.margin.view', 'Catálogo', 'Ver márgenes'],
  ['product.price.view', 'Catálogo', 'Ver precios'], ['product.price.edit', 'Catálogo', 'Editar precios'],
  ['product.image.manage', 'Catálogo', 'Gestionar imágenes'],
  ['inventory.receive', 'Inventario', 'Recibir mercancía'], ['inventory.transfer', 'Inventario', 'Transferir inventario'],
  ['inventory.count.view', 'Inventario', 'Ver conteos'], ['inventory.adjustment.request', 'Inventario', 'Solicitar ajustes'],
  ['inventory.adjustment.execute', 'Inventario', 'Ejecutar ajustes aprobados'],
  ['inventory.damage.report', 'Inventario', 'Reportar averías'], ['inventory.damage.review', 'Inventario', 'Revisar averías'],
  ['sale.view', 'Ventas', 'Ver ventas'], ['sale.create', 'Ventas', 'Crear ventas'],
  ['sale.cancel', 'Ventas', 'Anular ventas'], ['sale.return', 'Ventas', 'Registrar devoluciones'],
  ['sale.discount.apply', 'Ventas', 'Aplicar descuentos autorizados'], ['sale.discount.override', 'Ventas', 'Autorizar descuentos especiales'],
  ['pos.use', 'Ventas', 'Usar punto de venta'],
  ['cash.open', 'Caja', 'Abrir caja'], ['cash.close', 'Caja', 'Cerrar caja'], ['cash.view', 'Caja', 'Ver caja'],
  ['cash.movement.create', 'Caja', 'Registrar movimientos de caja'], ['cash.report.view', 'Caja', 'Ver reportes de caja'],
  ['customer.view', 'Clientes', 'Ver clientes'], ['customer.create', 'Clientes', 'Crear clientes'],
  ['customer.edit', 'Clientes', 'Editar clientes'], ['customer.group.manage', 'Clientes', 'Gestionar segmentos de clientes'],
  ['supplier.view', 'Compras', 'Ver proveedores'], ['supplier.manage', 'Compras', 'Gestionar proveedores'],
  ['purchase.view', 'Compras', 'Ver compras'], ['purchase.create', 'Compras', 'Crear compras'],
  ['purchase.receive', 'Compras', 'Recibir compras'], ['purchase.approve', 'Compras', 'Aprobar compras'],
  ['receivable.view', 'Finanzas', 'Ver cuentas por cobrar'], ['receivable.manage', 'Finanzas', 'Gestionar cuentas por cobrar'],
  ['payable.view', 'Finanzas', 'Ver cuentas por pagar'], ['payable.manage', 'Finanzas', 'Gestionar cuentas por pagar'],
  ['bank.view', 'Finanzas', 'Ver bancos'], ['bank.manage', 'Finanzas', 'Gestionar bancos'],
  ['accounting.view', 'Contabilidad', 'Ver contabilidad'], ['accounting.manage', 'Contabilidad', 'Gestionar contabilidad'],
  ['report.export', 'Reportes', 'Exportar reportes'], ['billing.view', 'Facturación', 'Ver facturación electrónica'],
  ['billing.manage', 'Facturación', 'Gestionar facturación electrónica'],
  ['user.view', 'Seguridad', 'Ver usuarios'], ['user.manage', 'Seguridad', 'Gestionar usuarios y roles'],
  ['configuration.view', 'Configuración', 'Ver configuración'], ['configuration.manage', 'Configuración', 'Gestionar configuración'],
  ['commercial.view', 'Centro comercial', 'Ver planificación comercial'],
  ['commercial.manage', 'Centro comercial', 'Gestionar planificación comercial'],
  ['promotion.view', 'Centro comercial', 'Ver promociones'], ['promotion.manage', 'Centro comercial', 'Gestionar promociones'],
  ['marketing.budget.view', 'Marketing', 'Ver presupuesto comercial'], ['marketing.budget.manage', 'Marketing', 'Gestionar presupuesto comercial'],
  ['marketing.campaign.view', 'Marketing', 'Ver campañas'], ['marketing.campaign.manage', 'Marketing', 'Gestionar campañas'],
  ['marketing.performance.view', 'Marketing', 'Ver resultados de campañas'],
  ['field_sales.view', 'Ventas', 'Ver ventas de campo'], ['field_sales.manage', 'Ventas', 'Gestionar ventas de campo'],
];

export const PERMISSION_CATALOG = [
  ...LEGACY_PERMISSIONS.map((code) => ({
    code,
    group: 'Compatibilidad',
    name: code,
    description: 'Permiso de compatibilidad para módulos existentes.',
  })),
  ...ENTERPRISE_PERMISSION_DETAILS.map(([code, group, name]) => ({
    code,
    group,
    name,
    description: `Permite ${name.toLowerCase()}.`,
  })),
];

export const ALL_PERMISSIONS = [...new Set(PERMISSION_CATALOG.map((permission) => permission.code))];

const rolePermissions = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter((permission) => ![
    'companies.manage', 'configuration.manage', 'billing.manage', 'accounting.manage',
  ].includes(permission)),
  SUPERVISOR: [
    'dashboard.view', 'dashboard.inventory.view', 'inventory.view', 'inventory.count.view',
    'inventory.count.view_expected_stock', 'inventory.count.recount', 'inventory.adjustment.approve',
    'inventory.adjustment.execute', 'inventory.damage.review', 'logistics.view', 'logistics.approve',
    'logistics.labels', 'product.view', 'product.price.view', 'sale.view', 'cash.view',
    'cash.report.view', 'reports.view', 'report.export', 'commercial.view',
    'commercial_planning.view', 'commercial_planning.supervise', 'audit.view',
  ],
  WAREHOUSE: [
    'dashboard.view', 'dashboard.inventory.view', 'product.view', 'product.price.view',
    'product.image.manage', 'inventory.view', 'inventory.receive', 'inventory.transfer',
    'inventory.count.view', 'inventory.count.perform', 'inventory.count.recount',
    'inventory.adjustment.request', 'inventory.damage.report', 'inventory.evidence.view',
    'inventory.evidence.upload', 'media.upload', 'logistics.view', 'logistics.count',
    'logistics.labels', 'purchase.view', 'purchase.receive', 'warehouse.view',
  ],
  CASHIER: [
    'dashboard.view', 'product.view', 'product.price.view', 'inventory.view', 'sale.view',
    'sale.create', 'sale.return', 'sale.discount.apply', 'pos.use', 'cash.open', 'cash.close',
    'cash.view', 'cash.movement.create', 'cash.report.view', 'customer.view', 'customer.create',
  ],
  SELLER: [
    'dashboard.view', 'product.view', 'product.price.view', 'inventory.view', 'sale.view',
    'sale.create', 'sale.discount.apply', 'customer.view', 'customer.create', 'customer.edit',
    'promotion.view', 'commercial.view', 'field_sales.view', 'field_sales.manage',
  ],
  MARKETING: [
    'dashboard.view', 'dashboard.marketing.view', 'dashboard.inventory.view', 'product.view',
    'product.price.view', 'product.image.manage', 'inventory.view', 'customer.view',
    'customer.group.manage', 'commercial.view', 'commercial.manage', 'promotion.view',
    'promotion.manage', 'marketing.budget.view', 'marketing.budget.manage',
    'marketing.campaign.view', 'marketing.campaign.manage', 'marketing.performance.view',
    'commercial_planning.view', 'commercial_planning.marketing', 'media.upload',
  ],
  ACCOUNTANT: [
    'dashboard.view', 'dashboard.financial.view', 'sale.view', 'cash.view', 'cash.report.view',
    'receivable.view', 'receivable.manage', 'payable.view', 'payable.manage', 'bank.view',
    'bank.manage', 'accounting.view', 'accounting.manage', 'reports.view', 'report.export',
    'billing.view', 'audit.view',
  ],
  OPERATIONS: [
    'dashboard.view', 'catalog.manage', 'inventory.view', 'inventory.adjust', 'logistics.view',
    'logistics.count', 'logistics.price', 'logistics.labels', 'purchases.manage', 'expenses.view',
    'expenses.manage', 'parties.view', 'parties.manage', 'sales.operate', 'reports.view',
  ],
  AUDITOR: ['dashboard.view', 'inventory.view', 'logistics.view', 'receivables.manage', 'payables.manage', 'expenses.view', 'parties.view', 'audit.view', 'reports.view'],
};

export const BASE_ROLES = [
  {
    code: 'OWNER',
    name: 'Propietario',
    description: 'Control total de la empresa, el equipo y la configuración.',
    color: 'PURPLE',
    permissions: rolePermissions.OWNER,
  },
  {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Administra la operación diaria sin acceso a infraestructura SaaS.',
    color: 'BLUE',
    permissions: rolePermissions.ADMIN,
  },
  {
    code: 'SUPERVISOR', name: 'Supervisor', description: 'Supervisa inventario y aprueba diferencias sin gestionar la plataforma.', color: 'AMBER', permissions: rolePermissions.SUPERVISOR,
  },
  {
    code: 'WAREHOUSE', name: 'Bodeguero', description: 'Recibe, cuenta, transfiere y documenta mercancía; no aprueba sus propios ajustes.', color: 'CYAN', permissions: rolePermissions.WAREHOUSE,
  },
  {
    code: 'OPERATIONS',
    name: 'Operaciones',
    description: 'Gestiona catálogo, inventario, compras y ventas.',
    color: 'CYAN',
    permissions: rolePermissions.OPERATIONS,
  },
  {
    code: 'CASHIER',
    name: 'Caja',
    description: 'Opera exclusivamente caja, ventas y cobros del punto de venta.',
    color: 'GREEN',
    permissions: rolePermissions.CASHIER,
  },
  {
    code: 'SELLER', name: 'Vendedor', description: 'Gestiona ventas, clientes y pedidos comerciales asignados.', color: 'GREEN', permissions: rolePermissions.SELLER,
  },
  {
    code: 'MARKETING', name: 'Marketing', description: 'Gestiona campañas y presupuesto comercial sin acceder a finanzas contables.', color: 'ROSE', permissions: rolePermissions.MARKETING,
  },
  {
    code: 'ACCOUNTANT', name: 'Contador', description: 'Gestiona cartera, bancos, contabilidad y reportes financieros.', color: 'BLUE', permissions: rolePermissions.ACCOUNTANT,
  },
  {
    code: 'AUDITOR',
    name: 'Auditor',
    description: 'Consulta información financiera, inventario y trazabilidad.',
    color: 'AMBER',
    permissions: rolePermissions.AUDITOR,
  },
];

/**
 * Ensures that every tenant has the current set of protected operational
 * roles. This is deliberately additive: legacy roles and current user
 * assignments are never removed or reassigned.
 *
 * It is also used as a small self-healing guard for tenants created before a
 * new base role was introduced in a later migration.
 */
export async function ensureTenantBaseRoles(client, tenantId) {
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
           is_system = TRUE,
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
  return ownerRole;
}

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
  const ownerRole = await ensureTenantBaseRoles(client, tenantId);
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
  return requireAnyPermission([permissionCode]);
}

export function requireAnyPermission(permissionCodes) {
  return async function permissionGuard(req, _res, next) {
    try {
      const { tenantId, userId } = req.context || {};
      if (!tenantId || !UUID_PATTERN.test(tenantId)) {
        throw new AppError(
          'Selecciona una empresa válida para continuar.',
          400,
          'TENANT_CONTEXT_REQUIRED',
        );
      }
      if (!userId || !UUID_PATTERN.test(userId)) {
        throw new AppError(
          'Inicia sesión para realizar esta acción.',
          401,
          'USER_CONTEXT_REQUIRED',
        );
      }
      if (req.context.requestedTenantId && req.context.requestedTenantId !== tenantId) {
        throw new AppError(
          'La empresa solicitada no coincide con el contexto seguro de la sesión.',
          409,
          'TENANT_CONTEXT_MISMATCH',
        );
      }
      const result = await query(
        `SELECT u.id, u.full_name, u.email, tu.status membership_status,
                r.id role_id, r.code role_code, r.name role_name,
                tu.branch_id
         FROM tenant_users tu
         JOIN users u ON u.id = tu.user_id
         JOIN roles r
           ON r.id = tu.role_id
          AND r.tenant_id = tu.tenant_id
          AND r.active = TRUE
         JOIN role_permissions rp
           ON rp.role_id = r.id
          AND rp.tenant_id = tu.tenant_id
          AND rp.permission_code = ANY($3::text[])
         WHERE tu.tenant_id = $1
           AND tu.user_id = $2
           AND tu.status = 'ACTIVE'
           AND u.status = 'ACTIVE'`,
        [tenantId, userId, permissionCodes],
      );
      if (!result.rowCount) {
        throw new AppError(
          'Tu rol no permite realizar esta acción.',
          403,
          'PERMISSION_DENIED',
        );
      }
      req.context.user = result.rows[0];
      req.context.branchId = result.rows[0].branch_id || null;
      const requestedBranchId = req.body?.branchId || req.query?.branchId || null;
      const requestPath = `${req.baseUrl}${req.path}`;
      if (result.rows[0].branch_id && requestPath.startsWith('/api/audit')) {
        throw new AppError(
          'La auditoría completa requiere acceso a toda la empresa.',
          403,
          'BRANCH_SCOPE_DENIED',
        );
      }
      if (result.rows[0].branch_id &&
          req.method !== 'GET' &&
          (['/api/companies', '/api/branches'].includes(requestPath) ||
           requestPath.startsWith('/api/users'))) {
        throw new AppError(
          'Un acceso limitado a sucursal no puede cambiar la estructura empresarial.',
          403,
          'BRANCH_SCOPE_DENIED',
        );
      }
      if (result.rows[0].branch_id && requestedBranchId &&
          result.rows[0].branch_id !== requestedBranchId) {
        throw new AppError(
          'Tu acceso está limitado a otra sucursal.',
          403,
          'BRANCH_SCOPE_DENIED',
        );
      }
      const warehouseIds = [
        req.body?.warehouseId,
        req.body?.sourceWarehouseId,
        req.body?.destinationWarehouseId,
        ...(Array.isArray(req.body?.items)
          ? req.body.items.map((item) => item?.warehouseId)
          : []),
      ].filter(Boolean);
      if (result.rows[0].branch_id && warehouseIds.length) {
        const scopedWarehouses = await query(
          `SELECT COUNT(*)::integer count
           FROM warehouses
           WHERE tenant_id = $1
             AND branch_id = $2
             AND id = ANY($3::uuid[])`,
          [tenantId, result.rows[0].branch_id, [...new Set(warehouseIds)]],
        );
        if (scopedWarehouses.rows[0].count !== new Set(warehouseIds).size) {
          throw new AppError(
            'Una de las bodegas está fuera de tu sucursal asignada.',
            403,
            'BRANCH_SCOPE_DENIED',
          );
        }
      }
      const validWarehouseIds = [...new Set(warehouseIds)]
        .filter((warehouseId) => UUID_PATTERN.test(warehouseId));
      if (
        validWarehouseIds.length &&
        !['OWNER', 'ADMIN'].includes(result.rows[0].role_code)
      ) {
        const requestRead = ['GET', 'HEAD'].includes(req.method);
        let capability = requestRead ? 'can_view' : null;
        if (!requestRead && requestPath.startsWith('/api/pos')) capability = 'can_sell';
        else if (!requestRead && requestPath.includes('/receipts')) capability = 'can_receive';
        else if (!requestRead && req.body?.sourceWarehouseId) capability = 'can_dispatch';
        else if (!requestRead && req.body?.destinationWarehouseId) capability = 'can_receive';
        else if (!requestRead && requestPath.startsWith('/api/inventory')) capability = 'can_adjust';
        if (capability) {
          const access = await query(
            `SELECT warehouse.id,
                    NOT EXISTS(
                      SELECT 1 FROM warehouse_user_permissions configured
                      WHERE configured.tenant_id = warehouse.tenant_id
                        AND configured.warehouse_id = warehouse.id
                    ) OR EXISTS(
                      SELECT 1 FROM warehouse_user_permissions granted
                      WHERE granted.tenant_id = warehouse.tenant_id
                        AND granted.warehouse_id = warehouse.id
                        AND granted.user_id = $2
                        AND granted.${capability} = TRUE
                    ) allowed
             FROM warehouses warehouse
             WHERE warehouse.tenant_id = $1
               AND warehouse.id = ANY($3::uuid[])`,
            [tenantId, userId, validWarehouseIds],
          );
          if (
            access.rowCount !== validWarehouseIds.length ||
            access.rows.some((warehouse) => !warehouse.allowed)
          ) {
            throw new AppError(
              'No tienes el permiso requerido para operar esta bodega.',
              403,
              'WAREHOUSE_PERMISSION_DENIED',
            );
          }
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Rutas que comprueban la membresía por su cuenta y contra el dueño del recurso,
// no contra la empresa activa del encabezado. Pasarlas por el mapa de permisos
// las evaluaría contra la empresa equivocada, así que se declaran aparte.
export const SELF_GUARDED_API_PREFIXES = ['/api/assets'];

// Devuelve los permisos exigidos por una ruta, [] si es de acceso libre para
// cualquier miembro autenticado, o null si la ruta no está declarada.
export function resolveRequiredPermissions(path, method) {
  const read = ['GET', 'HEAD'].includes(method);
  let permissions = null;

  if (path === '/api/companies' && read) return [];

  if (path.startsWith('/api/companies')) permissions = ['companies.manage'];
  else if (path.startsWith('/api/branches')) {
    permissions = read
      ? ['branch.view', 'dashboard.view', 'branches.manage', 'inventory.view', 'sales.operate']
      : ['branches.manage'];
  } else if (path.startsWith('/api/warehouses')) {
    permissions = read
      ? ['warehouse.view', 'inventory.view', 'warehouses.manage', 'purchases.manage', 'sales.operate']
      : ['warehouses.manage'];
  } else if (/^\/api\/(categories|brands|products|product-structures|pricing|taxes|catalog-import)/.test(path)) {
    permissions = read
      ? ['product.view', 'product.price.view', 'inventory.view', 'catalog.manage', 'purchases.manage', 'sales.operate']
      : [
        path.startsWith('/api/pricing') ? 'product.price.edit' : 'product.edit',
        'product.create', 'catalog.manage',
      ];
  } else if (path.startsWith('/api/inventory-advanced/warehouse-permissions')) {
    permissions = ['users.manage', 'warehouses.manage'];
  } else if (path.startsWith('/api/module-settings')) {
    permissions = read
      ? ['inventory.view', 'logistics.view', 'users.manage']
      : ['users.manage'];
  } else if (path.startsWith('/api/logistics')) {
    permissions = read
      ? ['logistics.view', 'inventory.view', 'product.view']
      : [
        'inventory.receive',
        'logistics.count',
        'logistics.price',
        'logistics.approve',
        'logistics.labels',
      ];
  } else if (path.startsWith('/api/inventory')) {
    permissions = read ? ['inventory.view'] : ['inventory.adjust', 'inventory.adjustment.execute', 'inventory.transfer', 'inventory.receive'];
  } else if (path.startsWith('/api/physical-counts')) {
    if (read) permissions = ['inventory.view', 'inventory.count.view', 'inventory.adjust'];
    else if (/\/complete$/.test(path)) permissions = ['inventory.adjustment.approve', 'inventory.adjustment.execute', 'inventory.adjust'];
    else if (/\/submit$/.test(path)) permissions = ['inventory.count.perform', 'inventory.count.recount', 'inventory.adjust'];
    else permissions = ['inventory.count.perform', 'inventory.count.recount', 'inventory.adjust'];
  } else if (path.startsWith('/api/purchases')) permissions = ['purchases.manage'];
  else if (path.startsWith('/api/pos')) permissions = ['pos.use', 'sale.create', 'sales.operate'];
  else if (path.startsWith('/api/receivables')) permissions = ['receivables.manage'];
  else if (path.startsWith('/api/payables')) permissions = ['payables.manage'];
  else if (path.startsWith('/api/expenses')) {
    permissions = read
      ? ['expenses.view', 'expenses.manage', 'expenses.approve', 'expenses.pay']
      : ['expenses.manage', 'expenses.approve', 'expenses.pay'];
  }
  else if (path.startsWith('/api/payroll')) {
    permissions = read
      ? ['payroll.view', 'payroll.manage', 'payroll.approve']
      : ['payroll.manage', 'payroll.approve'];
  }
  else if (path.startsWith('/api/third-parties')) {
    permissions = read
      ? ['parties.view', 'parties.manage']
      : ['parties.manage'];
  }
  else if (path.startsWith('/api/users')) permissions = ['users.manage', 'user.manage'];
  else if (path.startsWith('/api/dashboard')) permissions = ['dashboard.view'];
  else if (path.startsWith('/api/audit')) permissions = ['audit.view'];
  else if (path.startsWith('/api/reports')) permissions = ['reports.view'];
  else if (path.startsWith('/api/electronic-billing')) permissions = ['billing.manage'];
  else if (path.startsWith('/api/billing-workflow')) permissions = ['billing.manage'];
  else if (path.startsWith('/api/media/assets') && path.endsWith('/content') && read) {
    permissions = ['inventory.evidence.view', 'product.image.manage', 'catalog.manage', 'inventory.view'];
  }
  else if (path.startsWith('/api/media/assets') && method === 'POST') {
    permissions = ['media.upload', 'product.image.manage', 'inventory.evidence.upload'];
  }
  else if (path.startsWith('/api/media/assets') && method === 'DELETE') {
    permissions = ['media.delete'];
  }
  else if (path.startsWith('/api/media/links') && read) {
    permissions = ['inventory.evidence.view', 'product.image.manage', 'catalog.manage', 'inventory.view'];
  }
  else if (path.startsWith('/api/media/links') && ['POST', 'PATCH'].includes(method)) {
    permissions = ['product.image.manage', 'inventory.evidence.upload'];
  }
  else if (path.startsWith('/api/media/links') && method === 'DELETE') {
    permissions = ['media.delete'];
  }
  else if (path.startsWith('/api/media/policy')) {
    permissions = read
      ? ['inventory.view', 'inventory.evidence.view', 'inventory.adjust']
      : ['inventory.adjustment.approve'];
  }
  else if (path.startsWith('/api/commercial-planning')) {
    permissions = read
      ? [
        'commercial.view',
        'promotion.view',
        'marketing.budget.view',
        'marketing.campaign.view',
        'marketing.performance.view',
        'commercial_planning.view',
        'commercial_planning.manage',
        'commercial_planning.marketing',
        'commercial_planning.supervise',
        'reports.view',
        'sales.operate',
      ]
      : [
        'commercial.manage', 'promotion.manage', 'marketing.budget.manage',
        'marketing.campaign.manage', 'commercial_planning.manage', 'commercial_planning.marketing',
      ];
  }
  else if (path.startsWith('/api/secure-files')) {
    permissions = read
      ? ['documents.manage', 'audit.view', 'accounting.manage']
      : ['documents.manage'];
  }

  return permissions;
}

export function authorizeApiRequest(req, res, next) {
  const path = `${req.baseUrl}${req.path}`;
  if (SELF_GUARDED_API_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return next();
  }
  const permissions = resolveRequiredPermissions(path, req.method);
  if (permissions === null) {
    // Falla cerrado a propósito: una ruta sin permisos declarados es un olvido,
    // y dejarla pasar la abriría a cualquier miembro de cualquier empresa.
    return next(new AppError(
      'Esta operación no está habilitada.',
      403,
      'ROUTE_NOT_AUTHORIZED',
    ));
  }
  if (!permissions.length) return next();
  return requireAnyPermission(permissions)(req, res, next);
}
