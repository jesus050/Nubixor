DELETE FROM role_permissions rp
USING roles r
WHERE rp.role_id = r.id
  AND rp.tenant_id = r.tenant_id
  AND r.code = 'CASHIER'
  AND r.is_system = TRUE
  AND rp.permission_code IN ('dashboard.view', 'inventory.view');

UPDATE roles
SET description = 'Opera exclusivamente caja, ventas y cobros del punto de venta.',
    updated_at = now()
WHERE code = 'CASHIER'
  AND is_system = TRUE;
