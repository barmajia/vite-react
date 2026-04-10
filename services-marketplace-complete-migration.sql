-- ============================================
-- Services Marketplace - Complete Migration
-- Uses existing e-commerce tables (products, sellers, categories)
-- ============================================

-- 1. Add is_featured to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Add service-specific fields to sellers table
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 0 CHECK (response_rate BETWEEN 0 AND 100);

-- 3. Create index for featured products
CREATE INDEX IF NOT EXISTS idx_products_featured_active 
ON products(is_featured, status) 
WHERE is_featured = true AND status = 'active' AND is_deleted = false;

-- 4. Create index for service products (using attributes JSONB)
CREATE INDEX IF NOT EXISTS idx_products_attributes_service 
ON products USING GIN (attributes) 
WHERE attributes->>'is_service' = 'true';

-- 5. Create view for category service counts
CREATE OR REPLACE VIEW category_service_counts AS
SELECT 
  c.id,
  c.name,
  COUNT(p.id) as service_count
FROM categories c
LEFT JOIN products p ON p.category = c.name 
  AND p.status = 'active' 
  AND p.is_deleted = false
  AND (p.attributes->>'is_service')::boolean = true
GROUP BY c.id, c.name;

-- 6. Create view for seller stats (response rate, total bookings, etc.)
CREATE OR REPLACE VIEW seller_service_stats AS
SELECT 
  s.id as seller_id,
  s.user_id,
  s.full_name,
  s.is_verified,
  s.avatar_url,
  s.bio,
  s.response_rate,
  COUNT(p.id) as total_services,
  COALESCE(AVG(p.average_rating), 0) as avg_rating,
  COALESCE(SUM(p.review_count), 0) as total_reviews
FROM sellers s
LEFT JOIN products p ON p.seller_id = s.id 
  AND p.status = 'active' 
  AND p.is_deleted = false
  AND (p.attributes->>'is_service')::boolean = true
GROUP BY s.id, s.user_id, s.full_name, s.is_verified, s.avatar_url, s.bio, s.response_rate;

-- 7. Enable Realtime for products table (for live service updates)
-- Note: This assumes realtime is already enabled for public schema
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  products, 
  sellers, 
  categories,
  orders,
  reviews;

-- 8. Add comments for documentation
COMMENT ON COLUMN products.attributes IS 'JSONB for extended fields. For services use: {
  "is_service": true,
  "price_type": "fixed" | "hourly" | "project",
  "delivery_time": "3 days",
  "revisions": 2,
  "deliverables": ["source code", "documentation"],
  "requirements": ["project details", "timeline"]
}';

-- 9. Create function to get service products only
CREATE OR REPLACE FUNCTION get_service_products()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  images JSONB,
  average_rating NUMERIC,
  review_count INTEGER,
  is_featured BOOLEAN,
  category TEXT,
  seller_id UUID,
  created_at TIMESTAMPTZ,
  attributes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.currency,
    p.images,
    p.average_rating,
    p.review_count,
    p.is_featured,
    p.category,
    p.seller_id,
    p.created_at,
    p.attributes
  FROM products p
  WHERE p.status = 'active'
    AND p.is_deleted = false
    AND (p.attributes->>'is_service')::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- 10. Seed sample service categories (if they don't exist)
INSERT INTO categories (name, parent_id) VALUES
  ('Programming & Tech', NULL),
  ('Design & Creative', NULL),
  ('Digital Marketing', NULL),
  ('Writing & Translation', NULL),
  ('Business & Consulting', NULL),
  ('Health & Wellness', NULL)
ON CONFLICT DO NOTHING;

-- 11. Grant necessary permissions
GRANT SELECT ON category_service_counts TO authenticated, anon;
GRANT SELECT ON seller_service_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_service_products() TO authenticated, anon;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert a sample service product
-- Uncomment and update seller_id with a valid UUID from your sellers table
/*
INSERT INTO products (
  seller_id,
  title,
  description,
  brand,
  price,
  currency,
  category,
  images,
  attributes,
  status,
  is_featured,
  average_rating,
  review_count
) VALUES (
  (SELECT id FROM sellers LIMIT 1), -- Replace with actual seller UUID
  'Professional Web Development Consultation',
  'Get expert advice on your web development project. I''ll help you with architecture, technology choices, and best practices.',
  'Tech Consulting',
  75.00,
  'USD',
  'Programming & Tech',
  '[{"url": "https://via.placeholder.com/800x600", "alt": "Web Development"}]'::jsonb,
  '{
    "is_service": true,
    "price_type": "hourly",
    "delivery_time": "2 days",
    "revisions": 2,
    "deliverables": ["Consultation call", "Written summary", "Action plan"],
    "requirements": ["Project details", "Current tech stack", "Goals and timeline"]
  }'::jsonb,
  'active',
  true,
  5.0,
  12
);
*/

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
/*
-- To rollback these changes:
DROP VIEW IF EXISTS category_service_counts CASCADE;
DROP VIEW IF EXISTS seller_service_stats CASCADE;
DROP FUNCTION IF EXISTS get_service_products() CASCADE;
DROP PUBLICATION IF EXISTS supabase_realtime;

ALTER TABLE products DROP COLUMN IF EXISTS is_featured;
ALTER TABLE sellers DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE sellers DROP COLUMN IF EXISTS bio;
ALTER TABLE sellers DROP COLUMN IF EXISTS response_rate;

DROP INDEX IF EXISTS idx_products_featured_active;
DROP INDEX IF EXISTS idx_products_attributes_service;
*/
