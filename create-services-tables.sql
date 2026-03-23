-- Services Marketplace Schema for Aurora E-commerce
-- Run this in Supabase SQL Editor to create missing services tables
-- This fixes the 400 Bad Request errors for svc_* tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SERVICE CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
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
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
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
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('individual', 'company', 'hospital', 'client')),
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
    specialties TEXT[],
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
    delivery_days INTEGER,
    images TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE PORTFOLIO
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_portfolio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.svc_providers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    images TEXT[],
    project_url VARCHAR(200),
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
    requirements TEXT,
    delivery_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_svc_categories_slug ON public.svc_categories(slug);
CREATE INDEX IF NOT EXISTS idx_svc_categories_active ON public.svc_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_svc_subcategories_category ON public.svc_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_svc_subcategories_slug ON public.svc_subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_svc_providers_user ON public.svc_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_svc_providers_type ON public.svc_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_svc_providers_status ON public.svc_providers(status);
CREATE INDEX IF NOT EXISTS idx_svc_providers_verified ON public.svc_providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_svc_providers_rating ON public.svc_providers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_svc_listings_provider ON public.svc_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_listings_subcategory ON public.svc_listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_svc_listings_active ON public.svc_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_svc_reviews_provider ON public.svc_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_orders_provider ON public.svc_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_orders_customer ON public.svc_orders(customer_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE public.svc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_orders ENABLE ROW LEVEL SECURITY;

-- Categories & Subcategories: Public read access
CREATE POLICY "Categories are publicly viewable" ON public.svc_categories
    FOR SELECT USING (true);

CREATE POLICY "Subcategories are publicly viewable" ON public.svc_subcategories
    FOR SELECT USING (true);

-- Providers: Public read, owner update/delete
CREATE POLICY "Providers are publicly viewable" ON public.svc_providers
    FOR SELECT USING (true);

CREATE POLICY "Providers can update own profile" ON public.svc_providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can delete own profile" ON public.svc_providers
    FOR DELETE USING (auth.uid() = user_id);

-- Listings: Public read for active, owner can manage all
CREATE POLICY "Active listings are publicly viewable" ON public.svc_listings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage own listings" ON public.svc_listings
    FOR ALL USING (
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

-- Portfolio: Public read, owner can manage
CREATE POLICY "Portfolio is publicly viewable" ON public.svc_portfolio
    FOR SELECT USING (true);

CREATE POLICY "Providers can manage own portfolio" ON public.svc_portfolio
    FOR ALL USING (
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

-- Reviews: Public read for approved, users can create own
CREATE POLICY "Approved reviews are publicly viewable" ON public.svc_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create reviews" ON public.svc_reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Orders: Participants can view
CREATE POLICY "Order participants can view" ON public.svc_orders
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create orders" ON public.svc_orders
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- =============================================
-- SEED DATA - Sample Categories
-- =============================================
INSERT INTO public.svc_categories (name, slug, description, icon, is_active) VALUES
    ('Programming & Tech', 'programming', 'Software development, web design, and IT services', '💻', true),
    ('Design & Creative', 'design', 'Graphic design, video editing, and creative services', '🎨', true),
    ('Healthcare & Medical', 'healthcare', 'Medical consultations and health services', '🏥', true),
    ('Business & Consulting', 'business', 'Business consulting and professional services', '💼', true),
    ('Writing & Translation', 'writing', 'Content writing, copywriting, and translation', '✍️', true),
    ('Marketing & Sales', 'marketing', 'Digital marketing, SEO, and sales services', '📈', true),
    ('Education & Training', 'education', 'Online tutoring and training services', '📚', true),
    ('Legal Services', 'legal', 'Legal advice and consultation', '⚖️', true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify tables were created successfully
SELECT 
    'svc_categories' as table_name, 
    COUNT(*) as row_count 
FROM public.svc_categories
UNION ALL
SELECT 'svc_subcategories', COUNT(*) FROM public.svc_subcategories
UNION ALL
SELECT 'svc_providers', COUNT(*) FROM public.svc_providers
UNION ALL
SELECT 'svc_listings', COUNT(*) FROM public.svc_listings
UNION ALL
SELECT 'svc_portfolio', COUNT(*) FROM public.svc_portfolio
UNION ALL
SELECT 'svc_reviews', COUNT(*) FROM public.svc_reviews
UNION ALL
SELECT 'svc_orders', COUNT(*) FROM public.svc_orders;
