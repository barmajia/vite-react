-- =====================================================
-- Create Users Table
-- =====================================================
-- This creates the users table that stores user profiles
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    account_type text DEFAULT 'user'::text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own profile (for trigger)
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read other users' basic info (for chat, etc.)
CREATE POLICY "Users can read other users basic info"
    ON public.users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_user_id_idx ON public.users(user_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (user_id, email, full_name, avatar_url, account_type, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'account_type', 'user'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        account_type = COALESCE(EXCLUDED.account_type, users.account_type),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Insert existing auth users into users table
-- =====================================================
-- This migrates existing auth users to the users table

INSERT INTO public.users (user_id, email, full_name, account_type, phone)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    COALESCE(au.raw_user_meta_data->>'account_type', 'user') as account_type,
    au.raw_user_meta_data->>'phone' as phone
FROM auth.users au
LEFT JOIN public.users u ON u.user_id = au.id
WHERE u.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    account_type = COALESCE(EXCLUDED.account_type, users.account_type),
    phone = COALESCE(EXCLUDED.phone, users.phone);

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the table was created correctly

-- SELECT 
--     u.user_id,
--     u.email,
--     u.full_name,
--     u.account_type,
--     u.created_at
-- FROM public.users u
-- ORDER BY u.created_at DESC;
