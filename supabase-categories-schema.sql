-- Aurora E-commerce: Categories Table Schema
-- Run this in your Supabase SQL Editor to create the categories table

-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES public.categories(id),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Categories are publicly viewable (only active ones)
CREATE POLICY "Categories are publicly viewable"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Optional: Admin policy for managing categories (uncomment and customize for admin functionality)
-- CREATE POLICY "Admins can manage categories"
--   ON public.categories FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin')
--   WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed example data
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Electronics', 'electronics', 'Phones, laptops, gadgets, and more', 1),
  ('Fashion', 'fashion', 'Clothing, shoes, accessories', 2),
  ('Home & Garden', 'home-garden', 'Furniture, decor, tools', 3),
  ('Sports & Outdoors', 'sports-outdoors', 'Fitness, outdoor, team sports', 4),
  ('Books', 'books', 'Fiction, non-fiction, textbooks', 5),
  ('Toys & Games', 'toys-games', 'Kids toys, board games, puzzles', 6);

-- Verify the data
SELECT * FROM categories ORDER BY display_order;
