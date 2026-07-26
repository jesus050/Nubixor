import { Router } from 'express';
import { query } from '../db.js';
const router = Router();
router.get('/', async (_req, res) => {
  const result = await query('SELECT id, legal_name, trade_name, tax_id, status, created_at FROM tenants ORDER BY legal_name');
  res.json(result.rows);
});
router.post('/', async (req, res) => {
  const { legalName, tradeName = null, taxId = null } = req.body;
  if (!legalName) return res.status(422).json({ error: 'legalName es obligatorio.' });
  const result = await query(`INSERT INTO tenants(legal_name, trade_name, tax_id) VALUES($1,$2,$3) RETURNING *`, [legalName, tradeName, taxId]);
  res.status(201).json(result.rows[0]);
});
export default router;
