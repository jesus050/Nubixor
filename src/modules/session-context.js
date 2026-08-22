import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.post('/company', asyncHandler(async (req, res) => {
  const tenantId = typeof req.body?.tenantId === 'string' ? req.body.tenantId : '';
  if (!UUID_PATTERN.test(tenantId)) {
    throw new AppError('Selecciona una empresa válida.', 422, 'TENANT_CONTEXT_INVALID');
  }
  const membership = await query(
    `SELECT tu.tenant_id, tu.branch_id, r.code role_code
     FROM tenant_users tu
     JOIN tenants t ON t.id = tu.tenant_id AND t.status = 'ACTIVE'
     JOIN roles r ON r.id = tu.role_id AND r.tenant_id = tu.tenant_id AND r.active = TRUE
     WHERE tu.tenant_id = $1 AND tu.user_id = $2 AND tu.status = 'ACTIVE'`,
    [tenantId, req.context.userId],
  );
  if (!membership.rowCount) {
    throw new AppError('No perteneces a la empresa seleccionada.', 403, 'TENANT_MEMBERSHIP_REQUIRED');
  }
  await query(
    `UPDATE auth_sessions SET active_tenant_id = $1, last_seen_at = now()
     WHERE id = $2 AND user_id = $3 AND revoked_at IS NULL`,
    [tenantId, req.context.sessionId, req.context.userId],
  );
  req.context.tenantId = tenantId;
  req.context.branchId = membership.rows[0].branch_id || null;
  res.json({ tenantId, branchId: req.context.branchId, roleCode: membership.rows[0].role_code });
}));

export default router;
