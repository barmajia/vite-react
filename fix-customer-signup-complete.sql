-- =====================================================
-- COMPLETE CUSTOMER SIGNUP FIX
-- =====================================================
-- This migration fixes the database error saving new user issue
-- by:
-- 1. Creating a unified handle_new_user trigger for all account types
-- 2. Fixing RLS policies to allow triggers to insert
-- 3. Creating customer_signup helper function
-- Run this in your Supabase SQL Editor

BEGIN;

-- =====================================================
-- STEP 1: FIX RLS POLICIES ON KEY TABLES
-- =====================================================

-- Allow postgres/service_role to insert into users table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR current_user = 'postgres'
        OR auth.role() = 'service_role'
    );

-- Allow postgres/service_role to insert into customers table
DROP POLICY IF EXISTS "Customers can insert their own record" ON public.customers;
CREATE POLICY "Customers can insert their own record"
    ON public.customers
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR current_user = 'postgres'
        OR auth.role() = 'service_role'
    );

-- Allow postgres/service_role to insert into sellers table
DROP POLICY IF EXISTS "Users can insert own seller profile" ON public.sellers;
CREATE POLICY "Users can insert own seller profile"
    ON public.sellers
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR current_user = 'postgres'
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- STEP 2: DROP OLD TRIGGERS TO AVOID DUPLICATES
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_customer_on_signup();

-- =====================================================
-- STEP 3: CREATE UNIFIED HANDLE_NEW_USER TRIGGER
-- =====================================================
-- Handles all account types with safe defaults

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
  -- 1. Create base profile in public.users (for all account types)
  INSERT INTO public.users (user_id, email, full_name, phone, account_type)
  VALUES (NEW.id, NEW.email, full_name, phone, acct)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Create customer record (for customers)
  IF acct = 'customer' THEN
    INSERT INTO public.customers (
      user_id, name, email, phone, created_at, updated_at
    ) VALUES (
      NEW.id,
      COALESCE(full_name, NEW.email),
      NEW.email,
      COALESCE(phone, 'unknown'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 3. Create seller record (for sellers)
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

  -- 4. Create factory record (for factories)
  IF acct = 'factory' THEN
    INSERT INTO public.sellers (
      user_id, email, full_name, phone, location, currency,
      account_type, is_verified, is_factory
    ) VALUES (
      NEW.id,
      NEW.email,
      full_name,
      phone,
      NEW.raw_user_meta_data->>'location',
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      'factory',
      FALSE,
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 5. Create delivery profile (for delivery drivers)
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

  -- 6. Create wallet for user (all account types)
  INSERT INTO public.user_wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'USD')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 4: CREATE THE TRIGGER
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: CREATE CUSTOMER SIGNUP HELPER FUNCTION
-- =====================================================
-- Simple helper to manually create a customer profile
-- Usage: SELECT * FROM public.customer_signup('auth-uuid', 'email@example.com', 'Full Name', '+1234567890');

CREATE OR REPLACE FUNCTION public.customer_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_phone text DEFAULT NULL
)
RETURNS TABLE(customer_id uuid, success boolean) AS $$
DECLARE
  v_exists uuid;
BEGIN
  -- Ensure auth user exists
  SELECT id INTO v_exists FROM auth.users WHERE id = p_user_id;
  IF v_exists IS NULL THEN
    RAISE EXCEPTION 'Auth user % not found', p_user_id;
  END IF;

  -- Insert customer row
  INSERT INTO public.customers (user_id, name, email, phone, created_at, updated_at)
  VALUES (
    p_user_id,
    COALESCE(NULLIF(trim(p_full_name), ''), lower(trim(p_email))),
    lower(trim(p_email)),
    COALESCE(NULLIF(trim(p_phone), ''), 'unknown'),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  customer_id := p_user_id;
  success := TRUE;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.customer_signup(uuid, text, text, text) TO service_role;

-- =====================================================
-- STEP 6: VERIFY SETUP
-- =====================================================
-- After running this migration, customers should be able to signup

-- Test query to see customers:
-- SELECT * FROM public.customers ORDER BY created_at DESC LIMIT 10;

-- Test query to see all users:
-- SELECT id, email, account_type, created_at FROM public.users ORDER BY created_at DESC LIMIT 10;

COMMIT;

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
-- If signup still fails:
-- 1. Check Supabase logs for trigger errors
-- 2. Verify RLS policies are applied correctly
-- 3. Run: SELECT * FROM information_schema.table_constraints 
--        WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY';
-- 4. Run: SELECT * FROM pg_indexes WHERE tablename = 'customers';
