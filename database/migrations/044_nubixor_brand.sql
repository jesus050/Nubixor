-- Actualiza únicamente los datos demostrativos creados por MegaSuite.
-- Los nombres de empresas reales y el historial de auditoría permanecen intactos.
UPDATE tenants
SET trade_name = 'Nubixor Demo',
    updated_at = NOW()
WHERE trade_name = 'MegaSuite Demo';

UPDATE users
SET full_name = 'Administrador Nubixor',
    updated_at = NOW()
WHERE full_name = 'Administrador MegaSuite';

UPDATE electronic_billing_accounts
SET display_name = 'Simulador Nubixor',
    updated_at = NOW()
WHERE display_name = 'Simulador MegaSuite';
