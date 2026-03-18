-- Services Marketplace Schema for Aurora E-commerce
-- This schema creates tables for freelancers and service providers

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SERVICE CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE SUBCATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_subcategories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.svc_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE PROVIDERS (Freelancers, Companies, Hospitals)
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_name VARCHAR(200) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('individual', 'company', 'hospital')),
    tagline VARCHAR(200),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(200),
    website VARCHAR(200),
    specialties TEXT[], -- Array of skills/specialties
    average_rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE LISTINGS (Individual services offered by providers)
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.svc_providers(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES public.svc_subcategories(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price_type VARCHAR(50) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'monthly')),
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    delivery_days INTEGER, -- Number of days to complete
    images TEXT[], -- Array of image URLs
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE PORTFOLIO (Provider's past work)
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_portfolio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.svc_providers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    images TEXT[], -- Array of image URLs
    project_url VARCHAR(200), -- External link to project
    completed_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.svc_providers(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.svc_listings(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, reviewer_id, listing_id)
);

-- =============================================
-- SERVICE ORDERS (Bookings)
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.svc_listings(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.svc_providers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
    total_amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    requirements TEXT, -- Customer requirements
    delivery_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_svc_categories_slug ON public.svc_categories(slug);
CREATE INDEX idx_svc_categories_active ON public.svc_categories(is_active);
CREATE INDEX idx_svc_subcategories_category ON public.svc_subcategories(category_id);
CREATE INDEX idx_svc_subcategories_slug ON public.svc_subcategories(slug);
CREATE INDEX idx_svc_providers_user ON public.svc_providers(user_id);
CREATE INDEX idx_svc_providers_type ON public.svc_providers(provider_type);
CREATE INDEX idx_svc_providers_status ON public.svc_providers(status);
CREATE INDEX idx_svc_providers_verified ON public.svc_providers(is_verified);
CREATE INDEX idx_svc_providers_rating ON public.svc_providers(average_rating DESC);
CREATE INDEX idx_svc_listings_provider ON public.svc_listings(provider_id);
CREATE INDEX idx_svc_listings_subcategory ON public.svc_listings(subcategory_id);
CREATE INDEX idx_svc_listings_slug ON public.svc_listings(slug);
CREATE INDEX idx_svc_listings_active ON public.svc_listings(is_active);
CREATE INDEX idx_svc_portfolio_provider ON public.svc_portfolio(provider_id);
CREATE INDEX idx_svc_reviews_provider ON public.svc_reviews(provider_id);
CREATE INDEX idx_svc_reviews_listing ON public.svc_reviews(listing_id);
CREATE INDEX idx_svc_orders_provider ON public.svc_orders(provider_id);
CREATE INDEX idx_svc_orders_customer ON public.svc_orders(customer_id);
CREATE INDEX idx_svc_orders_status ON public.svc_orders(status);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_svc_categories_updated_at
    BEFORE UPDATE ON public.svc_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_subcategories_updated_at
    BEFORE UPDATE ON public.svc_subcategories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_providers_updated_at
    BEFORE UPDATE ON public.svc_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_listings_updated_at
    BEFORE UPDATE ON public.svc_listings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_reviews_updated_at
    BEFORE UPDATE ON public.svc_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_orders_updated_at
    BEFORE UPDATE ON public.svc_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.svc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_orders ENABLE ROW LEVEL SECURITY;

-- Categories & Subcategories: Publicly viewable (active only)
CREATE POLICY "categories_public_view" ON public.svc_categories
    FOR SELECT TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "subcategories_public_view" ON public.svc_subcategories
    FOR SELECT TO authenticated, anon
    USING (is_active = true);

-- Providers: Publicly viewable (active status)
CREATE POLICY "providers_public_view" ON public.svc_providers
    FOR SELECT TO authenticated, anon
    USING (status = 'active');

-- Providers: Users can update their own provider profile
CREATE POLICY "providers_update_own" ON public.svc_providers
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Providers: Users can insert their own provider profile
CREATE POLICY "providers_insert_own" ON public.svc_providers
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Listings: Publicly viewable (active only)
CREATE POLICY "listings_public_view" ON public.svc_listings
    FOR SELECT TO authenticated, anon
    USING (is_active = true);

-- Listings: Providers can manage their own listings
CREATE POLICY "listings_manage_own" ON public.svc_listings
    FOR ALL TO authenticated
    USING (provider_id IN (
        SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
    ));

-- Portfolio: Publicly viewable
CREATE POLICY "portfolio_public_view" ON public.svc_portfolio
    FOR SELECT TO authenticated, anon
    USING (TRUE);

-- Portfolio: Providers can manage their own portfolio
CREATE POLICY "portfolio_manage_own" ON public.svc_portfolio
    FOR ALL TO authenticated
    USING (provider_id IN (
        SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
    ));

-- Reviews: Publicly viewable (approved only)
CREATE POLICY "reviews_public_view" ON public.svc_reviews
    FOR SELECT TO authenticated, anon
    USING (is_approved = true);

-- Reviews: Users can create their own reviews
CREATE POLICY "reviews_insert_own" ON public.svc_reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

-- Reviews: Users can update their own reviews
CREATE POLICY "reviews_update_own" ON public.svc_reviews
    FOR UPDATE TO authenticated
    USING (reviewer_id = auth.uid());

-- Orders: Users can view their own orders
CREATE POLICY "orders_view_own" ON public.svc_orders
    FOR SELECT TO authenticated
    USING (customer_id = auth.uid() OR provider_id IN (
        SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
    ));

-- Orders: Customers can create orders
CREATE POLICY "orders_insert_customer" ON public.svc_orders
    FOR INSERT TO authenticated
    WITH CHECK (customer_id = auth.uid());

-- Orders: Providers can update their orders
CREATE POLICY "orders_update_provider" ON public.svc_orders
    FOR UPDATE TO authenticated
    USING (provider_id IN (
        SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
    ));

-- =============================================
-- SEED DATA: Categories
-- =============================================
INSERT INTO public.svc_categories (name, slug, description, icon, sort_order) VALUES
('Programming & Tech', 'programming', 'Software development, web design, and IT services', 'Code', 1),
('Design & Creative', 'design', 'Graphic design, video editing, and creative services', 'PenTool', 2),
('Healthcare & Medical', 'healthcare', 'Medical consultations, therapy, and health services', 'Heart', 3),
('Business & Finance', 'business', 'Consulting, accounting, and business services', 'Briefcase', 4),
('Home Services', 'home', 'Plumbing, electrical, cleaning, and home maintenance', 'Home', 5),
('Education & Training', 'education', 'Tutoring, courses, and educational services', 'GraduationCap', 6),
('Writing & Translation', 'writing', 'Content writing, copywriting, and translation', 'FileText', 7),
('Marketing & SEO', 'marketing', 'Digital marketing, social media, and SEO', 'TrendingUp', 8)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: Subcategories (Programming & Tech example)
-- =============================================
INSERT INTO public.svc_subcategories (category_id, name, slug, sort_order)
SELECT 
    (SELECT id FROM public.svc_categories WHERE slug = 'programming'),
    name, slug, sort_order
FROM (VALUES
    ('Web Development', 'web-development', 1),
    ('Mobile App Development', 'mobile-app-development', 2),
    ('Desktop Applications', 'desktop-applications', 3),
    ('Database Administration', 'database-admin', 4),
    ('DevOps & Cloud', 'devops-cloud', 5),
    ('Cybersecurity', 'cybersecurity', 6),
    ('AI & Machine Learning', 'ai-ml', 7),
    ('Blockchain', 'blockchain', 8)
) AS subcats(name, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Grant permissions
-- =============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- Completion message
-- =============================================
DO $$
BEGIN
    RAISE NOTICE 'Services Marketplace Schema created successfully!';
    RAISE NOTICE 'Tables created: svc_categories, svc_subcategories, svc_providers, svc_listings, svc_portfolio, svc_reviews, svc_orders';
    RAISE NOTICE 'RLS policies enabled and configured';
    RAISE NOTICE 'Seed data inserted: 8 categories, 8 programming subcategories';
END $$;
