import { checkDatabase, closeDatabase } from '../src/db.js';
import { checkRedis } from '../src/redis.js';
import { logger } from '../src/shared/logger.js';

const attempts = 30;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const checks = await Promise.allSettled([checkDatabase(), checkRedis()]);
  if (checks.every((check) => check.status === 'fulfilled')) {
    logger.info('services.ready', { attempt });
    await closeDatabase();
    process.exit(0);
  }
  if (attempt === attempts) {
    logger.error('services.timeout', { attempts });
    await closeDatabase();
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
