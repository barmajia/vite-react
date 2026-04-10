-- ═══════════════════════════════════════════════════════════
-- CRITICAL SECURITY FIX: Users Table Privilege Escalation
-- ═══════════════════════════════════════════════════════════

-- 1. Fix UPDATE policy to prevent users from changing their own account_type
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND 
    account_type = OLD.account_type -- CRITICAL: Prevents role escalation
  );

-- 2. Prevent users from inserting directly (should ONLY be via trigger)
-- We can leave it enabled for authenticated users if needed, but restrict account_type
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND 
    account_type IN ('customer', 'user', 'seller', 'provider', 'factory', 'delivery_driver', 'buyer')
  );

-- 3. Secure the trigger function to prevent malicious roles during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    safe_account_type text;
    requested_type text;
BEGIN
    requested_type := NEW.raw_user_meta_data->>'account_type';
    
    -- Whitelist allowed account types, default to 'customer'
    IF requested_type IN ('customer', 'user', 'seller', 'provider', 'factory', 'delivery_driver', 'buyer') THEN
        safe_account_type := requested_type;
    ELSE
        safe_account_type := 'customer';
    END IF;

    INSERT INTO public.users (user_id, email, full_name, avatar_url, account_type, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        safe_account_type,
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        updated_at = now();
        -- Notice we DO NOT update account_type on conflict to prevent escalation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;
