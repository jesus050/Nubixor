import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.use(requireTenant);

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT w.*, b.name branch_name
     FROM warehouses w
     JOIN branches b ON b.id = w.branch_id
     WHERE w.tenant_id = $1
     ORDER BY b.name, w.name`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { branchId, name, code, type = 'AVAILABLE' } = req.body;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const normalizedType = typeof type === 'string' ? type.trim().toUpperCase() : 'AVAILABLE';
  const allowedTypes = ['AVAILABLE', 'QUARANTINE', 'DAMAGED', 'TRANSIT'];

  if (!branchId || !normalizedName || !normalizedCode) {
    return res.status(422).json({ error: 'branchId, name y code son obligatorios.' });
  }
  if (typeof branchId !== 'string' || !UUID_PATTERN.test(branchId)) {
    return res.status(422).json({ error: 'branchId debe ser un UUID válido.' });
  }
  if (!allowedTypes.includes(normalizedType)) {
    return res.status(422).json({ error: 'El tipo de bodega no es válido.' });
  }
  if (normalizedName.length > 160 || normalizedCode.length > 30) {
    return res.status(422).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }

  try {
    const result = await query(
      `INSERT INTO warehouses(tenant_id, branch_id, name, code, warehouse_type)
       SELECT $1, b.id, $3, $4, $5
       FROM branches b
       WHERE b.id = $2 AND b.tenant_id = $1
       RETURNING id, tenant_id, branch_id, name, code, warehouse_type, active`,
      [req.context.tenantId, branchId, normalizedName, normalizedCode, normalizedType],
    );
    if (!result.rowCount) {
      throw new AppError('La sucursal no pertenece a la empresa activa.', 404, 'BRANCH_NOT_FOUND');
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Ya existe una bodega con ese código.', 409, 'WAREHOUSE_CODE_EXISTS');
    }
    throw error;
  }
}));

export default router;
