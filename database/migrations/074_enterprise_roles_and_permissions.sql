-- Roles empresariales y permisos granulares.
-- Es aditiva: no elimina roles ni permisos existentes para no interrumpir usuarios activos.

INSERT INTO roles(tenant_id, code, name, description, color, is_system, active)
SELECT tenant.id, template.code, template.name, template.description, template.color, TRUE, TRUE
FROM tenants tenant
CROSS JOIN (
  VALUES
    ('OWNER', 'Propietario', 'Control completo de la empresa; no equivale al Superadmin SaaS.', 'PURPLE'),
    ('ADMIN', 'Administrador', 'Administración operativa amplia de la empresa.', 'BLUE'),
    ('SUPERVISOR', 'Supervisor', 'Aprueba y supervisa procesos sensibles de operación.', 'AMBER'),
    ('WAREHOUSE', 'Bodeguero', 'Recibe, cuenta y documenta mercancía sin aprobar sus propios ajustes.', 'CYAN'),
    ('CASHIER', 'Cajero', 'Opera punto de venta y caja asignada.', 'GREEN'),
    ('SELLER', 'Vendedor', 'Gestiona ventas, clientes y pedidos comerciales.', 'GREEN'),
    ('MARKETING', 'Marketing', 'Gestiona campañas y presupuesto comercial sin acceso contable.', 'ROSE'),
    ('ACCOUNTANT', 'Contador', 'Gestiona cartera, bancos, contabilidad y reportes financieros.', 'BLUE')
) AS template(code, name, description, color)
ON CONFLICT(tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    active = TRUE,
    is_system = TRUE,
    updated_at = now();

-- Permisos granulares. Los permisos antiguos se mantienen como aliases de compatibilidad.
WITH permissions(code) AS (
  VALUES
    ('dashboard.financial.view'), ('dashboard.margin.view'), ('dashboard.marketing.view'), ('dashboard.inventory.view'),
    ('company.view'), ('branch.view'), ('warehouse.view'), ('warehouse.manage'),
    ('product.view'), ('product.create'), ('product.edit'), ('product.delete'), ('product.cost.view'), ('product.margin.view'), ('product.price.view'), ('product.price.edit'), ('product.image.manage'),
    ('inventory.receive'), ('inventory.transfer'), ('inventory.count.view'), ('inventory.adjustment.request'), ('inventory.adjustment.execute'), ('inventory.damage.report'), ('inventory.damage.review'),
    ('sale.view'), ('sale.create'), ('sale.cancel'), ('sale.return'), ('sale.discount.apply'), ('sale.discount.override'), ('pos.use'),
    ('cash.open'), ('cash.close'), ('cash.view'), ('cash.movement.create'), ('cash.report.view'),
    ('customer.view'), ('customer.create'), ('customer.edit'), ('customer.group.manage'),
    ('supplier.view'), ('supplier.manage'), ('purchase.view'), ('purchase.create'), ('purchase.receive'), ('purchase.approve'),
    ('receivable.view'), ('receivable.manage'), ('payable.view'), ('payable.manage'), ('bank.view'), ('bank.manage'),
    ('accounting.view'), ('accounting.manage'), ('report.export'), ('billing.view'), ('billing.manage'),
    ('user.view'), ('user.manage'), ('configuration.view'), ('configuration.manage'),
    ('commercial.view'), ('commercial.manage'), ('promotion.view'), ('promotion.manage'),
    ('marketing.budget.view'), ('marketing.budget.manage'), ('marketing.campaign.view'), ('marketing.campaign.manage'), ('marketing.performance.view'),
    ('field_sales.view'), ('field_sales.manage')
), owner_permissions AS (
  SELECT tenant_id, permission_code AS code FROM role_permissions
  UNION
  SELECT tenant.id, permissions.code FROM tenants tenant CROSS JOIN permissions
), grants(role_code, code) AS (
  SELECT 'OWNER', code FROM owner_permissions
  UNION ALL
  SELECT 'ADMIN', code FROM permissions
  UNION ALL
  SELECT 'SUPERVISOR', code FROM (VALUES
    ('dashboard.view'), ('dashboard.inventory.view'), ('inventory.view'), ('inventory.count.view'),
    ('inventory.count.view_expected_stock'), ('inventory.count.recount'), ('inventory.adjustment.approve'), ('inventory.adjustment.execute'),
    ('inventory.damage.review'), ('logistics.view'), ('logistics.approve'), ('logistics.labels'), ('product.view'),
    ('product.price.view'), ('sale.view'), ('cash.view'), ('cash.report.view'), ('reports.view'), ('report.export'),
    ('commercial.view'), ('commercial_planning.view'), ('commercial_planning.supervise'), ('audit.view')
  ) AS permission(code)
  UNION ALL
  SELECT 'WAREHOUSE', code FROM (VALUES
    ('dashboard.view'), ('dashboard.inventory.view'), ('product.view'), ('product.price.view'), ('product.image.manage'),
    ('inventory.view'), ('inventory.receive'), ('inventory.transfer'), ('inventory.count.view'), ('inventory.count.perform'),
    ('inventory.count.recount'), ('inventory.adjustment.request'), ('inventory.damage.report'), ('inventory.evidence.view'),
    ('inventory.evidence.upload'), ('media.upload'), ('logistics.view'), ('logistics.count'), ('logistics.labels'),
    ('purchase.view'), ('purchase.receive'), ('warehouse.view')
  ) AS permission(code)
  UNION ALL
  SELECT 'CASHIER', code FROM (VALUES
    ('dashboard.view'), ('product.view'), ('product.price.view'), ('inventory.view'), ('sale.view'), ('sale.create'),
    ('sale.return'), ('sale.discount.apply'), ('pos.use'), ('cash.open'), ('cash.close'), ('cash.view'),
    ('cash.movement.create'), ('cash.report.view'), ('customer.view'), ('customer.create')
  ) AS permission(code)
  UNION ALL
  SELECT 'SELLER', code FROM (VALUES
    ('dashboard.view'), ('product.view'), ('product.price.view'), ('inventory.view'), ('sale.view'), ('sale.create'),
    ('sale.discount.apply'), ('customer.view'), ('customer.create'), ('customer.edit'), ('promotion.view'),
    ('commercial.view'), ('field_sales.view'), ('field_sales.manage')
  ) AS permission(code)
  UNION ALL
  SELECT 'MARKETING', code FROM (VALUES
    ('dashboard.view'), ('dashboard.marketing.view'), ('dashboard.inventory.view'), ('product.view'), ('product.price.view'),
    ('product.image.manage'), ('inventory.view'), ('customer.view'), ('customer.group.manage'), ('commercial.view'),
    ('commercial.manage'), ('promotion.view'), ('promotion.manage'), ('marketing.budget.view'), ('marketing.budget.manage'),
    ('marketing.campaign.view'), ('marketing.campaign.manage'), ('marketing.performance.view'),
    ('commercial_planning.view'), ('commercial_planning.marketing'), ('media.upload')
  ) AS permission(code)
  UNION ALL
  SELECT 'ACCOUNTANT', code FROM (VALUES
    ('dashboard.view'), ('dashboard.financial.view'), ('sale.view'), ('cash.view'), ('cash.report.view'),
    ('receivable.view'), ('receivable.manage'), ('payable.view'), ('payable.manage'), ('bank.view'), ('bank.manage'),
    ('accounting.view'), ('accounting.manage'), ('reports.view'), ('report.export'), ('billing.view'), ('audit.view')
  ) AS permission(code)
)
INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, grants.code
FROM roles role
JOIN grants ON grants.role_code = role.code
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS role_permissions_tenant_role_code
  ON role_permissions(tenant_id, role_id, permission_code);
