import { query } from '../db.js';
import { logger } from '../shared/logger.js';

const RETRY_INTERVAL_MS = 30_000;

export async function releaseDueBillingRetries() {
  const [documents, notes] = await Promise.all([
    query(
      `UPDATE electronic_document_transmissions
       SET status = 'QUEUED', next_attempt_at = NULL
       WHERE status = 'RETRYABLE'
         AND next_attempt_at IS NOT NULL
         AND next_attempt_at <= now()
       RETURNING id`,
    ),
    query(
      `UPDATE electronic_note_transmissions
       SET status = 'QUEUED', next_attempt_at = NULL
       WHERE status = 'RETRYABLE'
         AND next_attempt_at IS NOT NULL
         AND next_attempt_at <= now()
       RETURNING id`,
    ),
  ]);
  const released = documents.rowCount + notes.rowCount;
  if (released) {
    logger.info('billing.retries_released', {
      documents: documents.rowCount,
      notes: notes.rowCount,
    });
  }
  return released;
}

export function startBillingRetryScheduler() {
  const run = () => releaseDueBillingRetries().catch((error) => {
    logger.error('billing.retry_scheduler_failed', {
      errorName: error.name,
      errorCode: error.code,
      message: error.message,
    });
  });
  const timer = setInterval(run, RETRY_INTERVAL_MS);
  timer.unref();
  run();
  return () => clearInterval(timer);
}
