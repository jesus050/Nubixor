import { createHash, randomBytes } from 'node:crypto';
import { pool, query } from '../src/db.js';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_ID = '50000000-0000-0000-0000-000000000001';
const API_BASE = process.env.NUBIXOR_INTERNAL_URL || 'http://127.0.0.1:4100';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (['password', 'client_secret', 'access_token', 'refresh_token', 'token'].includes(key)) {
      sanitized[key] = '[REDACTED_SENSITIVE_KEY]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

async function runSuite() {
  console.log("=== INICIANDO SUITE CONTROLADA DE VERIFICACIÓN FACTUS V2 ===");
  const sessionToken = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(24).toString('base64url');
  let sessionId;

  const api = async (path, options = {}) => {
    const method = options.method || 'GET';
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Cookie: `megasuite_session=${sessionToken}`,
        'x-tenant-id': COMPANY_ID,
        ...(!['GET', 'HEAD', 'OPTIONS'].includes(method)
          ? { 'x-csrf-token': csrfToken }
          : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const sanitizedPayload = sanitizeObject(payload);
      throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(sanitizedPayload)}`);
    }
    return payload;
  };

  try {
    const temporarySession = await query(
      `INSERT INTO auth_sessions(user_id, token_hash, csrf_token_hash, expires_at, user_agent)
       VALUES($1,$2,$3,now() + interval '30 minutes',$4)
       RETURNING id`,
      [ADMIN_ID, digest(sessionToken), digest(csrfToken), 'Nubixor Factus Recovery Suite']
    );
    sessionId = temporarySession.rows[0].id;

    console.log("1. Verificando estado de la cuenta de facturación...");
    const overview = await api('/api/electronic-billing/overview');
    console.log("Cuenta activa:", JSON.stringify(sanitizeObject(overview.account), null, 2));

    console.log("2. Consultando rangos de numeración oficiales...");
    const rangesPayload = await api('/api/electronic-billing/factus/numbering-ranges');
    console.log("Respuesta rangos (sanitizada):", JSON.stringify(sanitizeObject(rangesPayload), null, 2));

    console.log("SUITE DE PRUEBAS COMPLETADA DE FORMA CONTROLADA SANITIZADA.");
  } catch (error) {
    console.error("ERROR EN SUITE CONTROLADA:", error.message);
    // Sin esto el proceso termina en 0 y cualquier verificación de despliegue
    // daría la suite por buena sin haber comprobado nada.
    process.exitCode = 1;
  } finally {
    if (sessionId) {
      await query('UPDATE auth_sessions SET revoked_at = now() WHERE id = $1', [sessionId]).catch(() => {});
    }
    await pool?.end();
  }
}

runSuite();
