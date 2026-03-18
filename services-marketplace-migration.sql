-- Services Marketplace Migration for Aurora E-commerce
-- Run this in Supabase SQL Editor to create the services marketplace tables
-- Date: March 16, 2026

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
CREATE INDEX IF NOT EXISTS idx_svc_listings_slug ON public.svc_listings(slug);
CREATE INDEX IF NOT EXISTS idx_svc_listings_active ON public.svc_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_svc_portfolio_provider ON public.svc_portfolio(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_reviews_provider ON public.svc_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_reviews_listing ON public.svc_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_svc_orders_provider ON public.svc_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_orders_customer ON public.svc_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_svc_orders_status ON public.svc_orders(status);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_svc_categories_updated_at
    BEFORE UPDATE ON public.svc_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_subcategories_updated_at
    BEFORE UPDATE ON public.svc_subcategories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_providers_updated_at
    BEFORE UPDATE ON public.svc_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_listings_updated_at
    BEFORE UPDATE ON public.svc_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_reviews_updated_at
    BEFORE UPDATE ON public.svc_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_svc_orders_updated_at
    BEFORE UPDATE ON public.svc_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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

-- Categories & Subcategories: Public read access for active ones
CREATE POLICY "categories_public_view" ON public.svc_categories
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "subcategories_public_view" ON public.svc_subcategories
    FOR SELECT
    USING (is_active = true);

-- Providers: Public read access for active providers
CREATE POLICY "providers_public_view" ON public.svc_providers
    FOR SELECT
    USING (status = 'active');

-- Listings: Public read access for active listings
CREATE POLICY "listings_public_view" ON public.svc_listings
    FOR SELECT
    USING (is_active = true);

-- Portfolio: Public read access
CREATE POLICY "portfolio_public_view" ON public.svc_portfolio
    FOR SELECT
    USING (true);

-- Reviews: Public read access for approved reviews
CREATE POLICY "reviews_public_view" ON public.svc_reviews
    FOR SELECT
    USING (is_approved = true);

-- Providers: Users can update their own provider profile
CREATE POLICY "providers_update_own" ON public.svc_providers
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "providers_insert_own" ON public.svc_providers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Listings: Providers can manage their own listings
CREATE POLICY "listings_manage_own" ON public.svc_listings
    FOR ALL
    USING (
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

-- Portfolio: Providers can manage their own portfolio
CREATE POLICY "portfolio_manage_own" ON public.svc_portfolio
    FOR ALL
    USING (
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

-- Reviews: Users can create their own reviews
CREATE POLICY "reviews_insert_own" ON public.svc_reviews
    FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Orders: Users can view their own orders
CREATE POLICY "orders_view_own" ON public.svc_orders
    FOR SELECT
    USING (
        customer_id = auth.uid() OR 
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "orders_insert_own" ON public.svc_orders
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "orders_update_own" ON public.svc_orders
    FOR UPDATE
    USING (
        customer_id = auth.uid() OR 
        provider_id IN (
            SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- SEED DATA - Service Categories
-- =============================================

INSERT INTO public.svc_categories (name, slug, description, icon, is_active, sort_order) VALUES
('Home Services', 'home-services', 'Professional home maintenance and repair services', 'home', true, 1),
('Tutoring & Education', 'tutoring-education', 'Learn new skills with expert tutors', 'book', true, 2),
('Beauty & Wellness', 'beauty-wellness', 'Look and feel your best', 'sparkles', true, 3),
('Photography & Video', 'photography-video', 'Capture life''s precious moments', 'camera', true, 4),
('Event Planning', 'event-planning', 'Make your events unforgettable', 'calendar', true, 5),
('Tech Support', 'tech-support', 'Expert IT and tech assistance', 'cpu', true, 6),
('Cleaning Services', 'cleaning-services', 'Professional cleaning for home and office', 'shine', true, 7),
('Pet Services', 'pet-services', 'Care for your furry friends', 'heart', true, 8),
('Fitness & Training', 'fitness-training', 'Achieve your fitness goals', 'activity', true, 9),
('Legal & Financial', 'legal-financial', 'Professional advice you can trust', 'scale', true, 10),
('Graphic Design', 'graphic-design', 'Creative design services', 'palette', true, 11),
('Writing & Translation', 'writing-translation', 'Words that make a difference', 'edit', true, 12),
('Music & Audio', 'music-audio', 'Sound and music professionals', 'music', true, 13),
('Healthcare', 'healthcare', 'Medical and health services', 'pulse', true, 14),
('Automotive', 'automotive', 'Car maintenance and repair', 'tool', true, 15)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA - Service Subcategories
-- =============================================

INSERT INTO public.svc_subcategories (category_id, name, slug, description, is_active, sort_order) VALUES
((SELECT id FROM svc_categories WHERE slug = 'home-services'), 'Plumbing', 'plumbing', 'Professional plumbing services', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'home-services'), 'Electrical', 'electrical', 'Licensed electricians', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'home-services'), 'HVAC', 'hvac', 'Heating and cooling services', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'home-services'), 'Carpentry', 'carpentry', 'Custom woodwork and repairs', true, 4),
((SELECT id FROM svc_categories WHERE slug = 'home-services'), 'Painting', 'painting', 'Interior and exterior painting', true, 5),
((SELECT id FROM svc_categories WHERE slug = 'tutoring-education'), 'Math Tutoring', 'math-tutoring', 'From basic math to calculus', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'tutoring-education'), 'Language Learning', 'language-learning', 'Learn new languages', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'tutoring-education'), 'Music Lessons', 'music-lessons', 'Learn to play instruments', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'tutoring-education'), 'Test Prep', 'test-prep', 'SAT, ACT, and exam preparation', true, 4),
((SELECT id FROM svc_categories WHERE slug = 'beauty-wellness'), 'Hair Styling', 'hair-styling', 'Professional haircuts and styling', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'beauty-wellness'), 'Makeup', 'makeup', 'Professional makeup services', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'beauty-wellness'), 'Massage', 'massage', 'Relaxing massage therapy', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'beauty-wellness'), 'Nail Care', 'nail-care', 'Manicures and pedicures', true, 4),
((SELECT id FROM svc_categories WHERE slug = 'photography-video'), 'Portrait Photography', 'portrait-photography', 'Professional portraits', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'photography-video'), 'Event Photography', 'event-photography', 'Weddings and events', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'photography-video'), 'Videography', 'videography', 'Professional video services', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'photography-video'), 'Photo Editing', 'photo-editing', 'Photo retouching and editing', true, 4),
((SELECT id FROM svc_categories WHERE slug = 'tech-support'), 'Computer Repair', 'computer-repair', 'PC and laptop repairs', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'tech-support'), 'Phone Repair', 'phone-repair', 'Smartphone repairs', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'tech-support'), 'Software Help', 'software-help', 'Software installation and support', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'tech-support'), 'Network Setup', 'network-setup', 'Home and office networking', true, 4),
((SELECT id FROM svc_categories WHERE slug = 'cleaning-services'), 'House Cleaning', 'house-cleaning', 'Regular home cleaning', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'cleaning-services'), 'Deep Cleaning', 'deep-cleaning', 'Thorough deep cleaning', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'cleaning-services'), 'Office Cleaning', 'office-cleaning', 'Commercial cleaning', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'cleaning-services'), 'Carpet Cleaning', 'carpet-cleaning', 'Professional carpet care', true, 4),
((SELECT id FROM svc_categories WHERE slug = 'fitness-training'), 'Personal Training', 'personal-training', 'One-on-one fitness training', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'fitness-training'), 'Yoga Instruction', 'yoga-instruction', 'Yoga classes and private sessions', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'fitness-training'), 'Nutrition Coaching', 'nutrition-coaching', 'Diet and nutrition advice', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'graphic-design'), 'Logo Design', 'logo-design', 'Custom logo creation', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'graphic-design'), 'Web Design', 'web-design', 'Website design services', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'graphic-design'), 'Print Design', 'print-design', 'Brochures, flyers, and more', true, 3),
((SELECT id FROM svc_categories WHERE slug = 'writing-translation'), 'Content Writing', 'content-writing', 'Blog posts and articles', true, 1),
((SELECT id FROM svc_categories WHERE slug = 'writing-translation'), 'Copywriting', 'copywriting', 'Marketing and sales copy', true, 2),
((SELECT id FROM svc_categories WHERE slug = 'writing-translation'), 'Translation', 'translation', 'Professional translation services', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify tables were created
SELECT 
    'Services Marketplace Migration Complete' as status,
    (SELECT COUNT(*) FROM svc_categories) as categories_count,
    (SELECT COUNT(*) FROM svc_subcategories) as subcategories_count,
    (SELECT COUNT(*) FROM svc_providers) as providers_count,
    (SELECT COUNT(*) FROM svc_listings) as listings_count;
