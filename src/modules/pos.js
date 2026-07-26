import { Router } from 'express';
import { withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.use(requireTenant);

router.get('/summary', asyncHandler(async (req, res) => {
  const summary = await withTransaction(async (client) => {
    const registers = await client.query(
      `SELECT cr.id, cr.name, cr.code, cr.branch_id, b.name branch_name, cr.active
       FROM cash_registers cr
       JOIN branches b ON b.id = cr.branch_id
       WHERE cr.tenant_id = $1 AND cr.active = TRUE
       ORDER BY b.name, cr.name`,
      [req.context.tenantId],
    );
    const session = await client.query(
      `SELECT cs.id, cs.cash_register_id, cs.status, cs.opening_amount,
              cs.opened_at, cr.name register_name, cr.code register_code,
              b.name branch_name
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       WHERE cs.tenant_id = $1 AND cs.status = 'OPEN'
       ORDER BY cs.opened_at DESC
       LIMIT 1`,
      [req.context.tenantId],
    );
    return {
      registers: registers.rows,
      openSession: session.rows[0] || null,
    };
  });
  res.json(summary);
}));

router.post('/sessions', asyncHandler(async (req, res) => {
  const { cashRegisterId, openingAmount = 0 } = req.body;
  const amount = Number(openingAmount);
  if (!cashRegisterId) {
    return res.status(422).json({ error: 'cashRegisterId es obligatorio.' });
  }
  if (typeof cashRegisterId !== 'string' || !UUID_PATTERN.test(cashRegisterId)) {
    return res.status(422).json({ error: 'cashRegisterId debe ser un UUID válido.' });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(422).json({ error: 'openingAmount debe ser un valor positivo.' });
  }

  try {
    const session = await withTransaction(async (client) => {
      const register = await client.query(
        `SELECT id
         FROM cash_registers
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE
         FOR UPDATE`,
        [cashRegisterId, req.context.tenantId],
      );
      if (!register.rowCount) {
        throw new AppError('La caja no pertenece a la empresa activa.', 404, 'CASH_REGISTER_NOT_FOUND');
      }
      const result = await client.query(
        `INSERT INTO cash_sessions(
           tenant_id, cash_register_id, opening_amount, opened_by
         )
         VALUES($1,$2,$3,$4)
         RETURNING id, tenant_id, cash_register_id, status, opening_amount, opened_at`,
        [req.context.tenantId, cashRegisterId, amount, req.context.userId],
      );
      return result.rows[0];
    });
    res.status(201).json(session);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Esta caja ya tiene un turno abierto.', 409, 'CASH_SESSION_ALREADY_OPEN');
    }
    throw error;
  }
}));

router.post('/sessions/:id/close', asyncHandler(async (req, res) => {
  const { closingAmount } = req.body;
  const amount = Number(closingAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(422).json({ error: 'closingAmount debe ser un valor positivo.' });
  }
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El turno debe tener un UUID válido.' });
  }
  const session = await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE cash_sessions
       SET status = 'CLOSED', closing_amount = $1, closed_by = $2, closed_at = now()
       WHERE id = $3 AND tenant_id = $4 AND status = 'OPEN'
       RETURNING id, status, opening_amount, closing_amount, opened_at, closed_at`,
      [amount, req.context.userId, req.params.id, req.context.tenantId],
    );
    if (!result.rowCount) {
      throw new AppError('No encontramos un turno de caja abierto.', 404, 'CASH_SESSION_NOT_FOUND');
    }
    return result.rows[0];
  });
  res.json(session);
}));

export default router;
