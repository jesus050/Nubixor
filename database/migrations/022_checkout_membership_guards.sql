-- Refuerza la autorización de caja: la relación caja–empresa no sustituye
-- la membresía activa del cajero en cada empresa participante.

CREATE OR REPLACE FUNCTION enforce_checkout_company_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM checkout_sessions session
    JOIN cash_register_companies register_company
      ON register_company.cash_register_id = session.cash_register_id
     AND register_company.company_id = NEW.company_id
     AND register_company.active = TRUE
    JOIN tenant_users membership
      ON membership.tenant_id = NEW.company_id
     AND membership.user_id = session.cashier_id
     AND membership.status = 'ACTIVE'
    JOIN users cashier
      ON cashier.id = session.cashier_id
     AND cashier.status = 'ACTIVE'
    WHERE session.id = NEW.checkout_session_id
  ) THEN
    RAISE EXCEPTION
      'La empresa % no está autorizada para la caja o el cajero.',
      NEW.company_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_checkout_item_authorization()
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
     AND register_company.company_id = NEW.seller_company_id
     AND register_company.active = TRUE
    JOIN tenant_users membership
      ON membership.tenant_id = NEW.seller_company_id
     AND membership.user_id = session.cashier_id
     AND membership.status = 'ACTIVE'
    JOIN users cashier
      ON cashier.id = session.cashier_id
     AND cashier.status = 'ACTIVE'
    WHERE cart.id = NEW.checkout_cart_id
  ) THEN
    RAISE EXCEPTION
      'La empresa vendedora % no está autorizada para esta caja o cajero.',
      NEW.seller_company_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
