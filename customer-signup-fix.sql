-- Customer-focused signup hardening
-- 1) Drops legacy customer trigger if present
-- 2) Ensures single unified trigger that inserts users + customers safely

BEGIN;

-- Drop old customer trigger if it exists to avoid duplicate execution
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP FUNCTION IF EXISTS public.create_customer_on_signup();

-- Replace the main handler to cover all roles, with safe defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  acct TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', 'user');
  full_name TEXT := NULLIF(NEW.raw_user_meta_data->>'full_name', '');
  phone TEXT := NULLIF(NEW.raw_user_meta_data->>'phone', '');
BEGIN
  -- base profile
  INSERT INTO public.users (user_id, email, full_name, phone, account_type)
  VALUES (NEW.id, NEW.email, full_name, phone, acct)
  ON CONFLICT (user_id) DO NOTHING;

  -- customer
  IF acct = 'customer' THEN
    INSERT INTO public.customers (
      user_id, name, email, phone, created_at, updated_at
    ) VALUES (
      NEW.id,
      COALESCE(full_name, NEW.email),
      NEW.email,
      COALESCE(NULLIF(phone, ''), 'unknown'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- seller
  IF acct = 'seller' THEN
    INSERT INTO public.sellers (
      user_id, email, full_name, phone, location, currency,
      account_type, is_verified
    ) VALUES (
      NEW.id,
      NEW.email,
      full_name,
      phone,
      NEW.raw_user_meta_data->>'location',
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      'seller',
      FALSE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- factory
  IF acct = 'factory' THEN
    INSERT INTO public.factories (
      user_id, email, full_name, phone, location, currency,
      account_type, is_verified
    ) VALUES (
      NEW.id,
      NEW.email,
      full_name,
      phone,
      NEW.raw_user_meta_data->>'location',
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      'factory',
      FALSE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- delivery
  IF acct = 'delivery' THEN
    INSERT INTO public.delivery_profiles (
      user_id, full_name, phone, vehicle_type, vehicle_number,
      is_verified, is_active
    ) VALUES (
      NEW.id,
      full_name,
      phone,
      COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'motorcycle'),
      NEW.raw_user_meta_data->>'vehicle_number',
      FALSE,
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure only one handler runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
