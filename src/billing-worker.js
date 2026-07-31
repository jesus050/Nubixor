import 'dotenv/config';
import { closeDatabase } from './db.js';
import {
  recoverStaleTransmissions,
  runWorkerIteration,
} from './electronic-billing/transmission-worker.js';
import { logger } from './shared/logger.js';

const pollIntervalMs = Math.max(1000, Number(process.env.BILLING_WORKER_POLL_MS) || 5000);
const staleSeconds = Math.max(60, Number(process.env.BILLING_WORKER_STALE_SECONDS) || 600);
let stopping = false;

async function sleep(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  logger.info('billing.worker.stopping', { signal });
  await closeDatabase().catch(() => {});
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

async function main() {
  const recovered = await recoverStaleTransmissions({ staleSeconds });
  logger.info('billing.worker.started', { pollIntervalMs, staleSeconds, recovered });

  while (!stopping) {
    const processed = await runWorkerIteration();
    if (!processed) await sleep(pollIntervalMs);
  }
}

main().catch(async (error) => {
  logger.error('billing.worker.crashed', {
    errorName: error.name,
    errorCode: error.code,
    message: error.message,
  });
  process.exitCode = 1;
  await closeDatabase().catch(() => {});
});
