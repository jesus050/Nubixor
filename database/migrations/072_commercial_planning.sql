-- Planificación Comercial: inteligencia de rotación, temporadas, presupuesto
-- y campañas sin modificar costos ni existencias contables.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_id_tenant_unique'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_id_tenant_unique UNIQUE(id, tenant_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brands_id_tenant_unique'
  ) THEN
    ALTER TABLE brands
      ADD CONSTRAINT brands_id_tenant_unique UNIQUE(id, tenant_id);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS commercial_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  season_type TEXT NOT NULL DEFAULT 'CUSTOM'
    CHECK(season_type IN (
      'CHRISTMAS','LOVE_AND_FRIENDSHIP','MOTHERS_DAY','FATHERS_DAY',
      'BACK_TO_SCHOOL','HALLOWEEN','VACATIONS','HOLY_WEEK',
      'HIGH_SEASON','LOW_SEASON','CUSTOM'
    )),
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(ends_on >= starts_on),
  UNIQUE(tenant_id, name, starts_on),
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS commercial_product_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  product_lifecycle TEXT NOT NULL DEFAULT 'PERMANENT'
    CHECK(product_lifecycle IN (
      'PERMANENT','TEMPORARY','SEASONAL','LIMITED_EDITION',
      'LAUNCH','PROMOTIONAL'
    )),
  is_new_product BOOLEAN NOT NULL DEFAULT FALSE,
  requires_launch BOOLEAN NOT NULL DEFAULT FALSE,
  push_candidate BOOLEAN NOT NULL DEFAULT FALSE,
  commercial_priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK(commercial_priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  suggested_launch_date DATE,
  marketing_notes TEXT,
  first_commercial_entry_at TIMESTAMPTZ,
  last_commercial_entry_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  dismissal_reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id) REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(tenant_id, product_id),
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS commercial_product_seasons (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  season_id UUID NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, product_id, season_id),
  FOREIGN KEY(product_id, tenant_id) REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(season_id, tenant_id) REFERENCES commercial_seasons(id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commercial_rotation_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE RESTRICT,
  analysis_period_days INTEGER NOT NULL DEFAULT 30
    CHECK(analysis_period_days BETWEEN 1 AND 730),
  high_rotation_min_units NUMERIC(18,4) NOT NULL DEFAULT 10
    CHECK(high_rotation_min_units >= 0),
  medium_rotation_min_units NUMERIC(18,4) NOT NULL DEFAULT 4
    CHECK(medium_rotation_min_units >= 0),
  low_rotation_min_units NUMERIC(18,4) NOT NULL DEFAULT 1
    CHECK(low_rotation_min_units >= 0),
  high_stock_units NUMERIC(18,4) NOT NULL DEFAULT 20
    CHECK(high_stock_units >= 0),
  stale_days_threshold INTEGER NOT NULL DEFAULT 45
    CHECK(stale_days_threshold BETWEEN 1 AND 3650),
  good_margin_percent NUMERIC(7,4) NOT NULL DEFAULT 30
    CHECK(good_margin_percent >= 0),
  new_product_launch_days INTEGER NOT NULL DEFAULT 10
    CHECK(new_product_launch_days BETWEEN 0 AND 365),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(high_rotation_min_units >= medium_rotation_min_units),
  CHECK(medium_rotation_min_units >= low_rotation_min_units)
);

INSERT INTO commercial_rotation_settings(tenant_id)
SELECT id FROM tenants
ON CONFLICT(tenant_id) DO NOTHING;

CREATE OR REPLACE FUNCTION ensure_commercial_rotation_settings_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO commercial_rotation_settings(tenant_id)
  VALUES(NEW.id)
  ON CONFLICT(tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_seed_commercial_rotation_settings
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION ensure_commercial_rotation_settings_for_tenant();

CREATE TABLE IF NOT EXISTS commercial_rotation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  branch_id UUID,
  warehouse_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  units_sold NUMERIC(18,4) NOT NULL DEFAULT 0,
  units_returned NUMERIC(18,4) NOT NULL DEFAULT 0,
  net_units_sold NUMERIC(18,4) NOT NULL DEFAULT 0,
  stock_on_hand NUMERIC(18,4) NOT NULL DEFAULT 0,
  sales_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  gross_margin_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  gross_margin_percent NUMERIC(7,4) NOT NULL DEFAULT 0,
  sales_velocity NUMERIC(18,6) NOT NULL DEFAULT 0,
  coverage_days NUMERIC(18,2),
  first_entry_at TIMESTAMPTZ,
  last_entry_at TIMESTAMPTZ,
  last_sale_at TIMESTAMPTZ,
  days_since_last_sale INTEGER,
  days_since_first_entry INTEGER,
  rotation_class TEXT NOT NULL
    CHECK(rotation_class IN ('HIGH','MEDIUM','LOW','NONE')),
  season_context TEXT NOT NULL DEFAULT 'NOT_SEASONAL'
    CHECK(season_context IN ('IN_SEASON','UPCOMING','OUT_OF_SEASON','NOT_SEASONAL')),
  recommendation TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id) REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id) REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  CHECK(period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS commercial_rotation_snapshots_lookup
  ON commercial_rotation_snapshots(tenant_id, product_id, branch_id, warehouse_id, calculated_at DESC);

CREATE TABLE IF NOT EXISTS commercial_marketing_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  budget_type TEXT NOT NULL CHECK(budget_type IN ('MONTHLY','QUARTERLY','CUSTOM')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_budget NUMERIC(18,2) NOT NULL CHECK(total_budget >= 0),
  committed_budget NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(committed_budget >= 0),
  actual_spend NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(actual_spend >= 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','ACTIVE','CLOSED','CANCELLED')),
  responsible_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_end >= period_start),
  CHECK(committed_budget <= total_budget),
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS commercial_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID,
  budget_id UUID,
  name TEXT NOT NULL,
  objective TEXT NOT NULL
    CHECK(objective IN (
      'LAUNCH','INCREASE_SALES','LIQUIDATE_INVENTORY','MOVE_LOW_ROTATION',
      'SEASON','POSITIONING','GENERATE_LEADS','PROMOTION',
      'RECOVER_STALLED_PRODUCT','OTHER'
    )),
  description TEXT,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  requested_budget NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(requested_budget >= 0),
  approved_budget NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(approved_budget >= 0),
  actual_spend NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(actual_spend >= 0),
  responsible_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  channel TEXT NOT NULL DEFAULT 'STORE'
    CHECK(channel IN ('STORE','WHOLESALE','DIGITAL','FIELD','META_ADS','GOOGLE_ADS','TIKTOK_ADS','OTHER')),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','PLANNED','APPROVED','ACTIVE','FINISHED','EVALUATED','CANCELLED')),
  leads INTEGER NOT NULL DEFAULT 0 CHECK(leads >= 0),
  reach INTEGER NOT NULL DEFAULT 0 CHECK(reach >= 0),
  impressions INTEGER NOT NULL DEFAULT 0 CHECK(impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK(clicks >= 0),
  observations TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(budget_id, tenant_id) REFERENCES commercial_marketing_budgets(id, tenant_id) ON DELETE RESTRICT,
  CHECK(ends_on >= starts_on),
  CHECK(actual_spend <= approved_budget OR approved_budget = 0),
  CHECK(status <> 'APPROVED' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS commercial_campaign_products (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  campaign_id UUID NOT NULL,
  product_id UUID NOT NULL,
  stock_at_start NUMERIC(18,4),
  stock_at_end NUMERIC(18,4),
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, campaign_id, product_id),
  FOREIGN KEY(campaign_id, tenant_id) REFERENCES commercial_campaigns(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(product_id, tenant_id) REFERENCES products(id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commercial_campaign_categories (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  campaign_id UUID NOT NULL,
  category_id UUID NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, campaign_id, category_id),
  FOREIGN KEY(campaign_id, tenant_id) REFERENCES commercial_campaigns(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(category_id, tenant_id) REFERENCES categories(id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commercial_marketing_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  campaign_id UUID,
  budget_id UUID,
  expense_type TEXT NOT NULL
    CHECK(expense_type IN (
      'META_ADS','GOOGLE_ADS','TIKTOK_ADS','VIDEO_PRODUCTION','PHOTOGRAPHY',
      'DESIGN','INFLUENCERS','POP_MATERIAL','ACTIVATIONS','PRINTED',
      'PROMOTIONS','EVENTS','OTHER'
    )),
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK(amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'COMMITTED'
    CHECK(status IN ('COMMITTED','SPENT','VOID')),
  reference TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(campaign_id, tenant_id) REFERENCES commercial_campaigns(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(budget_id, tenant_id) REFERENCES commercial_marketing_budgets(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS commercial_opportunity_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  branch_id UUID,
  warehouse_id UUID,
  action_type TEXT NOT NULL CHECK(action_type IN ('FOLLOW_UP','DISMISSED','CAMPAIGN_CREATED')),
  reason TEXT,
  campaign_id UUID,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(product_id, tenant_id) REFERENCES products(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(warehouse_id, tenant_id) REFERENCES warehouses(id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY(campaign_id, tenant_id) REFERENCES commercial_campaigns(id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commercial_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id UUID,
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_revenue NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(target_revenue >= 0),
  target_margin NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(target_margin >= 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','ACTIVE','REVIEW','CLOSED','CANCELLED')),
  owner_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE RESTRICT,
  CHECK(period_end >= period_start),
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS commercial_plan_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'STORE'
    CHECK(channel IN ('STORE','WHOLESALE','DIGITAL','FIELD','OTHER')),
  expected_revenue NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK(expected_revenue >= 0),
  priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'TODO'
    CHECK(status IN ('TODO','IN_PROGRESS','BLOCKED','DONE','CANCELLED')),
  due_date DATE,
  responsible_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(plan_id, tenant_id) REFERENCES commercial_plans(id, tenant_id) ON DELETE RESTRICT,
  UNIQUE(id, tenant_id)
);

CREATE INDEX IF NOT EXISTS commercial_plans_current
  ON commercial_plans(tenant_id, status, period_start DESC, period_end DESC);

CREATE INDEX IF NOT EXISTS commercial_plan_initiatives_plan
  ON commercial_plan_initiatives(tenant_id, plan_id, status, due_date);

CREATE INDEX IF NOT EXISTS commercial_seasons_window
  ON commercial_seasons(tenant_id, active, starts_on, ends_on);

CREATE INDEX IF NOT EXISTS commercial_product_profiles_priority
  ON commercial_product_profiles(tenant_id, commercial_priority, push_candidate, requires_launch);

CREATE INDEX IF NOT EXISTS commercial_campaigns_status
  ON commercial_campaigns(tenant_id, status, starts_on, ends_on);

CREATE INDEX IF NOT EXISTS commercial_campaign_products_product
  ON commercial_campaign_products(tenant_id, product_id, campaign_id);

CREATE INDEX IF NOT EXISTS commercial_marketing_expenses_scope
  ON commercial_marketing_expenses(tenant_id, campaign_id, budget_id, status, expense_date DESC);

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.code
FROM roles role
CROSS JOIN (
  VALUES
    ('commercial_planning.view'),
    ('commercial_planning.manage'),
    ('commercial_planning.marketing'),
    ('commercial_planning.supervise')
) AS permission(code)
WHERE role.code IN ('OWNER','ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.code
FROM roles role
CROSS JOIN (
  VALUES
    ('commercial_planning.view'),
    ('commercial_planning.marketing')
) AS permission(code)
WHERE role.code IN ('MARKETING')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id, role_id, permission_code)
SELECT role.tenant_id, role.id, permission.code
FROM roles role
CROSS JOIN (
  VALUES
    ('commercial_planning.view'),
    ('commercial_planning.supervise')
) AS permission(code)
WHERE role.code IN ('SUPERVISOR')
ON CONFLICT DO NOTHING;
