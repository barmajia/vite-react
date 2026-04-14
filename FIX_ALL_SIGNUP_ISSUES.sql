-- =====================================================
-- AURORA COMPREHENSIVE FIX - ALL CRITICAL ISSUES
-- =====================================================
-- This script fixes:
-- 1. Customer signup RLS policy issues
-- 2. Wallet auto-creation for all users
-- 3. Proper trigger execution with SECURITY DEFINER
-- 4. All role-specific profile creation (customer, seller, factory, delivery, middleman)
--
-- Run in Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: CLEAN UP OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Customers can insert their own record" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own seller profile" ON public.sellers;
DROP POLICY IF EXISTS "Wallets can insert own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Insert own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "allow_trigger_insert_users" ON public.users;
DROP POLICY IF EXISTS "allow_own_read_users" ON public.users;
DROP POLICY IF EXISTS "allow_own_update_users" ON public.users;
DROP POLICY IF EXISTS "allow_trigger_insert_customers" ON public.customers;
DROP POLICY IF EXISTS "allow_own_read_customers" ON public.customers;
DROP POLICY IF EXISTS "allow_own_update_customers" ON public.customers;
DROP POLICY IF EXISTS "allow_trigger_insert_sellers" ON public.sellers;
DROP POLICY IF EXISTS "allow_own_read_sellers" ON public.sellers;
DROP POLICY IF EXISTS "allow_own_update_sellers" ON public.sellers;
DROP POLICY IF EXISTS "allow_trigger_insert_wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "allow_own_read_wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "allow_own_update_wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "allow_trigger_insert_delivery" ON public.delivery_profiles;
DROP POLICY IF EXISTS "allow_own_read_delivery" ON public.delivery_profiles;
DROP POLICY IF EXISTS "allow_own_update_delivery" ON public.delivery_profiles;

COMMIT;
BEGIN;

-- =====================================================
-- STEP 2: ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY IF EXISTS;

COMMIT;
BEGIN;

-- =====================================================
-- STEP 3: CREATE PROPER RLS POLICIES
-- =====================================================

-- Users table policies
CREATE POLICY "allow_trigger_insert_users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_own_read_users"
  ON public.users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_own_update_users"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Customers table policies
CREATE POLICY "allow_trigger_insert_customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_own_read_customers"
  ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_own_update_customers"
  ON public.customers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sellers table policies
CREATE POLICY "allow_trigger_insert_sellers"
  ON public.sellers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_own_read_sellers"
  ON public.sellers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_own_update_sellers"
  ON public.sellers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_sellers"
  ON public.sellers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User wallets table policies
CREATE POLICY "allow_trigger_insert_wallets"
  ON public.user_wallets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_own_read_wallets"
  ON public.user_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_own_update_wallets"
  ON public.user_wallets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_wallets"
  ON public.user_wallets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Delivery profiles table policies
CREATE POLICY "allow_trigger_insert_delivery"
  ON public.delivery_profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_own_read_delivery"
  ON public.delivery_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "allow_own_update_delivery"
  ON public.delivery_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_delivery"
  ON public.delivery_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
BEGIN;

-- =====================================================
-- STEP 4: DROP AND RECREATE TRIGGER FUNCTION
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
  v_vehicle_type TEXT;
  v_vehicle_number TEXT;
BEGIN
  -- Extract metadata from auth user
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer');
  v_full_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_location := NEW.raw_user_meta_data->>'location';
  v_currency := COALESCE(NEW.raw_user_meta_data->>'currency', 'USD');
  v_vehicle_type := NEW.raw_user_meta_data->>'vehicle_type';
  v_vehicle_number := NEW.raw_user_meta_data->>'vehicle_number';

  -- Normalize account types
  IF v_account_type = 'delivery_driver' THEN
    v_account_type := 'delivery';
  END IF;

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

    -- FACTORY account
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
          COALESCE(v_vehicle_type, 'motorcycle'),
          v_vehicle_number,
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
          'middleman',
          FALSE,
          FALSE,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting middleman: %', SQLERRM;
      END;
      
    ELSE
      -- Default: just create customer record for unknown types
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
        RAISE WARNING 'Error inserting default customer: %', SQLERRM;
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

-- Grant execute permission to necessary roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, authenticated;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- =====================================================
-- STEP 5: VERIFICATION QUERIES
-- =====================================================

-- Verify trigger exists
SELECT 
  trigger_name, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- Verify function is SECURITY DEFINER
SELECT 
  routine_name, 
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- Verify RLS policies are in place
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'customers', 'sellers', 'user_wallets', 'delivery_profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If you reach here without errors, the fix is applied!
-- Test signup with different account types to verify.
-- =====================================================
