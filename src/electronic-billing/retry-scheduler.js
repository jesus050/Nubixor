import { runBillingWorkerCycle } from './billing-worker.js';
import { logger } from '../shared/logger.js';

const RETRY_INTERVAL_MS = 30_000;

// Se conserva este export para los consumidores existentes y para ejecutar
// manualmente una vuelta completa de recuperación sin levantar el servidor.
export { releaseDueBillingRetries } from './billing-worker.js';

export function startBillingRetryScheduler() {
  let running = false;
  const run = async () => {
    // Evita que dos ciclos de la misma instancia dupliquen llamadas al proveedor.
    if (running) return;
    running = true;
    try {
      await runBillingWorkerCycle();
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
