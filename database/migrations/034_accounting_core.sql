-- Núcleo contable de doble partida. Las cuentas son una plantilla operativa y
-- deben ser validadas por el contador de cada empresa antes de producción.

CREATE TABLE accounting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN (
    'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'
  )),
  normal_balance TEXT NOT NULL CHECK(normal_balance IN ('DEBIT', 'CREDIT')),
  allows_posting BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  accountant_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code),
  UNIQUE(id, tenant_id)
);

CREATE TABLE accounting_account_mappings (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL,
  account_id UUID NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, purpose),
  FOREIGN KEY(account_id, tenant_id)
    REFERENCES accounting_accounts(id, tenant_id)
);

CREATE TABLE accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN', 'REVIEW', 'CLOSED')),
  closed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  closed_at TIMESTAMPTZ,
  closing_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_end >= period_start),
  UNIQUE(tenant_id, period_start, period_end),
  UNIQUE(id, tenant_id)
);

CREATE TABLE accounting_entry_counters (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE RESTRICT,
  next_number BIGINT NOT NULL DEFAULT 1 CHECK(next_number > 0)
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_id UUID NOT NULL,
  entry_number BIGINT NOT NULL,
  entry_date DATE NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT', 'POSTED')),
  reversal_of UUID,
  total_debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_credit NUMERIC(18,2) NOT NULL DEFAULT 0,
  entry_hash TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ,
  FOREIGN KEY(period_id, tenant_id)
    REFERENCES accounting_periods(id, tenant_id),
  FOREIGN KEY(reversal_of)
    REFERENCES journal_entries(id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, entry_number),
  UNIQUE(tenant_id, source_type, source_id),
  UNIQUE(id, tenant_id),
  CHECK(total_debit >= 0 AND total_credit >= 0)
);

CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  journal_entry_id UUID NOT NULL,
  line_number INTEGER NOT NULL CHECK(line_number > 0),
  account_id UUID NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(debit >= 0),
  credit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(credit >= 0),
  third_party_type TEXT,
  third_party_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(journal_entry_id, tenant_id)
    REFERENCES journal_entries(id, tenant_id),
  FOREIGN KEY(account_id, tenant_id)
    REFERENCES accounting_accounts(id, tenant_id),
  CHECK(
    (debit > 0 AND credit = 0) OR
    (credit > 0 AND debit = 0)
  ),
  UNIQUE(journal_entry_id, line_number)
);

CREATE INDEX journal_entries_tenant_date
  ON journal_entries(tenant_id, entry_date DESC, entry_number DESC);

CREATE INDEX journal_entry_lines_account
  ON journal_entry_lines(tenant_id, account_id, journal_entry_id);

CREATE OR REPLACE FUNCTION seed_default_accounting_chart(target_tenant UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO accounting_accounts(
    tenant_id, code, name, account_type, normal_balance
  )
  VALUES
    (target_tenant, '110505', 'Caja principal', 'ASSET', 'DEBIT'),
    (target_tenant, '110510', 'Caja registradora', 'ASSET', 'DEBIT'),
    (target_tenant, '111005', 'Bancos', 'ASSET', 'DEBIT'),
    (target_tenant, '130505', 'Clientes nacionales', 'ASSET', 'DEBIT'),
    (target_tenant, '135517', 'Impuesto a las ventas descontable', 'ASSET', 'DEBIT'),
    (target_tenant, '143501', 'Inventarios para la venta', 'ASSET', 'DEBIT'),
    (target_tenant, '220505', 'Proveedores nacionales', 'LIABILITY', 'CREDIT'),
    (target_tenant, '238095', 'Mercancía recibida pendiente de facturar', 'LIABILITY', 'CREDIT'),
    (target_tenant, '240805', 'Impuesto a las ventas generado', 'LIABILITY', 'CREDIT'),
    (target_tenant, '311505', 'Capital o patrimonio', 'EQUITY', 'CREDIT'),
    (target_tenant, '413595', 'Ingresos por ventas', 'INCOME', 'CREDIT'),
    (target_tenant, '429595', 'Ingresos diversos', 'INCOME', 'CREDIT'),
    (target_tenant, '519595', 'Gastos diversos', 'EXPENSE', 'DEBIT'),
    (target_tenant, '529595', 'Diferencias de caja', 'EXPENSE', 'DEBIT'),
    (target_tenant, '613595', 'Costo de mercancía vendida', 'EXPENSE', 'DEBIT')
  ON CONFLICT(tenant_id, code) DO NOTHING;

  INSERT INTO accounting_account_mappings(tenant_id, purpose, account_id)
  SELECT target_tenant, mapping.purpose, account.id
  FROM (
    VALUES
      ('CASH_MAIN', '110505'),
      ('CASH_REGISTER', '110510'),
      ('BANK', '111005'),
      ('RECEIVABLES', '130505'),
      ('INPUT_TAX', '135517'),
      ('INVENTORY', '143501'),
      ('PAYABLES', '220505'),
      ('RECEIVED_NOT_INVOICED', '238095'),
      ('OUTPUT_TAX', '240805'),
      ('EQUITY', '311505'),
      ('SALES_REVENUE', '413595'),
      ('OTHER_INCOME', '429595'),
      ('GENERAL_EXPENSE', '519595'),
      ('CASH_OVER_SHORT', '529595'),
      ('COST_OF_SALES', '613595')
  ) mapping(purpose, code)
  JOIN accounting_accounts account
    ON account.tenant_id = target_tenant
   AND account.code = mapping.code
  ON CONFLICT(tenant_id, purpose) DO NOTHING;

  INSERT INTO accounting_entry_counters(tenant_id)
  VALUES(target_tenant)
  ON CONFLICT DO NOTHING;
END;
$$;

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants
  LOOP
    PERFORM seed_default_accounting_chart(tenant_record.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION seed_accounting_for_new_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM seed_default_accounting_chart(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_create_default_accounting
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION seed_accounting_for_new_tenant();

CREATE OR REPLACE FUNCTION guard_journal_line_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_status TEXT;
  target_entry UUID;
  target_tenant UUID;
BEGIN
  target_entry := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  target_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);
  SELECT status INTO parent_status
  FROM journal_entries
  WHERE id = target_entry AND tenant_id = target_tenant;

  IF parent_status = 'POSTED' THEN
    RAISE EXCEPTION
      'Las líneas de un asiento contabilizado son inalterables.'
      USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER journal_lines_draft_only
BEFORE INSERT OR UPDATE OR DELETE ON journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION guard_journal_line_mutation();

CREATE OR REPLACE FUNCTION seal_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  debit_total NUMERIC(18,2);
  credit_total NUMERIC(18,2);
  line_count INTEGER;
  line_payload TEXT;
BEGIN
  IF OLD.status = 'POSTED' THEN
    RAISE EXCEPTION
      'El asiento contabilizado es inalterable; registre una reversión.'
      USING ERRCODE = '55000';
  END IF;

  IF NEW.status = 'POSTED' THEN
    SELECT
      COALESCE(SUM(line.debit), 0),
      COALESCE(SUM(line.credit), 0),
      COUNT(*)::integer,
      string_agg(
        concat_ws(
          ':',
          line.line_number::text,
          account.code,
          line.debit::text,
          line.credit::text,
          line.description,
          COALESCE(line.third_party_type, ''),
          COALESCE(line.third_party_id, '')
        ),
        '|' ORDER BY line.line_number
      )
    INTO debit_total, credit_total, line_count, line_payload
    FROM journal_entry_lines line
    JOIN accounting_accounts account
      ON account.id = line.account_id
     AND account.tenant_id = line.tenant_id
    WHERE line.journal_entry_id = NEW.id
      AND line.tenant_id = NEW.tenant_id;

    IF line_count < 2 OR debit_total <= 0 OR debit_total <> credit_total THEN
      RAISE EXCEPTION
        'El asiento no cumple la partida doble: débitos %, créditos %.',
        debit_total, credit_total
        USING ERRCODE = '23514';
    END IF;

    NEW.total_debit := debit_total;
    NEW.total_credit := credit_total;
    NEW.posted_at := now();
    NEW.entry_hash := encode(
      digest(
        convert_to(
          concat_ws(
            E'\x1f',
            NEW.tenant_id::text,
            NEW.entry_number::text,
            NEW.entry_date::text,
            NEW.source_type,
            NEW.source_id,
            NEW.description,
            line_payload
          ),
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER journal_entries_seal
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION seal_journal_entry();

CREATE OR REPLACE FUNCTION guard_posted_journal_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'POSTED' THEN
    RAISE EXCEPTION
      'El asiento contabilizado no se puede eliminar.'
      USING ERRCODE = '55000';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER journal_entries_no_posted_delete
BEFORE DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION guard_posted_journal_delete();

