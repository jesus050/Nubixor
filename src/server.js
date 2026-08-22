import { app } from './app.js';
import { config } from './config.js';
import { checkTenantIsolationEnforcement, closeDatabase } from './db.js';
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
// Las políticas de aislamiento por empresa solo surten efecto si la aplicación
// se conecta con un rol que no pueda saltárselas. Si puede, hay que decirlo:
// creerlas activas cuando no lo están es peor que no tenerlas.
if (config.databaseUrl) {
  checkTenantIsolationEnforcement()
    .then(({ enforced, reason }) => {
      if (enforced) {
        logger.info('database.tenant_isolation_enforced');
      } else {
        logger.error('database.tenant_isolation_not_enforced', {
          reason,
          message: 'Las políticas por empresa no se aplican a este rol de base de datos. '
            + 'Conéctate con un rol sin SUPERUSER ni BYPASSRLS para que tengan efecto.',
        });
      }
    })
    .catch((error) => {
      logger.error('database.tenant_isolation_check_failed', {
        errorName: error.name,
        message: error.message,
      });
    });
}

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
