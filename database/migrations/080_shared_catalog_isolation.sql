-- Aislamiento del catálogo compartido.
--
-- Las dos tandas anteriores cubrieron tablas cuyo alcance es siempre una
-- empresa. El catálogo no lo es: una caja compartida muestra productos de
-- varias empresas y su cobro descuenta las existencias de cada una dentro de la
-- misma petición. Una política de empresa única dejaría ese catálogo vacío.
--
-- Por eso la conexión ya no declara una empresa, sino el conjunto que la
-- petición puede tocar: la activa más las que comparten la caja, calculado
-- siempre en el servidor a partir de la configuración de la caja y de la
-- membresía del usuario. Para las tablas de una sola empresa nada cambia: sin
-- ampliación, el conjunto es exactamente la empresa activa.

CREATE OR REPLACE FUNCTION app_tenant_scope_set()
RETURNS uuid[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      string_to_array(NULLIF(current_setting('app.tenant_ids', true), ''), ',')::uuid[],
      ARRAY[]::uuid[]
    ),
    -- Una conexión que solo declaró la empresa activa —o ninguna— sigue
    -- funcionando: el conjunto es esa empresa, o vacío.
    CASE WHEN app_tenant_scope() IS NULL THEN ARRAY[]::uuid[]
         ELSE ARRAY[app_tenant_scope()] END
  )
$$;

DO $$
DECLARE
  protegida TEXT;
  tablas TEXT[] := ARRAY[
    'products',
    'inventory_balances',
    'inventory_movements'
  ];
BEGIN
  FOREACH protegida IN ARRAY tablas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', protegida);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', protegida);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', protegida);
    EXECUTE format($politica$
      CREATE POLICY tenant_isolation ON %I
        USING (app_tenant_isolation_disabled() OR tenant_id = ANY(app_tenant_scope_set()))
        WITH CHECK (app_tenant_isolation_disabled() OR tenant_id = ANY(app_tenant_scope_set()))
    $politica$, protegida);
  END LOOP;
END
$$;

COMMENT ON FUNCTION app_tenant_scope_set() IS
  'Empresas que la petición en curso puede tocar. Sin ampliación explícita es '
  'solo la empresa activa; la caja compartida añade las que atiende esa caja.';
