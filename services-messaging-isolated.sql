-- ============================================================
-- Services Messaging System - Isolated & Dedicated
-- Complete separation from Product/Trading conversations
-- ============================================================

-- Step 1: Cleanup (if previous attempts exist)
-- ============================================================
DROP TABLE IF EXISTS public.services_messages CASCADE;
DROP TABLE IF EXISTS public.services_conversations CASCADE;

-- Step 2: Create SERVICES_CONVERSATIONS Table
-- ============================================================
CREATE TABLE public.services_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core Participants (Explicit Foreign Keys to auth.users)
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context
  listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
  
  -- State
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  is_read_by_provider BOOLEAN DEFAULT TRUE,
  is_read_by_client BOOLEAN DEFAULT TRUE,
  
  -- Constraint: One active conversation per Client-Provider-Listing combo
  CONSTRAINT unique_service_conv UNIQUE (provider_id, client_id, listing_id)
);

-- Step 3: Create SERVICES_MESSAGES Table
-- ============================================================
CREATE TABLE public.services_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.services_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachment_url TEXT,
  attachment_name TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full Text Search
  content_tsvector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', COALESCE(content, ''))) STORED
);

-- Step 4: Indexes for Performance
-- ============================================================
CREATE INDEX idx_svc_conv_provider ON public.services_conversations(provider_id);
CREATE INDEX idx_svc_conv_client ON public.services_conversations(client_id);
CREATE INDEX idx_svc_conv_listing ON public.services_conversations(listing_id);
CREATE INDEX idx_svc_conv_updated ON public.services_conversations(updated_at DESC);

CREATE INDEX idx_svc_msg_conv ON public.services_messages(conversation_id, created_at DESC);
CREATE INDEX idx_svc_msg_sender ON public.services_messages(sender_id);
CREATE INDEX idx_svc_msg_search ON public.services_messages USING GIN(content_tsvector);

-- Step 5: Triggers
-- ============================================================

-- A. Update Conversation on New Message
CREATE OR REPLACE FUNCTION public.update_svc_conv_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.services_conversations
    SET
      last_message = CASE 
        WHEN NEW.message_type = 'image' THEN '📷 Image' 
        WHEN NEW.message_type = 'file' THEN '📎 Attachment'
        ELSE LEFT(NEW.content, 60) 
      END,
      last_message_at = NEW.created_at,
      updated_at = NOW(),
      -- Mark as unread for the receiver
      is_read_by_provider = CASE WHEN NEW.sender_id = provider_id THEN TRUE ELSE FALSE END,
      is_read_by_client = CASE WHEN NEW.sender_id = client_id THEN TRUE ELSE FALSE END
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_svc_conv_update
AFTER INSERT ON public.services_messages
FOR EACH ROW EXECUTE FUNCTION public.update_svc_conv_on_message();

-- B. Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_svc_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_svc_conv_timestamp
BEFORE UPDATE ON public.services_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_svc_timestamps();

-- Step 6: Helper Function - Get or Create Conversation
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_or_create_service_conversation(
  p_provider_id UUID,
  p_listing_id UUID
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_client_id UUID := auth.uid();
BEGIN
  -- Check existing
  SELECT id INTO v_conversation_id
  FROM public.services_conversations
  WHERE provider_id = p_provider_id
    AND client_id = v_client_id
    AND listing_id = p_listing_id;

  IF v_conversation_id IS NULL THEN
    -- Create new
    INSERT INTO public.services_conversations (provider_id, client_id, listing_id)
    VALUES (p_provider_id, v_client_id, p_listing_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.services_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_messages ENABLE ROW LEVEL SECURITY;

-- A. Conversations Policies
-- Users can see if they are either the Provider OR the Client
DROP POLICY IF EXISTS "svc_users_view_own_conversations" ON public.services_conversations;
CREATE POLICY "svc_users_view_own_conversations" ON public.services_conversations
FOR SELECT USING (
  auth.uid() = provider_id OR auth.uid() = client_id
);

-- Only Clients can initiate (create) a conversation via the helper function
DROP POLICY IF EXISTS "svc_clients_create_conversations" ON public.services_conversations;
CREATE POLICY "svc_clients_create_conversations" ON public.services_conversations
FOR INSERT WITH CHECK (
  auth.uid() = client_id
);

-- Updates (e.g., archiving, marking read) allowed for participants
DROP POLICY IF EXISTS "svc_users_update_own_conversations" ON public.services_conversations;
CREATE POLICY "svc_users_update_own_conversations" ON public.services_conversations
FOR UPDATE USING (
  auth.uid() = provider_id OR auth.uid() = client_id
);

-- B. Messages Policies
-- View messages if participant in the conversation
DROP POLICY IF EXISTS "svc_users_view_messages" ON public.services_messages;
CREATE POLICY "svc_users_view_messages" ON public.services_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.services_conversations c
    WHERE c.id = conversation_id 
    AND (c.provider_id = auth.uid() OR c.client_id = auth.uid())
  )
);

-- Send messages if participant
DROP POLICY IF EXISTS "svc_users_send_messages" ON public.services_messages;
CREATE POLICY "svc_users_send_messages" ON public.services_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.services_conversations c
    WHERE c.id = conversation_id 
    AND (c.provider_id = auth.uid() OR c.client_id = auth.uid())
  )
);

-- Update own messages (edit/delete/read receipt)
DROP POLICY IF EXISTS "svc_users_update_own_messages" ON public.services_messages;
CREATE POLICY "svc_users_update_own_messages" ON public.services_messages
FOR UPDATE USING (
  sender_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.services_conversations c
    WHERE c.id = conversation_id 
    AND (c.provider_id = auth.uid() OR c.client_id = auth.uid())
  )
);

-- Step 8: Verify Tables Created
-- ============================================================
SELECT 
  table_name,
  'Created' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('services_conversations', 'services_messages')
ORDER BY table_name;

-- ============================================================
-- Migration Complete!
-- Services Messaging is now completely isolated from Product messaging
-- ============================================================
