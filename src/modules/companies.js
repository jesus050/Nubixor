import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { bootstrapTenantAccess } from '../authorization.js';
import { asyncHandler } from '../shared/async-handler.js';
const router = Router();
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT t.id, t.legal_name, t.trade_name, t.tax_id, t.status, t.created_at
     FROM tenants t
     JOIN tenant_users tu ON tu.tenant_id = t.id
     WHERE tu.user_id = $1
       AND tu.status = 'ACTIVE'
       AND t.status = 'ACTIVE'
     ORDER BY t.legal_name`,
    [req.context.userId],
  );
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
  const company = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO tenants(legal_name, trade_name, tax_id)
       VALUES($1,$2,$3)
       RETURNING id, legal_name, trade_name, tax_id, status, created_at`,
      [normalizedLegalName, normalizedTradeName, normalizedTaxId],
    );
    await bootstrapTenantAccess(client, {
      tenantId: result.rows[0].id,
      ownerUserId: req.context.userId,
    });
    return result.rows[0];
  });
  res.status(201).json(company);
}));
export default router;
