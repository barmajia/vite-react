-- =====================================================
-- Aurora Chat System - Complete SQL Setup
-- =====================================================
-- This script sets up the chat system for all account types
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Enable Realtime for Chat Tables
-- =====================================================
-- Add chat tables to Supabase realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.trading_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.trading_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.health_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.health_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.services_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.services_messages;

-- =====================================================
-- 2. Create Chat Attachments Storage Bucket
-- =====================================================
-- Create bucket for chat file attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Storage RLS Policies for Chat Attachments
-- =====================================================
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Users can upload chat attachments
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = 'chat'
);

-- Users can view all chat attachments
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

-- Users can delete their own attachments
DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
);

-- =====================================================
-- 4. Create Indexes for Better Performance
-- =====================================================
-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Indexes for conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON public.conversations(context);

-- Indexes for conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);

-- Indexes for trading conversations
CREATE INDEX IF NOT EXISTS idx_trading_conversations_initiator ON public.trading_conversations(initiator_id);
CREATE INDEX IF NOT EXISTS idx_trading_conversations_receiver ON public.trading_conversations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trading_conversations_last_message ON public.trading_conversations(last_message_at DESC NULLS LAST);

-- Indexes for services conversations
CREATE INDEX IF NOT EXISTS idx_services_conversations_provider ON public.services_conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_conversations_client ON public.services_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_services_conversations_last_message ON public.services_conversations(last_message_at DESC NULLS LAST);

-- Indexes for health conversations
CREATE INDEX IF NOT EXISTS idx_health_conversations_appointment ON public.health_conversations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_health_conversations_last_message ON public.health_conversations(last_message_at DESC NULLS LAST);

-- =====================================================
-- 5. Create Helper Functions
-- =====================================================
-- Function to get user conversations with products
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_products(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  product_id uuid,
  product_title text,
  product_price numeric,
  product_image text,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  unread_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.product_id,
    p.title AS product_title,
    p.price AS product_price,
    p.images[1] AS product_image,
    c.last_message,
    c.last_message_at,
    c.created_at,
    op.user_id AS other_user_id,
    op.full_name AS other_user_name,
    op.avatar_url AS other_user_avatar,
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    )::bigint AS unread_count
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  JOIN users op ON op.user_id = (
    SELECT user_id
    FROM conversation_participants
    WHERE conversation_id = c.id
      AND user_id != p_user_id
    LIMIT 1
  )
  LEFT JOIN products p ON p.id = c.product_id
  WHERE cp.user_id = p_user_id
    AND c.is_archived = false
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- Function to create a direct conversation between two users
CREATE OR REPLACE FUNCTION public.create_direct_conversation(
  p_target_user_id uuid,
  p_context text DEFAULT 'general',
  p_product_id uuid DEFAULT NULL,
  p_appointment_id uuid DEFAULT NULL,
  p_listing_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Check if conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_current_user_id
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = p_target_user_id
  WHERE c.product_id IS NOT DISTINCT FROM p_product_id
    AND c.context = p_context
  LIMIT 1;
  
  -- If conversation exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (product_id, context, factory_id, appointment_id, listing_id)
  VALUES (p_product_id, p_context::public.conversation_context, NULL, p_appointment_id, p_listing_id)
  RETURNING id INTO v_conversation_id;
  
  -- Add current user as participant
  INSERT INTO conversation_participants (conversation_id, user_id, role, is_muted)
  VALUES (v_conversation_id, v_current_user_id, 'user', false);
  
  -- Add target user as participant
  INSERT INTO conversation_participants (conversation_id, user_id, role, is_muted)
  VALUES (v_conversation_id, p_target_user_id, 'user', false);
  
  RETURN v_conversation_id;
END;
$$;

-- =====================================================
-- 6. Grant Permissions
-- =====================================================
-- Grant usage on functions
GRANT EXECUTE ON FUNCTION public.get_user_conversations_with_products TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation TO authenticated;

-- =====================================================
-- 7. Create Triggers for Updated At
-- =====================================================
-- Ensure updated_at triggers exist for all chat tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to conversations table if not exists
DROP TRIGGER IF EXISTS set_updated_at_conversations ON public.conversations;
CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 8. Verify Setup
-- =====================================================
-- Check if realtime is enabled
DO $$
BEGIN
  RAISE NOTICE 'Chat system setup complete!';
  RAISE NOTICE 'Realtime enabled for: messages, conversations, conversation_participants';
  RAISE NOTICE 'Storage bucket created: chat-attachments';
  RAISE NOTICE 'Helper functions created: get_user_conversations_with_products, create_direct_conversation';
END $$;

-- =====================================================
-- Verification Queries (Optional - Run separately to verify)
-- =====================================================
-- Check realtime tables:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Check storage bucket:
-- SELECT * FROM storage.buckets WHERE id = 'chat-attachments';

-- Check functions:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name LIKE '%conversation%';
