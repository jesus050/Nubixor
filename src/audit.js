export async function writeAudit(client, { tenantId, userId, action, entityType, entityId, before = null, after = null, reason = null, metadata = {} }) {
  await client.query(
    `INSERT INTO audit_events
      (tenant_id, actor_user_id, action, entity_type, entity_id, before_data, after_data, reason, metadata)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb)`,
    [tenantId, userId, action, entityType, entityId, JSON.stringify(before), JSON.stringify(after), reason, JSON.stringify(metadata)]
  );
}
