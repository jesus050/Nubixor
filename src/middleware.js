export function requestContext(req, _res, next) {
  req.context = {
    tenantId: req.header('x-tenant-id') || null,
    userId: req.header('x-user-id') || null,
    requestId: req.header('x-request-id') || crypto.randomUUID(),
  };
  next();
}

export function requireTenant(req, res, next) {
  if (!req.context.tenantId) {
    return res.status(400).json({ error: 'Se requiere el encabezado x-tenant-id.' });
  }
  next();
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada.' });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = Number(error.status || 500);
  res.status(status).json({ error: status >= 500 ? 'Error interno.' : error.message });
}
