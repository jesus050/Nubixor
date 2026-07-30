import { app } from './app.js';
import { config } from './config.js';
import { closeDatabase } from './db.js';
import { logger } from './shared/logger.js';
import { startBillingRetryScheduler } from './electronic-billing/retry-scheduler.js';
import { startBackupScheduler } from './backup-scheduler.js';

const server = app.listen(config.port, () => {
  logger.info('server.started', {
    appName: config.appName,
    nodeEnv: config.nodeEnv,
    nodeVersion: process.version,
    port: config.port,
    databaseConfigured: Boolean(config.databaseUrl),
    redisConfigured: Boolean(config.redisUrl),
  });
});
const stopBillingRetryScheduler = startBillingRetryScheduler();
const stopBackupScheduler = startBackupScheduler();

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  stopBillingRetryScheduler();
  stopBackupScheduler();
  logger.info('server.stopping', { signal });

  server.close(async (error) => {
    try {
      await closeDatabase();
      if (error) throw error;
      logger.info('server.stopped');
      process.exit(0);
    } catch (shutdownError) {
      logger.error('server.shutdown_failed', {
        errorName: shutdownError.name,
        message: shutdownError.message,
      });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('server.shutdown_timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.error('process.uncaught_exception', { errorName: error.name, message: error.message });
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('process.unhandled_rejection', { errorName: error.name, message: error.message });
  shutdown('unhandledRejection');
});
