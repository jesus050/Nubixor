-- La empresa activa deja de ser una preferencia confiada al navegador.
-- Es contexto de la sesión y siempre se valida contra tenant_users.
ALTER TABLE auth_sessions
  ADD COLUMN IF NOT EXISTS active_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS auth_sessions_active_tenant_idx
  ON auth_sessions(user_id, active_tenant_id)
  WHERE revoked_at IS NULL;
