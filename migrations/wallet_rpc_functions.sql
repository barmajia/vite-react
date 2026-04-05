-- =====================================================
-- Wallet Operations RPC Functions
-- =====================================================
-- Secure wallet balance operations for marketplace
-- =====================================================

-- 1. Deduct Wallet Balance Function
-- Safely deducts amount from user's wallet with balance check
CREATE OR REPLACE FUNCTION "public"."deduct_wallet_balance"(
  p_user_id uuid,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance numeric;
  v_wallet_record record;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_wallet_record
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;

  v_current_balance := v_wallet_record.available_balance;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  -- Deduct balance
  UPDATE public.user_wallets
  SET 
    available_balance = available_balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_current_balance - p_amount,
    'deducted', p_amount
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION "public"."deduct_wallet_balance"(uuid, numeric) TO "authenticated";

-- 2. Add Wallet Balance Function
-- Adds amount to user's wallet (for top-ups, earnings, etc.)
CREATE OR REPLACE FUNCTION "public"."add_wallet_balance"(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_exists boolean;
BEGIN
  -- Check if wallet exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_wallets WHERE user_id = p_user_id
  ) INTO v_wallet_exists;

  IF v_wallet_exists THEN
    -- Update existing wallet
    UPDATE public.user_wallets
    SET 
      available_balance = available_balance + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Create new wallet
    INSERT INTO public.user_wallets (
      user_id, 
      available_balance, 
      total_earned,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_amount,
      p_amount,
      now(),
      now()
    );
  END IF;

  -- Log transaction if description provided
  IF p_description IS NOT NULL THEN
    INSERT INTO public.wallet_transactions (
      user_id,
      transaction_type,
      amount,
      description,
      reference_type,
      status
    ) VALUES (
      p_user_id,
      'credit',
      p_amount,
      p_description,
      'wallet_topup',
      'completed'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'amount_added', p_amount
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION "public"."add_wallet_balance"(uuid, numeric, text) TO "authenticated";

-- 3. Get Wallet Balance Function
-- Returns user's wallet balance (for API consistency)
CREATE OR REPLACE FUNCTION "public"."get_wallet_balance"(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_record record;
BEGIN
  SELECT * INTO v_wallet_record
  FROM public.user_wallets
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet not found',
      'available_balance', 0,
      'pending_balance', 0,
      'total_earned', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'available_balance', v_wallet_record.available_balance,
    'pending_balance', v_wallet_record.pending_balance,
    'total_earned', v_wallet_record.total_earned
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION "public"."get_wallet_balance"(uuid) TO "authenticated";
