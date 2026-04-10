-- ============================================
-- MIDDLEMAN WORKFLOW ENHANCEMENTS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add promotional metadata to middle_man_deals
ALTER TABLE public.middle_man_deals 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'auto_approved' CHECK (approval_status IN ('auto_approved', 'pending_approval', 'rejected', 'archived')),
ADD COLUMN IF NOT EXISTS promo_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_price_synced_at TIMESTAMPTZ;

-- Indexes for faster discovery & sync
CREATE INDEX IF NOT EXISTS idx_mm_deals_seller_status 
ON public.middle_man_deals(seller_id, is_active, approval_status) 
WHERE is_active = true AND approval_status = 'auto_approved';

CREATE INDEX IF NOT EXISTS idx_mm_deals_expires 
ON public.middle_man_deals(expires_at) 
WHERE expires_at IS NOT NULL AND is_active = true;

-- 2. Product Discovery RPC for Middle Men
CREATE OR REPLACE FUNCTION public.get_marketplace_products_for_middlemen(
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT 0,
  p_max_price NUMERIC DEFAULT 99999,
  p_min_stock INT DEFAULT 5,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
) RETURNS TABLE (
  asin TEXT,
  title TEXT,
  description TEXT,
  price NUMERIC,
  images JSONB,
  seller_id UUID,
  seller_name TEXT,
  seller_rating NUMERIC,
  stock_quantity INT,
  category TEXT,
  is_local_brand BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.asin, p.title, p.description, p.price, p.images,
    p.seller_id, s.full_name as seller_name, 
    COALESCE((SELECT AVG(rating) FROM public.reviews WHERE asin = p.asin AND is_approved = true), 0) as seller_rating,
    p.quantity as stock_quantity, p.category, p.is_local_brand
  FROM public.products p
  JOIN public.sellers s ON s.user_id = p.seller_id
  WHERE p.status = 'active'
    AND p.is_deleted = false
    AND p.quantity >= p_min_stock
    AND p.price BETWEEN p_min_price AND p_max_price
    AND (p_category IS NULL OR p.category ILIKE '%' || p_category || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_for_middlemen(TEXT, NUMERIC, NUMERIC, INT, INT, INT) TO authenticated;

-- 3. Claim & Create Promo Deal (Idempotent + Seller Validation)
CREATE OR REPLACE FUNCTION public.claim_and_create_promo_deal(
  p_product_asin TEXT,
  p_margin_type TEXT,
  p_margin_value NUMERIC,
  p_expires_days INT DEFAULT 30,
  p_promo_tags TEXT[] DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_middle_man_id UUID := auth.uid();
  v_deal_id UUID;
  v_slug TEXT;
  v_product RECORD;
  v_max_margin NUMERIC;
BEGIN
  -- Validate Middle Man exists
  IF NOT EXISTS (SELECT 1 FROM public.middle_men WHERE user_id = v_middle_man_id) THEN
    RAISE EXCEPTION 'User is not registered as a Middle Man';
  END IF;

  -- Fetch Product Info
  SELECT p.*, s.min_order_quantity, s.wholesale_discount, s.user_id as seller_id
  INTO v_product
  FROM public.products p
  JOIN public.sellers s ON s.user_id = p.seller_id
  WHERE p.asin = p_product_asin AND p.status = 'active' AND p.is_deleted = false;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Generate Slug
  v_slug := 'promo-' || SUBSTRING(v_middle_man_id::text, 1, 8) || '-' || v_product.asin;

  -- Insert/Update Deal (Idempotent)
  INSERT INTO public.middle_man_deals (
    middle_man_id, product_asin, seller_id,
    commission_rate, margin_amount, unique_slug, is_active,
    approval_status, expires_at, promo_tags, created_at
  ) VALUES (
    v_middle_man_id, v_product.asin, v_product.seller_id,
    CASE WHEN p_margin_type = 'percentage' THEN p_margin_value ELSE 0 END,
    CASE WHEN p_margin_type = 'fixed' THEN p_margin_value ELSE 0 END,
    v_slug, true, 'auto_approved',
    NOW() + (p_expires_days || ' days')::INTERVAL,
    p_promo_tags, NOW()
  )
  ON CONFLICT (middle_man_id, product_asin) DO UPDATE SET
    commission_rate = EXCLUDED.commission_rate,
    margin_amount = EXCLUDED.margin_amount,
    is_active = true,
    expires_at = EXCLUDED.expires_at,
    promo_tags = EXCLUDED.promo_tags,
    updated_at = NOW()
  RETURNING id, unique_slug INTO v_deal_id, v_slug;

  -- Return Deal Data
  RETURN jsonb_build_object(
    'success', true,
    'deal_id', v_deal_id,
    'promo_slug', v_slug,
    'share_url', current_setting('app.settings.site_url', true) || '/deal/' || v_slug,
    'product_title', v_product.title,
    'original_price', v_product.price,
    'estimated_earnings', CASE 
      WHEN p_margin_type = 'percentage' THEN v_product.price * (p_margin_value / 100)
      ELSE p_margin_value 
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_and_create_promo_deal(TEXT, TEXT, NUMERIC, INT, TEXT[]) TO authenticated;

-- 4. Price/Stock Sync Trigger
CREATE OR REPLACE FUNCTION public.sync_middleman_deals_on_product_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Pause deals if out of stock
  IF NEW.quantity = 0 AND OLD.quantity > 0 THEN
    UPDATE public.middle_man_deals SET is_active = false WHERE product_asin = NEW.asin;
  END IF;

  -- Update last synced timestamp
  UPDATE public.middle_man_deals 
  SET last_price_synced_at = NOW() 
  WHERE product_asin = NEW.asin;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_mm_deals_product_change ON public.products;
CREATE TRIGGER trg_sync_mm_deals_product_change
AFTER UPDATE OF price, quantity, status ON public.products
FOR EACH ROW EXECUTE FUNCTION sync_middleman_deals_on_product_change();

-- 5. Seller Controls (Optional)
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS allow_middleman_promo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_middleman_margin NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS require_middleman_approval BOOLEAN DEFAULT false;
