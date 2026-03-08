-- ============================================
-- Aurora E-commerce: Categories Table Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add missing columns
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Step 2: Add foreign key constraint
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);

-- Step 3: Add unique constraint on slug
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Step 5: Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy for public read access
DROP POLICY IF EXISTS "Categories are publicly viewable" ON public.categories;
CREATE POLICY "Categories are publicly viewable" ON public.categories FOR SELECT USING (is_active = true);

-- Step 7: Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Generate slugs for existing categories (if any)
UPDATE public.categories 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(name), '\s+', '-', 'g'), '[^a-z0-9-]', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- Step 10: Insert seed data
INSERT INTO categories (name, slug, description, display_order, is_active) VALUES
  ('Electronics', 'electronics', 'Phones, laptops, gadgets, and more', 1, true),
  ('Fashion', 'fashion', 'Clothing, shoes, accessories', 2, true),
  ('Home & Garden', 'home-garden', 'Furniture, decor, tools', 3, true),
  ('Sports & Outdoors', 'sports-outdoors', 'Fitness, outdoor, team sports', 4, true),
  ('Books', 'books', 'Fiction, non-fiction, textbooks', 5, true),
  ('Toys & Games', 'toys-games', 'Kids toys, board games, puzzles', 6, true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Step 11: Verify results
SELECT 'Table Structure' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

SELECT 'Categories Data' AS info;
SELECT id, name, slug, display_order, is_active 
FROM categories 
ORDER BY display_order;
