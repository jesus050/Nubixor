-- Completa el aislamiento de la SUBFASE A para pagos, asignaciones,
-- obligaciones interempresa y perfiles tributarios de nuevas empresas.

CREATE OR REPLACE FUNCTION create_default_company_tax_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO company_tax_profiles(
    company_id,
    taxpayer_type,
    electronic_invoicing_required,
    default_document_type,
    vat_responsibility,
    tax_regime
  )
  VALUES(
    NEW.id,
    'PENDING_ACCOUNTING_REVIEW',
    FALSE,
    'INTERNAL_RECEIPT',
    'PENDING_ACCOUNTING_REVIEW',
    'PENDING_ACCOUNTING_REVIEW'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_create_default_tax_profile
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION create_default_company_tax_profile();

CREATE OR REPLACE FUNCTION validate_payment_checkout_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM checkout_carts cart
    JOIN checkout_sessions session ON session.id = cart.checkout_session_id
    JOIN cash_register_companies register_company
      ON register_company.cash_register_id = session.cash_register_id
     AND register_company.company_id = NEW.receiving_company_id
     AND register_company.active = TRUE
    JOIN tenant_users membership
      ON membership.tenant_id = NEW.receiving_company_id
     AND membership.user_id = session.cashier_id
     AND membership.status = 'ACTIVE'
    JOIN users cashier
      ON cashier.id = session.cashier_id
     AND cashier.status = 'ACTIVE'
    WHERE cart.id = NEW.checkout_cart_id
  ) THEN
    RAISE EXCEPTION
      'La empresa receptora % no está autorizada para el checkout.',
      NEW.receiving_company_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_validate_checkout_scope
BEFORE INSERT OR UPDATE OF checkout_cart_id, receiving_company_id
ON payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_checkout_scope();

CREATE OR REPLACE FUNCTION validate_payment_allocation_checkout()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM payments payment
    JOIN sales sale
      ON sale.id = NEW.sale_id
     AND sale.company_id = NEW.company_id
     AND sale.checkout_cart_id = payment.checkout_cart_id
    WHERE payment.id = NEW.payment_id
  ) THEN
    RAISE EXCEPTION
      'La venta asignada no pertenece al mismo checkout y empresa del pago.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payment_allocations_validate_checkout
BEFORE INSERT OR UPDATE OF payment_id, sale_id, company_id
ON payment_allocations
FOR EACH ROW
EXECUTE FUNCTION validate_payment_allocation_checkout();

CREATE OR REPLACE FUNCTION validate_intercompany_settlement_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sales
    WHERE checkout_cart_id = NEW.checkout_cart_id
      AND company_id = NEW.from_company_id
  ) OR NOT EXISTS (
    SELECT 1
    FROM sales
    WHERE checkout_cart_id = NEW.checkout_cart_id
      AND company_id = NEW.to_company_id
  ) THEN
    RAISE EXCEPTION
      'Las dos empresas de la obligación deben participar en el checkout.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER intercompany_settlements_validate_participants
BEFORE INSERT OR UPDATE OF checkout_cart_id, from_company_id, to_company_id
ON intercompany_settlements
FOR EACH ROW
EXECUTE FUNCTION validate_intercompany_settlement_participants();
