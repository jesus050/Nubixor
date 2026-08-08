BEGIN;

-- 1. Agregar la política de facturación a los productos
-- Valores permitidos: ELECTRONIC_INVOICE, EQUIVALENT_DOCUMENT_POS, INTERNAL_RECEIPT
ALTER TABLE products 
ADD COLUMN billing_policy VARCHAR(50) NOT NULL DEFAULT 'ELECTRONIC_INVOICE';

-- 2. Sistema de Agrupación de Cobros POS
-- Para mantener un solo registro del pago real sin duplicarlo en la conciliación.
CREATE TABLE sale_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vincular las ventas al grupo
ALTER TABLE sales
ADD COLUMN sale_group_id UUID REFERENCES sale_groups(id);

-- Para evitar migraciones destructivas en producción, los pagos reales en tarjeta 
-- se asignarán a la venta de mayor valor del grupo para la tabla sale_payment_records,
-- y se usarán sale_payment_tenders para prorrateo contable interno, 
-- cumpliendo exactamente la regla de conciliación bancaria única sin reescribir toda la BD.

COMMIT;
