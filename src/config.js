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

function readStorageProvider(value) {
  const provider = (value || 'local').trim().toLowerCase();
  if (!['local', 's3'].includes(provider)) {
    throw new Error('MEDIA_STORAGE_PROVIDER debe ser "local" o "s3".');
  }
  return provider;
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
  const fallbackOrigins = 'http://localhost:4100,http://127.0.0.1:4100,http://localhost:5173,http://127.0.0.1:5173';
  const origins = (value || fallbackOrigins).split(',').map((origin) => origin.trim()).filter(Boolean);
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
const publicBaseUrl = readOptionalUrl(
  'PUBLIC_BASE_URL',
  process.env.PUBLIC_BASE_URL,
  ['http:', 'https:'],
);
if (nodeEnv === 'production' &&
    (!publicBaseUrl || !publicBaseUrl.startsWith('https://'))) {
  throw new Error('PUBLIC_BASE_URL es obligatoria y debe usar HTTPS en producción.');
}
const passwordResetWebhookUrl = readOptionalUrl(
  'PASSWORD_RESET_WEBHOOK_URL',
  process.env.PASSWORD_RESET_WEBHOOK_URL,
  ['https:'],
);
const passwordResetWebhookSecret =
  process.env.PASSWORD_RESET_WEBHOOK_SECRET?.trim() || null;
if (nodeEnv === 'production' &&
    (!passwordResetWebhookUrl || !passwordResetWebhookSecret)) {
  throw new Error(
    'PASSWORD_RESET_WEBHOOK_URL y PASSWORD_RESET_WEBHOOK_SECRET son obligatorias en producción.',
  );
}

export const config = {
  nodeEnv,
  port: readPort(process.env.PORT),
  appName: process.env.APP_NAME || 'Nubixor',
  appVersion: process.env.APP_VERSION?.trim() || '0.1.0',
  buildCommit: process.env.BUILD_COMMIT?.trim() || 'unknown',
  buildTime: process.env.BUILD_TIME?.trim() || null,
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
  publicBaseUrl,
  passwordResetWebhookUrl,
  passwordResetWebhookSecret,
  storageDir: process.env.STORAGE_DIR?.trim() || './storage',
  mediaStorageProvider: readStorageProvider(process.env.MEDIA_STORAGE_PROVIDER),
  mediaMaxUploadMb: readPositiveInteger('MEDIA_MAX_UPLOAD_MB', process.env.MEDIA_MAX_UPLOAD_MB, 15),
  mediaMaxWidth: readPositiveInteger('MEDIA_MAX_WIDTH', process.env.MEDIA_MAX_WIDTH, 2000),
  mediaThumbWidth: readPositiveInteger('MEDIA_THUMB_WIDTH', process.env.MEDIA_THUMB_WIDTH, 400),
  backupEnabled: readBoolean('BACKUP_ENABLED', process.env.BACKUP_ENABLED),
  backupIntervalHours: readPositiveInteger(
    'BACKUP_INTERVAL_HOURS',
    process.env.BACKUP_INTERVAL_HOURS,
    24,
  ),
  backupDir: process.env.BACKUP_DIR?.trim() || './backups',
  backupRetentionDays: readPositiveInteger(
    'BACKUP_RETENTION_DAYS',
    process.env.BACKUP_RETENTION_DAYS,
    30,
  ),
  backupEncryptionKey:
    process.env.BACKUP_ENCRYPTION_KEY?.trim() || null,
  electronicBillingEncryptionKey:
    process.env.ELECTRONIC_BILLING_ENCRYPTION_KEY?.trim() || null,
  receiptVerificationKey:
    process.env.RECEIPT_VERIFICATION_KEY?.trim() ||
    process.env.ELECTRONIC_BILLING_ENCRYPTION_KEY?.trim() || null,
};
