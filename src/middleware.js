import { randomUUID } from 'node:crypto';
import { logger } from './shared/logger.js';

export function requestContext(req, _res, next) {
  const suppliedRequestId = req.header('x-request-id');
  const requestId = suppliedRequestId && suppliedRequestId.length <= 128
    ? suppliedRequestId
    : randomUUID();
  // Las etiquetas <img> del navegador no pueden adjuntar x-tenant-id. Solo
  // para contenido privado de medios permitimos el tenant como query string;
  // sigue siendo validado por sesión, permisos y company_id en el endpoint.
  const mediaContentTenant = req.path.match(/^\/api\/media\/assets\/[0-9a-f-]+\/content$/i)
    ? req.query?.tenantId
    : null;
  req.context = {
    tenantId: req.header('x-tenant-id') || mediaContentTenant || null,
    userId: null,
    authenticated: false,
    requestId,
  };
  _res.setHeader('x-request-id', requestId);
  next();
}

export function requestLogger(req, res, next) {
  const startedAt = performance.now();
  res.on('finish', () => {
    logger.info('http.request', {
      requestId: req.context?.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    });
  });
  next();
}

export function requireTenant(req, res, next) {
  if (!req.context.tenantId) {
    return res.status(400).json({ error: 'Se requiere el encabezado x-tenant-id.' });
  }
  next();
}

export function notFound(req, res) {
  res.status(404).json({
    error: 'Ruta no encontrada.',
    code: 'ROUTE_NOT_FOUND',
    requestId: req.context?.requestId,
  });
}

export function errorHandler(error, req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const isServerError = status >= 500;
  const expose = error.expose === true || !isServerError;

  logger.error('http.error', {
    requestId: req.context?.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: status,
    errorName: error.name,
    errorCode: error.code,
    message: error.message,
  });

  if (res.headersSent) return _next(error);
  return res.status(status).json({
    error: expose ? error.message : 'Error interno.',
    code: expose ? (error.code || 'REQUEST_ERROR') : 'INTERNAL_ERROR',
    ...(expose && error.details ? { details: error.details } : {}),
    requestId: req.context?.requestId,
  });
}
