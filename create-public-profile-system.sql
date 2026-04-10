-- =====================================================
-- PUBLIC PROFILE SYSTEM - COMPLETE SQL
-- =====================================================
-- Run this in Supabase SQL Editor to create profile functions
-- =====================================================

-- 1. Get Public Profile Function
DROP FUNCTION IF EXISTS public.get_public_profile(UUID);

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  account_type TEXT,
  location TEXT,
  currency TEXT,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  product_count BIGINT,
  total_sales BIGINT,
  total_revenue NUMERIC,
  average_rating NUMERIC,
  review_count BIGINT,
  store_name TEXT,
  is_factory BOOLEAN,
  is_middle_man BOOLEAN,
  is_seller BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    u.email,
    u.full_name,
    CASE 
      WHEN auth.uid() = p_user_id THEN u.phone
      ELSE NULL 
    END AS phone,
    u.avatar_url,
    u.account_type,
    COALESCE(s.location, NULL) AS location,
    COALESCE(s.currency, 'USD') AS currency,
    COALESCE(s.is_verified, false) AS is_verified,
    u.created_at,
    COALESCE(pc.product_count, 0)::BIGINT AS product_count,
    COALESCE(sc.sales_count, 0)::BIGINT AS total_sales,
    COALESCE(sr.total_revenue, 0)::NUMERIC AS total_revenue,
    COALESCE(r.avg_rating, 0)::NUMERIC AS average_rating,
    COALESCE(r.review_count, 0)::BIGINT AS review_count,
    COALESCE(s.full_name, NULL) AS store_name,
    (u.account_type = 'factory') AS is_factory,
    (u.account_type = 'middle_man') AS is_middle_man,
    (u.account_type = 'seller') AS is_seller
  FROM public.users u
  LEFT JOIN public.sellers s ON s.user_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, COUNT(*) AS product_count
    FROM public.products
    WHERE is_deleted = false OR is_deleted IS NULL
    GROUP BY seller_id
  ) pc ON pc.seller_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, COUNT(*) AS sales_count
    FROM public.sales
    GROUP BY seller_id
  ) sc ON sc.seller_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, SUM(total_price) AS total_revenue
    FROM public.sales
    GROUP BY seller_id
  ) sr ON sr.seller_id = u.user_id
  LEFT JOIN (
    SELECT 
      p.seller_id,
      AVG(r2.rating) AS avg_rating,
      COUNT(r2.id) AS review_count
    FROM public.products p
    LEFT JOIN public.reviews r2 ON r2.asin = p.asin AND r2.is_approved = true
    WHERE p.is_deleted = false OR p.is_deleted IS NULL
    GROUP BY p.seller_id
  ) r ON r.seller_id = u.user_id
  WHERE u.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile TO anon;

-- 2. Search Public Profiles Function
DROP FUNCTION IF EXISTS public.search_public_profiles(TEXT, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.search_public_profiles(
  p_search_term TEXT DEFAULT NULL,
  p_account_type TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT,
  location TEXT,
  is_verified BOOLEAN,
  product_count BIGINT,
  total_revenue NUMERIC,
  average_rating NUMERIC,
  store_name TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    u.full_name,
    u.avatar_url,
    u.account_type,
    s.location,
    s.is_verified,
    COALESCE(pc.product_count, 0)::BIGINT AS product_count,
    COALESCE(sr.total_revenue, 0)::NUMERIC AS total_revenue,
    COALESCE(r.avg_rating, 0)::NUMERIC AS average_rating,
    COALESCE(s.full_name, NULL) AS store_name
  FROM public.users u
  LEFT JOIN public.sellers s ON s.user_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, COUNT(*) AS product_count
    FROM public.products
    WHERE is_deleted = false OR is_deleted IS NULL
    GROUP BY seller_id
  ) pc ON pc.seller_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, SUM(total_price) AS total_revenue
    FROM public.sales
    GROUP BY seller_id
  ) sr ON sr.seller_id = u.user_id
  LEFT JOIN (
    SELECT 
      p.seller_id,
      AVG(r2.rating) AS avg_rating
    FROM public.products p
    LEFT JOIN public.reviews r2 ON r2.asin = p.asin AND r2.is_approved = true
    WHERE p.is_deleted = false OR p.is_deleted IS NULL
    GROUP BY p.seller_id
  ) r ON r.seller_id = u.user_id
  WHERE 
    (p_search_term IS NULL OR 
      u.full_name ILIKE '%' || p_search_term || '%' OR 
      u.email ILIKE '%' || p_search_term || '%' OR
      s.location ILIKE '%' || p_search_term || '%')
    AND (p_account_type IS NULL OR u.account_type = p_account_type)
    AND (p_location IS NULL OR s.location ILIKE '%' || p_location || '%')
  ORDER BY s.is_verified DESC, pc.product_count DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_public_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_profiles TO anon;

-- 3. Update RLS Policies for Public Profile Access
DROP POLICY IF EXISTS "users_view_public_profiles" ON public.users;
CREATE POLICY "users_view_public_profiles" ON public.users
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_view_public_anon" ON public.users;
CREATE POLICY "users_view_public_anon" ON public.users
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "sellers_view_public" ON public.sellers;
CREATE POLICY "sellers_view_public" ON public.sellers
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "sellers_view_public_anon" ON public.sellers;
CREATE POLICY "sellers_view_public_anon" ON public.sellers
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "factories_view_public" ON public.factories;
CREATE POLICY "factories_view_public" ON public.factories
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "factories_view_public_anon" ON public.factories;
CREATE POLICY "factories_view_public_anon" ON public.factories
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "products_view_active_public" ON public.products;
CREATE POLICY "products_view_active_public" ON public.products
FOR SELECT TO authenticated
USING ((is_deleted = false OR is_deleted IS NULL) AND status = 'active');

DROP POLICY IF EXISTS "products_view_active_anon" ON public.products;
CREATE POLICY "products_view_active_anon" ON public.products
FOR SELECT TO anon
USING ((is_deleted = false OR is_deleted IS NULL) AND status = 'active');

-- =====================================================
-- Verification
-- =====================================================
-- Test the functions:
-- SELECT * FROM public.get_public_profile('YOUR-USER-ID-HERE');
-- SELECT * FROM public.search_public_profiles(NULL, 'factory', NULL, 10, 0);
