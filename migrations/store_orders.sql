-- ============================================
-- STORE ORDERS & TRANSACTIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- Create store orders table
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.middleman_stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id),
  customer_email TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'pending',
  subtotal NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Store owner can view orders
CREATE POLICY "store_owner_view_orders" ON public.store_orders
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
  )
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_asin TEXT NOT NULL,
  product_title TEXT,
  product_image TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_owner_view_items" ON public.store_order_items
FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.store_orders WHERE store_id IN (
      SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_orders_store ON public.store_orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON public.store_order_items(order_id);

-- Function: Create order from cart
CREATE OR REPLACE FUNCTION public.create_store_order(
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_items JSONB,
  p_shipping_address JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER;
  END LOOP;
  
  v_total := v_subtotal;
  
  INSERT INTO public.store_orders (
    store_id,
    customer_id,
    customer_email,
    customer_name,
    subtotal,
    total,
    shipping_address,
    notes,
    status
  ) VALUES (
    p_store_id,
    v_user_id,
    p_customer_email,
    p_customer_name,
    v_subtotal,
    v_total,
    p_shipping_address,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_order_id;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.store_order_items (
      order_id,
      product_asin,
      product_title,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_item->>'product_asin',
      v_item->>'title',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      (v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER
    );
  END LOOP;
  
  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store_order TO authenticated;

-- Function: Get store orders for owner
CREATE OR REPLACE FUNCTION public.get_store_orders(p_store_id UUID)
RETURNS TABLE (
  id UUID,
  customer_email TEXT,
  customer_name TEXT,
  status TEXT,
  subtotal NUMERIC,
  total NUMERIC,
  payment_status TEXT,
  created_at TIMESTAMPTZ,
  items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_email,
    o.customer_name,
    o.status,
    o.subtotal,
    o.total,
    o.payment_status,
    o.created_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_asin', oi.product_asin,
            'product_title', oi.product_title,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          )
        )
        FROM public.store_order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    ) AS items
  FROM public.store_orders o
  WHERE o.store_id = p_store_id
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_orders TO authenticated;

-- Function: Update order status
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.store_orders
  SET status = p_status, updated_at = NOW()
  WHERE id = p_order_id
    AND store_id IN (
      SELECT id FROM public.middleman_stores WHERE middle_man_id = auth.uid()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Store orders tables created successfully!';
END $$;