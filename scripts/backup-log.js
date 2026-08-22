import { hostname } from 'node:os';
import { getPool } from '../src/db.js';
import { logger } from '../src/shared/logger.js';

// El registro de un respaldo nunca puede hacer fallar el respaldo. Si la base
// no está disponible para anotarlo, se anota en el log y se sigue: perder la
// anotación es molesto, perder la copia es otra cosa.
async function safely(work, event) {
  try {
    return await work();
  } catch (error) {
    logger.error(event, { errorCode: error.code, message: error.message });
    return null;
  }
}

export async function startBackupRun(kind) {
  return safely(async () => {
    const result = await getPool().query(
      `INSERT INTO backup_runs(kind, status, hostname)
       VALUES($1, 'RUNNING', $2)
       RETURNING id, started_at`,
      [kind, hostname()],
    );
    return result.rows[0];
  }, 'backup.run_not_registered');
}

export async function finishBackupRun(run, { file = null, bytes = null, sha256 = null, prunedCount = null } = {}) {
  if (!run) return null;
  return safely(() => getPool().query(
    `UPDATE backup_runs
     SET status = 'SUCCEEDED',
         finished_at = now(),
         duration_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000,
         file_name = $2, bytes = $3, sha256 = $4, pruned_count = $5
     WHERE id = $1`,
    [run.id, file, bytes, sha256, prunedCount],
  ), 'backup.run_completion_not_registered');
}

export async function failBackupRun(run, error) {
  if (!run) return null;
  return safely(() => getPool().query(
    `UPDATE backup_runs
     SET status = 'FAILED',
         finished_at = now(),
         duration_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000,
         error_message = $2
     WHERE id = $1`,
    [run.id, error?.message?.slice(0, 500) || 'Error desconocido'],
  ), 'backup.run_failure_not_registered');
}

// Lo que hay que poder responder sin entrar a buscar en los registros del
// servidor: cuándo fue el último respaldo bueno, cuánto pesó, cuánto tardó, y
// cuándo se probó por última vez que se puede restaurar.
export async function backupStatus() {
  const ultimo = async (kind, status) => {
    const result = await getPool().query(
      `SELECT id, status, started_at, finished_at, duration_ms, file_name,
              bytes, sha256, pruned_count, error_message, hostname
       FROM backup_runs
       WHERE kind = $1 AND ($2::text IS NULL OR status = $2)
       ORDER BY started_at DESC
       LIMIT 1`,
      [kind, status],
    );
    return result.rows[0] || null;
  };

  const [ultimoExitoso, ultimoIntento, ultimaVerificacion, ultimaRestauracion, sinTerminar] =
    await Promise.all([
      ultimo('BACKUP', 'SUCCEEDED'),
      ultimo('BACKUP', null),
      ultimo('VERIFICATION', 'SUCCEEDED'),
      ultimo('RESTORE_TEST', 'SUCCEEDED'),
      getPool().query(
        `SELECT COUNT(*)::integer total FROM backup_runs
         WHERE status = 'RUNNING' AND started_at < now() - interval '6 hours'`,
      ),
    ]);

  return {
    lastSuccessfulBackup: ultimoExitoso,
    lastBackupAttempt: ultimoIntento,
    lastVerification: ultimaVerificacion,
    lastRestoreTest: ultimaRestauracion,
    unfinishedRuns: sinTerminar.rows[0].total,
  };
}
