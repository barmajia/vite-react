-- User Wallets Table Migration
-- Run this in your Supabase SQL Editor to create the wallet system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
    pending_balance numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (pending_balance >= 0),
    total_earned numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (total_earned >= 0),
    total_withdrawn numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (total_withdrawn >= 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own wallet
DROP POLICY IF EXISTS "users_can_view_own_wallet" ON public.user_wallets;
CREATE POLICY "users_can_view_own_wallet" ON public.user_wallets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own wallet (for automatic updates)
DROP POLICY IF EXISTS "users_can_update_own_wallet" ON public.user_wallets;
CREATE POLICY "users_can_update_own_wallet" ON public.user_wallets
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all wallets (for backend operations)
DROP POLICY IF EXISTS "service_role_can_manage_all_wallets" ON public.user_wallets;
CREATE POLICY "service_role_can_manage_all_wallets" ON public.user_wallets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to create wallet for new users
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
BEGIN
    INSERT INTO public.user_wallets (user_id, balance, pending_balance, total_earned, total_withdrawn)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00);
    RETURN NEW;
END;
$$;

-- Trigger to automatically create wallet when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_create_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_create_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric(12,2) NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    description text,
    reference_type text,
    reference_id uuid,
    balance_after numeric(12,2) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON public.wallet_transactions(reference_type, reference_id);

-- Enable Row Level Security for wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
DROP POLICY IF EXISTS "users_can_view_own_transactions" ON public.wallet_transactions;
CREATE POLICY "users_can_view_own_transactions" ON public.wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all transactions
DROP POLICY IF EXISTS "service_role_can_manage_all_transactions" ON public.wallet_transactions;
CREATE POLICY "service_role_can_manage_all_transactions" ON public.wallet_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to record wallet transaction
CREATE OR REPLACE FUNCTION public.record_wallet_transaction(
    p_user_id uuid,
    p_amount numeric,
    p_transaction_type text,
    p_description text,
    p_reference_type text DEFAULT NULL,
    p_reference_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
DECLARE
    v_wallet_balance numeric;
    v_new_balance numeric;
    v_transaction_id uuid;
BEGIN
    -- Get current wallet balance
    SELECT balance INTO v_wallet_balance
    FROM public.user_wallets
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
    END IF;
    
    -- Calculate new balance
    IF p_transaction_type = 'credit' THEN
        v_new_balance := v_wallet_balance + p_amount;
    ELSIF p_transaction_type = 'debit' THEN
        IF v_wallet_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', v_wallet_balance, p_amount;
        END IF;
        v_new_balance := v_wallet_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
    END IF;
    
    -- Update wallet balance
    UPDATE public.user_wallets
    SET 
        balance = v_new_balance,
        total_earned = CASE WHEN p_transaction_type = 'credit' THEN total_earned + p_amount ELSE total_earned END,
        total_withdrawn = CASE WHEN p_transaction_type = 'debit' THEN total_withdrawn + p_amount ELSE total_withdrawn END,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Insert transaction record
    INSERT INTO public.wallet_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        reference_type,
        reference_id,
        balance_after,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        p_transaction_type,
        p_description,
        p_reference_type,
        p_reference_id,
        v_new_balance,
        p_metadata
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Grant permissions
GRANT ALL ON TABLE public.user_wallets TO authenticated;
GRANT ALL ON TABLE public.wallet_transactions TO authenticated;
GRANT ALL ON FUNCTION public.record_wallet_transaction TO authenticated;

-- Add comments
COMMENT ON TABLE public.user_wallets IS 'Stores user wallet balances and earnings';
COMMENT ON TABLE public.wallet_transactions IS 'Records all wallet transactions (credits and debits)';
COMMENT ON FUNCTION public.record_wallet_transaction IS 'Records a wallet transaction and updates the user balance atomically';
