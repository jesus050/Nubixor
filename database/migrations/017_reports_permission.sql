INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT r.tenant_id, r.id, 'reports.view'
FROM roles r
WHERE r.active = TRUE
  AND r.code IN ('OWNER', 'ADMIN', 'OPERATIONS', 'AUDITOR')
ON CONFLICT DO NOTHING;
