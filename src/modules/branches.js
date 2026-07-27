import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
router.use(requireTenant);

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, tenant_id, name, code, address, active
     FROM branches
     WHERE tenant_id = $1
       AND ($2::uuid IS NULL OR id = $2)
     ORDER BY name`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, code, address = null } = req.body;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const normalizedAddress = typeof address === 'string' ? address.trim() || null : null;

  if (!normalizedName || !normalizedCode) {
    return res.status(422).json({ error: 'name y code son obligatorios.' });
  }
  if (normalizedName.length > 160 || normalizedCode.length > 30 || normalizedAddress?.length > 240) {
    return res.status(422).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }

  try {
    const result = await query(
      `INSERT INTO branches(tenant_id, name, code, address)
       VALUES($1,$2,$3,$4)
       RETURNING id, tenant_id, name, code, address, active`,
      [req.context.tenantId, normalizedName, normalizedCode, normalizedAddress],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Ya existe una sucursal con ese código.', 409, 'BRANCH_CODE_EXISTS');
    }
    throw error;
  }
}));

export default router;
