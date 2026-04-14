-- ============================================
-- MIDDLEMAN STORES (Shopify-like)
-- Run this in Supabase SQL Editor
-- ============================================

-- Create middleman stores table
CREATE TABLE IF NOT EXISTS public.middleman_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  middle_man_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_slug TEXT NOT NULL UNIQUE,
  store_description TEXT,
  store_logo_url TEXT,
  store_banner_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  font_family TEXT DEFAULT 'inherit',
  custom_css TEXT,
  custom_html TEXT,
  custom_js TEXT,
  domain TEXT,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  total_views INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.middleman_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "middleman_access_own_store" ON public.middleman_stores
FOR ALL TO authenticated
USING (middle_man_id = auth.uid())
WITH CHECK (middle_man_id = auth.uid());

-- Create index on store_slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_middleman_stores_slug ON public.middleman_stores(store_slug) WHERE is_published = true;

-- Create middleman store products (selected deals for their store)
CREATE TABLE IF NOT EXISTS public.middleman_store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.middleman_stores(id) ON DELETE CASCADE,
  product_asin TEXT NOT NULL,
  custom_price NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, product_asin)
);

-- Enable RLS
ALTER TABLE public.middleman_store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "middleman_manage_own_store_products" ON public.middleman_store_products
FOR ALL TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
  )
);

-- Public view for store products
CREATE POLICY "public_view_store_products" ON public.middleman_store_products
FOR SELECT TO anon, authenticated
USING (
  is_active = true AND store_id IN (
    SELECT id FROM public.middleman_stores WHERE is_published = true AND is_active = true
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_middleman_store_products_store ON public.middleman_store_products(store_id, display_order) WHERE is_active = true;

-- View: Public store info (safe to expose)
CREATE OR REPLACE VIEW public.middleman_stores_public AS
SELECT 
  id,
  store_name,
  store_slug,
  store_description,
  store_logo_url,
  store_banner_url,
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  is_published,
  is_active,
  viewed_at,
  total_views,
  total_orders,
  total_revenue,
  created_at
FROM public.middleman_stores
WHERE is_published = true AND is_active = true;

GRANT SELECT ON public.middleman_stores_public TO anon, authenticated;

-- Function: Get store by slug
CREATE OR REPLACE FUNCTION public.get_store_by_slug(p_store_slug TEXT)
RETURNS TABLE (
  id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_description TEXT,
  store_logo_url TEXT,
  store_banner_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  font_family TEXT,
  custom_css TEXT,
  custom_html TEXT,
  is_published BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.store_name,
    s.store_slug,
    s.store_description,
    s.store_logo_url,
    s.store_banner_url,
    s.primary_color,
    s.secondary_color,
    s.accent_color,
    s.font_family,
    s.custom_css,
    s.custom_html,
    s.is_published
  FROM public.middleman_stores s
  WHERE s.store_slug = p_store_slug AND s.is_published = true AND s.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_slug(TEXT) TO anon, authenticated;

-- Function: Get store products
CREATE OR REPLACE FUNCTION public.get_store_products(p_store_id UUID)
RETURNS TABLE (
  id UUID,
  product_asin TEXT,
  custom_price NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  is_featured BOOLEAN,
  display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.product_asin,
    sp.custom_price,
    sp.custom_title,
    sp.custom_description,
    sp.custom_image_url,
    sp.is_featured,
    sp.display_order
  FROM public.middleman_store_products sp
  WHERE sp.store_id = p_store_id AND sp.is_active = true
  ORDER BY sp.is_featured DESC, sp.display_order ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_products(UUID) TO anon, authenticated;

-- Function: Track store view
CREATE OR REPLACE FUNCTION public.track_store_view(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.middleman_stores
  SET total_views = total_views + 1,
      viewed_at = NOW()
  WHERE id = p_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_store_view(UUID) TO anon;

-- Function: Create/update store
CREATE OR REPLACE FUNCTION public.upsert_middleman_store(
  p_store_id UUID DEFAULT NULL,
  p_store_name TEXT,
  p_store_slug TEXT,
  p_store_description TEXT DEFAULT NULL,
  p_store_logo_url TEXT DEFAULT NULL,
  p_store_banner_url TEXT DEFAULT NULL,
  p_primary_color TEXT DEFAULT '#000000',
  p_secondary_color TEXT DEFAULT '#ffffff',
  p_accent_color TEXT DEFAULT '#3b82f6',
  p_font_family TEXT DEFAULT 'inherit',
  p_custom_css TEXT DEFAULT NULL,
  p_custom_html TEXT DEFAULT NULL,
  p_domain TEXT DEFAULT NULL,
  p_is_published BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF p_store_id IS NOT NULL THEN
    UPDATE public.middleman_stores
    SET 
      store_name = p_store_name,
      store_slug = p_store_slug,
      store_description = p_store_description,
      store_logo_url = p_store_logo_url,
      store_banner_url = p_store_banner_url,
      primary_color = p_primary_color,
      secondary_color = p_secondary_color,
      accent_color = p_accent_color,
      font_family = p_font_family,
      custom_css = p_custom_css,
      custom_html = p_custom_html,
      domain = p_domain,
      is_published = p_is_published,
      updated_at = NOW()
    WHERE id = p_store_id AND middle_man_id = v_user_id
    RETURNING id INTO v_store_id;
  ELSE
    INSERT INTO public.middleman_stores (
      middle_man_id,
      store_name,
      store_slug,
      store_description,
      store_logo_url,
      store_banner_url,
      primary_color,
      secondary_color,
      accent_color,
      font_family,
      custom_css,
      custom_html,
      domain,
      is_published
    ) VALUES (
      v_user_id,
      p_store_name,
      p_store_slug,
      p_store_description,
      p_store_logo_url,
      p_store_banner_url,
      p_primary_color,
      p_secondary_color,
      p_accent_color,
      p_font_family,
      p_custom_css,
      p_custom_html,
      p_domain,
      p_is_published
    )
    ON CONFLICT (store_slug) DO NOTHING
    RETURNING id INTO v_store_id;
  END IF;
  
  RETURN v_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_middleman_store TO authenticated;

-- Function: Add product to store
CREATE OR REPLACE FUNCTION public.add_product_to_store(
  p_store_id UUID,
  p_product_asin TEXT,
  p_custom_price NUMERIC DEFAULT NULL,
  p_custom_title TEXT DEFAULT NULL,
  p_custom_description TEXT DEFAULT NULL,
  p_custom_image_url TEXT DEFAULT NULL,
  p_is_featured BOOLEAN DEFAULT false,
  p_display_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  INSERT INTO public.middleman_store_products (
    store_id,
    product_asin,
    custom_price,
    custom_title,
    custom_description,
    custom_image_url,
    is_featured,
    display_order
  ) VALUES (
    p_store_id,
    p_product_asin,
    p_custom_price,
    p_custom_title,
    p_custom_description,
    p_custom_image_url,
    p_is_featured,
    p_display_order
  )
  ON CONFLICT (store_id, product_asin) DO UPDATE SET
    custom_price = EXCLUDED.custom_price,
    custom_title = EXCLUDED.custom_title,
    custom_description = EXCLUDED.custom_description,
    custom_image_url = EXCLUDED.custom_image_url,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order,
    updated_at = NOW()
  RETURNING id INTO v_product_id;
  
  RETURN v_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_product_to_store TO authenticated;

-- Function: Remove product from store
CREATE OR REPLACE FUNCTION public.remove_product_from_store(
  p_store_id UUID,
  p_product_asin TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.middleman_store_products
  WHERE store_id = p_store_id 
    AND product_asin = p_product_asin
    AND store_id IN (
      SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_product_from_store TO authenticated;

-- Console output
DO $$
BEGIN
  RAISE NOTICE 'Middleman Stores tables and functions created successfully!';
END $$;