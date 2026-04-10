-- ═══════════════════════════════════════════════════════════════════════
-- AuroraChat Database Setup
-- Unified Chat System for All Account Types
-- ═══════════════════════════════════════════════════════════════════════
-- This script sets up the core conversation system that allows any 
-- account type to communicate with any other account type.
--
-- Features:
-- - Direct and group conversations
-- - Account type auto-population via triggers
-- - Secure RLS policies
-- - Realtime support for live updates
-- - Performance indexes
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Ensure Base Tables Exist
-- ═══════════════════════════════════════════════════════════════════════

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name text DEFAULT 'Direct Chat'::text,
    type text DEFAULT 'direct'::text CHECK (type IN ('direct', 'group')),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    factory_id uuid REFERENCES public.factory_profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_message text,
    last_message_at timestamptz,
    is_archived boolean DEFAULT false,
    context text DEFAULT 'general'::text CHECK (context IN ('general', 'ecommerce', 'health', 'service', 'trading', 'logistics'))
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create conversation_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    account_type text,
    role text,
    last_read_message_id uuid REFERENCES public.messages(id),
    is_muted boolean DEFAULT false,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    content text,
    message_type text DEFAULT 'text'::text CHECK (message_type IN ('text', 'image', 'file', 'call_invite', 'voice_call', 'video_call')),
    attachment_url text,
    attachment_name text,
    attachment_size bigint,
    is_deleted boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Create Indexes for Performance
-- ═══════════════════════════════════════════════════════════════════════

-- Conversations indexes
CREATE INDEX IF NOT EXISTS conversations_type_idx ON public.conversations(type);
CREATE INDEX IF NOT EXISTS conversations_context_idx ON public.conversations(context);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_product_id_idx ON public.conversations(product_id);
CREATE INDEX IF NOT EXISTS conversations_factory_id_idx ON public.conversations(factory_id);

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS conversation_participants_account_type_idx ON public.conversation_participants(account_type);

-- Messages indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_read_at_idx ON public.messages(read_at);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Create Trigger to Auto-Populate Account Type
-- ═══════════════════════════════════════════════════════════════════════

-- Function to auto-populate account_type from users table
CREATE OR REPLACE FUNCTION public.set_participant_account_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Get account_type from users table
    SELECT account_type INTO NEW.account_type
    FROM public.users
    WHERE user_id = NEW.user_id;
    
    -- If account_type is null, default to 'user'
    IF NEW.account_type IS NULL THEN
        NEW.account_type := 'user';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_participant_account_type_trigger ON public.conversation_participants;

-- Create trigger
CREATE TRIGGER set_participant_account_type_trigger
    BEFORE INSERT OR UPDATE OF user_id ON public.conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_participant_account_type();

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Create Helper Functions
-- ═══════════════════════════════════════════════════════════════════════

-- Function to find or create direct conversation between two users
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(
    p_user_id_1 uuid,
    p_user_id_2 uuid
)
RETURNS uuid AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Try to find existing conversation
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = p_user_id_1
    JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = p_user_id_2
    WHERE c.type = 'direct'
    LIMIT 1;
    
    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (name, type)
        VALUES ('Direct Chat', 'direct')
        RETURNING id INTO v_conversation_id;
        
        -- Add participants
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES 
            (v_conversation_id, p_user_id_1),
            (v_conversation_id, p_user_id_2);
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- Function to get conversation with participants
CREATE OR REPLACE FUNCTION public.get_conversation_with_participants(
    p_conversation_id uuid
)
RETURNS TABLE (
    id uuid,
    name text,
    type text,
    created_at timestamptz,
    updated_at timestamptz,
    participant_user_ids uuid[],
    participant_account_types text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.type,
        c.created_at,
        c.updated_at,
        array_agg(cp.user_id),
        array_agg(cp.account_type)
    FROM public.conversations c
    JOIN public.conversation_participants cp ON cp.conversation_id = c.id
    WHERE c.id = p_conversation_id
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Row Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view their participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert their participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can delete their participants" ON public.conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON public.messages;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
    ON public.conversations
    FOR SELECT
    USING (
        id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
    ON public.conversations
    FOR UPDATE
    USING (
        id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their conversations"
    ON public.conversations
    FOR DELETE
    USING (
        id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Conversation participants policies
CREATE POLICY "Users can view their participants"
    ON public.conversation_participants
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their participants"
    ON public.conversation_participants
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participants"
    ON public.conversation_participants
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their participants"
    ON public.conversation_participants
    FOR DELETE
    USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their messages"
    ON public.messages
    FOR UPDATE
    USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their messages"
    ON public.messages
    FOR DELETE
    USING (sender_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Enable Realtime for Live Updates
-- ═══════════════════════════════════════════════════════════════════════

-- Enable realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. Create Storage Bucket for Attachments
-- ═══════════════════════════════════════════════════════════════════════

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files" ON storage.objects;

CREATE POLICY "Users can upload files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'chat-attachments' AND
        owner = auth.uid()
    );

CREATE POLICY "Users can view files in their conversations"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'chat-attachments' AND
        (owner = auth.uid() OR EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            JOIN public.messages m ON m.conversation_id = cp.conversation_id
            WHERE m.attachment_url = storage.objects.name
            AND cp.user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can delete their files"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'chat-attachments' AND
        owner = auth.uid()
    );

-- ═══════════════════════════════════════════════════════════════════════
-- 8. Create Updated At Trigger
-- ═══════════════════════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;

-- Create triggers
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- 9. Validation Queries
-- ═══════════════════════════════════════════════════════════════════════

-- Run these to verify setup:
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') AS conversations_exists;
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_participants') AS participants_exists;
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') AS messages_exists;
-- SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_participant_account_type_trigger') AS trigger_exists;

-- ═══════════════════════════════════════════════════════════════════════
-- Setup Complete! ✅
-- ═══════════════════════════════════════════════════════════════════════
-- Your AuroraChat system is now ready to use.
-- 
-- Next steps:
-- 1. Verify all tables exist in Supabase Dashboard
-- 2. Test creating a conversation using the useConversation hook
-- 3. Check RLS policies are working correctly
-- 4. Test realtime updates by sending messages in multiple browsers
-- ═══════════════════════════════════════════════════════════════════════
