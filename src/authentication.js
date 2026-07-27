import {
  createHash,
  randomBytes,
  timingSafeEqual,
  scrypt as scryptCallback,
} from 'node:crypto';
import { promisify } from 'node:util';
import { query, withTransaction } from './db.js';
import { config } from './config.js';
import { AppError } from './shared/errors.js';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'megasuite_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const REMEMBERED_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_MAX_LENGTH = 128;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseCookies(header = '') {
  const cookies = new Map();
  for (const item of header.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    const name = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (name) cookies.set(name, decodeURIComponent(value));
  }
  return cookies;
}

function sessionToken(req) {
  return parseCookies(req.header('cookie')).get(SESSION_COOKIE) || null;
}

function sessionCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.nodeEnv === 'production',
    maxAge,
    path: '/',
  };
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions(0));
}

export function validateNewPassword(password) {
  if (typeof password !== 'string' ||
      password.length < 10 ||
      password.length > PASSWORD_MAX_LENGTH ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)) {
    throw new AppError(
      'La contraseña debe tener entre 10 y 128 caracteres, mayúscula, minúscula y número.',
      422,
      'WEAK_PASSWORD',
    );
  }
  return password;
}

export async function hashPassword(password) {
  validateNewPassword(password);
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH ||
      typeof storedHash !== 'string') return false;
  const [algorithm, n, r, p, salt, expectedHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const derived = await scrypt(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function createSession(client, req, res, userId, remember = false) {
  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(24).toString('base64url');
  const duration = remember ? REMEMBERED_SESSION_DURATION_MS : SESSION_DURATION_MS;
  const expiresAt = new Date(Date.now() + duration);
  await client.query(
    `INSERT INTO auth_sessions(
       user_id, token_hash, csrf_token_hash, expires_at, user_agent
     )
     VALUES($1,$2,$3,$4,$5)`,
    [
      userId,
      digest(token),
      digest(csrfToken),
      expiresAt,
      req.header('user-agent')?.slice(0, 500) || null,
    ],
  );
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(duration));
  return { csrfToken, expiresAt };
}

export async function resolveSession(req, { required = true } = {}) {
  const token = sessionToken(req);
  if (!token) {
    if (!required) return null;
    throw new AppError(
      'Inicia sesión para continuar.',
      401,
      'AUTHENTICATION_REQUIRED',
    );
  }
  const result = await query(
    `SELECT s.id session_id, s.csrf_token_hash, s.expires_at,
            u.id, u.email, u.full_name, u.job_title, u.status
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.status = 'ACTIVE'`,
    [digest(token)],
  );
  if (!result.rowCount) {
    if (!required) return null;
    throw new AppError(
      'La sesión venció. Vuelve a iniciar sesión.',
      401,
      'SESSION_EXPIRED',
    );
  }
  const session = result.rows[0];
  req.context.userId = session.id;
  req.context.sessionId = session.session_id;
  req.context.authenticated = true;
  req.context.user = {
    id: session.id,
    email: session.email,
    fullName: session.full_name,
    jobTitle: session.job_title,
  };
  return session;
}

export async function authenticatedUserProfile(userId) {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.job_title, u.last_login_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'tenantId', t.id,
                  'legalName', t.legal_name,
                  'tradeName', t.trade_name,
                  'status', tu.status,
                  'branchId', tu.branch_id,
                  'roleId', r.id,
                  'roleCode', r.code,
                  'roleName', r.name,
                  'permissions', role_permissions.permissions
                )
                ORDER BY t.legal_name
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'::json
            ) memberships
     FROM users u
     LEFT JOIN tenant_users tu
       ON tu.user_id = u.id AND tu.status = 'ACTIVE'
     LEFT JOIN tenants t
       ON t.id = tu.tenant_id AND t.status = 'ACTIVE'
     LEFT JOIN roles r
       ON r.id = tu.role_id AND r.tenant_id = tu.tenant_id AND r.active = TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(json_agg(permission_code ORDER BY permission_code), '[]'::json)
              permissions
       FROM role_permissions
       WHERE role_id = r.id AND tenant_id = t.id
     ) role_permissions ON TRUE
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId],
  );
  return result.rows[0] || null;
}

export async function rotateCsrfToken(sessionId) {
  const csrfToken = randomBytes(24).toString('base64url');
  await query(
    'UPDATE auth_sessions SET csrf_token_hash = $1, last_seen_at = now() WHERE id = $2',
    [digest(csrfToken), sessionId],
  );
  return csrfToken;
}

export function requireAuthenticatedSession(req, res, next) {
  resolveSession(req)
    .then((session) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const csrfToken = req.header('x-csrf-token');
        if (!csrfToken || digest(csrfToken) !== session.csrf_token_hash) {
          throw new AppError(
            'La verificación de seguridad de la sesión no es válida.',
            403,
            'CSRF_TOKEN_INVALID',
          );
        }
      }
      if (Math.random() < 0.05) {
        query(
          'UPDATE auth_sessions SET last_seen_at = now() WHERE id = $1',
          [session.session_id],
        ).catch(() => {});
      }
      next();
    })
    .catch((error) => {
      if (error.status === 401) clearSessionCookie(res);
      next(error);
    });
}

export async function revokeCurrentSession(req, res) {
  const token = sessionToken(req);
  if (token) {
    await query(
      'UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [digest(token)],
    );
  }
  clearSessionCookie(res);
}

export async function bootstrapPassword(req, res, { email, password }) {
  const passwordHash = await hashPassword(password);
  return withTransaction(async (client) => {
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
    const existing = await client.query(
      'SELECT 1 FROM users WHERE password_hash IS NOT NULL LIMIT 1',
    );
    if (existing.rowCount) {
      throw new AppError(
        'El acceso inicial ya fue configurado.',
        409,
        'BOOTSTRAP_ALREADY_COMPLETED',
      );
    }
    const user = await client.query(
      `UPDATE users
       SET password_hash = $1, password_changed_at = now(),
           failed_login_attempts = 0, locked_until = NULL, status = 'ACTIVE'
       WHERE lower(email) = lower($2) AND status = 'ACTIVE'
       RETURNING id, email, full_name`,
      [passwordHash, email],
    );
    if (!user.rowCount) {
      throw new AppError(
        'No encontramos la cuenta inicial activa.',
        404,
        'BOOTSTRAP_USER_NOT_FOUND',
      );
    }
    const auth = await createSession(client, req, res, user.rows[0].id);
    return { user: user.rows[0], ...auth };
  });
}

export async function loginWithPassword(req, res, { email, password, remember }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof password !== 'string' || !password) {
    throw new AppError(
      'Correo y contraseña son obligatorios.',
      422,
      'LOGIN_FIELDS_REQUIRED',
    );
  }
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, email, full_name, password_hash, status,
              failed_login_attempts, locked_until
       FROM users
       WHERE lower(email) = $1
       FOR UPDATE`,
      [normalizedEmail],
    );
    const user = result.rows[0];
    const blocked = user?.locked_until && new Date(user.locked_until) > new Date();
    const valid = user && user.status === 'ACTIVE' && !blocked &&
      await verifyPassword(password, user.password_hash);
    if (!valid) {
      if (user && !blocked) {
        const attempts = Number(user.failed_login_attempts) + 1;
        await client.query(
          `UPDATE users
           SET failed_login_attempts = $1,
               locked_until = CASE WHEN $1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
           WHERE id = $2`,
          [attempts >= 5 ? 0 : attempts, user.id],
        );
      }
      throw new AppError(
        blocked
          ? 'La cuenta está temporalmente bloqueada. Intenta nuevamente más tarde.'
          : 'El correo o la contraseña no son correctos.',
        401,
        blocked ? 'ACCOUNT_TEMPORARILY_LOCKED' : 'INVALID_CREDENTIALS',
      );
    }
    await client.query(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now()
       WHERE id = $1`,
      [user.id],
    );
    await client.query(
      `UPDATE auth_sessions SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at <= now()`,
      [user.id],
    );
    const auth = await createSession(client, req, res, user.id, Boolean(remember));
    return { user: { id: user.id, email: user.email, full_name: user.full_name }, ...auth };
  });
}

export async function createUserAccessToken(client, { userId, createdBy }) {
  const token = randomBytes(32).toString('base64url');
  await client.query(
    `UPDATE user_access_tokens
     SET used_at = now()
     WHERE user_id = $1 AND purpose = 'SET_PASSWORD' AND used_at IS NULL`,
    [userId],
  );
  await client.query(
    `INSERT INTO user_access_tokens(
       user_id, purpose, token_hash, expires_at, created_by
     )
     VALUES($1,'SET_PASSWORD',$2,now() + interval '72 hours',$3)`,
    [userId, digest(token), createdBy],
  );
  return token;
}

export async function activateUserWithToken(req, res, { token, password }) {
  if (typeof token !== 'string' || token.length < 32) {
    throw new AppError(
      'El enlace de activación no es válido.',
      422,
      'INVALID_ACTIVATION_TOKEN',
    );
  }
  const passwordHash = await hashPassword(password);
  return withTransaction(async (client) => {
    const access = await client.query(
      `SELECT id, user_id
       FROM user_access_tokens
       WHERE token_hash = $1
         AND purpose = 'SET_PASSWORD'
         AND used_at IS NULL
         AND expires_at > now()
       FOR UPDATE`,
      [digest(token)],
    );
    if (!access.rowCount) {
      throw new AppError(
        'El enlace venció o ya fue utilizado.',
        410,
        'ACTIVATION_TOKEN_EXPIRED',
      );
    }
    const user = await client.query(
      `UPDATE users
       SET password_hash = $1, password_changed_at = now(), status = 'ACTIVE',
           last_login_at = now(),
           failed_login_attempts = 0, locked_until = NULL
       WHERE id = $2
       RETURNING id, email, full_name`,
      [passwordHash, access.rows[0].user_id],
    );
    await client.query(
      `UPDATE tenant_users
       SET status = 'ACTIVE', joined_at = COALESCE(joined_at, now()), updated_at = now()
       WHERE user_id = $1 AND status = 'INVITED'`,
      [access.rows[0].user_id],
    );
    await client.query(
      'UPDATE user_access_tokens SET used_at = now() WHERE id = $1',
      [access.rows[0].id],
    );
    await client.query(
      `UPDATE auth_sessions
       SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [access.rows[0].user_id],
    );
    const auth = await createSession(client, req, res, user.rows[0].id);
    return { user: user.rows[0], ...auth };
  });
}
