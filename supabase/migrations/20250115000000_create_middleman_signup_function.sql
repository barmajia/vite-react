-- =====================================================
-- MIDDLEMAN SIGNUP FUNCTION
-- Handles complete middleman registration flow
-- Creates user + middleman profile in single transaction
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.signup_middleman(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_company_name TEXT,
  p_location TEXT,
  p_currency TEXT,
  p_commission_rate NUMERIC,
  p_specialization TEXT,
  p_years_of_experience INTEGER,
  p_tax_id TEXT,
  p_bio TEXT
);

-- Create the middleman signup function
CREATE OR REPLACE FUNCTION public.signup_middleman(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_company_name TEXT,
  p_location TEXT,
  p_currency TEXT DEFAULT 'USD',
  p_commission_rate NUMERIC DEFAULT 5.0,
  p_specialization TEXT DEFAULT NULL,
  p_years_of_experience INTEGER DEFAULT NULL,
  p_tax_id TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_middleman_id UUID;
  v_wallet_id UUID;
  v_verification_token TEXT;
  v_result JSON;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;
  
  IF p_password IS NULL OR LENGTH(p_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;
  
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RETURN json_build_object('success', false, 'error', 'Full name is required');
  END IF;
  
  IF p_company_name IS NULL OR p_company_name = '' THEN
    RETURN json_build_object('success', false, 'error', 'Company name is required');
  END IF;
  
  IF p_commission_rate < 0 OR p_commission_rate > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Commission rate must be between 0 and 100');
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Start transaction
  BEGIN
    -- Step 1: Create user in auth.users via RPC (using existing signup function pattern)
    -- We'll insert directly into auth.users with proper encryption
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      last_sign_in_at,
      role
    )
    VALUES (
      p_email,
      crypt(p_password, gen_salt('bf')),
      NULL, -- Email needs confirmation
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'full_name', p_full_name,
        'phone', p_phone,
        'account_type', 'middleman'
      ),
      NOW(),
      NOW(),
      NOW(),
      'authenticated'
    )
    RETURNING id INTO v_user_id;
    
    -- Step 2: Create middleman profile
    INSERT INTO public.middlemen (
      user_id,
      company_name,
      location,
      currency,
      commission_rate,
      specialization,
      years_of_experience,
      tax_id,
      bio,
      status,
      verification_status,
      total_deals,
      total_revenue,
      total_commission_earned
    )
    VALUES (
      v_user_id,
      p_company_name,
      p_location,
      p_currency,
      p_commission_rate,
      p_specialization,
      p_years_of_experience,
      p_tax_id,
      p_bio,
      'pending', -- Initial status
      'unverified', -- Needs verification
      0,
      0,
      0
    )
    RETURNING id INTO v_middleman_id;
    
    -- Step 3: Create wallet for middleman
    INSERT INTO public.user_wallets (
      user_id,
      balance,
      currency,
      pending_balance,
      total_earned,
      total_withdrawn
    )
    VALUES (
      v_user_id,
      0,
      p_currency,
      0,
      0,
      0
    )
    RETURNING id INTO v_wallet_id;
    
    -- Step 4: Generate verification token
    v_verification_token := encode(gen_random_bytes(32), 'hex');
    
    -- Step 5: Create verification request
    INSERT INTO public.verification_requests (
      user_id,
      entity_type,
      entity_id,
      verification_token,
      status,
      expires_at
    )
    VALUES (
      v_user_id,
      'middleman',
      v_middleman_id,
      v_verification_token,
      'pending',
      NOW() + INTERVAL '7 days'
    );
    
    -- Step 6: Send verification email (via notification queue)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data,
      is_read
    )
    VALUES (
      v_user_id,
      'email_verification',
      'Verify Your Middleman Account',
      'Please verify your email to activate your middleman account.',
      jsonb_build_object(
        'verification_token', v_verification_token,
        'entity_type', 'middleman',
        'company_name', p_company_name
      ),
      false
    );
    
    -- Build success response
    v_result := json_build_object(
      'success', true,
      'message', 'Middleman account created successfully. Please check your email for verification.',
      'data', json_build_object(
        'user_id', v_user_id,
        'middleman_id', v_middleman_id,
        'wallet_id', v_wallet_id,
        'email', p_email,
        'full_name', p_full_name,
        'company_name', p_company_name,
        'status', 'pending',
        'verification_required', true,
        'verification_token', v_verification_token
      )
    );
    
    RETURN v_result;
    
  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object('success', false, 'error', 'Email already exists');
    WHEN foreign_key_violation THEN
      RETURN json_build_object('success', false, 'error', 'Invalid reference data');
    WHEN check_violation THEN
      RETURN json_build_object('success', false, 'error', 'Data validation failed');
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.signup_middleman(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, INTEGER, TEXT, TEXT
) TO authenticated;

-- Grant execute permission to anon (for signup page)
GRANT EXECUTE ON FUNCTION public.signup_middleman(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, INTEGER, TEXT, TEXT
) TO anon;

-- =====================================================
-- HELPER FUNCTION: Verify Middleman Email
-- =====================================================

DROP FUNCTION IF EXISTS public.verify_middleman_email(TEXT);

CREATE OR REPLACE FUNCTION public.verify_middleman_email(
  p_verification_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_middleman_id UUID;
  v_result JSON;
BEGIN
  -- Find verification request
  SELECT vr.user_id, vr.entity_id
  INTO v_user_id, v_middleman_id
  FROM public.verification_requests vr
  WHERE vr.verification_token = p_verification_token
    AND vr.entity_type = 'middleman'
    AND vr.status = 'pending'
    AND vr.expires_at > NOW();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired verification token');
  END IF;
  
  -- Update user email confirmation
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = v_user_id;
  
  -- Update middleman status
  UPDATE public.middlemen
  SET 
    status = 'active',
    verification_status = 'verified',
    verified_at = NOW()
  WHERE id = v_middleman_id;
  
  -- Mark verification request as completed
  UPDATE public.verification_requests
  SET status = 'approved', approved_at = NOW()
  WHERE verification_token = p_verification_token;
  
  -- Send welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    is_read
  )
  VALUES (
    v_user_id,
    'account_activated',
    'Welcome to Aurora!',
    'Your middleman account has been activated. You can now start selecting products and creating deals.',
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email verified successfully. Your middleman account is now active.',
    'data', json_build_object(
      'user_id', v_user_id,
      'middleman_id', v_middleman_id,
      'status', 'active'
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_middleman_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_middleman_email(TEXT) TO anon;

-- =====================================================
-- HELPER FUNCTION: Get Middleman Profile
-- =====================================================

DROP FUNCTION IF EXISTS public.get_middleman_profile(UUID);

CREATE OR REPLACE FUNCTION public.get_middleman_profile(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'success', true,
    'data', json_build_object(
      'user_id', m.user_id,
      'middleman_id', m.id,
      'company_name', m.company_name,
      'location', m.location,
      'currency', m.currency,
      'commission_rate', m.commission_rate,
      'specialization', m.specialization,
      'years_of_experience', m.years_of_experience,
      'tax_id', m.tax_id,
      'bio', m.bio,
      'logo_url', m.logo_url,
      'banner_url', m.banner_url,
      'status', m.status,
      'verification_status', m.verification_status,
      'total_deals', m.total_deals,
      'total_revenue', m.total_revenue,
      'total_commission_earned', m.total_commission_earned,
      'active_products', m.active_products,
      'created_at', m.created_at,
      'updated_at', m.updated_at,
      'verified_at', m.verified_at,
      'wallet', json_build_object(
        'balance', w.balance,
        'currency', w.currency,
        'pending_balance', w.pending_balance,
        'total_earned', w.total_earned
      )
    )
  )
  INTO v_result
  FROM public.middlemen m
  LEFT JOIN public.user_wallets w ON w.user_id = m.user_id
  WHERE m.user_id = p_user_id;
  
  IF v_result IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Middleman profile not found');
  END IF;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_middleman_profile(UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.signup_middleman IS 'Creates a new middleman account with user auth, profile, and wallet';
COMMENT ON FUNCTION public.verify_middleman_email IS 'Verifies middleman email and activates account';
COMMENT ON FUNCTION public.get_middleman_profile IS 'Retrieves complete middleman profile with wallet info';
