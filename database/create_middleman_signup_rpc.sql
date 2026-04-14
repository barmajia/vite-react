-- ============================================
-- MIDDLEMAN SIGNUP RPC FUNCTION
-- Creates middleman account with all necessary records
-- ============================================

-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.middleman_signup(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_commission_rate NUMERIC DEFAULT 5,
  p_specialization TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_middleman_id UUID;
  v_wallet_id UUID;
BEGIN
  -- Note: Auth user should be created via supabase.auth.signUp() first
  -- This function creates the public schema records
  
  -- Get the user ID from auth.users (created by auth.signUp)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Auth user not found. Please sign up first.'
    );
  END IF;
  
  -- Create/update users record
  INSERT INTO public.users (
    user_id,
    email,
    full_name,
    phone,
    account_type,
    currency,
    is_verified,
    is_factory
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_phone,
    ARRAY['user', 'middleman'],
    p_currency,
    false,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    account_type = array_cat(users.account_type, EXCLUDED.account_type)
    WHERE NOT (users.account_type && EXCLUDED.account_type);
  
  -- Create/update sellers record
  INSERT INTO public.sellers (
    user_id,
    email,
    full_name,
    is_verified,
    is_factory,
    min_order_quantity,
    wholesale_discount
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    false,
    false,
    1,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create middle_men record
  INSERT INTO public.middle_men (
    id,
    user_id,
    commission_rate,
    total_earnings,
    pending_earnings,
    is_verified,
    specialization
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    p_commission_rate,
    0,
    0,
    false,
    p_specialization
  )
  RETURNING id INTO v_middleman_id;
  
  -- Create user_wallet record
  INSERT INTO public.user_wallets (
    user_id,
    balance,
    currency
  ) VALUES (
    v_user_id,
    0,
    p_currency
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_wallet_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'middleman_id', v_middleman_id,
    'wallet_id', v_wallet_id,
    'message', 'Middleman account created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.middleman_signup TO authenticated;
GRANT EXECUTE ON FUNCTION public.middleman_signup TO anon;

-- Test the function (after creating an auth user)
-- SELECT public.middleman_signup(
--   'test@middleman.com',
--   'password123',
--   'Test Middleman',
--   '+1234567890',
--   'New York, USA',
--   'USD',
--   5,
--   'Electronics'
-- );
