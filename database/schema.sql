-- ============================================
-- MULTI-VENDOR E-COMMERCE DATABASE SCHEMA
-- Supabase (PostgreSQL) with Row Level Security
-- ============================================

-- 1. SELLERS TABLE
-- Extends auth.users with seller-specific data
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'pro', 'enterprise')),
  current_template_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  store_status TEXT DEFAULT 'active' CHECK (store_status IN ('active', 'suspended', 'closed'))
);

-- Index for faster lookups
CREATE INDEX idx_sellers_slug ON sellers(store_slug);
CREATE INDEX idx_sellers_template ON sellers(current_template_id);

-- 2. TEMPLATES TABLE
-- Stores available storefront templates
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Predefined JSON configuration for the template
  default_config JSONB NOT NULL DEFAULT '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#6B7280",
      "background": "#FFFFFF",
      "text": "#111827",
      "accent": "#F59E0B"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "layout": {
      "header_style": "default",
      "product_grid": "3-column",
      "footer_style": "standard"
    },
    "sections": {
      "hero": {
        "enabled": true,
        "title": "Welcome to Our Store",
        "subtitle": "Discover amazing products",
        "cta_text": "Shop Now",
        "background_image": null
      },
      "featured_products": {
        "enabled": true,
        "title": "Featured Products",
        "max_items": 8
      },
      "testimonials": {
        "enabled": false,
        "title": "What Our Customers Say"
      }
    }
  }'::jsonb
);

-- 3. STORE_CONFIGS TABLE
-- Seller-specific customizations to their chosen template
CREATE TABLE IF NOT EXISTS store_configs (
  id SERIAL PRIMARY KEY,
  seller_id UUID UNIQUE REFERENCES sellers(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES templates(id),
  custom_config JSONB NOT NULL DEFAULT '{}',
  -- Merged config (template defaults + customizations)
  merged_config JSONB NOT NULL DEFAULT '{}',
  logo_url TEXT,
  banner_image_url TEXT,
  favicon_url TEXT,
  custom_domain TEXT,
  seo_title TEXT,
  seo_description TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_store_configs_seller ON store_configs(seller_id);
CREATE INDEX idx_store_configs_template ON store_configs(template_id);
CREATE INDEX idx_store_configs_domain ON store_configs(custom_domain);

-- 4. PRODUCTS TABLE
-- Products managed by sellers
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= price OR compare_at_price IS NULL),
  cost_per_item DECIMAL(10, 2),
  sku TEXT,
  barcode TEXT,
  inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
  track_inventory BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  category_id INTEGER,
  tags TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  weight DECIMAL(10, 2),
  dimensions JSONB,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);

-- 5. PRODUCT_CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES product_categories(id),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, slug)
);

CREATE INDEX idx_categories_seller ON product_categories(seller_id);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  notes TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- 7. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- 8. STORE_VISITORS TABLE (for analytics)
CREATE TABLE IF NOT EXISTS store_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visitors_seller ON store_visitors(seller_id);
CREATE INDEX idx_visitors_time ON store_visitors(visited_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_visitors ENABLE ROW LEVEL SECURITY;

-- SELLERS RLS
-- Sellers can only view and update their own profile
CREATE POLICY "Sellers can view own profile"
  ON sellers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  USING (auth.uid() = id);

-- Public can view active seller profiles (for storefront)
CREATE POLICY "Public can view active sellers"
  ON sellers FOR SELECT
  USING (is_active = TRUE);

-- TEMPLATES RLS
-- Everyone can view active templates (for selection)
CREATE POLICY "Anyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = TRUE);

-- Only admins can modify templates (handled via service role)
-- No INSERT/UPDATE/DELETE policies for regular users

-- STORE_CONFIGS RLS
-- Sellers can only view and manage their own store config
CREATE POLICY "Sellers can view own store config"
  ON store_configs FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own store config"
  ON store_configs FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own store config"
  ON store_configs FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Public can view store configs (for storefront rendering)"
  ON store_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sellers 
      WHERE sellers.id = store_configs.seller_id 
      AND sellers.is_active = TRUE
    )
  );

-- PRODUCTS RLS
-- Sellers can only manage their own products
CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- Public can view active products (for storefront)
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM sellers 
      WHERE sellers.id = products.seller_id 
      AND sellers.is_active = TRUE
    )
  );

-- PRODUCT_CATEGORIES RLS
CREATE POLICY "Sellers can manage own categories"
  ON product_categories FOR ALL
  USING (auth.uid() = seller_id);

CREATE POLICY "Public can view categories"
  ON product_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sellers 
      WHERE sellers.id = product_categories.seller_id 
      AND sellers.is_active = TRUE
    )
  );

-- ORDERS RLS
CREATE POLICY "Sellers can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

-- ORDER_ITEMS RLS
CREATE POLICY "Sellers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.seller_id = auth.uid()
    )
  );

-- STORE_VISITORS RLS
CREATE POLICY "Sellers can view own visitor analytics"
  ON store_visitors FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "System can insert visitor data"
  ON store_visitors FOR INSERT
  WITH CHECK (auth.uid() = seller_id OR auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically create seller profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_seller()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sellers (id, email, store_slug, store_name)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(REGEXP_REPLACE(NEW.email, '[^a-zA-Z0-9]', '_', 'g')),
    SPLIT_PART(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create seller profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_seller();

-- Function to merge template config with seller customizations
CREATE OR REPLACE FUNCTION merge_store_config(
  p_template_id INTEGER,
  p_custom_config JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_template_config JSONB;
  v_merged JSONB;
BEGIN
  SELECT default_config INTO v_template_config
  FROM templates
  WHERE id = p_template_id;
  
  IF v_template_config IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Deep merge: custom config overrides template defaults
  v_merged := jsonb_deep_merge(v_template_config, p_custom_config);
  
  RETURN v_merged;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deep merge function for JSONB
CREATE OR REPLACE FUNCTION jsonb_deep_merge(
  p_target JSONB,
  p_source JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := p_target;
  v_key TEXT;
  v_value JSONB;
BEGIN
  FOR v_key, v_value IN
    SELECT key, value
    FROM jsonb_each(p_source)
  LOOP
    IF v_target ? v_key AND jsonb_typeof(v_value) = 'object' AND jsonb_typeof(v_target->v_key) = 'object' THEN
      v_result := jsonb_set(
        v_result,
        ARRAY[v_key],
        jsonb_deep_merge(v_target->v_key, v_value)
      );
    ELSE
      v_result := jsonb_set(v_result, ARRAY[v_key], v_value);
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_order_num TEXT;
BEGIN
  v_order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN v_order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update store config merged_config on update
CREATE OR REPLACE FUNCTION update_merged_config()
RETURNS TRIGGER AS $$
BEGIN
  NEW.merged_config := merge_store_config(NEW.template_id, NEW.custom_config);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_store_config_update
  BEFORE INSERT OR UPDATE ON store_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_merged_config();

-- Function to update inventory on order
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
    UPDATE products
    SET inventory_quantity = inventory_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA - Default Templates
-- ============================================

INSERT INTO templates (name, description, thumbnail_url, default_config) VALUES
(
  'Minimalist',
  'Clean and simple design with focus on products',
  '/templates/minimalist.png',
  '{
    "colors": {
      "primary": "#000000",
      "secondary": "#6B7280",
      "background": "#FFFFFF",
      "text": "#111827",
      "accent": "#F3F4F6"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "layout": {
      "header_style": "minimal",
      "product_grid": "3-column",
      "footer_style": "minimal"
    },
    "sections": {
      "hero": {
        "enabled": true,
        "title": "Simple & Clean",
        "subtitle": "Curated collection of quality products",
        "cta_text": "Explore",
        "background_image": null
      },
      "featured_products": {
        "enabled": true,
        "title": "Featured",
        "max_items": 6
      },
      "testimonials": {
        "enabled": false
      }
    }
  }'::jsonb
),
(
  'Bold',
  'Vibrant colors and large typography for maximum impact',
  '/templates/bold.png',
  '{
    "colors": {
      "primary": "#EF4444",
      "secondary": "#8B5CF6",
      "background": "#FAFAFA",
      "text": "#1F2937",
      "accent": "#FBBF24"
    },
    "fonts": {
      "heading": "Poppins",
      "body": "Inter"
    },
    "layout": {
      "header_style": "bold",
      "product_grid": "2-column",
      "footer_style": "bold"
    },
    "sections": {
      "hero": {
        "enabled": true,
        "title": "BOLD STATEMENTS",
        "subtitle": "Stand out from the crowd",
        "cta_text": "SHOP NOW",
        "background_image": null
      },
      "featured_products": {
        "enabled": true,
        "title": "HOT PRODUCTS",
        "max_items": 8
      },
      "testimonials": {
        "enabled": true,
        "title": "LOVE FROM CUSTOMERS"
      }
    }
  }'::jsonb
),
(
  'Tech-Focused',
  'Modern design for tech and electronics stores',
  '/templates/tech.png',
  '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981",
      "background": "#0F172A",
      "text": "#F8FAFC",
      "accent": "#06B6D4"
    },
    "fonts": {
      "heading": "Roboto",
      "body": "Inter"
    },
    "layout": {
      "header_style": "tech",
      "product_grid": "4-column",
      "footer_style": "tech"
    },
    "sections": {
      "hero": {
        "enabled": true,
        "title": "Next-Gen Technology",
        "subtitle": "Discover cutting-edge innovations",
        "cta_text": "Shop Tech",
        "background_image": null
      },
      "featured_products": {
        "enabled": true,
        "title": "Latest Arrivals",
        "max_items": 12
      },
      "testimonials": {
        "enabled": true,
        "title": "Trusted by Tech Enthusiasts"
      }
    }
  }'::jsonb
);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View for seller dashboard overview
CREATE OR REPLACE VIEW seller_dashboard_stats AS
SELECT
  s.id as seller_id,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as total_sales,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT v.visitor_id) as unique_visitors_last_30_days
FROM sellers s
LEFT JOIN orders o ON s.id = o.seller_id
LEFT JOIN products p ON s.id = p.seller_id AND p.is_active = TRUE
LEFT JOIN store_visitors v ON s.id = v.seller_id 
  AND v.visited_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id;

-- Grant access to authenticated users
GRANT SELECT ON seller_dashboard_stats TO authenticated;
