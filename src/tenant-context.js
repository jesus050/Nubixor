import { AsyncLocalStorage } from 'node:async_hooks';

// La empresa activa viaja con la petición para que la capa de datos pueda
// declararla en la conexión sin que cada consulta tenga que pasarla a mano.
// PostgreSQL la usa en las políticas de aislamiento por fila.
const storage = new AsyncLocalStorage();

export function runWithTenantScope(scope, work) {
  return storage.run(scope, work);
}

export function currentTenantScope() {
  return storage.getStore() || null;
}

// El aislamiento se levanta solo para trabajo de mantenimiento que legítimamente
// cruza empresas: respaldos, reprocesos contables y migraciones de datos. Nunca
// para atender una petición.
export function runWithoutTenantIsolation(work) {
  return storage.run({ tenantId: null, bypassIsolation: true }, work);
}
