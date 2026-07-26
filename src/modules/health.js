import { Router } from 'express';
import { checkDatabase } from '../db.js';
import { checkRedis } from '../redis.js';

function rejectedCheck(reason) {
  return {
    ok: false,
    code: reason?.code || 'DEPENDENCY_UNAVAILABLE',
  };
}

export function createHealthRouter({
  databaseCheck = checkDatabase,
  redisCheck = checkRedis,
} = {}) {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({
      ok: true,
      status: 'alive',
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  router.get('/ready', async (_req, res) => {
    const [database, redis] = await Promise.allSettled([databaseCheck(), redisCheck()]);
    const checks = {
      postgres: database.status === 'fulfilled'
        ? { ok: true, ...database.value }
        : rejectedCheck(database.reason),
      redis: redis.status === 'fulfilled'
        ? { ok: true, ...redis.value }
        : rejectedCheck(redis.reason),
    };
    const ok = checks.postgres.ok && checks.redis.ok;
    res.status(ok ? 200 : 503).json({
      ok,
      status: ok ? 'ready' : 'not_ready',
      checks,
      time: new Date().toISOString(),
    });
  });

  return router;
}

export default createHealthRouter();
