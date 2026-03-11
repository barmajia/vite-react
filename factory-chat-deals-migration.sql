-- =====================================================
-- Factory Chat + Deal Integration
-- Aurora E-commerce Platform
-- =====================================================
-- This migration adds:
-- 1. Deal link to conversations
-- 2. Deal proposal tracking in chat
-- 3. Enhanced message types for deal negotiations
-- =====================================================

-- STEP 1: Add deal-related columns to conversations
-- =====================================================

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'general' CHECK (conversation_type IN ('general', 'deal_negotiation', 'order_support'));

-- Create index for conversation_type
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_deal_id ON conversations(deal_id);

-- STEP 2: Add message subtype to messages table
-- =====================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_subtype TEXT DEFAULT 'text' CHECK (message_subtype IN ('text', 'deal_proposal', 'deal_counter', 'deal_accepted', 'deal_rejected', 'file', 'image'));

-- Create index for message_subtype
CREATE INDEX IF NOT EXISTS idx_messages_subtype ON messages(message_subtype);

-- STEP 3: Create conversation_deals table
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  proposer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for conversation_deals
CREATE INDEX IF NOT EXISTS idx_conversation_deals_conversation ON conversation_deals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_deals_status ON conversation_deals(status);
CREATE INDEX IF NOT EXISTS idx_conversation_deals_proposer ON conversation_deals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_deals_recipient ON conversation_deals(recipient_id);
CREATE INDEX IF NOT EXISTS idx_conversation_deals_created_at ON conversation_deals(created_at DESC);

-- STEP 4: Enable RLS on conversation_deals
-- =====================================================

ALTER TABLE conversation_deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS conversation_deals_view_own ON conversation_deals;
DROP POLICY IF EXISTS conversation_deals_insert_own ON conversation_deals;
DROP POLICY IF EXISTS conversation_deals_update_own ON conversation_deals;

-- Create RLS policies
CREATE POLICY conversation_deals_view_own ON conversation_deals
FOR SELECT TO authenticated
USING (proposer_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY conversation_deals_insert_own ON conversation_deals
FOR INSERT TO authenticated
WITH CHECK (proposer_id = auth.uid());

CREATE POLICY conversation_deals_update_own ON conversation_deals
FOR UPDATE TO authenticated
USING (proposer_id = auth.uid() OR recipient_id = auth.uid())
WITH CHECK (proposer_id = auth.uid() OR recipient_id = auth.uid());

-- STEP 5: Create trigger to update conversation on deal proposal
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_on_deal_proposal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversations
  SET 
    deal_id = NEW.deal_id,
    conversation_type = 'deal_negotiation',
    last_message = '🤝 Deal proposal sent',
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_conversation_on_deal_proposal ON conversation_deals;
CREATE TRIGGER trigger_update_conversation_on_deal_proposal
AFTER INSERT ON conversation_deals
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_deal_proposal();

-- STEP 6: Update can_start_conversation() function
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_start_conversation(
  from_user_id uuid,
  to_user_id uuid,
  product_id uuid DEFAULT NULL,
  conversation_type text DEFAULT 'general'
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  from_role users.account_type%TYPE;
  to_role users.account_type%TYPE;
  product_owner_id UUID;
  product_allows BOOLEAN;
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != from_user_id THEN
    RAISE EXCEPTION 'Access denied: can only initiate conversations as yourself';
  END IF;

  -- Get user roles
  SELECT account_type INTO from_role FROM users WHERE user_id = from_user_id;
  SELECT account_type INTO to_role FROM users WHERE user_id = to_user_id;

  -- Cannot chat with self
  IF from_user_id = to_user_id THEN 
    RETURN FALSE; 
  END IF;

  -- Deal negotiation conversations (factory ↔ seller/middleman)
  IF conversation_type = 'deal_negotiation' THEN
    IF from_role = 'factory' AND to_role IN ('seller', 'middleman') THEN 
      RETURN TRUE; 
    END IF;
    IF from_role = 'seller' AND to_role = 'factory' THEN 
      RETURN TRUE; 
    END IF;
    IF from_role = 'middleman' THEN 
      RETURN TRUE; 
    END IF;
  END IF;

  -- Factory can message sellers/middlemen for general chat
  IF from_role = 'factory' AND to_role IN ('seller', 'middleman') THEN 
    RETURN TRUE; 
  END IF;

  -- Seller can message factory/middleman
  IF from_role = 'seller' THEN
    IF to_role IN ('factory', 'middleman') THEN 
      RETURN TRUE;
    ELSIF to_role = 'customer' THEN
      IF product_id IS NULL THEN RETURN FALSE; END IF;
      SELECT seller_id, allow_chat INTO product_owner_id, product_allows
      FROM products WHERE id = product_id;
      RETURN (product_owner_id = from_user_id) AND product_allows;
    END IF;
  END IF;

  -- Middleman can message anyone
  IF from_role = 'middleman' THEN 
    RETURN TRUE; 
  END IF;

  -- Customer can message seller about products
  IF from_role = 'customer' OR from_role = 'user' THEN
    IF to_role = 'seller' AND product_id IS NOT NULL THEN
      SELECT seller_id, allow_chat INTO product_owner_id, product_allows
      FROM products WHERE id = product_id;
      RETURN (product_owner_id = to_user_id) AND product_allows;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

-- STEP 7: Grant permissions
-- =====================================================

GRANT ALL ON TABLE conversation_deals TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_on_deal_proposal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_start_conversation(uuid, uuid, uuid, text) TO authenticated;

-- STEP 8: Verification queries
-- =====================================================

-- Verify tables
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages', 'conversation_deals')
ORDER BY table_name, ordinal_position;

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%conversation%'
ORDER BY tablename;

-- Verify triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%deal%';

-- Verify functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_conversation_on_deal_proposal', 'can_start_conversation');

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'conversation_deals'
ORDER BY policyname;
