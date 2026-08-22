-- Aislamiento por empresa aplicado dentro de PostgreSQL.
--
-- Hasta ahora la separación entre empresas dependía por completo de que cada
-- consulta escribiera su filtro. Con 128 tablas y más de 250 rutas, un olvido
-- no lo detecta nadie. Estas políticas ponen la regla en la base: si la
-- conexión no declara empresa, no hay filas.
--
-- Esta primera tanda cubre las tablas de dinero donde el tenant_id nunca se
-- cruza. Queda fuera a propósito lo que toca la caja compartida —ventas y sus
-- pagos—, porque una misma sesión de caja guarda ventas de varias empresas y
-- una regla estricta ocultaría el corte por empresa del cierre.

CREATE OR REPLACE FUNCTION app_tenant_scope()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

-- El aislamiento solo se levanta para mantenimiento que legítimamente cruza
-- empresas: reprocesos contables, respaldos y migraciones de datos.
CREATE OR REPLACE FUNCTION app_tenant_isolation_disabled()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.bypass_tenant_isolation', true), 'off') = 'on'
$$;

DO $$
DECLARE
  protegida TEXT;
  tablas TEXT[] := ARRAY[
    'ar_invoices',
    'ar_invoice_items',
    'ar_payments',
    'ap_invoices',
    'ap_payments',
    'journal_entries',
    'journal_entry_lines',
    'cash_movements',
    'cash_count_lines',
    'accounting_accounts',
    'accounting_periods',
    'accounting_entry_counters',
    'accounting_account_mappings'
  ];
BEGIN
  FOREACH protegida IN ARRAY tablas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', protegida);
    -- Sin FORCE, el dueño de la tabla —que es el usuario con el que se conecta
    -- la aplicación— se saltaría la política y todo esto sería decorativo.
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', protegida);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', protegida);
    EXECUTE format($politica$
      CREATE POLICY tenant_isolation ON %I
        USING (app_tenant_isolation_disabled() OR tenant_id = app_tenant_scope())
        WITH CHECK (app_tenant_isolation_disabled() OR tenant_id = app_tenant_scope())
    $politica$, protegida);
  END LOOP;
END
$$;
