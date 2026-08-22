import { runBackup } from '../scripts/backup.js';
import { config } from './config.js';
import { withAdvisoryLock } from './db.js';
import { logger } from './shared/logger.js';

const BACKUP_LOCK = 'nubixor:backup';

export function startBackupScheduler() {
  if (!config.backupEnabled) return () => {};
  if (!config.backupEncryptionKey) {
    throw new Error('BACKUP_ENCRYPTION_KEY es obligatoria cuando BACKUP_ENABLED=true.');
  }
  let running = false;
  const execute = async () => {
    // Este contador cubre la misma instancia; el cerrojo cubre las demás.
    if (running) return;
    running = true;
    try {
      // Dos servidores respaldando a la vez son dos pg_dump peleando por disco
      // y ancho de banda para producir el mismo archivo. Quien no toma el turno
      // se aparta en silencio: no es un error, es que otro ya está en ello.
      const { acquired, result } = await withAdvisoryLock(BACKUP_LOCK, runBackup);
      if (!acquired) {
        logger.info('backup.skipped_other_instance_running');
        return;
      }
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
