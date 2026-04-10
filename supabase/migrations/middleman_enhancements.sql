-- ============================================
-- MIDDLEMAN DATABASE ENHANCEMENTS
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on middle_man tables
ALTER TABLE IF EXISTS public.middle_men ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.middle_man_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Middle men can only access their own data
DROP POLICY IF EXISTS "middle_men_view_own" ON public.middle_men;
CREATE POLICY "middle_men_view_own" ON public.middle_men
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "middle_men_manage_own_deals" ON public.middle_man_deals;
CREATE POLICY "middle_men_manage_own_deals" ON public.middle_man_deals
TO authenticated 
USING (middle_man_id = auth.uid())
WITH CHECK (middle_man_id = auth.uid());

DROP POLICY IF EXISTS "middle_men_view_own_commissions" ON public.commissions;
CREATE POLICY "middle_men_view_own_commissions" ON public.commissions
FOR SELECT TO authenticated USING (middle_man_id = auth.uid());

-- Index for faster deal lookups by slug (for public links)
CREATE INDEX IF NOT EXISTS idx_middle_man_deals_slug_active 
ON public.middle_man_deals(unique_slug, is_active) 
WHERE is_active = true;

-- View: Public-facing product deals (no sensitive data)
CREATE OR REPLACE VIEW public.middle_man_deals_public AS
SELECT 
  d.unique_slug,
  d.product_asin,
  p.title,
  p.description,
  p.images,
  p.price as original_price,
  p.price * (1 + COALESCE(d.margin_amount, 0) / 100) as deal_price,
  d.commission_rate,
  d.margin_amount,
  d.clicks,
  d.conversions,
  s.full_name as seller_name,
  s.is_verified as seller_verified
FROM public.middle_man_deals d
JOIN public.products p ON p.asin = d.product_asin
JOIN public.sellers s ON s.user_id = p.seller_id
WHERE d.is_active = true
AND p.status = 'active'
AND p.is_deleted = false;

GRANT SELECT ON public.middle_man_deals_public TO anon, authenticated;

-- Track clicks on middle man deal links
CREATE OR REPLACE FUNCTION public.track_deal_click(p_unique_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.middle_man_deals
  SET clicks = clicks + 1,
      updated_at = NOW()
  WHERE unique_slug = p_unique_slug
  AND is_active = true;
END;
$$;

-- Grant execution to authenticated users (for public deal pages)
GRANT EXECUTE ON FUNCTION public.track_deal_click(TEXT) TO authenticated, anon;

-- Create middle man deal function
CREATE OR REPLACE FUNCTION public.create_middle_man_deal(
  p_middle_man_id UUID,
  p_product_asin TEXT,
  p_commission_rate NUMERIC DEFAULT 0,
  p_margin_amount NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal_id UUID;
  v_unique_slug TEXT;
BEGIN
  v_unique_slug := 'mm-' || LEFT(p_middle_man_id::TEXT, 8) || '-' || p_product_asin;
  
  INSERT INTO public.middle_man_deals (
    middle_man_id,
    product_asin,
    commission_rate,
    margin_amount,
    unique_slug,
    is_active
  ) VALUES (
    p_middle_man_id,
    p_product_asin,
    p_commission_rate,
    p_margin_amount,
    v_unique_slug,
    true
  )
  RETURNING id INTO v_deal_id;
  
  RETURN v_deal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_middle_man_deal(UUID, TEXT, NUMERIC, NUMERIC) TO authenticated;

-- Trigger: Auto-calculate middle man commission on order confirmation
CREATE OR REPLACE FUNCTION public.calculate_middle_man_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_middle_man_id UUID;
  v_commission NUMERIC;
  v_deal RECORD;
BEGIN
  IF NEW.middle_man_slug IS NOT NULL AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    SELECT middle_man_id, commission_rate, margin_amount
    INTO v_deal
    FROM public.middle_man_deals
    WHERE unique_slug = NEW.middle_man_slug
    AND is_active = true;
    
    IF v_deal.middle_man_id IS NOT NULL THEN
      IF COALESCE(v_deal.margin_amount, 0) > 0 THEN
        v_commission := v_deal.margin_amount;
      ELSE
        v_commission := NEW.subtotal * (v_deal.commission_rate / 100);
      END IF;
      
      INSERT INTO public.commissions (
        middle_man_id,
        order_id,
        amount,
        commission_rate,
        status
      ) VALUES (
        v_deal.middle_man_id,
        NEW.id,
        v_commission,
        COALESCE(v_deal.commission_rate, 0),
        'pending'
      );
      
      UPDATE public.middle_men
      SET pending_earnings = COALESCE(pending_earnings, 0) + v_commission
      WHERE user_id = v_deal.middle_man_id;
      
      UPDATE public.middle_man_deals
      SET conversions = conversions + 1,
          total_revenue = COALESCE(total_revenue, 0) + NEW.subtotal
      WHERE unique_slug = NEW.middle_man_slug;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_middle_man_commission ON public.orders;
CREATE TRIGGER trigger_calculate_middle_man_commission
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_middle_man_commission();
