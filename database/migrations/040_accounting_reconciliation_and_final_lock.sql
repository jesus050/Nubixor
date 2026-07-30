-- Conciliación bancaria y cierre contable definitivo. Un período bloqueado
-- permanentemente no admite reapertura ni nuevos asientos.

ALTER TABLE accounting_periods
  ADD COLUMN permanently_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN permanently_locked_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN permanently_locked_at TIMESTAMPTZ,
  ADD COLUMN permanent_lock_hash TEXT;

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  accounting_account_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  masked_account TEXT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'COP',
  opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(accounting_account_id, tenant_id)
    REFERENCES accounting_accounts(id, tenant_id),
  UNIQUE(tenant_id, bank_name, masked_account),
  UNIQUE(id, tenant_id)
);

CREATE TABLE bank_statement_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  bank_account_id UUID NOT NULL,
  transaction_date DATE NOT NULL,
  reference TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK(amount <> 0),
  statement_balance NUMERIC(18,2),
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'UNMATCHED'
    CHECK(status IN ('UNMATCHED', 'MATCHED', 'IGNORED')),
  matched_journal_entry_id UUID,
  matched_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  matched_at TIMESTAMPTZ,
  match_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(bank_account_id, tenant_id)
    REFERENCES bank_accounts(id, tenant_id),
  FOREIGN KEY(matched_journal_entry_id, tenant_id)
    REFERENCES journal_entries(id, tenant_id)
);

CREATE UNIQUE INDEX bank_statement_external_unique
  ON bank_statement_transactions(tenant_id, bank_account_id, external_id)
  WHERE external_id IS NOT NULL;
CREATE INDEX bank_statement_transactions_period
  ON bank_statement_transactions(tenant_id, bank_account_id, transaction_date DESC);

CREATE TABLE bank_reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  bank_account_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  statement_ending_balance NUMERIC(18,2) NOT NULL,
  ledger_ending_balance NUMERIC(18,2) NOT NULL,
  difference NUMERIC(18,2) NOT NULL,
  unmatched_count INTEGER NOT NULL DEFAULT 0 CHECK(unmatched_count >= 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT', 'COMPLETED')),
  completed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  completed_at TIMESTAMPTZ,
  evidence_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(bank_account_id, tenant_id)
    REFERENCES bank_accounts(id, tenant_id),
  CHECK(period_end >= period_start),
  CHECK(
    (status = 'DRAFT') OR
    (completed_by IS NOT NULL AND completed_at IS NOT NULL AND evidence_hash IS NOT NULL)
  ),
  UNIQUE(tenant_id, bank_account_id, period_start, period_end)
);

CREATE OR REPLACE FUNCTION guard_accounting_period_close()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  draft_count INTEGER;
  unbalanced_count INTEGER;
BEGIN
  IF OLD.status = 'CLOSED' AND NEW.status = 'CLOSED' AND
     OLD IS DISTINCT FROM NEW AND
     NOT (OLD.permanently_locked = FALSE AND NEW.permanently_locked = TRUE) THEN
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

CREATE OR REPLACE FUNCTION guard_permanent_accounting_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.permanently_locked AND OLD IS DISTINCT FROM NEW THEN
    RAISE EXCEPTION
      'El período tiene bloqueo definitivo y no puede modificarse.'
      USING ERRCODE = '55000';
  END IF;
  IF NEW.permanently_locked AND (
    NEW.status <> 'CLOSED' OR NEW.permanently_locked_by IS NULL OR
    NEW.permanently_locked_at IS NULL OR NEW.permanent_lock_hash IS NULL
  ) THEN
    RAISE EXCEPTION
      'El bloqueo definitivo requiere período cerrado, responsable, fecha y hash.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounting_periods_guard_permanent_lock
BEFORE UPDATE ON accounting_periods
FOR EACH ROW
EXECUTE FUNCTION guard_permanent_accounting_lock();

CREATE OR REPLACE FUNCTION guard_entry_period_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_period UUID;
  target_tenant UUID;
  period_status TEXT;
  period_locked BOOLEAN;
BEGIN
  target_period := COALESCE(NEW.period_id, OLD.period_id);
  target_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);
  SELECT status, permanently_locked INTO period_status, period_locked
  FROM accounting_periods
  WHERE id = target_period AND tenant_id = target_tenant;

  IF period_locked OR period_status = 'CLOSED' THEN
    RAISE EXCEPTION
      'El período contable está cerrado y no admite movimientos.'
      USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER journal_entries_open_period_only
BEFORE INSERT OR UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION guard_entry_period_mutation();
