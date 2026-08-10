import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requirePermission } from '../authorization.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DOCUMENT_TYPES = new Set(['CC', 'CE', 'PASSPORT', 'PPT', 'OTHER']);
const CONTRACT_TYPES = new Set(['INDEFINITE', 'FIXED_TERM', 'WORK_OR_LABOR', 'APPRENTICESHIP', 'OTHER']);
const FREQUENCIES = new Set(['MONTHLY', 'BIWEEKLY']);
const NOVELTY_TYPES = new Set(['EARNING', 'DEDUCTION', 'ABSENCE', 'OVERTIME', 'LEAVE', 'OTHER']);

router.use(requireTenant);

function value(input, maxLength, required = false) {
  const cleaned = typeof input === 'string' ? input.trim() : '';
  if (required && !cleaned) throw new AppError('Completa los campos obligatorios.', 422, 'PAYROLL_REQUIRED_FIELD');
  if (cleaned.length > maxLength) throw new AppError(`El campo supera ${maxLength} caracteres.`, 422, 'PAYROLL_FIELD_TOO_LONG');
  return cleaned || null;
}

function date(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const candidate = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(candidate.valueOf()) && candidate.toISOString().slice(0, 10) === value;
}

function id(value, message) {
  if (!UUID.test(value || '')) throw new AppError(message, 422, 'INVALID_PAYROLL_REFERENCE');
}

function money(input) {
  const amount = Math.round(Number(input) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError('El valor monetario no es válido.', 422, 'INVALID_PAYROLL_AMOUNT');
  }
  return amount;
}

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(*)::integer FROM payroll_employees WHERE tenant_id = $1 AND active = TRUE) active_employees,
       (SELECT COUNT(*)::integer FROM payroll_contracts WHERE tenant_id = $1 AND status = 'ACTIVE') active_contracts,
       (SELECT COUNT(*)::integer FROM payroll_periods WHERE tenant_id = $1 AND status IN ('DRAFT','REVIEW')) open_periods,
       (SELECT COUNT(*)::integer FROM payroll_novelties WHERE tenant_id = $1 AND status = 'DRAFT') pending_novelties`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/employees', asyncHandler(async (req, res) => {
  const search = value(req.query.search, 120);
  const result = await query(
    `SELECT employee.id, employee.document_type, employee.document_number,
            employee.first_name, employee.middle_name, employee.last_name,
            employee.second_last_name, employee.email, employee.phone, employee.active,
            branch.id branch_id, branch.name branch_name,
            contract.id active_contract_id, contract.contract_type,
            contract.base_salary, contract.payment_frequency, contract.start_date
     FROM payroll_employees employee
     LEFT JOIN branches branch ON branch.id = employee.branch_id AND branch.tenant_id = employee.tenant_id
     LEFT JOIN payroll_contracts contract
       ON contract.employee_id = employee.id AND contract.tenant_id = employee.tenant_id
      AND contract.status = 'ACTIVE'
     WHERE employee.tenant_id = $1
       AND ($2::text IS NULL OR concat_ws(' ', employee.first_name, employee.middle_name, employee.last_name, employee.second_last_name) ILIKE '%' || $2 || '%'
         OR employee.document_number ILIKE '%' || $2 || '%')
     ORDER BY employee.active DESC, employee.last_name, employee.first_name`,
    [req.context.tenantId, search],
  );
  res.json(result.rows);
}));

router.post('/employees', asyncHandler(async (req, res) => {
  const documentType = value(req.body.documentType, 20, true)?.toUpperCase();
  const documentNumber = value(req.body.documentNumber, 40, true);
  const firstName = value(req.body.firstName, 80, true);
  const lastName = value(req.body.lastName, 80, true);
  const branchId = req.body.branchId || null;
  if (!DOCUMENT_TYPES.has(documentType)) throw new AppError('El tipo de documento no es válido.', 422, 'INVALID_PAYROLL_DOCUMENT');
  if (branchId) id(branchId, 'La sucursal debe tener un UUID válido.');
  const employee = await withTransaction(async (client) => {
    if (branchId) {
      const branch = await client.query('SELECT id FROM branches WHERE id = $1 AND tenant_id = $2 AND active = TRUE', [branchId, req.context.tenantId]);
      if (!branch.rowCount) throw new AppError('La sucursal no pertenece a la empresa activa.', 404, 'PAYROLL_BRANCH_NOT_FOUND');
    }
    try {
      const result = await client.query(
        `INSERT INTO payroll_employees(tenant_id, branch_id, document_type, document_number, first_name, middle_name, last_name, second_last_name, email, phone, address, created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [req.context.tenantId, branchId, documentType, documentNumber, firstName, value(req.body.middleName, 80), lastName, value(req.body.secondLastName, 80), value(req.body.email, 160), value(req.body.phone, 40), value(req.body.address, 240), req.context.userId],
      );
      await writeAudit(client, { tenantId: req.context.tenantId, userId: req.context.userId, action: 'payroll.employee_created', entityType: 'payroll_employee', entityId: result.rows[0].id, after: result.rows[0], reason: 'Empleado creado en nómina' });
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') throw new AppError('Ya existe un empleado con ese documento.', 409, 'PAYROLL_EMPLOYEE_EXISTS');
      throw error;
    }
  });
  res.status(201).json(employee);
}));

router.post('/employees/:id/contracts', asyncHandler(async (req, res) => {
  id(req.params.id, 'El empleado debe tener un UUID válido.');
  const contractType = value(req.body.contractType, 30, true)?.toUpperCase();
  const startDate = req.body.startDate;
  const endDate = req.body.endDate || null;
  const frequency = value(req.body.paymentFrequency, 20)?.toUpperCase() || 'MONTHLY';
  if (!CONTRACT_TYPES.has(contractType) || !FREQUENCIES.has(frequency) || !date(startDate) || (endDate && (!date(endDate) || endDate < startDate))) {
    throw new AppError('Revisa tipo, fechas y frecuencia del contrato.', 422, 'INVALID_PAYROLL_CONTRACT');
  }
  const contract = await withTransaction(async (client) => {
    const employee = await client.query('SELECT id FROM payroll_employees WHERE id = $1 AND tenant_id = $2 AND active = TRUE FOR SHARE', [req.params.id, req.context.tenantId]);
    if (!employee.rowCount) throw new AppError('El empleado no pertenece a la empresa activa.', 404, 'PAYROLL_EMPLOYEE_NOT_FOUND');
    try {
      const result = await client.query(
        `INSERT INTO payroll_contracts(tenant_id, employee_id, contract_type, start_date, end_date, base_salary, payment_frequency, status, created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8) RETURNING *`,
        [req.context.tenantId, req.params.id, contractType, startDate, endDate, money(req.body.baseSalary), frequency, req.context.userId],
      );
      await writeAudit(client, { tenantId: req.context.tenantId, userId: req.context.userId, action: 'payroll.contract_created', entityType: 'payroll_contract', entityId: result.rows[0].id, after: result.rows[0], reason: 'Contrato laboral activo creado' });
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') throw new AppError('El empleado ya tiene un contrato activo. Ciérralo antes de crear otro.', 409, 'PAYROLL_ACTIVE_CONTRACT_EXISTS');
      throw error;
    }
  });
  res.status(201).json(contract);
}));

router.get('/periods', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT period.id, period.period_number, period.start_date, period.end_date, period.payment_date, period.frequency, period.status, period.notes, period.created_at,
            COUNT(novelty.id)::integer novelty_count,
            COALESCE(SUM(novelty.amount) FILTER (WHERE novelty.novelty_type = 'EARNING' AND novelty.status <> 'VOID'), 0) earnings,
            COALESCE(SUM(novelty.amount) FILTER (WHERE novelty.novelty_type = 'DEDUCTION' AND novelty.status <> 'VOID'), 0) deductions
     FROM payroll_periods period
     LEFT JOIN payroll_novelties novelty ON novelty.payroll_period_id = period.id AND novelty.tenant_id = period.tenant_id
     WHERE period.tenant_id = $1
     GROUP BY period.id
     ORDER BY period.end_date DESC`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/periods', asyncHandler(async (req, res) => {
  const { startDate, endDate, paymentDate } = req.body;
  const frequency = value(req.body.frequency, 20, true)?.toUpperCase();
  if (!date(startDate) || !date(endDate) || !date(paymentDate) || endDate < startDate || paymentDate < startDate || !FREQUENCIES.has(frequency)) {
    throw new AppError('Revisa las fechas y frecuencia del periodo.', 422, 'INVALID_PAYROLL_PERIOD');
  }
  try {
    const result = await withTransaction(async (client) => {
      const period = await client.query(
        `INSERT INTO payroll_periods(tenant_id, start_date, end_date, payment_date, frequency, notes, created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.context.tenantId, startDate, endDate, paymentDate, frequency, value(req.body.notes, 500), req.context.userId],
      );
      await writeAudit(client, { tenantId: req.context.tenantId, userId: req.context.userId, action: 'payroll.period_created', entityType: 'payroll_period', entityId: period.rows[0].id, after: period.rows[0], reason: 'Periodo de nómina creado' });
      return period.rows[0];
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.code === '23505') throw new AppError('Ya existe un periodo con estas fechas y frecuencia.', 409, 'PAYROLL_PERIOD_EXISTS');
    throw error;
  }
}));

router.get('/periods/:id/novelties', asyncHandler(async (req, res) => {
  id(req.params.id, 'El periodo debe tener un UUID válido.');
  const result = await query(
    `SELECT novelty.*, employee.first_name, employee.last_name, employee.document_number
     FROM payroll_novelties novelty
     JOIN payroll_employees employee ON employee.id = novelty.employee_id AND employee.tenant_id = novelty.tenant_id
     WHERE novelty.payroll_period_id = $1 AND novelty.tenant_id = $2
     ORDER BY employee.last_name, employee.first_name, novelty.created_at`,
    [req.params.id, req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/periods/:id/novelties', asyncHandler(async (req, res) => {
  id(req.params.id, 'El periodo debe tener un UUID válido.');
  id(req.body.employeeId, 'El empleado debe tener un UUID válido.');
  const noveltyType = value(req.body.noveltyType, 20, true)?.toUpperCase();
  if (!NOVELTY_TYPES.has(noveltyType)) throw new AppError('El tipo de novedad no es válido.', 422, 'INVALID_PAYROLL_NOVELTY');
  const novelty = await withTransaction(async (client) => {
    const period = await client.query('SELECT id, status, start_date, end_date FROM payroll_periods WHERE id = $1 AND tenant_id = $2 FOR UPDATE', [req.params.id, req.context.tenantId]);
    if (!period.rowCount) throw new AppError('No encontramos el periodo de nómina.', 404, 'PAYROLL_PERIOD_NOT_FOUND');
    if (!['DRAFT', 'REVIEW'].includes(period.rows[0].status)) throw new AppError('Este periodo ya no admite novedades.', 409, 'PAYROLL_PERIOD_LOCKED');
    const employee = await client.query('SELECT id FROM payroll_employees WHERE id = $1 AND tenant_id = $2 AND active = TRUE', [req.body.employeeId, req.context.tenantId]);
    if (!employee.rowCount) throw new AppError('El empleado no pertenece a la empresa activa.', 404, 'PAYROLL_EMPLOYEE_NOT_FOUND');
    const effectiveDate = req.body.effectiveDate || null;
    if (effectiveDate && (!date(effectiveDate) || effectiveDate < String(period.rows[0].start_date).slice(0, 10) || effectiveDate > String(period.rows[0].end_date).slice(0, 10))) {
      throw new AppError('La fecha de la novedad debe estar dentro del periodo.', 422, 'PAYROLL_NOVELTY_DATE_INVALID');
    }
    const result = await client.query(
      `INSERT INTO payroll_novelties(tenant_id, payroll_period_id, employee_id, novelty_type, concept_code, description, quantity, amount, effective_date, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.context.tenantId, req.params.id, req.body.employeeId, noveltyType, value(req.body.conceptCode, 40, true), value(req.body.description, 240, true), req.body.quantity == null || req.body.quantity === '' ? null : Number(req.body.quantity), money(req.body.amount), effectiveDate, req.context.userId],
    );
    await writeAudit(client, { tenantId: req.context.tenantId, userId: req.context.userId, action: 'payroll.novelty_created', entityType: 'payroll_novelty', entityId: result.rows[0].id, after: result.rows[0], reason: 'Novedad de nómina registrada' });
    return result.rows[0];
  });
  res.status(201).json(novelty);
}));

router.post('/periods/:id/approve', requirePermission('payroll.approve'), asyncHandler(async (req, res) => {
  id(req.params.id, 'El periodo debe tener un UUID válido.');
  const period = await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE payroll_periods SET status = 'APPROVED', approved_by = $3, approved_at = now(), updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND status IN ('DRAFT','REVIEW') RETURNING *`,
      [req.params.id, req.context.tenantId, req.context.userId],
    );
    if (!result.rowCount) throw new AppError('El periodo no existe o ya fue aprobado.', 409, 'PAYROLL_PERIOD_NOT_APPROVABLE');
    await writeAudit(client, { tenantId: req.context.tenantId, userId: req.context.userId, action: 'payroll.period_approved', entityType: 'payroll_period', entityId: result.rows[0].id, after: result.rows[0], reason: 'Periodo aprobado para liquidación revisada' });
    return result.rows[0];
  });
  res.json(period);
}));

export default router;
