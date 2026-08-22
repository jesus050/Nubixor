import { runBillingWorkerCycle } from './billing-worker.js';
import { syncReadyFactusRanges } from './resolution-sync.js';
import { withAdvisoryLock } from '../db.js';
import { logger } from '../shared/logger.js';

const RANGE_SYNC_LOCK = 'nubixor:factus-range-sync';

const RETRY_INTERVAL_MS = 30_000;
const RANGE_SYNC_INTERVAL_MS = 15 * 60_000;

// Se conserva este export para los consumidores existentes y para ejecutar
// manualmente una vuelta completa de recuperación sin levantar el servidor.
export { releaseDueBillingRetries } from './billing-worker.js';

export function startBillingRetryScheduler() {
  let running = false;
  let lastRangeSyncAt = 0;
  const run = async () => {
    // Evita que dos ciclos de la misma instancia dupliquen llamadas al proveedor.
    if (running) return;
    running = true;
    try {
      // La cola sí puede correr en varias instancias a la vez: reparte trabajo
      // con SKIP LOCKED y cada transmisión la toma una sola. Ahí el paralelismo
      // es rendimiento, no duplicación.
      await runBillingWorkerCycle();
      if (Date.now() - lastRangeSyncAt >= RANGE_SYNC_INTERVAL_MS) {
        lastRangeSyncAt = Date.now();
        // La sincronización de rangos no tiene ese reparto: son llamadas al
        // proveedor por cada cuenta, y hacerlas por duplicado gasta cuota
        // ajena. Esta sí pide turno.
        const { acquired, result: ranges } = await withAdvisoryLock(
          RANGE_SYNC_LOCK,
          syncReadyFactusRanges,
        );
        if (acquired && ranges.length) {
          logger.info('billing.resolutions_auto_sync', { accounts: ranges.length });
        }
      }
    } catch (error) {
      logger.error('billing.retry_scheduler_failed', {
        errorName: error.name,
        errorCode: error.code,
        message: error.message,
      });
    } finally {
      running = false;
    }
  };
  const timer = setInterval(run, RETRY_INTERVAL_MS);
  timer.unref();
  void run();
  return () => clearInterval(timer);
}
