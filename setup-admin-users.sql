-- Admin Users Table Setup
-- Run this in Supabase SQL Editor to enable admin functionality

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'admin',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can view other admins
DROP POLICY IF EXISTS "admins_can_view_admins" ON public.admin_users;
CREATE POLICY "admins_can_view_admins"
ON public.admin_users FOR SELECT
USING (true);

-- Only super admins can insert/delete (handled via service role)
DROP POLICY IF EXISTS "service_role_manage_admins" ON public.admin_users;
CREATE POLICY "service_role_manage_admins"
ON public.admin_users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.admin_users;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT ON TABLE public.admin_users TO authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;

-- Add your admin user here (replace with your actual user ID)
-- INSERT INTO public.admin_users (user_id, role) 
-- VALUES ('your-user-id-here', 'super_admin');

-- Verification query
SELECT 
  '✅ Admin Users Setup Complete' as status,
  COUNT(*) as admin_count
FROM public.admin_users;
