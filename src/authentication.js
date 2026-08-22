import {
  createHash,
  randomBytes,
  timingSafeEqual,
  scrypt as scryptCallback,
} from 'node:crypto';
import { promisify } from 'node:util';
import { query, withTransaction } from './db.js';
import { writeAccessAudit } from './audit.js';
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
       user_id, token_hash, csrf_token_hash, expires_at, user_agent, active_tenant_id
     )
     VALUES(
       $1,$2,$3,$4,$5,
       (SELECT tenant_id FROM tenant_users
        WHERE user_id = $1 AND status = 'ACTIVE'
        ORDER BY joined_at NULLS LAST, tenant_id LIMIT 1)
     )`,
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
    `SELECT s.id session_id, s.csrf_token_hash, s.expires_at, s.active_tenant_id,
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
  const membership = await query(
    `SELECT tenant_id, branch_id
     FROM tenant_users
     WHERE user_id = $1 AND status = 'ACTIVE'
     ORDER BY CASE WHEN tenant_id = $2 THEN 0 ELSE 1 END, joined_at NULLS LAST, tenant_id
     LIMIT 1`,
    [session.id, session.active_tenant_id],
  );
  if (!membership.rowCount) {
    throw new AppError('Tu usuario no tiene una empresa activa asignada.', 403, 'TENANT_MEMBERSHIP_REQUIRED');
  }
  const tenantId = membership.rows[0].tenant_id;
  req.context.tenantId = tenantId;
  req.context.branchId = membership.rows[0].branch_id || null;
  if (tenantId !== session.active_tenant_id) {
    await query('UPDATE auth_sessions SET active_tenant_id = $1 WHERE id = $2', [tenantId, session.session_id]);
  }
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
    await withTransaction(async (client) => {
      const revoked = await client.query(
        `UPDATE auth_sessions SET revoked_at = now()
         WHERE token_hash = $1 AND revoked_at IS NULL
         RETURNING user_id`,
        [digest(token)],
      );
      if (revoked.rowCount) {
        await writeAccessAudit(client, {
          userId: revoked.rows[0].user_id,
          action: 'auth.logout',
          reason: 'Cierre de sesión solicitado por la persona',
        });
      }
    });
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
  // El intento fallido se registra y la transacción se cierra bien; el error se
  // lanza después. Antes se lanzaba dentro, así que la reversión se llevaba por
  // delante el contador de intentos y el bloqueo por fuerza bruta no llegaba a
  // activarse nunca: cada intento partía de cero.
  const outcome = await withTransaction(async (client) => {
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
      let locked = false;
      if (user && !blocked) {
        const attempts = Number(user.failed_login_attempts) + 1;
        locked = attempts >= 5;
        await client.query(
          `UPDATE users
           SET failed_login_attempts = $1,
               locked_until = CASE WHEN $2 THEN now() + interval '15 minutes' ELSE NULL END
           WHERE id = $3`,
          // El contador vuelve a cero al bloquear para que, pasados los quince
          // minutos, la cuenta empiece con cinco oportunidades otra vez. Antes
          // ese cero viajaba en el mismo parámetro que decidía el bloqueo, así
          // que la condición nunca se cumplía y la cuenta no se bloqueaba nunca.
          [locked ? 0 : attempts, locked, user.id],
        );
      }
      if (user) {
        await writeAccessAudit(client, {
          userId: user.id,
          action: locked ? 'auth.account_locked' : 'auth.login_failed',
          reason: blocked
            ? 'Intento sobre una cuenta bloqueada temporalmente'
            : 'Credenciales incorrectas',
          metadata: { email: normalizedEmail, blocked: Boolean(blocked) },
        });
      }
      return { ok: false, blocked: Boolean(blocked) };
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
    await writeAccessAudit(client, {
      userId: user.id,
      action: 'auth.login',
      reason: remember ? 'Acceso con sesión recordada' : 'Acceso con contraseña',
    });
    return {
      ok: true,
      session: { user: { id: user.id, email: user.email, full_name: user.full_name }, ...auth },
    };
  });

  if (!outcome.ok) {
    throw new AppError(
      outcome.blocked
        ? 'La cuenta está temporalmente bloqueada. Intenta nuevamente más tarde.'
        : 'El correo o la contraseña no son correctos.',
      401,
      outcome.blocked ? 'ACCOUNT_TEMPORARILY_LOCKED' : 'INVALID_CREDENTIALS',
    );
  }
  return outcome.session;
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
    await writeAccessAudit(client, {
      userId: user.rows[0].id,
      action: 'auth.account_activated',
      reason: 'La persona definió su contraseña desde el enlace de invitación',
    });
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

async function deliverPasswordReset({ email, fullName, resetUrl }) {
  if (!config.passwordResetWebhookUrl) return false;
  const response = await fetch(config.passwordResetWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.passwordResetWebhookSecret
        ? { Authorization: `Bearer ${config.passwordResetWebhookSecret}` }
        : {}),
    },
    body: JSON.stringify({
      type: 'PASSWORD_RESET',
      recipient: { email, name: fullName },
      resetUrl,
      expiresInMinutes: 30,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`El proveedor de correo respondió ${response.status}.`);
  }
  return true;
}

export async function requestPasswordReset(req, { email }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || normalizedEmail.length > 320) {
    throw new AppError('Escribe un correo válido.', 422, 'INVALID_EMAIL');
  }
  const reset = await withTransaction(async (client) => {
    const ipHash = digest(req.ip || req.socket.remoteAddress || 'unknown');
    const emailHash = digest(normalizedEmail);
    await client.query(
      `DELETE FROM auth_recovery_attempts
       WHERE created_at < now() - interval '7 days'`,
    );
    const attempts = await client.query(
      `SELECT
         COUNT(*) FILTER (WHERE requester_ip_hash = $1)::integer ip_count,
         COUNT(*) FILTER (WHERE email_hash = $2)::integer email_count
       FROM auth_recovery_attempts
       WHERE created_at > now() - interval '1 hour'`,
      [ipHash, emailHash],
    );
    await client.query(
      `INSERT INTO auth_recovery_attempts(requester_ip_hash, email_hash)
       VALUES($1,$2)`,
      [ipHash, emailHash],
    );
    if (attempts.rows[0].ip_count >= 10 ||
        attempts.rows[0].email_count >= 5) return null;
    const userResult = await client.query(
      `SELECT id, email, full_name
       FROM users
       WHERE lower(email) = $1 AND status = 'ACTIVE'
       FOR UPDATE`,
      [normalizedEmail],
    );
    if (!userResult.rowCount) return null;
    const user = userResult.rows[0];
    const recent = await client.query(
      `SELECT COUNT(*)::integer count
       FROM user_access_tokens
       WHERE user_id = $1 AND purpose = 'RESET_PASSWORD'
         AND created_at > now() - interval '1 hour'`,
      [user.id],
    );
    if (recent.rows[0].count >= 3) return null;
    await client.query(
      `UPDATE user_access_tokens
       SET used_at = now()
       WHERE user_id = $1 AND purpose = 'RESET_PASSWORD' AND used_at IS NULL`,
      [user.id],
    );
    const token = randomBytes(32).toString('base64url');
    const created = await client.query(
      `INSERT INTO user_access_tokens(
         user_id, purpose, token_hash, expires_at, requested_ip_hash,
         requested_user_agent, delivery_status
       )
       VALUES($1,'RESET_PASSWORD',$2,now() + interval '30 minutes',$3,$4,$5)
       RETURNING id`,
      [
        user.id,
        digest(token),
        ipHash,
        req.header('user-agent')?.slice(0, 500) || null,
        config.passwordResetWebhookUrl ? 'PENDING' : 'NOT_REQUIRED',
      ],
    );
    return { ...user, token, requestId: created.rows[0].id };
  });
  if (!reset) return { accepted: true };

  const baseUrl = config.publicBaseUrl || `http://localhost:${config.port}`;
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/?reset=${encodeURIComponent(reset.token)}`;
  if (config.passwordResetWebhookUrl) {
    try {
      await deliverPasswordReset({
        email: reset.email,
        fullName: reset.full_name,
        resetUrl,
      });
      await query(
        `UPDATE user_access_tokens
         SET delivery_status = 'SENT', delivered_at = now()
         WHERE id = $1`,
        [reset.requestId],
      );
    } catch {
      await query(
        `UPDATE user_access_tokens SET delivery_status = 'FAILED' WHERE id = $1`,
        [reset.requestId],
      );
    }
  }
  return {
    accepted: true,
    ...(config.nodeEnv !== 'production' ? { resetUrl } : {}),
  };
}

export async function resetPasswordWithToken(req, res, { token, password }) {
  if (typeof token !== 'string' || token.length < 32) {
    throw new AppError(
      'El enlace de recuperación no es válido.',
      422,
      'INVALID_PASSWORD_RESET_TOKEN',
    );
  }
  const passwordHash = await hashPassword(password);
  return withTransaction(async (client) => {
    const access = await client.query(
      `SELECT id, user_id
       FROM user_access_tokens
       WHERE token_hash = $1 AND purpose = 'RESET_PASSWORD'
         AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [digest(token)],
    );
    if (!access.rowCount) {
      throw new AppError(
        'El enlace venció o ya fue utilizado.',
        410,
        'PASSWORD_RESET_TOKEN_EXPIRED',
      );
    }
    const user = await client.query(
      `UPDATE users
       SET password_hash = $1, password_changed_at = now(),
           failed_login_attempts = 0, locked_until = NULL
       WHERE id = $2 AND status = 'ACTIVE'
       RETURNING id, email, full_name`,
      [passwordHash, access.rows[0].user_id],
    );
    if (!user.rowCount) {
      throw new AppError('La cuenta ya no está activa.', 410, 'USER_NOT_ACTIVE');
    }
    await client.query(
      `UPDATE user_access_tokens SET used_at = now()
       WHERE user_id = $1 AND purpose = 'RESET_PASSWORD' AND used_at IS NULL`,
      [access.rows[0].user_id],
    );
    await client.query(
      `UPDATE auth_sessions SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [access.rows[0].user_id],
    );
    await writeAccessAudit(client, {
      userId: user.rows[0].id,
      action: 'auth.password_changed',
      reason: 'Contraseña restablecida desde el enlace de recuperación',
      // Las sesiones abiertas se cerraron: quien tuviera la cuenta tomada queda
      // fuera, y eso es parte del evento.
      metadata: { revokedExistingSessions: true },
    });
    const auth = await createSession(client, req, res, user.rows[0].id);
    return { user: user.rows[0], ...auth };
  });
}
