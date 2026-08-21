import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../shared/async-handler.js';
import {
  authenticatedUserProfile,
  activateUserWithToken,
  bootstrapPassword,
  loginWithPassword,
  requestPasswordReset,
  requireAuthenticatedSession,
  resetPasswordWithToken,
  resolveSession,
  rotateCsrfToken,
  revokeCurrentSession,
} from '../authentication.js';
import { AppError } from '../shared/errors.js';
import { setTimeout as delay } from 'node:timers/promises';

import { createRateLimiter } from '../middleware/rate-limiter.js';

const router = Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de acceso. Por favor, espera 15 minutos.',
});


router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function requireLocalBootstrap(req) {
  const address = req.socket.remoteAddress || '';
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) {
    throw new AppError(
      'La configuración inicial solo puede realizarse desde este equipo.',
      403,
      'LOCAL_BOOTSTRAP_REQUIRED',
    );
  }
}

router.get('/status', asyncHandler(async (req, res) => {
  const [passwordState, session] = await Promise.all([
    query(
      `SELECT
         EXISTS(SELECT 1 FROM users WHERE password_hash IS NOT NULL) configured,
         (SELECT email FROM users WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1) initial_email`,
    ),
    resolveSession(req, { required: false }),
  ]);
  const profile = session ? await authenticatedUserProfile(session.id) : null;
  const csrfToken = session ? await rotateCsrfToken(session.session_id) : null;
  res.json({
    authenticated: Boolean(profile),
    setupRequired: !passwordState.rows[0].configured,
    // No exponemos direcciones de usuarios activos en el dominio público de
    // producción. En desarrollo se conserva para facilitar el primer montaje.
    initialEmail: config.nodeEnv === 'production' ? null : passwordState.rows[0].initial_email,
    user: profile,
    csrfToken,
  });
}));

router.post('/bootstrap', authLimiter, asyncHandler(async (req, res) => {
  requireLocalBootstrap(req);
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError('Escribe un correo válido.', 422, 'INVALID_EMAIL');
  }
  const result = await bootstrapPassword(req, res, {
    email,
    password: req.body.password,
  });
  const profile = await authenticatedUserProfile(result.user.id);
  res.status(201).json({ user: profile, csrfToken: result.csrfToken });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const result = await loginWithPassword(req, res, req.body);
  const profile = await authenticatedUserProfile(result.user.id);
  res.json({ user: profile, csrfToken: result.csrfToken });
}));

router.post('/activate', asyncHandler(async (req, res) => {
  const result = await activateUserWithToken(req, res, req.body);
  const profile = await authenticatedUserProfile(result.user.id);
  res.json({ user: profile, csrfToken: result.csrfToken });
}));

router.post('/password-recovery/request', authLimiter, asyncHandler(async (req, res) => {
  const startedAt = performance.now();
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError('Escribe un correo válido.', 422, 'INVALID_EMAIL');
  }
  const result = await requestPasswordReset(req, { email });
  await delay(Math.max(0, 350 - (performance.now() - startedAt)));
  res.status(202).json({
    message: 'Si la cuenta existe, enviaremos las instrucciones de recuperación.',
    ...(result.resetUrl ? { resetUrl: result.resetUrl } : {}),
  });
}));

router.post('/password-recovery/complete', asyncHandler(async (req, res) => {
  const result = await resetPasswordWithToken(req, res, req.body);
  const profile = await authenticatedUserProfile(result.user.id);
  res.json({ user: profile, csrfToken: result.csrfToken });
}));

router.get('/me', requireAuthenticatedSession, asyncHandler(async (req, res) => {
  const profile = await authenticatedUserProfile(req.context.userId);
  res.json(profile);
}));

router.post('/logout', requireAuthenticatedSession, asyncHandler(async (req, res) => {
  await revokeCurrentSession(req, res);
  res.status(204).end();
}));

export default router;
