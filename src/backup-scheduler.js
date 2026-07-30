import { runBackup } from '../scripts/backup.js';
import { config } from './config.js';
import { logger } from './shared/logger.js';

export function startBackupScheduler() {
  if (!config.backupEnabled) return () => {};
  if (!config.backupEncryptionKey) {
    throw new Error('BACKUP_ENCRYPTION_KEY es obligatoria cuando BACKUP_ENABLED=true.');
  }
  let running = false;
  const execute = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runBackup();
      logger.info('backup.completed', {
        fileName: result.file.split('/').pop(),
        bytes: result.bytes,
        sha256: result.sha256,
        prunedCount: result.removed.length,
      });
    } catch (error) {
      logger.error('backup.failed', {
        errorName: error.name,
        message: error.message,
      });
    } finally {
      running = false;
    }
  };
  const timer = setInterval(
    execute,
    config.backupIntervalHours * 60 * 60 * 1000,
  );
  timer.unref();
  setTimeout(execute, 30_000).unref();
  return () => clearInterval(timer);
}
