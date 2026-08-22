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

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

// Una caja compartida atiende a varias empresas en la misma petición: el
// catálogo muestra productos de todas las que comparten la caja y el cobro
// descuenta sus existencias. Para que las políticas no dejen ese catálogo
// vacío, la petición amplía su alcance con las empresas que puede tocar.
//
// La lista la calcula siempre el servidor a partir de la configuración de la
// caja y de la membresía del usuario. Nada que venga del navegador entra aquí:
// ampliar el alcance con una empresa ajena sería exactamente el agujero que las
// políticas existen para cerrar.
export function widenTenantScope(tenantIds) {
  const scope = currentTenantScope();
  if (!scope) {
    throw new Error('No hay una petición en curso a la que ampliar el alcance.');
  }
  const valid = [...new Set(tenantIds)].filter((tenantId) => UUID_PATTERN.test(tenantId || ''));
  if (valid.length !== tenantIds.length) {
    throw new Error('El alcance por empresa solo admite identificadores válidos.');
  }
  scope.additionalTenantIds = [
    ...new Set([...(scope.additionalTenantIds || []), ...valid]),
  ];
  return scope.additionalTenantIds;
}

// Las empresas que la petición puede tocar: la activa, más las que se hayan
// declarado explícitamente. Sin empresa activa no hay alcance, ni siquiera con
// ampliaciones: es el estado en el que ninguna política devuelve filas.
export function tenantScopeIds(scope = currentTenantScope()) {
  if (!scope?.tenantId || !UUID_PATTERN.test(scope.tenantId)) return [];
  return [...new Set([scope.tenantId, ...(scope.additionalTenantIds || [])])];
}

// El aislamiento se levanta solo para trabajo de mantenimiento que legítimamente
// cruza empresas: respaldos, reprocesos contables y migraciones de datos. Nunca
// para atender una petición.
export function runWithoutTenantIsolation(work) {
  return storage.run({ tenantId: null, bypassIsolation: true }, work);
}
