import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../shared/async-handler.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
  const result = await query('SELECT id, legal_name, trade_name, tax_id, status, created_at FROM tenants ORDER BY legal_name');
  res.json(result.rows);
}));
router.post('/', asyncHandler(async (req, res) => {
  const { legalName, tradeName = null, taxId = null } = req.body;
  const normalizedLegalName = typeof legalName === 'string' ? legalName.trim() : '';
  const normalizedTradeName = typeof tradeName === 'string' ? tradeName.trim() || null : null;
  const normalizedTaxId = typeof taxId === 'string' ? taxId.trim() || null : null;
  if (!normalizedLegalName) {
    return res.status(422).json({ error: 'legalName es obligatorio.' });
  }
  if (normalizedLegalName.length > 160 || normalizedTradeName?.length > 160 || normalizedTaxId?.length > 40) {
    return res.status(422).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }
  const result = await query(
    `INSERT INTO tenants(legal_name, trade_name, tax_id)
     VALUES($1,$2,$3)
     RETURNING id, legal_name, trade_name, tax_id, status, created_at`,
    [normalizedLegalName, normalizedTradeName, normalizedTaxId],
  );
  res.status(201).json(result.rows[0]);
}));
export default router;
