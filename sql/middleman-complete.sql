-- ============================================
-- MIDDLEMAN COMPLETE SCHEMA
-- Fixed & Consolidated
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Main middleman profile table
CREATE TABLE IF NOT EXISTS public.middle_men (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    company_name TEXT,
    specialization TEXT,
    location TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(10,8),
    currency TEXT DEFAULT 'USD',
    commission_rate NUMERIC(5,2) DEFAULT 5.00,
    total_earnings NUMERIC(10,2) DEFAULT 0,
    pending_earnings NUMERIC(10,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Middleman deals - links ASIN + seller + margin
CREATE TABLE IF NOT EXISTS public.middleman_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    middle_man_id UUID NOT NULL REFERENCES public.middle_men(id) ON DELETE CASCADE,
    product_asin TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    commission_rate NUMERIC(5,2) DEFAULT 5.00,
    margin_amount NUMERIC(10,2) DEFAULT 0,
    margin_type TEXT DEFAULT 'percentage' CHECK (margin_type IN ('percentage', 'fixed')),
    unique_slug TEXT NOT NULL UNIQUE,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    total_revenue NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    approval_status TEXT DEFAULT 'pending_approval' CHECK (approval_status IN ('pending_approval', 'approved', 'rejected', 'archived', 'auto_approved')),
    expires_at TIMESTAMPTZ,
    promo_tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Middleman commissions - tracks earnings per order
CREATE TABLE IF NOT EXISTS public.middleman_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    middle_man_id UUID NOT NULL REFERENCES public.middle_men(id) ON DELETE CASCADE,
    order_id UUID,
    deal_id UUID REFERENCES public.middleman_deals(id) ON DELETE SET NULL,
    product_asin TEXT NOT NULL,
    seller_id UUID REFERENCES auth.users(id),
    amount NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Middleman products - products for middleman's website
CREATE TABLE IF NOT EXISTS public.middleman_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    middle_man_id UUID NOT NULL REFERENCES public.middle_men(id) ON DELETE CASCADE,
    product_asin TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES auth.users(id),
    selected_price NUMERIC(10,2),
    selling_price NUMERIC(10,2),
    is_published BOOLEAN DEFAULT false,
    publish_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(middle_man_id, product_asin)
);

-- ============================================
-- 2. STORE TABLES
-- ============================================

-- Store templates
CREATE TABLE IF NOT EXISTS public.middleman_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store setup wizard tracking
CREATE TABLE IF NOT EXISTS public.middleman_store_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 5,
    template_id UUID REFERENCES public.middleman_templates(id),
    store_name TEXT,
    store_slug TEXT,
    completed_steps JSONB DEFAULT '[]',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public store
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

-- Store orders
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

-- Store order items
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

-- ============================================
-- 3. MIDDLEMAN SIGNUP RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.middleman_signup(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_currency TEXT DEFAULT 'USD',
    p_commission_rate NUMERIC DEFAULT 5,
    p_specialization TEXT DEFAULT NULL,
    p_company_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_middleman_id UUID;
    v_wallet_id UUID;
    v_lat NUMERIC;
    v_lng NUMERIC;
BEGIN
    -- Get auth user (created via supabase.auth.signUp first)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Auth user not found. Please sign up first.'
        );
    END IF;
    
    -- Parse location to lat/lng if provided
    IF p_location LIKE '%,%' THEN
        v_lat := SPLIT_PART(p_location, ',', 1)::NUMERIC;
        v_lng := SPLIT_PART(p_location, ',', 2)::NUMERIC;
    END IF;
    
    -- Create/update users record
    INSERT INTO public.users (user_id, email, full_name, phone, account_type, currency, is_verified)
    VALUES (v_user_id, p_email, p_full_name, p_phone, ARRAY['user', 'middleman'], p_currency, false)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;
    
    -- Create sellers record
    INSERT INTO public.sellers (user_id, email, full_name, is_verified, is_factory)
    VALUES (v_user_id, p_email, p_full_name, false, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create/update middle_men record
    INSERT INTO public.middle_men (
        user_id, email, full_name, phone, company_name, specialization,
        location, latitude, longitude, currency, commission_rate
    ) VALUES (
        v_user_id, p_email, p_full_name, p_phone, p_company_name, p_specialization,
        p_location, v_lat, v_lng, p_currency, p_commission_rate
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        company_name = COALESCE(EXCLUDED.company_name, middle_men.company_name),
        specialization = COALESCE(EXCLUDED.specialization, middle_men.specialization),
        location = COALESCE(EXCLUDED.location, middle_men.location)
    RETURNING id INTO v_middleman_id;
    
    -- Create wallet
    INSERT INTO public.user_wallets (user_id, balance, currency)
    VALUES (v_user_id, 0, p_currency)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_wallet_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'middleman_id', v_middleman_id,
        'wallet_id', v_wallet_id,
        'message', 'Middleman account created'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.middleman_signup TO authenticated, anon;

-- ============================================
-- 4. ADMIN VERIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_middleman(
    p_user_id UUID,
    p_verified BOOLEAN,
    p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update middle_men table
    UPDATE public.middle_men 
    SET is_verified = p_verified,
        verification_notes = p_notes,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Update sellers table
    UPDATE public.sellers 
    SET is_verified = p_verified,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id, title, message, type, priority
    ) VALUES (
        p_user_id,
        CASE WHEN p_verified THEN 'Account Verified!' ELSE 'Verification Rejected',
        CASE WHEN p_verified 
            THEN 'Your middleman account has been verified. You can now create deals!' 
            ELSE 'Your verification was rejected. Reason: ' || COALESCE(p_notes, 'No reason provided')
        END,
        'system',
        'high'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_middleman TO authenticated;

-- ============================================
-- 5. DEAL FUNCTIONS
-- ============================================

-- Create deal from product ASIN
CREATE OR REPLACE FUNCTION public.create_middleman_deal(
    p_product_asin TEXT,
    p_seller_id UUID,
    p_commission_rate NUMERIC DEFAULT 5.00,
    p_margin_amount NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deal_id UUID;
    v_middleman_id UUID;
    v_product_id UUID;
    v_unique_slug TEXT;
BEGIN
    v_middleman_id := auth.uid();
    
    IF v_middleman_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT id INTO v_product_id 
    FROM public.products 
    WHERE asin = p_product_asin AND status = 'active' AND is_deleted = false;
    
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', p_product_asin;
    END IF;
    
    v_unique_slug := 'mm-' || LEFT(v_middleman_id::TEXT, 8) || '-' || p_product_asin;
    
    INSERT INTO public.middleman_deals (
        middle_man_id, product_asin, product_id, seller_id,
        commission_rate, margin_amount, unique_slug, is_active, approval_status
    ) VALUES (
        (SELECT id FROM public.middle_men WHERE user_id = v_middleman_id),
        p_product_asin, v_product_id, p_seller_id,
        p_commission_rate, p_margin_amount, v_unique_slug, true, 'auto_approved'
    )
    ON CONFLICT (middle_man_id, product_asin) DO UPDATE SET
        commission_rate = EXCLUDED.commission_rate,
        margin_amount = EXCLUDED.margin_amount,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_deal_id;
    
    RETURN v_deal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_middleman_deal TO authenticated;

-- Select product for website
CREATE OR REPLACE FUNCTION public.select_product_for_store(
    p_product_asin TEXT,
    p_store_id UUID,
    p_selling_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
    v_seller_id UUID;
    v_selection_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT id, seller_id INTO v_product_id, v_seller_id 
    FROM public.products 
    WHERE asin = p_product_asin AND status = 'active';
    
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    INSERT INTO public.middleman_store_products (
        store_id, product_asin, product_id, seller_id,
        selected_price, selling_price, is_active
    ) VALUES (
        p_store_id, p_product_asin, v_product_id, v_seller_id,
        (SELECT price FROM public.products WHERE asin = p_product_asin),
        p_selling_price, true
    )
    ON CONFLICT (store_id, product_asin) DO UPDATE SET
        selling_price = EXCLUDED.selling_price,
        updated_at = NOW()
    RETURNING id INTO v_selection_id;
    
    RETURN v_selection_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.select_product_for_store TO authenticated;

-- Track deal click
CREATE OR REPLACE FUNCTION public.track_deal_click(p_unique_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.middleman_deals
    SET clicks = clicks + 1, updated_at = NOW()
    WHERE unique_slug = p_unique_slug AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_deal_click TO authenticated, anon;

-- ============================================
-- 6. VIEWS
-- ============================================

-- Products available for middlemen
CREATE OR REPLACE VIEW public.middleman_available_products AS
SELECT 
    p.asin, p.id as product_id, p.title, p.description,
    p.price, p.images, p.seller_id,
    s.full_name as seller_name, s.is_verified as seller_verified,
    p.category, p.status, p.average_rating, p.review_count
FROM public.products p
JOIN public.sellers s ON s.user_id = p.seller_id
WHERE p.status = 'active' AND p.is_deleted = false
AND COALESCE(p.allow_middleman, true) = true;

-- Middleman's deals
CREATE OR REPLACE VIEW public.middleman_my_deals AS
SELECT 
    d.id, d.product_asin, d.seller_id, d.commission_rate,
    d.margin_amount, d.margin_type, d.unique_slug,
    d.clicks, d.conversions, d.total_revenue, d.is_active,
    d.approval_status, d.created_at,
    p.title as product_title, p.price as product_price,
    p.images as product_images, s.full_name as seller_name
FROM public.middleman_deals d
LEFT JOIN public.products p ON p.asin = d.product_asin
LEFT JOIN public.sellers s ON s.user_id = d.seller_id;

-- Middleman's products for website
CREATE OR REPLACE VIEW public.middleman_my_products AS
SELECT 
    mp.id, mp.product_asin, mp.seller_id, mp.selling_price,
    mp.is_published, mp.created_at,
    p.title as product_title, p.images as product_images,
    s.full_name as seller_name
FROM public.middleman_products mp
LEFT JOIN public.products p ON p.asin = mp.product_asin
LEFT JOIN public.sellers s ON s.user_id = mp.seller_id;

-- Middleman's commissions
CREATE OR REPLACE VIEW public.middleman_my_commissions AS
SELECT 
    mc.id, mc.product_asin, mc.seller_id, mc.amount,
    mc.commission_rate, mc.status, mc.paid_at, mc.created_at,
    mc.order_id, s.full_name as seller_name
FROM public.middleman_commissions mc
LEFT JOIN public.sellers s ON s.user_id = mc.seller_id;

-- Pending middlemen for admin
CREATE OR REPLACE VIEW public.middlemen_pending_approval AS
SELECT 
    m.user_id, m.email, m.full_name, m.phone,
    m.company_name, m.specialization, m.location,
    m.commission_rate, m.is_verified, m.created_at
FROM public.middle_men m
WHERE m.is_verified = false;

-- ============================================
-- 7. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_middleman_deals_middleman ON public.middleman_deals(middle_man_id);
CREATE INDEX IF NOT EXISTS idx_middleman_deals_asin ON public.middleman_deals(product_asin);
CREATE INDEX IF NOT EXISTS idx_middleman_deals_seller ON public.middleman_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_middleman_deals_slug ON public.middleman_deals(unique_slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_middleman_commissions_middleman ON public.middleman_commissions(middle_man_id);
CREATE INDEX IF NOT EXISTS idx_middleman_commissions_status ON public.middleman_commissions(status);
CREATE INDEX IF NOT EXISTS idx_middleman_products_middleman ON public.middleman_products(middle_man_id);
CREATE INDEX IF NOT EXISTS idx_middleman_stores_slug ON public.middleman_stores(store_slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_middleman_store_products_store ON public.middleman_store_products(store_id);

-- ============================================
-- 8. GRANTS
-- ============================================

-- Table grants
GRANT SELECT ON public.middle_men TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_deals TO authenticated;
GRANT SELECT ON public.middleman_commissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_products TO authenticated;
GRANT SELECT ON public.middleman_templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_store_setup TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_stores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.middleman_store_products TO authenticated;
GRANT SELECT ON public.store_orders TO authenticated;
GRANT SELECT ON public.store_order_items TO authenticated;

-- View grants
GRANT SELECT ON public.middleman_available_products TO authenticated;
GRANT SELECT ON public.middleman_my_deals TO authenticated;
GRANT SELECT ON public.middleman_my_products TO authenticated;
GRANT SELECT ON public.middleman_my_commissions TO authenticated;
GRANT SELECT ON public.middlemen_pending_approval TO authenticated;

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.middle_men ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_store_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.middleman_store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- Middlemen policies
DROP POLICY IF EXISTS "middle_men_own" ON public.middle_men;
CREATE POLICY "middle_men_own" ON public.middle_men
FOR ALL TO authenticated USING (user_id = auth.uid());

-- Deals policies
DROP POLICY IF EXISTS "middleman_deals_own" ON public.middleman_deals;
CREATE POLICY "middleman_deals_own" ON public.middleman_deals
FOR ALL TO authenticated USING (
    middle_man_id IN (SELECT id FROM public.middle_men WHERE user_id = auth.uid())
);

-- Commissions policies
DROP POLICY IF EXISTS "middleman_commissions_own" ON public.middleman_commissions;
CREATE POLICY "middleman_commissions_own" ON public.middleman_commissions
FOR SELECT TO authenticated USING (
    middle_man_id IN (SELECT id FROM public.middle_men WHERE user_id = auth.uid())
);

-- Products policies
DROP POLICY IF EXISTS "middleman_products_own" ON public.middleman_products;
CREATE POLICY "middleman_products_own" ON public.middleman_products
FOR ALL TO authenticated USING (
    middle_man_id IN (SELECT id FROM public.middle_men WHERE user_id = auth.uid())
);

-- Templates policies (public read)
DROP POLICY IF EXISTS "templates_public" ON public.middleman_templates;
CREATE POLICY "templates_public" ON public.middleman_templates
FOR SELECT TO anon, authenticated USING (is_active = true);

-- Store setup policies
DROP POLICY IF EXISTS "store_setup_own" ON public.middleman_store_setup;
CREATE POLICY "store_setup_own" ON public.middleman_store_setup
FOR ALL TO authenticated USING (user_id = auth.uid());

-- Store policies
DROP POLICY IF EXISTS "middleman_stores_own" ON public.middleman_stores;
CREATE POLICY "middleman_stores_own" ON public.middleman_stores
FOR ALL TO authenticated USING (middle_man_id = auth.uid());

-- Store product policies
DROP POLICY IF EXISTS "store_products_own" ON public.middleman_store_products;
CREATE POLICY "store_products_own" ON public.middleman_store_products
FOR ALL TO authenticated USING (
    store_id IN (SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid())
);

-- Store orders policies
DROP POLICY IF EXISTS "store_orders_own" ON public.store_orders;
CREATE POLICY "store_orders_own" ON public.store_orders
FOR SELECT TO authenticated USING (
    store_id IN (SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid())
);

-- Store order items policies
DROP POLICY IF EXISTS "store_order_items_own" ON public.store_order_items;
CREATE POLICY "store_order_items_own" ON public.store_order_items
FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.store_orders WHERE store_id IN (
        SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
    ))
);

-- ============================================
-- 10. DEFAULT TEMPLATES
-- ============================================

INSERT INTO public.middleman_templates (name, slug, description, category, config) VALUES
('Minimal Store', 'minimal', 'Clean and simple design focusing on products', 'retail', 
'{"layout": "grid", "cards": "plain", "header": "centered", "accent_color": "#000000", "btn_style": "rounded", "show_rating": true}'),
('Modern Luxe', 'modern-luxe', 'Elegant design with bold accents for premium brands', 'luxury',
'{"layout": "masonry", "cards": "elevated", "header": "left", "accent_color": "#D4AF37", "btn_style": "pill", "show_rating": true, "show_reviews": true}'),
('Fresh Market', 'fresh-market', 'Vibrant design for fashion and lifestyle', 'fashion',
'{"layout": "carousel", "cards": "image-first", "header": "full", "accent_color": "#10B981", "btn_style": "rounded", "banner": true, "show_stock": true}'),
('Tech Store', 'tech-store', 'Dark theme ideal for electronics and gadgets', 'electronics',
'{"layout": "grid", "cards": "bordered", "header": "dark", "accent_color": "#3B82F6", "btn_style": "sharp", "show_specs": true, "compare": true}'),
('Boutique', 'boutique', 'Personalized feel for small businesses', 'general',
'{"layout": "list", "cards": "minimal", "header": "centered", "accent_color": "#EC4899", "btn_style": "rounded", "show_about": true}'),
('Wholesale Hub', 'wholesale', 'Bulk ordering focused for B2B', 'b2b',
'{"layout": "table", "cards": "compact", "header": "minimal", "accent_color": "#8B5CF6", "btn_style": "rounded", "moq_display": true, "bulk_pricing": true}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 11. COMMISSION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_middleman_commission_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_middle_man_id UUID;
    v_commission NUMERIC;
    v_deal RECORD;
BEGIN
    IF NEW.middle_man_slug IS NOT NULL AND NEW.status = 'confirmed' 
       AND OLD.status IS DISTINCT FROM 'confirmed' THEN
        
        SELECT middle_man_id, commission_rate, margin_amount
        INTO v_deal
        FROM public.middleman_deals
        WHERE unique_slug = NEW.middle_man_slug AND is_active = true;
        
        IF v_deal.middle_man_id IS NOT NULL THEN
            IF COALESCE(v_deal.margin_amount, 0) > 0 THEN
                v_commission := v_deal.margin_amount;
            ELSE
                v_commission := NEW.subtotal * (v_deal.commission_rate / 100);
            END IF;
            
            INSERT INTO public.middleman_commissions (
                middle_man_id, order_id, product_asin, seller_id,
                amount, commission_rate, status
            ) VALUES (
                v_deal.middle_man_id, NEW.id, NEW.asin, NEW.seller_id,
                v_commission, COALESCE(v_deal.commission_rate, 0), 'pending'
            );
            
            UPDATE public.middle_men
            SET pending_earnings = COALESCE(pending_earnings, 0) + v_commission
            WHERE id = v_deal.middle_man_id;
            
            UPDATE public.middleman_deals
            SET conversions = conversions + 1,
                total_revenue = COALESCE(total_revenue, 0) + NEW.subtotal
            WHERE id = v_deal.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.orders;
CREATE TRIGGER trigger_calculate_commission
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.calculate_middleman_commission_trigger();

-- ============================================
-- OUTPUT
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Middleman schema installed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Available routes:';
    RAISE NOTICE '  - /middleman/signup (public)';
    RAISE NOTICE '  - /middleman/login (public)';
    RAISE NOTICE '  - /middleman/dashboard (protected)';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin functions:';
    RAISE NOTICE '  - SELECT * FROM middlemen_pending_approval';
    RAISE NOTICE '  - SELECT verify_middleman(user_id, true, ''Approved'')';
END $$;