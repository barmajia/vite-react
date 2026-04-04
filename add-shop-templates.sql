-- ============================================
-- Shop System: Complete Migration
-- Safe, zero-downtime, IF NOT EXISTS throughout
-- ============================================

-- 1. Shops Table (one per user, supports all 4 roles)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  shop_type TEXT NOT NULL CHECK (shop_type IN ('doctor', 'seller', 'factory', 'middleman')),
  template_id UUID REFERENCES public.shop_templates(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended')),
  settings JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_owner_shop UNIQUE (owner_id)
);

-- 2. Shop Templates Marketplace
CREATE TABLE IF NOT EXISTS public.shop_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  shop_type TEXT NOT NULL CHECK (shop_type IN ('doctor', 'seller', 'factory', 'middleman')),
  preview_image_url TEXT,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Shop-Product Mapping (curated stores, middlemen)
CREATE TABLE IF NOT EXISTS public.shop_products (
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, product_id)
);

-- 4. Custom Template Requests
CREATE TABLE IF NOT EXISTS public.template_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_type TEXT NOT NULL CHECK (shop_type IN ('doctor', 'seller', 'factory', 'middleman')),
  description TEXT NOT NULL,
  reference_urls TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'completed')),
  feedback TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(status);
CREATE INDEX IF NOT EXISTS idx_shop_templates_status_type ON public.shop_templates(status, shop_type);
CREATE INDEX IF NOT EXISTS idx_shop_products_shop_id ON public.shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_product_id ON public.shop_products(product_id);
CREATE INDEX IF NOT EXISTS idx_template_requests_status ON public.template_requests(status);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;

-- Shops: Public view active, owners manage
CREATE POLICY view_active_shops
  ON public.shops FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY manage_own_shops
  ON public.shops FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Templates: Public view active, creators manage
CREATE POLICY view_active_templates
  ON public.shop_templates FOR SELECT
  USING (status = 'active' OR created_by = auth.uid());

CREATE POLICY manage_own_templates
  ON public.shop_templates FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Shop Products: Owners manage, public view active shop links
CREATE POLICY view_active_shop_products
  ON public.shop_products FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_products.shop_id AND s.status = 'active')
  );

CREATE POLICY manage_own_shop_products
  ON public.shop_products FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_products.shop_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_products.shop_id AND s.owner_id = auth.uid())
  );

-- Template Requests: Users manage own, admins view/update
CREATE POLICY manage_own_requests
  ON public.template_requests FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY admins_view_requests
  ON public.template_requests FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  );

CREATE POLICY admins_update_requests
  ON public.template_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  );

-- ============================================
-- Updated_at Triggers (reuses existing update_updated_at_column)
-- ============================================
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_templates_updated_at
  BEFORE UPDATE ON public.shop_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_requests_updated_at
  BEFORE UPDATE ON public.template_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Auto-Create Shop on First Visit
-- SECURITY DEFINER so it runs with elevated privileges
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_shop_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_account_type TEXT;
BEGIN
  -- Get account type from users table
  SELECT account_type INTO v_account_type
  FROM public.users
  WHERE user_id = v_user_id
  LIMIT 1;

  -- Map account_type to valid shop_type
  -- If account_type is 'user' or null, default to 'seller'
  IF v_account_type IS NULL OR v_account_type = 'user' THEN
    v_account_type := 'seller';
  END IF;

  -- Create shop if not exists (one shop per user constraint handles duplicates)
  INSERT INTO public.shops (owner_id, slug, shop_type, status, settings, metadata)
  VALUES (
    v_user_id,
    'shop-' || REPLACE(v_user_id::TEXT, '-', ''),
    v_account_type,
    'draft',
    '{}'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (owner_id) DO NOTHING;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_shop_exists() TO authenticated;
