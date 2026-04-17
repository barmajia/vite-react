-- ============================================
-- ADD 2 E-COMMERCE TEMPLATES TO MARKETPLACE
-- ============================================

-- Insert 2 new e-commerce templates
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
  js_template,
  default_colors,
  is_published
) VALUES 
(
  'Modern Boutique',
  'modern-boutique',
  'Clean, fashion-focused template with product spotlight',
  'ecommerce',
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
<!-- Featured Products -->
<section class="featured">
  <div class="container">
    <h2 class="section-title">Featured Products</h2>
    <div class="product-grid">{{featured_products}}</div>
  </div>
</section>
<!-- Collections -->
<section class="collections">
  <div class="container">
    <h2 class="section-title">Collections</h2>
    <div class="collection-grid">{{collections}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
    <div class="footer-links">{{footer_links}}</div>
  </div>
</footer>',
  '.header { padding: 1.5rem 0; border-bottom: 1px solid #eee; }
.logo { font-weight: 700; font-size: 1.5rem; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.hero { padding: 4rem 0; text-align: center; }
.hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
.section-title { font-size: 2rem; margin: 2rem 0 1rem; text-align: center; }
.product-grid, .collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 2rem; }
.product-card, .collection-card { border-radius: 0.5rem; overflow: hidden; border: 1px solid #f0f0f0; }
.product-card:hover, .collection-card:hover { transform: translateY(-4px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.footer { background: #f8f9fa; padding: 3rem 0; border-top: 1px solid #eee; }
.footer-links { display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem; }',
  '/* No custom JS needed */',
  '{"primary": "#333333", "secondary": "#ffffff", "accent": "#ef4444"}',
  true
),
(
  'Tech Gadget Store',
  'tech-gadget-store',
  'Modern tech-focused template with specifications highlight',
  'ecommerce',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
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
    <a href="#products" class="cta-button">Shop Now</a>
  </div>
</section>
<!-- Tech Specs -->
<section class="specs">
  <div class="container">
    <h2>Latest Tech Specs</h2>
    <div class="specs-grid">{{tech_specs}}</div>
  </div>
</section>
<!-- Products -->
<section class="products">
  <div class="container">
    <h2 class="section-title">Featured Gadgets</h2>
    <div class="product-grid">{{products}}</div>
  </div>
</section>
<!-- Reviews -->
<section class="reviews">
  <div class="container">
    <h2 class="section-title">Customer Reviews</h2>
    <div class="reviews-grid">{{reviews}}</div>
  </div>
</section>
<!-- Footer -->
<footer class="footer">
  <div class="container">
    <p>&copy; 2024 {{store_name}}. All rights reserved.</p>
  </div>
</footer>',
  '.header { padding: 2rem 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
.logo { font-weight: 700; font-size: 1.5rem; color: white; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem; }
.hero { padding: 6rem 0; text-align: center; color: white; }
.hero h1 { font-size: 3rem; margin-bottom: 1.5rem; }
.cta-button { display: inline-block; padding: 1rem 2rem; background: #3b82f6; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
.cta-button:hover { background: #2563eb; }
.section-title { font-size: 2.25rem; margin: 3rem 0 2rem; text-align: center; color: #1e293b; }
.specs-grid, .product-grid, .reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
.spec-card, .product-card, .review-card { border-radius: 0.75rem; overflow: hidden; border: 1px solid #e2e8f0; transition: transform 0.2s; }
.spec-card:hover, .product-card:hover, .review-card:hover { transform: translateY(-6px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
.footer { background: #0f172a; color: #e2e8f0; padding: 3rem 0; text-align: center; }',
  '/* Tech store interactive features */',
  '{"primary": "#0f172a", "secondary": "#f8fafc", "accent": "#3b82f6"}',
  true
);

-- Grant access (in case permissions need updating)
GRANT SELECT ON public.store_templates TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Added 2 e-commerce templates: Modern Boutique and Tech Gadget Store';
END $$;