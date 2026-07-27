import 'dotenv/config';

function readPort(value) {
  const port = Number(value ?? 4100);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }
  return port;
}

function readBoolean(name, value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} debe ser "true" o "false".`);
}

function readPositiveInteger(name, value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} debe ser un entero positivo.`);
  }
  return parsed;
}

function readBodyLimit(value) {
  const limit = value || '3mb';
  if (!/^\d+(b|kb|mb|gb)$/i.test(limit)) {
    throw new Error('JSON_BODY_LIMIT debe usar un formato como 512kb o 1mb.');
  }
  return limit;
}

function readOptionalUrl(name, value, protocols) {
  const normalized = value?.trim();
  if (!normalized) return null;

  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${name} debe contener una URL válida.`);
  }

  if (!protocols.includes(url.protocol)) {
    throw new Error(`${name} debe usar uno de estos protocolos: ${protocols.join(', ')}.`);
  }
  return normalized;
}

function readCorsOrigins(value) {
  const origins = (value || '*').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.includes('*') && origins.length > 1) {
    throw new Error('CORS_ORIGINS no puede combinar "*" con orígenes específicos.');
  }
  for (const origin of origins) {
    if (origin === '*') continue;
    readOptionalUrl('CORS_ORIGINS', origin, ['http:', 'https:']);
  }
  return origins;
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV debe ser development, test o production.');
}
const corsOrigins = readCorsOrigins(process.env.CORS_ORIGINS);
if (nodeEnv === 'production' && corsOrigins.includes('*')) {
  throw new Error('CORS_ORIGINS debe declarar orígenes explícitos en producción.');
}

export const config = {
  nodeEnv,
  port: readPort(process.env.PORT),
  appName: process.env.APP_NAME || 'MegaSuite',
  databaseUrl: readOptionalUrl('DATABASE_URL', process.env.DATABASE_URL, ['postgres:', 'postgresql:']),
  databaseSsl: readBoolean('DATABASE_SSL', process.env.DATABASE_SSL),
  databaseSslRejectUnauthorized: readBoolean(
    'DATABASE_SSL_REJECT_UNAUTHORIZED',
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    true,
  ),
  databasePoolMax: readPositiveInteger('DATABASE_POOL_MAX', process.env.DATABASE_POOL_MAX, 10),
  databaseConnectTimeoutMs: readPositiveInteger(
    'DATABASE_CONNECT_TIMEOUT_MS',
    process.env.DATABASE_CONNECT_TIMEOUT_MS,
    3000,
  ),
  redisUrl: readOptionalUrl('REDIS_URL', process.env.REDIS_URL, ['redis:', 'rediss:']),
  corsOrigins,
  trustProxy: readBoolean('TRUST_PROXY', process.env.TRUST_PROXY),
  jsonBodyLimit: readBodyLimit(process.env.JSON_BODY_LIMIT),
};
