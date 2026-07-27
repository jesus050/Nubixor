import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { csvCell } from '../shared/csv.js';

const router = Router();
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER_PATTERN = /^\d+$/;

router.use(requireTenant);

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El filtro supera ${maxLength} caracteres.`,
      422,
      'AUDIT_FILTER_TOO_LONG',
    );
  }
  return normalized;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function parseFilters(search) {
  const dateFrom = cleanText(search.dateFrom, 10);
  const dateTo = cleanText(search.dateTo, 10);
  if ((dateFrom && !validDate(dateFrom)) || (dateTo && !validDate(dateTo))) {
    throw new AppError(
      'Las fechas de auditoría deben usar el formato AAAA-MM-DD.',
      422,
      'INVALID_AUDIT_DATE',
    );
  }
  if (dateFrom && dateTo && dateTo < dateFrom) {
    throw new AppError(
      'La fecha final no puede ser anterior a la fecha inicial.',
      422,
      'INVALID_AUDIT_DATE_RANGE',
    );
  }
  const page = Number(search.page || 1);
  const pageSize = Number(search.pageSize || 30);
  if (!Number.isInteger(page) || page < 1 ||
      !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new AppError(
      'La paginación de auditoría no es válida.',
      422,
      'INVALID_AUDIT_PAGINATION',
    );
  }
  return {
    q: cleanText(search.q, 120),
    actorId: cleanText(search.actorId, 36),
    action: cleanText(search.action, 100),
    entityType: cleanText(search.entityType, 100),
    dateFrom,
    dateTo,
    page,
    pageSize,
  };
}

function buildWhere(tenantId, filters) {
  const values = [tenantId];
  const clauses = ['ae.tenant_id = $1'];
  const add = (clause, value) => {
    values.push(value);
    clauses.push(clause.replace('?', `$${values.length}`));
  };
  if (filters.q) {
    add(
      `(ae.action ILIKE '%' || ? || '%'
        OR ae.entity_type ILIKE '%' || ? || '%'
        OR COALESCE(ae.entity_id, '') ILIKE '%' || ? || '%'
        OR COALESCE(ae.reason, '') ILIKE '%' || ? || '%'
        OR COALESCE(u.full_name, '') ILIKE '%' || ? || '%'
        OR COALESCE(u.email, '') ILIKE '%' || ? || '%')`,
      filters.q,
    );
    const index = values.length;
    clauses[clauses.length - 1] = clauses[clauses.length - 1]
      .replaceAll('?', `$${index}`);
  }
  if (filters.actorId) add('ae.actor_user_id::text = ?', filters.actorId);
  if (filters.action) add('ae.action = ?', filters.action);
  if (filters.entityType) add('ae.entity_type = ?', filters.entityType);
  if (filters.dateFrom) add('ae.created_at >= ?::date', filters.dateFrom);
  if (filters.dateTo) add(`ae.created_at < (?::date + INTERVAL '1 day')`, filters.dateTo);
  return { clause: clauses.join('\n AND '), values };
}

router.get('/summary', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT COUNT(*)::integer total,
            COUNT(*) FILTER (
              WHERE created_at >= CURRENT_DATE
            )::integer today,
            COUNT(*) FILTER (
              WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
            )::integer last_7_days,
            COUNT(*) FILTER (
              WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
            )::integer last_30_days,
            COUNT(DISTINCT actor_user_id) FILTER (
              WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
            )::integer active_actors,
            COUNT(DISTINCT action)::integer action_types
     FROM audit_events
     WHERE tenant_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0]);
}));

router.get('/facets', asyncHandler(async (req, res) => {
  const [actions, entities, actors] = await Promise.all([
    query(
      `SELECT action, COUNT(*)::integer event_count
       FROM audit_events
       WHERE tenant_id = $1
       GROUP BY action
       ORDER BY action`,
      [req.context.tenantId],
    ),
    query(
      `SELECT entity_type, COUNT(*)::integer event_count
       FROM audit_events
       WHERE tenant_id = $1
       GROUP BY entity_type
       ORDER BY entity_type`,
      [req.context.tenantId],
    ),
    query(
      `SELECT u.id, u.full_name, u.email, COUNT(*)::integer event_count
       FROM audit_events ae
       JOIN users u ON u.id = ae.actor_user_id
       WHERE ae.tenant_id = $1
       GROUP BY u.id, u.full_name, u.email
       ORDER BY u.full_name`,
      [req.context.tenantId],
    ),
  ]);
  res.json({
    actions: actions.rows,
    entities: entities.rows,
    actors: actors.rows,
  });
}));

router.get('/events', asyncHandler(async (req, res) => {
  const filters = parseFilters(req.query);
  const where = buildWhere(req.context.tenantId, filters);
  const offset = (filters.page - 1) * filters.pageSize;
  const [events, total] = await Promise.all([
    query(
      `SELECT ae.id, ae.action, ae.entity_type, ae.entity_id, ae.reason,
              ae.metadata, ae.created_at, ae.actor_user_id,
              u.full_name actor_name, u.email actor_email
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_user_id
       WHERE ${where.clause}
       ORDER BY ae.created_at DESC, ae.id DESC
       LIMIT $${where.values.length + 1}
       OFFSET $${where.values.length + 2}`,
      [...where.values, filters.pageSize, offset],
    ),
    query(
      `SELECT COUNT(*)::integer total
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_user_id
       WHERE ${where.clause}`,
      where.values,
    ),
  ]);
  const totalItems = total.rows[0].total;
  res.json({
    items: events.rows,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / filters.pageSize)),
    },
  });
}));

router.get('/export.csv', asyncHandler(async (req, res) => {
  const filters = parseFilters({ ...req.query, page: 1, pageSize: 100 });
  const where = buildWhere(req.context.tenantId, filters);
  const result = await query(
    `SELECT ae.id, ae.created_at, COALESCE(u.full_name, 'Sistema') actor_name,
            u.email actor_email, ae.action, ae.entity_type, ae.entity_id,
            ae.reason, ae.before_data, ae.after_data, ae.metadata
     FROM audit_events ae
     LEFT JOIN users u ON u.id = ae.actor_user_id
     WHERE ${where.clause}
     ORDER BY ae.created_at DESC, ae.id DESC
     LIMIT 5000`,
    where.values,
  );
  const headings = [
    'ID', 'Fecha', 'Actor', 'Correo', 'Acción', 'Entidad', 'Identificador',
    'Motivo', 'Antes', 'Después', 'Metadatos',
  ];
  const lines = [
    headings.map(csvCell).join(','),
    ...result.rows.map((row) => [
      row.id,
      row.created_at?.toISOString?.() || row.created_at,
      row.actor_name,
      row.actor_email,
      row.action,
      row.entity_type,
      row.entity_id,
      row.reason,
      row.before_data,
      row.after_data,
      row.metadata,
    ].map(csvCell).join(',')),
  ];
  const filename = `megasuite-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  res
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${filename}"`)
    .send(`\uFEFF${lines.join('\n')}`);
}));

router.get('/events/:id', asyncHandler(async (req, res) => {
  if (!INTEGER_PATTERN.test(req.params.id)) {
    throw new AppError(
      'El evento de auditoría debe tener un identificador numérico.',
      422,
      'INVALID_AUDIT_EVENT_ID',
    );
  }
  const result = await query(
    `SELECT ae.id, ae.action, ae.entity_type, ae.entity_id, ae.reason,
            ae.before_data, ae.after_data, ae.metadata, ae.created_at,
            ae.actor_user_id, u.full_name actor_name, u.email actor_email
     FROM audit_events ae
     LEFT JOIN users u ON u.id = ae.actor_user_id
     WHERE ae.id = $1 AND ae.tenant_id = $2`,
    [req.params.id, req.context.tenantId],
  );
  if (!result.rowCount) {
    throw new AppError(
      'No encontramos el evento de auditoría.',
      404,
      'AUDIT_EVENT_NOT_FOUND',
    );
  }
  res.json(result.rows[0]);
}));

export { parseFilters };
export default router;
