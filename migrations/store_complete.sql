-- ============================================
-- MIDDLEMAN STORES + ORDERS (Combined)
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================
-- STORES TABLE
-- =====================
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

ALTER TABLE public.middleman_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "middleman_access_own_store" ON public.middleman_stores
FOR ALL TO authenticated
USING (middle_man_id = auth.uid())
WITH CHECK (middle_man_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_middleman_stores_slug ON public.middleman_stores(store_slug) WHERE is_published = true;

-- Store products
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

-- =====================
-- ORDERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.middleman_stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id),
  customer_email TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'pending',
  subtotal NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_owner_view_orders" ON public.store_orders
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
  )
);

-- Order items
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_asin TEXT NOT NULL,
  product_title TEXT,
  product_image TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_owner_view_items" ON public.store_order_items
FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.store_orders WHERE store_id IN (
      SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_store_orders_store ON public.store_orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON public.store_order_items(order_id);

-- =====================
-- FUNCTIONS
-- =====================

-- Get store by slug
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
  SELECT s.id, s.store_name, s.store_slug, s.store_description, s.store_logo_url,
         s.store_banner_url, s.primary_color, s.secondary_color, s.accent_color,
         s.font_family, s.custom_css, s.custom_html, s.is_published
  FROM public.middleman_stores s
  WHERE s.store_slug = p_store_slug AND s.is_published = true AND s.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_slug(TEXT) TO anon, authenticated;

-- Track store view
CREATE OR REPLACE FUNCTION public.track_store_view(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.middleman_stores
  SET total_views = total_views + 1, viewed_at = NOW()
  WHERE id = p_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_store_view(UUID) TO anon;

-- Create order from cart
CREATE OR REPLACE FUNCTION public.create_store_order(
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_items JSONB,
  p_shipping_address JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER;
  END LOOP;
  
  v_total := v_subtotal;
  
  INSERT INTO public.store_orders (store_id, customer_email, customer_name, subtotal, total, shipping_address, notes, status)
  VALUES (p_store_id, p_customer_email, p_customer_name, v_subtotal, v_total, p_shipping_address, p_notes, 'pending')
  RETURNING id INTO v_order_id;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.store_order_items (order_id, product_asin, product_title, quantity, unit_price, total_price)
    VALUES (v_order_id, v_item->>'product_asin', v_item->>'title', (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::NUMERIC, (v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER);
  END LOOP;
  
  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store_order TO authenticated;

-- Get store orders
CREATE OR REPLACE FUNCTION public.get_store_orders(p_store_id UUID)
RETURNS TABLE (
  id UUID, customer_email TEXT, customer_name TEXT, status TEXT, subtotal NUMERIC, total NUMERIC,
  payment_status TEXT, created_at TIMESTAMPTZ, items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.customer_email, o.customer_name, o.status, o.subtotal, o.total, o.payment_status, o.created_at,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id', oi.id, 'product_asin', oi.product_asin, 'product_title', oi.product_title, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) FROM public.store_order_items oi WHERE oi.order_id = o.id), '[]'::jsonb) AS items
  FROM public.store_orders o WHERE o.store_id = p_store_id ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_orders TO authenticated;

-- Update order status
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id UUID, p_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.store_orders SET status = p_status, updated_at = NOW()
  WHERE id = p_order_id AND store_id IN (SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status TO authenticated;

RAISE NOTICE 'All store tables and functions created successfully!';