import { currentTenantScope } from './tenant-context.js';

// El origen de un evento —quién lo pidió, desde qué dirección y con qué
// dispositivo— viaja con la petición, no con cada llamada. Se añade aquí para
// que los más de ciento cincuenta puntos que auditan no tengan que recordarlo.
//
// Va dentro de metadata a propósito: el sello de integridad ya cubre esa
// columna, así que la dirección y el dispositivo quedan encadenados como el
// resto del evento en vez de ser dos campos que nadie protege.
function requestOrigin() {
  const scope = currentTenantScope();
  if (!scope) return {};
  const origin = {};
  if (scope.ip) origin.ip = scope.ip;
  if (scope.userAgent) origin.userAgent = scope.userAgent;
  if (scope.requestId) origin.requestId = scope.requestId;
  return origin;
}

export async function writeAudit(client, { tenantId, userId, action, entityType, entityId, before = null, after = null, reason = null, metadata = {} }) {
  // Lo que el módulo declara manda: si ya puso su propio origen, se respeta.
  const enriched = { ...requestOrigin(), ...metadata };
  await client.query(
    `INSERT INTO audit_events
      (tenant_id, actor_user_id, action, entity_type, entity_id, before_data, after_data, reason, metadata)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb)`,
    [tenantId, userId, action, entityType, entityId, JSON.stringify(before), JSON.stringify(after), reason, JSON.stringify(enriched)]
  );
}

// Un acceso no pertenece a una empresa sino a una persona, pero cada empresa
// donde esa persona puede entrar tiene derecho a verlo en su propia auditoría.
// Por eso el evento se escribe una vez por membresía activa; si no hay ninguna,
// no hay empresa a la que contárselo y no se escribe nada.
export async function writeAccessAudit(client, { userId, action, reason = null, metadata = {} }) {
  const memberships = await client.query(
    `SELECT tenant_id
     FROM tenant_users
     WHERE user_id = $1 AND status = 'ACTIVE'`,
    [userId],
  );
  for (const membership of memberships.rows) {
    await writeAudit(client, {
      tenantId: membership.tenant_id,
      userId,
      action,
      entityType: 'user',
      entityId: userId,
      reason,
      metadata,
    });
  }
  return memberships.rowCount;
}
