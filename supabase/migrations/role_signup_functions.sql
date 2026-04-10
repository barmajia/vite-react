-- ============================================
-- SELLER SIGNUP RPC FUNCTION
-- Run this in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.seller_signup(
  p_email text,
  p_password text,  -- Not used in RPC; auth handled client-side
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_currency text DEFAULT 'USD'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current authenticated user ID (must be called after supabase.auth.signUp)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated first. Call supabase.auth.signUp() before this RPC.'
    );
  END IF;
  
  -- 1. Create/Update public.users with account_type as ARRAY (text[])
  INSERT INTO public.users (
    user_id,
    email,
    full_name,
    phone,
    account_type,
    location,
    currency,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_phone,
    ARRAY['user', 'seller']::text[],
    p_location,
    p_currency,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    account_type = EXCLUDED.account_type,
    location = EXCLUDED.location,
    currency = EXCLUDED.currency,
    updated_at = NOW();
  
  -- 2. Create/Update public.sellers with account_type as STRING (text)
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
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_phone,
    p_location,
    p_currency,
    'seller',
    FALSE,
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    currency = EXCLUDED.currency,
    updated_at = NOW();
  
  -- 3. Create user wallet
  INSERT INTO public.user_wallets (user_id, currency)
  VALUES (v_user_id, COALESCE(p_currency, 'USD'))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'account_type', ARRAY['user', 'seller'],
    'message', 'Seller account created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.seller_signup(text, text, text, text, text, text) TO authenticated;

-- ============================================
-- FACTORY SIGNUP RPC FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.factory_signup(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_company_name text DEFAULT NULL,
  p_specialization text DEFAULT NULL,
  p_production_capacity bigint DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated first.'
    );
  END IF;
  
  -- 1. Create/Update public.users with account_type as ARRAY
  INSERT INTO public.users (
    user_id, email, full_name, phone, account_type, location, currency, is_factory, created_at, updated_at
  ) VALUES (
    v_user_id, p_email, p_full_name, p_phone,
    ARRAY['user', 'factory']::text[],
    p_location, p_currency, true, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    account_type = EXCLUDED.account_type,
    location = EXCLUDED.location,
    currency = EXCLUDED.currency,
    is_factory = true,
    updated_at = NOW();
  
  -- 2. Create/Update public.sellers with is_factory = true
  INSERT INTO public.sellers (
    user_id, email, full_name, phone, location, currency, account_type,
    is_verified, is_factory, production_capacity, specialization, created_at, updated_at
  ) VALUES (
    v_user_id, p_email, p_full_name, p_phone, p_location, p_currency,
    'factory', FALSE, TRUE, p_production_capacity, p_specialization, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    currency = EXCLUDED.currency,
    production_capacity = EXCLUDED.production_capacity,
    specialization = EXCLUDED.specialization,
    updated_at = NOW();
  
  -- 3. Create user wallet
  INSERT INTO public.user_wallets (user_id, currency)
  VALUES (v_user_id, COALESCE(p_currency, 'USD'))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'account_type', ARRAY['user', 'factory'],
    'message', 'Factory account created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.factory_signup(text, text, text, text, text, text, text, text, bigint) TO authenticated;

-- ============================================
-- MIDDLEMAN SIGNUP RPC FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.middleman_signup(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_commission_rate numeric DEFAULT 5,
  p_specialization text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated first.'
    );
  END IF;
  
  -- 1. Create/Update public.users
  INSERT INTO public.users (
    user_id, email, full_name, phone, account_type, location, currency, created_at, updated_at
  ) VALUES (
    v_user_id, p_email, p_full_name, p_phone,
    ARRAY['user', 'middleman']::text[],
    p_location, p_currency, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    account_type = EXCLUDED.account_type,
    location = EXCLUDED.location,
    currency = EXCLUDED.currency,
    updated_at = NOW();
  
  -- 2. Create/Update public.sellers (middlemen are also sellers)
  INSERT INTO public.sellers (
    user_id, email, full_name, phone, location, currency, account_type,
    is_verified, is_factory, is_middleman, created_at, updated_at
  ) VALUES (
    v_user_id, p_email, p_full_name, p_phone, p_location, p_currency,
    'middleman', FALSE, FALSE, TRUE, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    currency = EXCLUDED.currency,
    updated_at = NOW();
  
  -- 3. Create middle_men record
  INSERT INTO public.middle_men (
    user_id, commission_rate, specialization, total_earnings, pending_earnings,
    is_verified, created_at, updated_at
  ) VALUES (
    v_user_id, p_commission_rate, p_specialization, 0, 0,
    FALSE, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    commission_rate = EXCLUDED.commission_rate,
    specialization = EXCLUDED.specialization,
    updated_at = NOW();
  
  -- 4. Create user wallet
  INSERT INTO public.user_wallets (user_id, currency)
  VALUES (v_user_id, COALESCE(p_currency, 'USD'))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'account_type', ARRAY['user', 'middleman'],
    'message', 'Middleman account created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.middleman_signup(text, text, text, text, text, text, numeric, text) TO authenticated;
