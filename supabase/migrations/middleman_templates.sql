-- ============================================
-- MIDDLEMAN STORE TEMPLATES
-- Run this in Supabase SQL Editor
-- ============================================

-- Templates table with e-commerce designs
CREATE TABLE IF NOT EXISTS public.middleman_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_premium BOOLEAN DEFAULT false,
  price NUMERIC DEFAULT 0,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO public.middleman_templates (name, slug, description, category, config) VALUES
('Minimal Store', 'minimal', 'Clean and simple design focusing on products', 'retail', 
'{"layout": "grid", "cards": "plain", "header": "centered", "accent_color": "#000000", "btn_style": "rounded", "show_rating": true}'),
('Modern Luxe', 'modern-luxe', 'Elegant design with bold accents for premium brands', 'luxury',
'{"layout": "masonry", "cards": "elevated", "header": "left", "accent_color": "#D4AF37", "btn_style": "pill", "show_rating": true, "show_reviews": true}'),
('Fresh Market', 'fresh-market', 'Vibrant design for fashion and lifestyle', 'fashion',
'{"layout": "carousel", "cards": "image-first", "header": "full", "accent_color": "#10B981", "btn_style": "rounded", "banner": true, "show_stock": true}'),
('Tech Store', 'tech-store', 'Dark theme ideal for electronics and gadgets', 'electronics',
'{"layout": "grid", "cards": "bordered", "header": "dark", "accent_color": "#3B82F6", "btn_style": "sharp", "show_specs": true, "compare": true}'),
('Boutique', 'boutique', 'Personalized feel for small businesses', 'general',
'{"layout": "list", "cards": "minimal", "header": "centered", "accent_color": "#EC4899", "btn_style": "rounded", "show_about": true}'),
('Wholesale Hub', 'wholesale', 'Bulk ordering focused for B2B', 'b2b',
'{"layout": "table", "cards": "compact", "header": "minimal", "accent_color": "#8B5CF6", "btn_style": "rounded", "moq_display": true, "bulk_pricing": true}')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE public.middleman_templates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "templates_view_public" ON public.middleman_templates
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Store setup wizard steps tracking
CREATE TABLE IF NOT EXISTS public.middleman_store_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  template_id UUID REFERENCES public.middleman_templates(id),
  store_name TEXT,
  store_slug TEXT,
  completed_steps JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.middleman_store_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_setup_own" ON public.middleman_store_setup
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Console output
DO $$
BEGIN
  RAISE NOTICE 'Middleman Templates tables created successfully!';
END $$;