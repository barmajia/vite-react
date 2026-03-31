-- =====================================================
-- Search Users Directly from auth.users Table
-- This bypasses the public.users table entirely
-- =====================================================

-- Function to search auth.users by email or metadata
CREATE OR REPLACE FUNCTION public.search_auth_users(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO auth, pg_catalog
AS $$
BEGIN
  -- Security check: ensure user is authenticated
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  -- Search auth.users directly (bypasses public.users table)
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
  FROM auth.users au
  WHERE 
    au.id != p_current_user_id  -- Exclude current user
    AND (
      au.email ILIKE '%' || p_query || '%'
      OR au.raw_user_meta_data->>'full_name' ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE WHEN au.email ILIKE p_query || '%' THEN 0 ELSE 1 END,
    au.email
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION public.search_auth_users IS 'Search users directly from auth.users table by email or full_name metadata. Excludes current user.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.search_auth_users TO authenticated;

-- Test the function
-- SELECT * FROM search_auth_users('test', 'your-user-id-here');
