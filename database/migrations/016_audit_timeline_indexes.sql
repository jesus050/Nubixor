CREATE INDEX IF NOT EXISTS audit_events_timeline
  ON audit_events(tenant_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS audit_events_actor_timeline
  ON audit_events(tenant_id, actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_action_timeline
  ON audit_events(tenant_id, action, created_at DESC);
