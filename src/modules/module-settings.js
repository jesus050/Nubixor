import { Router } from 'express';
import { withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const AVAILABLE_MODULES = new Map([
  ['LOGISTICS', {
    code: 'LOGISTICS',
    name: 'Logística',
    description: 'Recepción, ubicación, exhibición, reposición, lotes, series y reservas.',
  }],
]);

router.use(requireTenant);

router.get('/', asyncHandler(async (req, res) => {
  const result = await withTransaction((client) => client.query(
    `SELECT module_code,enabled,settings,enabled_at,disabled_at,updated_at
     FROM tenant_modules
     WHERE tenant_id=$1
     ORDER BY module_code`,
    [req.context.tenantId],
  ));
  const saved = new Map(result.rows.map((item) => [item.module_code, item]));
  res.json([...AVAILABLE_MODULES.values()].map((definition) => ({
    ...definition,
    enabled: Boolean(saved.get(definition.code)?.enabled),
    settings: saved.get(definition.code)?.settings || {},
    enabledAt: saved.get(definition.code)?.enabled_at || null,
    disabledAt: saved.get(definition.code)?.disabled_at || null,
    updatedAt: saved.get(definition.code)?.updated_at || null,
  })));
}));

router.patch('/:code', asyncHandler(async (req, res) => {
  const moduleCode = String(req.params.code || '').trim().toUpperCase();
  const definition = AVAILABLE_MODULES.get(moduleCode);
  if (!definition || typeof req.body.enabled !== 'boolean') {
    throw new AppError(
      'El módulo o el estado solicitado no es válido.',
      422,
      'INVALID_TENANT_MODULE',
    );
  }
  const saved = await withTransaction(async (client) => {
    const previous = await client.query(
      `SELECT * FROM tenant_modules
       WHERE tenant_id=$1 AND module_code=$2
       FOR UPDATE`,
      [req.context.tenantId, moduleCode],
    );
    const result = await client.query(
      `INSERT INTO tenant_modules(
         tenant_id,module_code,enabled,enabled_at,disabled_at,updated_by
       )
       VALUES($1,$2,$3,
         CASE WHEN $3 THEN now() ELSE NULL END,
         CASE WHEN $3 THEN NULL ELSE now() END,
         $4
       )
       ON CONFLICT(tenant_id,module_code) DO UPDATE
       SET enabled=EXCLUDED.enabled,
           enabled_at=CASE
             WHEN EXCLUDED.enabled AND NOT tenant_modules.enabled THEN now()
             ELSE tenant_modules.enabled_at
           END,
           disabled_at=CASE WHEN EXCLUDED.enabled THEN NULL ELSE now() END,
           updated_by=EXCLUDED.updated_by,
           updated_at=now()
       RETURNING *`,
      [
        req.context.tenantId,
        moduleCode,
        req.body.enabled,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: req.body.enabled ? 'module.enabled' : 'module.disabled',
      entityType: 'tenant_module',
      entityId: moduleCode,
      before: previous.rows[0] || null,
      after: result.rows[0],
      reason: req.body.enabled
        ? 'Activación del módulo desde Sistema'
        : 'Desactivación del módulo desde Sistema',
    });
    return result.rows[0];
  });
  res.json({
    ...definition,
    enabled: saved.enabled,
    settings: saved.settings,
    enabledAt: saved.enabled_at,
    disabledAt: saved.disabled_at,
    updatedAt: saved.updated_at,
  });
}));

export default router;
