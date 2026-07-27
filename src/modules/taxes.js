import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const TREATMENTS = new Set(['TAXED', 'EXEMPT', 'EXCLUDED', 'NON_TAXED', 'OTHER']);
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

router.post('/', asyncHandler(async (req, res) => {
  const {
    code,
    name,
    treatment,
    rate = 0,
    dianCode = null,
  } = req.body;
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedTreatment = typeof treatment === 'string' ? treatment.trim().toUpperCase() : '';
  const normalizedDianCode = typeof dianCode === 'string' ? dianCode.trim() || null : null;
  const normalizedRate = Number(rate);

  if (!normalizedCode || !normalizedName || !normalizedTreatment) {
    return res.status(422).json({ error: 'code, name y treatment son obligatorios.' });
  }
  if (!TREATMENTS.has(normalizedTreatment)) {
    return res.status(422).json({ error: 'El tratamiento tributario no es válido.' });
  }
  if (!Number.isFinite(normalizedRate) || normalizedRate < 0 || normalizedRate > 100) {
    return res.status(422).json({ error: 'La tarifa debe estar entre 0 y 100.' });
  }
  if (normalizedTreatment !== 'TAXED' && normalizedRate !== 0) {
    return res.status(422).json({
      error: 'Los tratamientos exento, excluido, no gravado u otro deben usar tarifa 0.',
    });
  }
  if (normalizedCode.length > 30 || normalizedName.length > 160 || normalizedDianCode?.length > 30) {
    return res.status(422).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }

  try {
    const tax = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO tax_categories(tenant_id, code, name, treatment, rate, dian_code)
         VALUES($1,$2,$3,$4,$5,$6)
         RETURNING id, tenant_id, code, name, treatment, rate, dian_code, active`,
        [
          req.context.tenantId,
          normalizedCode,
          normalizedName,
          normalizedTreatment,
          normalizedRate,
          normalizedDianCode,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'tax_category.created',
        entityType: 'tax_category',
        entityId: result.rows[0].id,
        after: result.rows[0],
      });
      return result.rows[0];
    });
    res.status(201).json(tax);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Ya existe un impuesto con ese código.',
        409,
        'TAX_CATEGORY_CODE_EXISTS',
      );
    }
    throw error;
  }
}));

export default router;
