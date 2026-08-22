-- Segunda tanda de aislamiento por empresa dentro de PostgreSQL.
--
-- La migración 077 cubrió las tablas de dinero. Esta cubre las de operación
-- cuyo alcance es siempre una sola empresa: compras, gastos, nómina, conteos
-- físicos y trazabilidad de inventario. En todas ellas el código consulta
-- exclusivamente con la empresa activa de la petición, así que la política no
-- cambia lo que se ve: solo deja de depender de que cada consulta lo recuerde.
--
-- Queda fuera a propósito el catálogo compartido —productos, saldos, bodegas,
-- clientes, ventas y sus renglones—. La caja multiempresa lee y escribe filas de
-- varias empresas en una misma petición, y una política de empresa única
-- dejaría ese catálogo vacío. Esas tablas necesitan que la conexión declare el
-- conjunto de empresas permitido, que es un cambio de middleware y no de
-- esquema; está documentado en docs/AUDITORIA_FASE_A.md §9.

DO $$
DECLARE
  protegida TEXT;
  tablas TEXT[] := ARRAY[
    'purchases',
    'purchase_items',
    'purchase_receipts',
    'purchase_receipt_items',
    'business_expenses',
    'expense_payments',
    'expense_categories',
    'payroll_employees',
    'payroll_contracts',
    'payroll_periods',
    'payroll_novelties',
    'inventory_counts',
    'inventory_count_items',
    'inventory_lots',
    'inventory_reservations',
    'inventory_serial_numbers'
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
