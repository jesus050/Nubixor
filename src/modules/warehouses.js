import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
const router = Router();
router.use(requireTenant);
router.get('/', async (req, res) => {
  const result = await query(`SELECT w.*, b.name branch_name FROM warehouses w JOIN branches b ON b.id=w.branch_id WHERE w.tenant_id=$1 ORDER BY b.name,w.name`, [req.context.tenantId]);
  res.json(result.rows);
});
router.post('/', async (req, res) => {
  const { branchId, name, code, type = 'AVAILABLE' } = req.body;
  if (!branchId || !name || !code) return res.status(422).json({ error: 'branchId, name y code son obligatorios.' });
  const result = await query(`INSERT INTO warehouses(tenant_id,branch_id,name,code,warehouse_type) VALUES($1,$2,$3,$4,$5) RETURNING *`, [req.context.tenantId, branchId, name, code, type]);
  res.status(201).json(result.rows[0]);
});
export default router;
