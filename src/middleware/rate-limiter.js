import { AppError } from '../shared/errors.js';

const defaultWindowMs = 15 * 60 * 1000; // 15 minutos
const defaultMaxRequests = 10; // Máximo 10 intentos por ventana

const requestStore = new Map();

// Limpieza periódica cada 10 minutos para prevenir fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export function createRateLimiter({
  windowMs = defaultWindowMs,
  max = defaultMaxRequests,
  keyGenerator = (req) => req.ip || req.header('x-forwarded-for') || req.socket.remoteAddress || 'global',
  message = 'Demasiados intentos. Por favor, intente nuevamente más tarde.',
  errorCode = 'TOO_MANY_REQUESTS',
} = {}) {
  return (req, res, next) => {
    const key = `${req.path}:${keyGenerator(req)}`;
    const now = Date.now();

    let record = requestStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestStore.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      throw new AppError(message, 429, errorCode);
    }

    next();
  };
}
