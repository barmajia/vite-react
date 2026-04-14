-- =====================================================
-- MIDDLEMAN MODULE - COMPLETE SQL SCHEMA & FUNCTIONS
-- =====================================================
-- This script creates a comprehensive middleman system where:
-- 1. Middlemen can sign up through the main signup flow
-- 2. They can browse and select products to market
-- 3. They can create custom shop templates
-- 4. They manage deals between buyers and sellers/factories
-- 5. Commission tracking and payout system
-- =====================================================

-- =====================================================
-- PART 1: ENHANCED MIDDLEMAN PROFILES TABLE
-- =====================================================

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS public.middleman_profiles CASCADE;

CREATE TABLE public.middleman_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    company_name text,
    specialization text,
    website_url text,
    description text,
    tax_id text,
    business_license_url text,
    years_of_experience integer DEFAULT 0,
    location text,
    latitude numeric(10,8),
    longitude numeric(10,8),
    currency text DEFAULT 'USD'::text,
    commission_rate numeric(5,2) DEFAULT 5.00,
    is_verified boolean DEFAULT false,
    verification_status text DEFAULT 'pending'::text, -- pending, verified, rejected
    verification_notes text,
    total_deals integer DEFAULT 0,
    total_commission_earned numeric(12,2) DEFAULT 0.00,
    active_templates integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.middleman_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 2: MIDDLEMAN PRODUCT SELECTION TABLE
-- =====================================================
-- Tracks which products a middleman has selected to market

DROP TABLE IF EXISTS public.middleman_products CASCADE;

CREATE TABLE public.middleman_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    middleman_id uuid NOT NULL REFERENCES public.middleman_profiles(user_id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    custom_price numeric(12,2), -- Middleman can set their own markup
    custom_description text,
    custom_images text[], -- Array of image URLs
    is_active boolean DEFAULT true,
    marketing_notes text,
    target_audience text,
    selected_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(middleman_id, product_id)
);

-- Index for fast lookups
CREATE INDEX idx_middleman_products_middleman ON public.middleman_products(middleman_id);
CREATE INDEX idx_middleman_products_product ON public.middleman_products(product_id);
CREATE INDEX idx_middleman_products_active ON public.middleman_products(is_active);

ALTER TABLE public.middleman_products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 3: MIDDLEMAN SHOP TEMPLATES TABLE
-- =====================================================
-- Custom e-commerce templates that middlemen can create

DROP TABLE IF EXISTS public.middleman_templates CASCADE;

CREATE TABLE public.middleman_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    middleman_id uuid NOT NULL REFERENCES public.middleman_profiles(user_id) ON DELETE CASCADE,
    template_name text NOT NULL,
    template_slug text UNIQUE NOT NULL,
    theme_config jsonb DEFAULT '{}'::jsonb, -- Colors, fonts, layout
    header_config jsonb DEFAULT '{}'::jsonb, -- Logo, navigation, hero section
    featured_products uuid[] DEFAULT '{}', -- Array of product IDs from middleman_products
    custom_domain text,
    is_published boolean DEFAULT false,
    is_premium boolean DEFAULT false,
    visitor_count integer DEFAULT 0,
    conversion_rate numeric(5,2) DEFAULT 0.00,
    total_sales numeric(12,2) DEFAULT 0.00,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for template lookups
CREATE INDEX idx_middleman_templates_middleman ON public.middleman_templates(middleman_id);
CREATE INDEX idx_middleman_templates_slug ON public.middleman_templates(template_slug);
CREATE INDEX idx_middleman_templates_published ON public.middleman_templates(is_published);

ALTER TABLE public.middleman_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 4: ENHANCED DEALS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.deals CASCADE;

CREATE TABLE public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    middleman_id uuid NOT NULL REFERENCES public.middleman_profiles(user_id) ON DELETE CASCADE,
    deal_title text NOT NULL,
    deal_description text,
    party_a_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE, -- Buyer
    party_b_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE, -- Seller/Factory
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer DEFAULT 1,
    unit_price numeric(12,2) NOT NULL,
    total_value numeric(12,2) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    commission_amount numeric(12,2) NOT NULL,
    status text DEFAULT 'draft'::text, -- draft, pending, active, completed, cancelled, rejected
    payment_status text DEFAULT 'pending'::text, -- pending, paid, refunded
    terms_conditions text,
    notes text,
    documents text[], -- Array of document URLs
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_commission_rate CHECK (((commission_rate >= (0)::numeric) AND (commission_rate <= (100)::numeric)))
);

-- Index for deal lookups
CREATE INDEX idx_deals_middleman ON public.deals(middleman_id);
CREATE INDEX idx_deals_party_a ON public.deals(party_a_id);
CREATE INDEX idx_deals_party_b ON public.deals(party_b_id);
CREATE INDEX idx_deals_status ON public.deals(status);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 5: MIDDLEMAN ANALYTICS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.middleman_analytics CASCADE;

CREATE TABLE public.middleman_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    middleman_id uuid NOT NULL REFERENCES public.middleman_profiles(user_id) ON DELETE CASCADE,
    event_type text NOT NULL, -- view, click, add_to_cart, purchase
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    template_id uuid REFERENCES public.middleman_templates(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
    visitor_id uuid,
    session_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    occurred_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for analytics queries
CREATE INDEX idx_middleman_analytics_middleman ON public.middleman_analytics(middleman_id);
CREATE INDEX idx_middleman_analytics_event ON public.middleman_analytics(event_type);
CREATE INDEX idx_middleman_analytics_occurred ON public.middleman_analytics(occurred_at);

ALTER TABLE public.middleman_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 6: RPC FUNCTIONS FOR MIDDLEMAN OPERATIONS
-- =====================================================

-- Function 1: Select product for marketing
CREATE OR REPLACE FUNCTION public.middleman_select_product(
    p_product_id uuid,
    p_custom_price numeric DEFAULT NULL,
    p_custom_description text DEFAULT NULL,
    p_marketing_notes text DEFAULT NULL,
    p_target_audience text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_middleman_id uuid;
    v_new_record_id uuid;
BEGIN
    -- Get current user's middleman profile
    SELECT user_id INTO v_middleman_id
    FROM public.middleman_profiles
    WHERE user_id = auth.uid();
    
    IF v_middleman_id IS NULL THEN
        RAISE EXCEPTION 'User does not have a middleman profile';
    END IF;
    
    -- Insert or update the product selection
    INSERT INTO public.middleman_products (
        middleman_id,
        product_id,
        custom_price,
        custom_description,
        marketing_notes,
        target_audience
    ) VALUES (
        v_middleman_id,
        p_product_id,
        p_custom_price,
        p_custom_description,
        p_marketing_notes,
        p_target_audience
    )
    ON CONFLICT (middleman_id, product_id) DO UPDATE SET
        custom_price = COALESCE(p_custom_price, excluded.custom_price),
        custom_description = COALESCE(p_custom_description, excluded.custom_description),
        marketing_notes = COALESCE(p_marketing_notes, excluded.marketing_notes),
        target_audience = COALESCE(p_target_audience, excluded.target_audience),
        is_active = true,
        updated_at = now()
    RETURNING id INTO v_new_record_id;
    
    RETURN v_new_record_id;
END;
$$;

-- Function 2: Create shop template
CREATE OR REPLACE FUNCTION public.middleman_create_template(
    p_template_name text,
    p_theme_config jsonb DEFAULT '{}'::jsonb,
    p_header_config jsonb DEFAULT '{}'::jsonb,
    p_featured_products uuid[] DEFAULT '{}'::uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_middleman_id uuid;
    v_template_slug text;
    v_new_template_id uuid;
BEGIN
    -- Get current user's middleman profile
    SELECT user_id INTO v_middleman_id
    FROM public.middleman_profiles
    WHERE user_id = auth.uid();
    
    IF v_middleman_id IS NULL THEN
        RAISE EXCEPTION 'User does not have a middleman profile';
    END IF;
    
    -- Generate unique slug
    v_template_slug := lower(regexp_replace(p_template_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
    
    -- Insert the template
    INSERT INTO public.middleman_templates (
        middleman_id,
        template_name,
        template_slug,
        theme_config,
        header_config,
        featured_products
    ) VALUES (
        v_middleman_id,
        p_template_name,
        v_template_slug,
        p_theme_config,
        p_header_config,
        p_featured_products
    )
    RETURNING id INTO v_new_template_id;
    
    -- Update active templates count
    UPDATE public.middleman_profiles
    SET active_templates = active_templates + 1,
        updated_at = now()
    WHERE user_id = v_middleman_id;
    
    RETURN v_new_template_id;
END;
$$;

-- Function 3: Create deal
CREATE OR REPLACE FUNCTION public.middleman_create_deal(
    p_deal_title text,
    p_deal_description text,
    p_party_a_id uuid,
    p_party_b_id uuid,
    p_product_id uuid DEFAULT NULL,
    p_quantity integer DEFAULT 1,
    p_unit_price numeric,
    p_commission_rate numeric,
    p_terms_conditions text DEFAULT NULL,
    p_starts_at timestamp with time zone DEFAULT NULL,
    p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_middleman_id uuid;
    v_total_value numeric;
    v_commission_amount numeric;
    v_new_deal_id uuid;
BEGIN
    -- Get current user's middleman profile
    SELECT user_id INTO v_middleman_id
    FROM public.middleman_profiles
    WHERE user_id = auth.uid();
    
    IF v_middleman_id IS NULL THEN
        RAISE EXCEPTION 'User does not have a middleman profile';
    END IF;
    
    -- Validate commission rate
    IF p_commission_rate < 0 OR p_commission_rate > 100 THEN
        RAISE EXCEPTION 'Commission rate must be between 0 and 100';
    END IF;
    
    -- Calculate totals
    v_total_value := p_unit_price * p_quantity;
    v_commission_amount := v_total_value * (p_commission_rate / 100);
    
    -- Insert the deal
    INSERT INTO public.deals (
        middleman_id,
        deal_title,
        deal_description,
        party_a_id,
        party_b_id,
        product_id,
        quantity,
        unit_price,
        total_value,
        commission_rate,
        commission_amount,
        terms_conditions,
        starts_at,
        expires_at,
        status
    ) VALUES (
        v_middleman_id,
        p_deal_title,
        p_deal_description,
        p_party_a_id,
        p_party_b_id,
        p_product_id,
        p_quantity,
        p_unit_price,
        v_total_value,
        p_commission_rate,
        v_commission_amount,
        p_terms_conditions,
        p_starts_at,
        p_expires_at,
        'draft'
    )
    RETURNING id INTO v_new_deal_id;
    
    RETURN v_new_deal_id;
END;
$$;

-- Function 4: Get middleman dashboard stats
CREATE OR REPLACE FUNCTION public.get_middleman_dashboard_stats()
RETURNS TABLE (
    total_deals bigint,
    active_deals bigint,
    completed_deals bigint,
    total_commission numeric,
    pending_commission numeric,
    total_products integer,
    active_templates integer,
    total_views bigint,
    conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_middleman_id uuid;
BEGIN
    -- Get current user's middleman profile
    SELECT user_id INTO v_middleman_id
    FROM public.middleman_profiles
    WHERE user_id = auth.uid();
    
    IF v_middleman_id IS NULL THEN
        RAISE EXCEPTION 'User does not have a middleman profile';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT d.id) AS total_deals,
        COUNT(DISTINCT CASE WHEN d.status IN ('active', 'pending') THEN d.id END) AS active_deals,
        COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) AS completed_deals,
        COALESCE(SUM(CASE WHEN d.payment_status = 'paid' THEN d.commission_amount ELSE 0 END), 0) AS total_commission,
        COALESCE(SUM(CASE WHEN d.payment_status = 'pending' AND d.status = 'completed' THEN d.commission_amount ELSE 0 END), 0) AS pending_commission,
        (SELECT COUNT(*) FROM public.middleman_products mp WHERE mp.middleman_id = v_middleman_id AND mp.is_active = true) AS total_products,
        (SELECT active_templates FROM public.middleman_profiles WHERE user_id = v_middleman_id) AS active_templates,
        COALESCE((SELECT COUNT(*) FROM public.middleman_analytics ma WHERE ma.middleman_id = v_middleman_id AND ma.event_type = 'view'), 0) AS total_views,
        COALESCE((
            SELECT COUNT(CASE WHEN ma.event_type = 'purchase' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)
            FROM public.middleman_analytics ma
            WHERE ma.middleman_id = v_middleman_id
        ), 0) AS conversion_rate
    FROM public.deals d
    WHERE d.middleman_id = v_middleman_id;
END;
$$;

-- Function 5: Track analytics event
CREATE OR REPLACE FUNCTION public.track_middleman_analytics(
    p_event_type text,
    p_product_id uuid DEFAULT NULL,
    p_template_id uuid DEFAULT NULL,
    p_deal_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_middleman_id uuid;
BEGIN
    -- Get current user's middleman profile (for events triggered by middleman)
    SELECT user_id INTO v_middleman_id
    FROM public.middleman_profiles
    WHERE user_id = auth.uid();
    
    -- If no middleman profile, try to get from template/deal
    IF v_middleman_id IS NULL AND p_template_id IS NOT NULL THEN
        SELECT middleman_id INTO v_middleman_id
        FROM public.middleman_templates
        WHERE id = p_template_id;
    END IF;
    
    IF v_middleman_id IS NULL AND p_deal_id IS NOT NULL THEN
        SELECT middleman_id INTO v_middleman_id
        FROM public.deals
        WHERE id = p_deal_id;
    END IF;
    
    IF v_middleman_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine middleman for analytics tracking';
    END IF;
    
    -- Insert analytics event
    INSERT INTO public.middleman_analytics (
        middleman_id,
        event_type,
        product_id,
        template_id,
        deal_id,
        visitor_id,
        metadata
    ) VALUES (
        v_middleman_id,
        p_event_type,
        p_product_id,
        p_template_id,
        p_deal_id,
        auth.uid(),
        p_metadata
    );
END;
$$;

-- Function 6: Update middleman profile (for signup)
CREATE OR REPLACE FUNCTION public.update_middleman_profile(
    p_user_id uuid,
    p_full_name text,
    p_company_name text DEFAULT NULL,
    p_specialization text DEFAULT NULL,
    p_website_url text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_tax_id text DEFAULT NULL,
    p_business_license_url text DEFAULT NULL,
    p_years_of_experience integer DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_currency text DEFAULT 'USD',
    p_commission_rate numeric DEFAULT 5.00
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    -- Upsert the middleman profile
    INSERT INTO public.middleman_profiles (
        user_id,
        full_name,
        company_name,
        specialization,
        website_url,
        description,
        tax_id,
        business_license_url,
        years_of_experience,
        location,
        currency,
        commission_rate,
        is_verified,
        verification_status
    ) VALUES (
        p_user_id,
        p_full_name,
        p_company_name,
        p_specialization,
        p_website_url,
        p_description,
        p_tax_id,
        p_business_license_url,
        p_years_of_experience,
        p_location,
        p_currency,
        p_commission_rate,
        false,
        'pending'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        company_name = COALESCE(EXCLUDED.company_name, public.middleman_profiles.company_name),
        specialization = COALESCE(EXCLUDED.specialization, public.middleman_profiles.specialization),
        website_url = COALESCE(EXCLUDED.website_url, public.middleman_profiles.website_url),
        description = COALESCE(EXCLUDED.description, public.middleman_profiles.description),
        tax_id = COALESCE(EXCLUDED.tax_id, public.middleman_profiles.tax_id),
        business_license_url = COALESCE(EXCLUDED.business_license_url, public.middleman_profiles.business_license_url),
        years_of_experience = COALESCE(EXCLUDED.years_of_experience, public.middleman_profiles.years_of_experience),
        location = COALESCE(EXCLUDED.location, public.middleman_profiles.location),
        currency = COALESCE(EXCLUDED.currency, public.middleman_profiles.currency),
        commission_rate = COALESCE(EXCLUDED.commission_rate, public.middleman_profiles.commission_rate),
        updated_at = now()
    RETURNING user_id INTO v_profile_id;
    
    RETURN v_profile_id;
END;
$$;

-- =====================================================
-- PART 7: RLS POLICIES
-- =====================================================

-- Middleman Profiles Policies
DROP POLICY IF EXISTS "public_view_middleman_profiles" ON public.middleman_profiles;
CREATE POLICY "public_view_middleman_profiles" ON public.middleman_profiles
    FOR SELECT
    USING (true); -- Anyone can view middleman profiles

DROP POLICY IF EXISTS "users_insert_own_middleman_profile" ON public.middleman_profiles;
CREATE POLICY "users_insert_own_middleman_profile" ON public.middleman_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_middleman_profile" ON public.middleman_profiles;
CREATE POLICY "users_update_own_middleman_profile" ON public.middleman_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Middleman Products Policies
DROP POLICY IF EXISTS "authenticated_view_middleman_products" ON public.middleman_products;
CREATE POLICY "authenticated_view_middleman_products" ON public.middleman_products
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "middlemen_manage_own_products" ON public.middleman_products;
CREATE POLICY "middlemen_manage_own_products" ON public.middleman_products
    FOR ALL
    TO authenticated
    USING (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()))
    WITH CHECK (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()));

-- Middleman Templates Policies
DROP POLICY IF EXISTS "public_view_published_templates" ON public.middleman_templates;
CREATE POLICY "public_view_published_templates" ON public.middleman_templates
    FOR SELECT
    USING (is_published = true OR middleman_id = auth.uid());

DROP POLICY IF EXISTS "middlemen_manage_own_templates" ON public.middleman_templates;
CREATE POLICY "middlemen_manage_own_templates" ON public.middleman_templates
    FOR ALL
    TO authenticated
    USING (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()))
    WITH CHECK (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()));

-- Deals Policies
DROP POLICY IF EXISTS "parties_view_deal" ON public.deals;
CREATE POLICY "parties_view_deal" ON public.deals
    FOR SELECT
    TO authenticated
    USING (
        middleman_id = auth.uid() OR 
        party_a_id = auth.uid() OR 
        party_b_id = auth.uid()
    );

DROP POLICY IF EXISTS "middlemen_manage_own_deals" ON public.deals;
CREATE POLICY "middlemen_manage_own_deals" ON public.deals
    FOR ALL
    TO authenticated
    USING (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()))
    WITH CHECK (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()));

-- Analytics Policies
DROP POLICY IF EXISTS "middlemen_view_own_analytics" ON public.middleman_analytics;
CREATE POLICY "middlemen_view_own_analytics" ON public.middleman_analytics
    FOR SELECT
    TO authenticated
    USING (middleman_id = (SELECT user_id FROM public.middleman_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_middleman_analytics" ON public.middleman_analytics;
CREATE POLICY "insert_middleman_analytics" ON public.middleman_analytics
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow anyone to trigger analytics events

-- =====================================================
-- PART 8: TRIGGERS
-- =====================================================

-- Trigger to auto-create middleman profile on user creation
CREATE OR REPLACE FUNCTION public.handle_middleman_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.account_type = 'middleman' THEN
        INSERT INTO public.middleman_profiles (
            user_id,
            full_name,
            email
        ) VALUES (
            NEW.user_id,
            COALESCE(NEW.full_name, ''),
            NEW.email
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_user_created_make_middleman ON public.users;

CREATE TRIGGER on_user_created_make_middleman
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_middleman_signup();

-- Updated_at trigger for middleman_profiles
DROP TRIGGER IF EXISTS set_updated_at_middleman_profiles ON public.middleman_profiles;
CREATE TRIGGER set_updated_at_middleman_profiles
    BEFORE UPDATE ON public.middleman_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Updated_at trigger for middleman_products
DROP TRIGGER IF EXISTS set_updated_at_middleman_products ON public.middleman_products;
CREATE TRIGGER set_updated_at_middleman_products
    BEFORE UPDATE ON public.middleman_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Updated_at trigger for middleman_templates
DROP TRIGGER IF EXISTS set_updated_at_middleman_templates ON public.middleman_templates;
CREATE TRIGGER set_updated_at_middleman_templates
    BEFORE UPDATE ON public.middleman_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Updated_at trigger for deals
DROP TRIGGER IF EXISTS set_updated_at_deals ON public.deals;
CREATE TRIGGER set_updated_at_deals
    BEFORE UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- PART 9: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON TABLE public.middleman_profiles TO authenticated;
GRANT ALL ON TABLE public.middleman_products TO authenticated;
GRANT ALL ON TABLE public.middleman_templates TO authenticated;
GRANT ALL ON TABLE public.deals TO authenticated;
GRANT ALL ON TABLE public.middleman_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION public.middleman_select_product TO authenticated;
GRANT EXECUTE ON FUNCTION public.middleman_create_template TO authenticated;
GRANT EXECUTE ON FUNCTION public.middleman_create_deal TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_middleman_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_middleman_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_middleman_profile TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify everything is set up correctly:

-- Check if tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'middleman%';

-- Check if functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'middleman%';

-- Check if triggers exist
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name LIKE '%middleman%';

-- =====================================================
-- END OF MIDDLEMAN MODULE SCHEMA
-- =====================================================
