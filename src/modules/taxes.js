import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';

const router = Router();
router.use(requireTenant);

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, tenant_id, code, name, treatment, rate, dian_code, active
     FROM tax_categories
     WHERE tenant_id = $1 AND active = TRUE
     ORDER BY rate DESC, name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

export default router;

