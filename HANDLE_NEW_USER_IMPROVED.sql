-- =====================================================
-- IMPROVED handle_new_user TRIGGER FUNCTION
-- =====================================================
-- Fixes:
-- 1. Adds wallet auto-creation for all users
-- 2. Uses correct 'sellers' table with is_factory flag
-- 3. Better error handling with EXCEPTION blocks
-- 4. Adds SECURITY DEFINER for trigger execution context
-- 
-- Replace the current handle_new_user function with this

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_location TEXT;
  v_currency TEXT;
BEGIN
  -- Extract metadata from auth user
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer');
  v_full_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_location := NEW.raw_user_meta_data->>'location';
  v_currency := COALESCE(NEW.raw_user_meta_data->>'currency', 'USD');

  -- Step 1: Create base user record (all account types)
  BEGIN
    INSERT INTO public.users (
      user_id,
      email,
      full_name,
      phone,
      account_type,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_phone,
      v_account_type,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error inserting user: %', SQLERRM;
  END;

  -- Step 2: Create role-specific record based on account_type
  CASE v_account_type
    -- CUSTOMER account
    WHEN 'customer' THEN
      BEGIN
        INSERT INTO public.customers (
          user_id,
          name,
          email,
          phone,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          COALESCE(v_full_name, NEW.email),
          NEW.email,
          COALESCE(v_phone, 'unknown'),
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting customer: %', SQLERRM;
      END;

    -- SELLER account
    WHEN 'seller' THEN
      BEGIN
        INSERT INTO public.sellers (
          user_id,
          email,
          full_name,
          phone,
          location,
          currency,
          account_type,
          is_verified,
          is_factory,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.email,
          v_full_name,
          v_phone,
          v_location,
          v_currency,
          'seller',
          FALSE,
          FALSE,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting seller: %', SQLERRM;
      END;

    -- FACTORY account (also uses sellers table with is_factory=TRUE)
    WHEN 'factory' THEN
      BEGIN
        INSERT INTO public.sellers (
          user_id,
          email,
          full_name,
          phone,
          location,
          currency,
          account_type,
          is_verified,
          is_factory,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.email,
          v_full_name,
          v_phone,
          v_location,
          v_currency,
          'factory',
          FALSE,
          TRUE,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting factory: %', SQLERRM;
      END;

    -- DELIVERY account
    WHEN 'delivery' THEN
      BEGIN
        INSERT INTO public.delivery_profiles (
          user_id,
          full_name,
          phone,
          vehicle_type,
          vehicle_number,
          is_verified,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          v_full_name,
          v_phone,
          COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'motorcycle'),
          NEW.raw_user_meta_data->>'vehicle_number',
          FALSE,
          TRUE,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting delivery profile: %', SQLERRM;
      END;

    -- MIDDLEMAN account
    WHEN 'middleman' THEN
      BEGIN
        INSERT INTO public.sellers (
          user_id,
          email,
          full_name,
          phone,
          location,
          currency,
          account_type,
          is_verified,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.email,
          v_full_name,
          v_phone,
          v_location,
          v_currency,
          'middleman',
          FALSE,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting middleman: %', SQLERRM;
      END;
  END CASE;

  -- Step 3: Create wallet for user (all account types) - CRITICAL!
  BEGIN
    INSERT INTO public.user_wallets (
      user_id,
      balance,
      currency,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      0,
      v_currency,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating wallet: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, authenticated;

-- =====================================================
-- DEPLOYMENT INSTRUCTIONS
-- =====================================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy this entire function
-- 3. Paste into a New Query
-- 4. Click Run
-- 5. Verify success with:
--    SELECT routine_name, security_type 
--    FROM information_schema.routines 
--    WHERE routine_name = 'handle_new_user';
-- 
-- After deployment, test signup:
-- - New customer email → should create customers + wallet
-- - New seller email → should create sellers (is_factory=false) + wallet
-- - New factory email → should create sellers (is_factory=true) + wallet
-- - New delivery email → should create delivery_profiles + wallet
-- =====================================================
