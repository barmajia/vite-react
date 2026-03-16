-- Services Marketplace - Simple Schema Migration
-- Run this in Supabase SQL Editor to enable the Services vertical
-- Date: March 16, 2026

-- =============================================
-- SERVICE CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE LISTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_slug TEXT REFERENCES public.service_categories(slug),
  price_numeric NUMERIC(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_listings_provider ON public.service_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_category ON public.service_listings(category_slug);
CREATE INDEX IF NOT EXISTS idx_service_listings_slug ON public.service_listings(slug);
CREATE INDEX IF NOT EXISTS idx_service_listings_created ON public.service_listings(created_at DESC);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_listings_updated_at
    BEFORE UPDATE ON public.service_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access
CREATE POLICY "service_categories_public_view" ON public.service_categories
    FOR SELECT
    USING (true);

-- Listings: Public read access
CREATE POLICY "service_listings_public_view" ON public.service_listings
    FOR SELECT
    USING (true);

-- Listings: Users can insert their own listings
CREATE POLICY "service_listings_insert_own" ON public.service_listings
    FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

-- Listings: Users can update their own listings
CREATE POLICY "service_listings_update_own" ON public.service_listings
    FOR UPDATE
    USING (auth.uid() = provider_id);

-- Listings: Users can delete their own listings
CREATE POLICY "service_listings_delete_own" ON public.service_listings
    FOR DELETE
    USING (auth.uid() = provider_id);

-- =============================================
-- SEED DATA - Service Categories
-- =============================================

INSERT INTO public.service_categories (slug, name) VALUES
('programming', 'Programming & Tech'),
('design', 'Graphic Design'),
('writing', 'Writing & Translation'),
('video', 'Video & Animation'),
('business', 'Business & Consulting'),
('lifestyle', 'Lifestyle & Wellness'),
('marketing', 'Digital Marketing'),
('music', 'Music & Audio'),
('photography', 'Photography'),
('education', 'Education & Tutoring'),
('healthcare', 'Healthcare Services'),
('home-services', 'Home Services')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 
    'Services Marketplace Setup Complete' as status,
    (SELECT COUNT(*) FROM service_categories) as categories_count,
    (SELECT COUNT(*) FROM service_listings) as listings_count;
