-- Deja la empresa de demostración conectada únicamente al simulador local.
-- No asigna resolución ni numeración ficticia y no afecta a Crative.

INSERT INTO electronic_billing_accounts(
  company_id,
  provider_code,
  display_name,
  environment,
  encrypted_credentials,
  connection_status,
  provider_config,
  last_tested_at,
  last_success_at,
  active
)
VALUES(
  '00000000-0000-0000-0000-000000000001',
  'SANDBOX',
  'Simulador MegaSuite',
  'TEST',
  NULL,
  'READY',
  '{"adapter":"sandbox-v1","localOnly":true}'::jsonb,
  now(),
  now(),
  TRUE
)
ON CONFLICT(company_id, provider_code, environment) DO UPDATE
SET display_name = EXCLUDED.display_name,
    connection_status = 'READY',
    provider_config = EXCLUDED.provider_config,
    last_tested_at = COALESCE(
      electronic_billing_accounts.last_tested_at,
      EXCLUDED.last_tested_at
    ),
    last_success_at = COALESCE(
      electronic_billing_accounts.last_success_at,
      EXCLUDED.last_success_at
    ),
    active = TRUE,
    updated_at = now();
