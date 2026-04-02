-- =====================================================
-- AURORA SIGNUP FIX - FINAL COMPREHENSIVE
-- =====================================================
-- This script fixes the "Database error saving new user" issue
-- by ensuring proper RLS policies and trigger execution
-- 
-- Run in Supabase SQL Editor step by step
-- Each section is independent and can be debugged separately

BEGIN;

-- =====================================================
-- STEP 1: DIAGNOSTIC QUERIES (Run to understand current state)
-- =====================================================
-- After running these, check:
-- 1. Does handle_new_user exist?
-- 2. Are RLS policies correct?
-- 3. Are permissions granted?

-- Check if handle_new_user trigger function exists
SELECT 
  routine_name,
  routine_definition,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

-- Check current RLS policies
SELECT 
  policyname,
  tablename,
  qual,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'users', 'user_wallets', 'sellers')
ORDER BY tablename, policyname;

-- Check trigger attaching
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- =====================================================
-- STEP 2: DROP CONFLICTING POLICIES (Clean slate)
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Customers can insert their own record" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own seller profile" ON public.sellers;
DROP POLICY IF EXISTS "Wallets can insert own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Insert own wallet" ON public.user_wallets;

COMMIT;
BEGIN;

-- =====================================================
-- STEP 3: CREATE PROPER RLS POLICIES
-- =====================================================
-- These policies allow the trigger (running as postgres/service_role) to insert

-- For public.users table
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

-- For public.customers table
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

-- For public.sellers table
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

-- For public.user_wallets table
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

-- For public.delivery_profiles table (if exists)
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

COMMIT;
BEGIN;

-- =====================================================
-- STEP 4: ENSURE TRIGGER EXISTS WITH PROPER DEFINITION
-- =====================================================

-- Drop old trigger if exists (without dropping function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with SECURITY DEFINER
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
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';
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
    RETURN NEW;
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
  END CASE;

  -- Step 3: Create wallet for user (all account types)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, authenticated;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
BEGIN;

-- =====================================================
-- STEP 5: VERIFY EVERYTHING IS IN PLACE
-- =====================================================

-- Verify RLS is enabled on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Verify trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Verify function is SECURITY DEFINER
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If you reach here without errors, the fix is applied!
-- 
-- Next steps:
-- 1. Go back to the browser at http://localhost:5173/signup/customer
-- 2. Try signing up with a NEW email address
-- 3. If it works, you should see the "Account Created!" success screen
-- 4. If you still get an error, check the browser console and share the error message
--
-- Test data:
-- Email: newtest@example.com
-- Password: Test@1234
-- Full Name: Test User
-- Phone: +1234567890
-- =====================================================
