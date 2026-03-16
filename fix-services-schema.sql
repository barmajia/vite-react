-- Fix Services Marketplace Schema
-- This adds missing columns to existing svc_categories and svc_subcategories tables
-- Run this in Supabase SQL Editor

-- =============================================
-- FIX SVC_CATEGORIES TABLE
-- =============================================

-- Add sort_order column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_categories' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.svc_categories ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to svc_categories';
    END IF;
END $$;

-- Add icon column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_categories' 
        AND column_name = 'icon'
    ) THEN
        ALTER TABLE public.svc_categories ADD COLUMN icon VARCHAR(50);
        RAISE NOTICE 'Added icon column to svc_categories';
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_categories' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.svc_categories ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to svc_categories';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_categories' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.svc_categories ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to svc_categories';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_categories' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.svc_categories ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to svc_categories';
    END IF;
END $$;

-- Create index for sort_order
CREATE INDEX IF NOT EXISTS idx_svc_categories_sort_order ON public.svc_categories(sort_order);

-- =============================================
-- FIX SVC_SUBCATEGORIES TABLE
-- =============================================

-- Add sort_order column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_subcategories' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.svc_subcategories ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to svc_subcategories';
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_subcategories' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.svc_subcategories ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to svc_subcategories';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_subcategories' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.svc_subcategories ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to svc_subcategories';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_subcategories' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.svc_subcategories ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to svc_subcategories';
    END IF;
END $$;

-- Create index for sort_order
CREATE INDEX IF NOT EXISTS idx_svc_subcategories_sort_order ON public.svc_subcategories(sort_order);

-- =============================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- =============================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_svc_categories_updated_at ON public.svc_categories;
CREATE TRIGGER update_svc_categories_updated_at
    BEFORE UPDATE ON public.svc_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_svc_subcategories_updated_at ON public.svc_subcategories;
CREATE TRIGGER update_svc_subcategories_updated_at
    BEFORE UPDATE ON public.svc_subcategories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert categories if table is empty
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
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- Insert subcategories if table is empty
INSERT INTO public.svc_subcategories (category_id, name, slug, description, is_active, sort_order) 
SELECT 
    c.id as category_id,
    sub.name,
    sub.slug,
    sub.description,
    true as is_active,
    sub.sort_order
FROM (
    VALUES
    ('home-services', 'Plumbing', 'plumbing', 'Professional plumbing services', 1),
    ('home-services', 'Electrical', 'electrical', 'Licensed electricians', 2),
    ('home-services', 'HVAC', 'hvac', 'Heating and cooling services', 3),
    ('home-services', 'Carpentry', 'carpentry', 'Custom woodwork and repairs', 4),
    ('home-services', 'Painting', 'painting', 'Interior and exterior painting', 5),
    ('tutoring-education', 'Math Tutoring', 'math-tutoring', 'From basic math to calculus', 1),
    ('tutoring-education', 'Language Learning', 'language-learning', 'Learn new languages', 2),
    ('tutoring-education', 'Music Lessons', 'music-lessons', 'Learn to play instruments', 3),
    ('tutoring-education', 'Test Prep', 'test-prep', 'SAT, ACT, and exam preparation', 4),
    ('beauty-wellness', 'Hair Styling', 'hair-styling', 'Professional haircuts and styling', 1),
    ('beauty-wellness', 'Makeup', 'makeup', 'Professional makeup services', 2),
    ('beauty-wellness', 'Massage', 'massage', 'Relaxing massage therapy', 3),
    ('beauty-wellness', 'Nail Care', 'nail-care', 'Manicures and pedicures', 4),
    ('photography-video', 'Portrait Photography', 'portrait-photography', 'Professional portraits', 1),
    ('photography-video', 'Event Photography', 'event-photography', 'Weddings and events', 2),
    ('photography-video', 'Videography', 'videography', 'Professional video services', 3),
    ('photography-video', 'Photo Editing', 'photo-editing', 'Photo retouching and editing', 4),
    ('tech-support', 'Computer Repair', 'computer-repair', 'PC and laptop repairs', 1),
    ('tech-support', 'Phone Repair', 'phone-repair', 'Smartphone repairs', 2),
    ('tech-support', 'Software Help', 'software-help', 'Software installation and support', 3),
    ('tech-support', 'Network Setup', 'network-setup', 'Home and office networking', 4),
    ('cleaning-services', 'House Cleaning', 'house-cleaning', 'Regular home cleaning', 1),
    ('cleaning-services', 'Deep Cleaning', 'deep-cleaning', 'Thorough deep cleaning', 2),
    ('cleaning-services', 'Office Cleaning', 'office-cleaning', 'Commercial cleaning', 3),
    ('cleaning-services', 'Carpet Cleaning', 'carpet-cleaning', 'Professional carpet care', 4),
    ('fitness-training', 'Personal Training', 'personal-training', 'One-on-one fitness training', 1),
    ('fitness-training', 'Yoga Instruction', 'yoga-instruction', 'Yoga classes and private sessions', 2),
    ('fitness-training', 'Nutrition Coaching', 'nutrition-coaching', 'Diet and nutrition advice', 3),
    ('graphic-design', 'Logo Design', 'logo-design', 'Custom logo creation', 1),
    ('graphic-design', 'Web Design', 'web-design', 'Website design services', 2),
    ('graphic-design', 'Print Design', 'print-design', 'Brochures, flyers, and more', 3),
    ('writing-translation', 'Content Writing', 'content-writing', 'Blog posts and articles', 1),
    ('writing-translation', 'Copywriting', 'copywriting', 'Marketing and sales copy', 2),
    ('writing-translation', 'Translation', 'translation', 'Professional translation services', 3)
) AS sub(category_slug, name, slug, description, sort_order)
JOIN public.svc_categories c ON c.slug = sub.category_slug
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify the fix
SELECT 
    'Services Schema Fix Complete' as status,
    (SELECT COUNT(*) FROM svc_categories) as categories_count,
    (SELECT COUNT(*) FROM svc_subcategories) as subcategories_count;

-- Show all categories
SELECT id, name, slug, icon, is_active, sort_order 
FROM svc_categories 
ORDER BY sort_order;

-- Show all subcategories
SELECT id, category_id, name, slug, is_active, sort_order 
FROM svc_subcategories 
ORDER BY sort_order;
