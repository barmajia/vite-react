-- =====================================================
-- Trading Chat System - Database Setup
-- =====================================================
-- This creates the trading chat system for Customer, Seller, 
-- Factory, and Middle Man with product-level chat permissions
-- =====================================================

-- =====================================================
-- 1. Create Trading Conversations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trading_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_type text CHECK (conversation_type IN ('product_inquiry', 'custom_request', 'deal_negotiation', 'factory_order')),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES public.middleman_deals(id) ON DELETE CASCADE,
    factory_id uuid REFERENCES public.factory_profiles(id) ON DELETE CASCADE,
    middleman_id uuid REFERENCES public.middle_men(id) ON DELETE CASCADE,
    initiator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    initiator_role text NOT NULL CHECK (initiator_role IN ('user', 'customer', 'seller', 'factory', 'middleman')),
    receiver_role text NOT NULL CHECK (receiver_role IN ('user', 'customer', 'seller', 'factory', 'middleman')),
    is_custom_request boolean DEFAULT false,
    custom_request_details jsonb,
    last_message text,
    last_message_at timestamptz,
    is_archived boolean DEFAULT false,
    is_closed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_conversations ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS trading_conversations_product_id_idx ON public.trading_conversations(product_id);
CREATE INDEX IF NOT EXISTS trading_conversations_deal_id_idx ON public.trading_conversations(deal_id);
CREATE INDEX IF NOT EXISTS trading_conversations_factory_id_idx ON public.trading_conversations(factory_id);
CREATE INDEX IF NOT EXISTS trading_conversations_middleman_id_idx ON public.trading_conversations(middleman_id);
CREATE INDEX IF NOT EXISTS trading_conversations_initiator_id_idx ON public.trading_conversations(initiator_id);
CREATE INDEX IF NOT EXISTS trading_conversations_receiver_id_idx ON public.trading_conversations(receiver_id);
CREATE INDEX IF NOT EXISTS trading_conversations_last_message_at_idx ON public.trading_conversations(last_message_at DESC);

-- =====================================================
-- 2. Update Conversation Participants Role Constraint
-- =====================================================
-- Drop existing constraint if it exists
ALTER TABLE public.conversation_participants 
DROP CONSTRAINT IF EXISTS conversation_participants_role_check;

-- Add new constraint that includes middleman
ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_role_check 
CHECK (role = ANY (ARRAY[
  'user'::text,
  'customer'::text,
  'seller'::text,
  'factory'::text,
  'middleman'::text
]));

-- =====================================================
-- 3. Create Function to Check Product Chat Permission
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_product_chat_permission(
  p_user_id uuid,
  p_product_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_allow_chat boolean;
  v_seller_id uuid;
  v_user_type text;
BEGIN
  -- Get product chat permission
  SELECT allow_chat, seller_id INTO v_allow_chat, v_seller_id
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get user account type
  SELECT account_type INTO v_user_type
  FROM users
  WHERE user_id = p_user_id;
  
  -- Customer/user must check product permission
  IF v_user_type IN ('user', 'customer') THEN
    RETURN v_allow_chat;
  END IF;
  
  -- Seller, factory, middleman always allowed (B2B)
  RETURN true;
END;
$$;

-- =====================================================
-- 4. Create Function to Create Trading Conversation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_trading_conversation(
  p_target_user_id uuid,
  p_initiator_role text,
  p_receiver_role text,
  p_product_id uuid DEFAULT NULL,
  p_conversation_type text DEFAULT 'product_inquiry'::text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_initiator_id uuid;
BEGIN
  -- Get current user ID
  v_initiator_id := auth.uid();
  
  -- Validate roles
  IF p_initiator_role NOT IN ('user', 'customer', 'seller', 'factory', 'middleman') THEN
    RAISE EXCEPTION 'Invalid initiator role';
  END IF;
  
  IF p_receiver_role NOT IN ('user', 'customer', 'seller', 'factory', 'middleman') THEN
    RAISE EXCEPTION 'Invalid receiver role';
  END IF;
  
  -- Check product permission if applicable
  IF p_product_id IS NOT NULL AND p_initiator_role IN ('user', 'customer') THEN
    IF NOT public.check_product_chat_permission(v_initiator_id, p_product_id) THEN
      RAISE EXCEPTION 'Chat is not enabled for this product';
    END IF;
  END IF;

  -- Check if conversation exists
  SELECT c.id INTO v_conversation_id
  FROM public.trading_conversations c
  WHERE 
    ((c.initiator_id = v_initiator_id AND c.receiver_id = p_target_user_id)
     OR (c.initiator_id = p_target_user_id AND c.receiver_id = v_initiator_id))
    AND c.is_archived = false
    AND c.product_id IS NOT DISTINCT FROM p_product_id
  LIMIT 1;

  -- Create new if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.trading_conversations (
      initiator_id,
      receiver_id,
      initiator_role,
      receiver_role,
      conversation_type,
      product_id,
      is_custom_request
    )
    VALUES (
      v_initiator_id,
      p_target_user_id,
      p_initiator_role,
      p_receiver_role,
      p_conversation_type,
      p_product_id,
      (p_conversation_type = 'custom_request')
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- =====================================================
-- 5. Create Function to Get My Trading Conversations
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_trading_conversations()
RETURNS TABLE (
  conversation_id uuid,
  conversation_type text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_account_type text,
  other_user_role text,
  product_id uuid,
  product_title text,
  product_price numeric,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::uuid,
    c.conversation_type::text,
    CASE 
      WHEN c.initiator_id = auth.uid() THEN c.receiver_id
      ELSE c.initiator_id
    END::uuid as other_user_id,
    u.full_name::text,
    u.avatar_url::text,
    u.account_type::text,
    CASE 
      WHEN c.initiator_id = auth.uid() THEN c.receiver_role
      ELSE c.initiator_role
    END::text as other_user_role,
    c.product_id::uuid,
    p.title::text,
    p.price::numeric,
    c.last_message::text,
    c.last_message_at::timestamptz,
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id = CASE 
          WHEN c.initiator_id = auth.uid() THEN c.receiver_id
          ELSE c.initiator_id
        END
        AND m.read_at IS NULL
    )::bigint as unread_count
  FROM public.trading_conversations c
  JOIN public.users u ON 
    CASE 
      WHEN c.initiator_id = auth.uid() THEN u.user_id = c.receiver_id
      ELSE u.user_id = c.initiator_id
    END
  LEFT JOIN public.products p ON c.product_id = p.id
  WHERE (c.initiator_id = auth.uid() OR c.receiver_id = auth.uid())
    AND c.is_archived = false
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- =====================================================
-- 6. RLS Policies for Trading Conversations
-- =====================================================
-- Users can read conversations they are part of
CREATE POLICY "Users can read own trading conversations"
  ON public.trading_conversations
  FOR SELECT
  USING (initiator_id = auth.uid() OR receiver_id = auth.uid());

-- Users can update conversations they are part of
CREATE POLICY "Users can update own trading conversations"
  ON public.trading_conversations
  FOR UPDATE
  USING (initiator_id = auth.uid() OR receiver_id = auth.uid());

-- Users can create conversations
CREATE POLICY "Users can create trading conversations"
  ON public.trading_conversations
  FOR INSERT
  WITH CHECK (
    initiator_id = auth.uid() AND
    (
      -- Product chat permission check
      product_id IS NULL OR
      check_product_chat_permission(auth.uid(), product_id)
    )
  );

-- =====================================================
-- 7. Create Trigger to Update Trading Conversation Last Message
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_trading_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.trading_conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only apply to messages linked to trading conversations
DROP TRIGGER IF EXISTS on_trading_message_insert ON public.messages;
CREATE TRIGGER on_trading_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (EXISTS (
    SELECT 1 FROM public.trading_conversations tc WHERE tc.id = NEW.conversation_id
  ))
  EXECUTE FUNCTION public.update_trading_conversation_last_message();

-- =====================================================
-- 8. Update Products Table - Ensure allow_chat column exists
-- =====================================================
-- Add allow_chat column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'allow_chat'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN allow_chat boolean DEFAULT true;
    
    -- Add comment
    COMMENT ON COLUMN public.products.allow_chat IS 'Allow customers to initiate chat about this product';
  END IF;
END $$;

-- =====================================================
-- 9. Create Index for Product Chat Permission Check
-- =====================================================
CREATE INDEX IF NOT EXISTS products_allow_chat_idx ON public.products(allow_chat, seller_id);

-- =====================================================
-- 10. Grant Permissions
-- =====================================================
-- Allow authenticated users to use the functions
GRANT EXECUTE ON FUNCTION public.check_product_chat_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trading_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_trading_conversations TO authenticated;

-- =====================================================
-- 11. Sample Data (Optional - for testing)
-- =====================================================
-- Uncomment to insert test data
-- INSERT INTO public.trading_conversations (
--   initiator_id, receiver_id, initiator_role, receiver_role, 
--   conversation_type, is_custom_request
-- ) VALUES (
--   'test-initiator-uuid',
--   'test-receiver-uuid',
--   'customer',
--   'seller',
--   'product_inquiry',
--   false
-- );

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify the setup:

-- Check tables exist
-- SELECT COUNT(*) FROM public.trading_conversations;
-- SELECT COUNT(*) FROM public.conversation_participants;

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE '%trading%';

-- Check product allow_chat column
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'allow_chat';

-- Test the create function:
-- SELECT create_trading_conversation(
--   'target-user-uuid',
--   'customer',
--   'seller',
--   NULL,
--   'product_inquiry'
-- );
