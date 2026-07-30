-- Gobierno contable: permisos, validación profesional y reversión única.

ALTER TABLE accounting_accounts
  ADD COLUMN accountant_reviewed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN accountant_reviewed_at TIMESTAMPTZ,
  ADD COLUMN accountant_review_notes TEXT;

CREATE UNIQUE INDEX journal_entries_one_reversal
  ON journal_entries(reversal_of)
  WHERE reversal_of IS NOT NULL;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, 'accounting.manage'
FROM roles role
WHERE role.code IN ('OWNER', 'ADMIN')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION guard_accounting_period_close()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  draft_count INTEGER;
  unbalanced_count INTEGER;
BEGIN
  IF OLD.status = 'CLOSED' AND NEW.status = 'CLOSED' AND
     OLD IS DISTINCT FROM NEW THEN
    RAISE EXCEPTION
      'Un período cerrado no se puede modificar.'
      USING ERRCODE = '55000';
  END IF;

  IF OLD.status <> 'CLOSED' AND NEW.status = 'CLOSED' THEN
    SELECT
      COUNT(*) FILTER (WHERE status = 'DRAFT'),
      COUNT(*) FILTER (
        WHERE status = 'POSTED' AND total_debit <> total_credit
      )
    INTO draft_count, unbalanced_count
    FROM journal_entries
    WHERE tenant_id = NEW.tenant_id
      AND period_id = NEW.id;

    IF draft_count > 0 OR unbalanced_count > 0 THEN
      RAISE EXCEPTION
        'El período contiene % borradores y % asientos descuadrados.',
        draft_count, unbalanced_count
        USING ERRCODE = '23514';
    END IF;
    IF NEW.closed_by IS NULL OR NEW.closed_at IS NULL OR
       NULLIF(BTRIM(COALESCE(NEW.closing_notes, '')), '') IS NULL THEN
      RAISE EXCEPTION
        'El cierre requiere responsable, fecha y observación.'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounting_periods_guard_close
BEFORE UPDATE ON accounting_periods
FOR EACH ROW
EXECUTE FUNCTION guard_accounting_period_close();
