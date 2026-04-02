-- Minimal helper to create a customer profile after auth signup.
-- Scope: touches only auth.users (for existence check) and public.customers.
-- Call after Supabase auth signUp; provide the auth user id returned by GoTrue.
-- Usage example:
--   select * from public.customer_signup('auth-uuid', 'email@example.com', 'Full Name', '+123...');

CREATE OR REPLACE FUNCTION public.customer_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_phone text DEFAULT NULL
)
RETURNS TABLE(customer_id uuid) AS $$
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
  ON CONFLICT (user_id) DO NOTHING
  RETURNING user_id INTO customer_id;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.customer_signup(uuid, text, text, text) TO service_role;
