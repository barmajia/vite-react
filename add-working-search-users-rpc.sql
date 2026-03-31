-- =====================================================
-- Search Users from auth.users (Working Version)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.search_auth_users(TEXT, UUID);

-- Create function to search auth.users
CREATE OR REPLACE FUNCTION public.search_auth_users(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO auth, pg_catalog
AS $$
BEGIN
  -- Security check
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Search auth.users directly
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
  FROM auth.users au
  WHERE au.id != p_current_user_id
    AND (
      au.email ILIKE '%' || p_query || '%'
      OR (au.raw_user_meta_data->>'full_name') ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE WHEN au.email ILIKE p_query || '%' THEN 0 ELSE 1 END,
    au.email
  LIMIT 20;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_auth_users TO authenticated;

-- Test it (replace with your user ID)
-- SELECT * FROM search_auth_users('test', 'your-user-id-here');

-- Also create a simpler function that just queries public.users with all accounts
DROP FUNCTION IF EXISTS public.search_all_users(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.search_all_users(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.user_id,
    u.email,
    COALESCE(u.full_name, au.email) as full_name,
    COALESCE(u.avatar_url, au.raw_user_meta_data->>'avatar_url') as avatar_url,
    COALESCE(u.account_type, au.raw_user_meta_data->>'account_type', 'user') as account_type
  FROM public.users u
  LEFT JOIN auth.users au ON u.user_id = au.id
  WHERE u.user_id != p_current_user_id
    AND (
      u.email ILIKE '%' || p_query || '%'
      OR u.full_name ILIKE '%' || p_query || '%'
    )
  UNION
  SELECT 
    au.id,
    au.id as user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    au.raw_user_meta_data->>'avatar_url' as avatar_url,
    COALESCE(au.raw_user_meta_data->>'account_type', 'user') as account_type
  FROM auth.users au
  WHERE au.id != p_current_user_id
    AND au.id NOT IN (SELECT user_id FROM public.users)
    AND (
      au.email ILIKE '%' || p_query || '%'
      OR (au.raw_user_meta_data->>'full_name') ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE WHEN email ILIKE p_query || '%' THEN 0 ELSE 1 END,
    email
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_all_users TO authenticated;

-- Test: SELECT * FROM search_all_users('test', 'your-user-id-here');
