-- Auditoría encadenada, expedientes de control y validaciones del contador.
-- La bitácora queda append-only: las correcciones se registran como eventos nuevos.

ALTER TABLE audit_events
  ADD COLUMN previous_hash TEXT,
  ADD COLUMN event_hash TEXT,
  ADD COLUMN integrity_version SMALLINT NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION audit_event_hash(
  event_tenant_id UUID,
  event_id BIGINT,
  event_created_at TIMESTAMPTZ,
  event_actor_user_id UUID,
  event_action TEXT,
  event_entity_type TEXT,
  event_entity_id TEXT,
  event_before_data JSONB,
  event_after_data JSONB,
  event_reason TEXT,
  event_metadata JSONB,
  event_previous_hash TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(
    digest(
      convert_to(
        concat_ws(
          E'\x1f',
          event_tenant_id::text,
          event_id::text,
          to_char(event_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
          COALESCE(event_actor_user_id::text, ''),
          event_action,
          event_entity_type,
          COALESCE(event_entity_id, ''),
          COALESCE(event_before_data, 'null'::jsonb)::text,
          COALESCE(event_after_data, 'null'::jsonb)::text,
          COALESCE(event_reason, ''),
          COALESCE(event_metadata, '{}'::jsonb)::text,
          COALESCE(event_previous_hash, '')
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  )
$$;

DO $$
DECLARE
  tenant_record RECORD;
  event_record RECORD;
  running_hash TEXT;
BEGIN
  FOR tenant_record IN
    SELECT DISTINCT tenant_id FROM audit_events ORDER BY tenant_id
  LOOP
    running_hash := NULL;
    FOR event_record IN
      SELECT *
      FROM audit_events
      WHERE tenant_id = tenant_record.tenant_id
      ORDER BY id
    LOOP
      UPDATE audit_events
      SET previous_hash = running_hash,
          event_hash = audit_event_hash(
            event_record.tenant_id,
            event_record.id,
            event_record.created_at,
            event_record.actor_user_id,
            event_record.action,
            event_record.entity_type,
            event_record.entity_id,
            event_record.before_data,
            event_record.after_data,
            event_record.reason,
            event_record.metadata,
            running_hash
          )
      WHERE id = event_record.id;

      SELECT event_hash INTO running_hash
      FROM audit_events
      WHERE id = event_record.id;
    END LOOP;
  END LOOP;
END;
$$;

ALTER TABLE audit_events
  ALTER COLUMN event_hash SET NOT NULL;

CREATE UNIQUE INDEX audit_events_event_hash_unique
  ON audit_events(event_hash);

CREATE TABLE audit_chain_heads (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE RESTRICT,
  last_event_id BIGINT REFERENCES audit_events(id) ON DELETE RESTRICT,
  last_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO audit_chain_heads(tenant_id, last_event_id, last_hash)
SELECT tenant.id, latest.id, latest.event_hash
FROM tenants tenant
LEFT JOIN LATERAL (
  SELECT id, event_hash
  FROM audit_events
  WHERE tenant_id = tenant.id
  ORDER BY id DESC
  LIMIT 1
) latest ON TRUE;

CREATE OR REPLACE FUNCTION seal_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  chain_previous_hash TEXT;
BEGIN
  INSERT INTO audit_chain_heads(tenant_id)
  VALUES(NEW.tenant_id)
  ON CONFLICT DO NOTHING;

  SELECT last_hash
  INTO chain_previous_hash
  FROM audit_chain_heads
  WHERE tenant_id = NEW.tenant_id
  FOR UPDATE;

  NEW.previous_hash := chain_previous_hash;
  NEW.integrity_version := 1;
  NEW.event_hash := audit_event_hash(
    NEW.tenant_id,
    NEW.id,
    NEW.created_at,
    NEW.actor_user_id,
    NEW.action,
    NEW.entity_type,
    NEW.entity_id,
    NEW.before_data,
    NEW.after_data,
    NEW.reason,
    NEW.metadata,
    NEW.previous_hash
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION advance_audit_chain_head()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE audit_chain_heads
  SET last_event_id = NEW.id,
      last_hash = NEW.event_hash,
      updated_at = now()
  WHERE tenant_id = NEW.tenant_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION reject_audit_event_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'La bitácora de auditoría es inalterable; registre un evento correctivo.'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER audit_events_seal
BEFORE INSERT ON audit_events
FOR EACH ROW
EXECUTE FUNCTION seal_audit_event();

CREATE TRIGGER audit_events_advance_head
AFTER INSERT ON audit_events
FOR EACH ROW
EXECUTE FUNCTION advance_audit_chain_head();

CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION reject_audit_event_mutation();

CREATE TABLE accountant_compliance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  review_type TEXT NOT NULL CHECK(review_type IN (
    'RUT',
    'TAXES',
    'BILLING_RESOLUTIONS',
    'ACCOUNTING_FLOW'
  )),
  status TEXT NOT NULL CHECK(status IN ('APPROVED', 'OBSERVED')),
  reviewer_name TEXT NOT NULL,
  reviewer_document TEXT,
  professional_card TEXT,
  notes TEXT NOT NULL,
  evidence_reference TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_end >= period_start),
  UNIQUE(tenant_id, period_start, period_end, review_type)
);

CREATE INDEX accountant_reviews_tenant_period
  ON accountant_compliance_reviews(tenant_id, period_end DESC, review_type);

CREATE TABLE audit_control_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PASS', 'WARNING', 'FAIL')),
  score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
  controls JSONB NOT NULL,
  evidence_hash TEXT NOT NULL,
  chain_head_hash TEXT,
  generated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_end >= period_start)
);

CREATE INDEX audit_control_runs_tenant_period
  ON audit_control_runs(tenant_id, period_end DESC, generated_at DESC);

