-- Cart Table RLS Policies
-- This file adds Row Level Security policies to the cart table

-- Enable RLS on cart table
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_view_own_cart" ON public.cart;
DROP POLICY IF EXISTS "users_insert_own_cart" ON public.cart;
DROP POLICY IF EXISTS "users_update_own_cart" ON public.cart;
DROP POLICY IF EXISTS "users_delete_own_cart" ON public.cart;

-- Users can view their own cart items
CREATE POLICY "users_view_own_cart"
  ON public.cart
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can add items to their own cart
CREATE POLICY "users_insert_own_cart"
  ON public.cart
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own cart items
CREATE POLICY "users_update_own_cart"
  ON public.cart
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete items from their own cart
CREATE POLICY "users_delete_own_cart"
  ON public.cart
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart TO authenticated;
