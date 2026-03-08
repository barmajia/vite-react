-- Update categories table (safe to run if table exists)

-- Add indexes if they don't exist (will skip if already present)
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Enable RLS if not already enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Categories are publicly viewable" ON public.categories;
CREATE POLICY "Categories are publicly viewable"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Insert seed data (will skip duplicates due to UNIQUE constraint)
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Electronics', 'electronics', 'Phones, laptops, gadgets, and more', 1),
  ('Fashion', 'fashion', 'Clothing, shoes, accessories', 2),
  ('Home & Garden', 'home-garden', 'Furniture, decor, tools', 3),
  ('Sports & Outdoors', 'sports-outdoors', 'Fitness, outdoor, team sports', 4),
  ('Books', 'books', 'Fiction, non-fiction, textbooks', 5),
  ('Toys & Games', 'toys-games', 'Kids toys, board games, puzzles', 6)
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT id, name, slug, is_active FROM categories ORDER BY display_order;
