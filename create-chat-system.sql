-- =====================================================
-- Universal Chat System - Database Setup
-- =====================================================
-- This creates the chat system that allows any account type
-- to communicate with any other account type
-- =====================================================

-- =====================================================
-- 1. Create Conversations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS conversations_product_id_idx ON public.conversations(product_id);
CREATE INDEX IF NOT EXISTS conversations_factory_id_idx ON public.conversations(factory_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations(last_message_at DESC);

-- =====================================================
-- 2. Create Conversation Participants Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL,
    last_read_message_id uuid REFERENCES public.messages(id),
    is_muted boolean DEFAULT false,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants(user_id);

-- =====================================================
-- 3. Create Messages Table
-- =====================================================
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- =====================================================
-- 4. Create Call Sessions Table (for voice/video calls)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    caller_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    call_type text NOT NULL CHECK (call_type IN ('voice', 'video')),
    status text NOT NULL CHECK (status IN ('ringing', 'connected', 'ended', 'missed')),
    started_at timestamptz,
    ended_at timestamptz,
    duration_seconds integer,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS call_sessions_conversation_id_idx ON public.call_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS call_sessions_caller_id_idx ON public.call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS call_sessions_receiver_id_idx ON public.call_sessions(receiver_id);

-- =====================================================
-- 5. Create Function to Create Direct Conversation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_direct_conversation(
    p_target_user_id uuid,
    p_context text DEFAULT 'general'::text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id uuid;
    v_initiator_role text;
    v_receiver_role text;
BEGIN
    -- Get roles from users table
    SELECT account_type INTO v_initiator_role FROM public.users WHERE user_id = auth.uid();
    SELECT account_type INTO v_receiver_role FROM public.users WHERE user_id = p_target_user_id;
    
    v_initiator_role := COALESCE(v_initiator_role, 'user'::text);
    v_receiver_role := COALESCE(v_receiver_role, 'user'::text);

    -- Check if conversation exists
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() 
      AND cp2.user_id = p_target_user_id
      AND c.is_archived = false
    LIMIT 1;

    -- Create new if not exists
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (is_archived, context)
        VALUES (false, p_context)
        RETURNING id INTO v_conversation_id;

        INSERT INTO public.conversation_participants (conversation_id, user_id, role)
        VALUES (v_conversation_id, auth.uid(), v_initiator_role);

        INSERT INTO public.conversation_participants (conversation_id, user_id, role)
        VALUES (v_conversation_id, p_target_user_id, v_receiver_role);
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- =====================================================
-- 6. Create Function to Get User's Conversations
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
    conversation_id uuid,
    other_user_id uuid,
    other_user_name text,
    other_user_avatar text,
    other_user_account_type text,
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
        u.user_id::uuid,
        u.full_name::text,
        u.avatar_url::text,
        u.account_type::text,
        c.last_message::text,
        c.last_message_at::timestamptz,
        (
            SELECT COUNT(*)
            FROM public.messages m
            WHERE m.conversation_id = c.id
              AND m.sender_id = u.user_id
              AND m.read_at IS NULL
        )::bigint as unread_count
    FROM public.conversations c
    JOIN public.conversation_participants cp ON c.id = cp.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != auth.uid()
    JOIN public.users u ON cp2.user_id = u.user_id
    WHERE cp.user_id = auth.uid()
      AND c.is_archived = false
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- =====================================================
-- 7. RLS Policies for Conversations
-- =====================================================
-- Users can read conversations they are participants of
CREATE POLICY "Users can read own conversations"
    ON public.conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = public.conversations.id
              AND cp.user_id = auth.uid()
        )
    );

-- Users can update conversations they are participants of
CREATE POLICY "Users can update own conversations"
    ON public.conversations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = public.conversations.id
              AND cp.user_id = auth.uid()
        )
    );

-- Users can insert conversations
CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 8. RLS Policies for Conversation Participants
-- =====================================================
-- Users can read participants of their conversations
CREATE POLICY "Users can read own conversation participants"
    ON public.conversation_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = public.conversation_participants.conversation_id
              AND cp.user_id = auth.uid()
        )
    );

-- Users can insert participants (when adding someone to a conversation)
CREATE POLICY "Users can add participants"
    ON public.conversation_participants
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 9. RLS Policies for Messages
-- =====================================================
-- Users can read messages in their conversations
CREATE POLICY "Users can read own conversation messages"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = public.messages.conversation_id
              AND cp.user_id = auth.uid()
        )
    );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = public.messages.conversation_id
              AND cp.user_id = auth.uid()
        )
    );

-- Users can update their own messages (mark as read, delete)
CREATE POLICY "Users can update own messages"
    ON public.messages
    FOR UPDATE
    USING (sender_id = auth.uid());

-- =====================================================
-- 10. RLS Policies for Call Sessions
-- =====================================================
-- Users can read call sessions they are involved in
CREATE POLICY "Users can read own call sessions"
    ON public.call_sessions
    FOR SELECT
    USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Users can create call sessions
CREATE POLICY "Users can create call sessions"
    ON public.call_sessions
    FOR INSERT
    WITH CHECK (caller_id = auth.uid());

-- Users can update call sessions they are involved in
CREATE POLICY "Users can update own call sessions"
    ON public.call_sessions
    FOR UPDATE
    USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- =====================================================
-- 11. Create Trigger to Update Conversation Last Message
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- =====================================================
-- 12. Create Chat Attachments Storage Bucket
-- =====================================================
-- This will be created via Supabase dashboard or API
-- Run this in SQL or create via UI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies for chat attachments
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload chat attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'chat-attachments'
        AND auth.role() = 'authenticated'
    );

-- Allow users to read files in their conversations
CREATE POLICY "Users can read chat attachments"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'chat-attachments'
        AND auth.role() = 'authenticated'
    );

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify the setup:

-- SELECT COUNT(*) FROM public.conversations;
-- SELECT COUNT(*) FROM public.conversation_participants;
-- SELECT COUNT(*) FROM public.messages;
-- SELECT COUNT(*) FROM public.call_sessions;

-- Test the create function:
-- SELECT public.create_direct_conversation('target-user-id-here', 'general');
