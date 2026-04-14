-- ============================================
-- STORE TEMPLATES FOR MARKETPLACE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create store templates table
CREATE TABLE IF NOT EXISTS public.store_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  preview_image_url TEXT,
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  html_template TEXT NOT NULL,
  css_template TEXT,
  js_template TEXT,
  default_colors JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_templates ENABLE ROW LEVEL SECURITY;

-- Public can view published templates
CREATE POLICY "public_view_store_templates" ON public.store_templates
FOR SELECT TO anon, authenticated
USING (is_published = true);

-- Only template creator can manage
CREATE POLICY "template_owner_manage" ON public.store_templates
FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Insert default templates
INSERT INTO public.store_templates (
  name,
  slug,
  description,
  category,
  preview_image_url,
  price,
  is_free,
  html_template,
  css_template,
  default_colors,
  is_published
) VALUES 
(
  'Minimal Modern',
  'minimal-modern',
  'Clean, minimalist design with focus on products',
  'minimal',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  0,
  true,
  '<!-- Header -->
<header class="header">
  <div class="container">
    <a href="/" class="logo">{{logo}}</a>
    <nav class="nav">{{nav}}</nav>
  </div>
</header>
<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <div class="product-grid">{{products}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 1.5rem 0; border-bottom: 1px solid #e5e5e5; }
.logo { font-weight: 700; font-size: 1.5rem; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.hero { padding: 4rem 0; text-align: center; }
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 2rem; }
.product-card { border-radius: 0.5rem; overflow: hidden; transition: transform 0.2s; }
.product-card:hover { transform: translateY(-4px); }',
  '{"primary": "#000000", "secondary": "#ffffff", "accent": "#3b82f6"}',
  true
),
(
  'Dark Elegant',
  'dark-elegant',
  'Sleek dark theme for premium products',
  'dark',
  'https://images.unsplash.com/photo-1557821552-17129678f391?w=400',
  0,
  true,
  '<!-- Header -->
<header class="header">
  <div class="container">
    <a href="/" class="logo">{{logo}}</a>
    <nav class="nav">{{nav}}</nav>
  </div>
</header>
<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <div class="product-grid">{{products}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 1.5rem 0; border-bottom: 1px solid #333; }
.logo { font-weight: 700; font-size: 1.5rem; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.hero { padding: 4rem 0; text-align: center; }
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 2rem; }
html { background: #121212; color: #fff; }
.product-card { border-radius: 0.5rem; overflow: hidden; background: #1e1e1e; }',
  '{"primary": "#ffffff", "secondary": "#121212", "accent": "#fbbf24"}',
  true
),
(
  'Colorful Pop',
  'colorful-pop',
  'Vibrant colors to make products stand out',
  'colorful',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b4b4?w=400',
  0,
  true,
  '<!-- Header -->
<header class="header">
  <div class="container">
    <a href="/" class="logo">{{logo}}</a>
    <nav class="nav">{{nav}}</nav>
  </div>
</header>
<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <div class="product-grid">{{products}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 1.5rem 0; background: var(--accent); }
.logo { font-weight: 800; font-size: 1.75rem; color: white; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.hero { padding: 4rem 0; text-align: center; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); color: white; }
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
.product-card { border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }',
  '{"primary": "#8b5cf6", "secondary": "#f0f9ff", "accent": "#f59e0b"}',
  true
),
(
  'Luxury Premium',
  'luxury-premium',
  'Elegant design for luxury brands',
  'luxury',
  'https://images.unsplash.com/photo-1445205170230-053dc8303547?w=400',
  999,
  false,
  '<!-- Header -->
<header class="header">
  <div class="container">
    <a href="/" class="logo">{{logo}}</a>
    <nav class="nav">{{nav}}</nav>
  </div>
</header>
<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <div class="product-grid">{{products}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 2rem 0; border-bottom: 1px solid #d4af37; }
.logo { font-weight: 300; font-size: 1.75rem; letter-spacing: 0.2em; text-transform: uppercase; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.hero { padding: 6rem 0; text-align: center; }
.hero h1 { font-size: 3.5rem; font-weight: 300; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; }
.product-card { border-radius: 0; overflow: hidden; }',
  '{"primary": "#1a1a1a", "secondary": "#fafafa", "accent": "#d4af37"}',
  true
),
(
  'Creative Portfolio',
  'creative-portfolio',
  'Showcase products in a portfolio-style grid',
  'portfolio',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
  0,
  true,
  '<!-- Header -->
<header class="header">
  <div class="container">
    <a href="/" class="logo">{{logo}}</a>
    <nav class="nav">{{nav}}</nav>
  </div>
</header>
<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <div class="masonry-grid">{{products}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 1.5rem 0; display: flex; justify-content: space-between; align-items: center; }
.logo { font-weight: 600; font-size: 1.25rem; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem; }
.hero { padding: 3rem 0 2rem; }
.hero h1 { font-size: 2.5rem; font-weight: 700; }
.masonry-grid { column-count: 3; column-gap: 1.5rem; }
.product-card { break-inside: avoid; margin-bottom: 1.5rem; border-radius: 0.75rem; overflow: hidden; }
@media (max-width: 768px) { .masonry-grid { column-count: 2; } }',
  '{"primary": "#0f172a", "secondary": "#ffffff", "accent": "#06b6d4"}',
  true
),
(
  'Vintage Classic',
  'vintage-classic',
  'Warm, nostalgic design for handmade products',
  'vintage',
  'https://images.unsplash.com/photo-1558618666-fba25c6cb3e9?w=400',
  499,
  false,
  '<!-- Header -->
<header class="header">
  <div class="container">
    <a href="/" class="logo">{{logo}}</a>
    <nav class="nav">{{nav}}</nav>
  </div>
</header>
<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <div class="product-grid">{{products}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 1.5rem 0; border-bottom: 2px solid var(--primary); }
.logo { font-family: Georgia, serif; font-weight: 700; font-size: 1.75rem; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
.hero { padding: 3rem 0; background: #fdf6e3; text-align: center; }
.hero h1 { font-family: Georgia, serif; font-size: 2.75rem; margin-bottom: 0.75rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 2rem; }
.product-card { border-radius: 0.25rem; overflow: hidden; border: 1px solid #e5e5e5; }',
  '{"primary": "#78350f", "secondary": "#fefae0", "accent": "#ca8a04"}',
  true
);

-- Grant access
GRANT SELECT ON public.store_templates TO anon, authenticated;

-- View for template listing
CREATE OR REPLACE VIEW public.store_templates_public AS
SELECT 
  id,
  name,
  slug,
  description,
  category,
  preview_image_url,
  price,
  is_free,
  default_colors,
  created_at
FROM public.store_templates
WHERE is_published = true;

GRANT SELECT ON public.store_templates_public TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Store templates created successfully!';
END $$;