-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Chat System Database Errors (SAFE VERSION)
-- Resolves 404 and 500 errors in conversation tables
-- ═══════════════════════════════════════════════════════════════════════
-- This version checks if tables exist before creating foreign keys
-- Run this script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Fix conversation_participants Table (500 Error)
-- ═══════════════════════════════════════════════════════════════════════

-- Ensure conversation_participants has the account_type column
ALTER TABLE public.conversation_participants 
ADD COLUMN IF NOT EXISTS account_type text;

-- Create index on account_type
CREATE INDEX IF NOT EXISTS conversation_participants_account_type_idx 
ON public.conversation_participants(account_type);

-- Fix: Ensure user_id foreign key references correctly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_participants_user_id_fkey'
        AND table_name = 'conversation_participants'
    ) THEN
        ALTER TABLE public.conversation_participants
        ADD CONSTRAINT conversation_participants_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix: Ensure conversation_id foreign key exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_participants_conversation_id_fkey'
        AND table_name = 'conversation_participants'
    ) THEN
        ALTER TABLE public.conversation_participants
        ADD CONSTRAINT conversation_participants_conversation_id_fkey
        FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Create Missing services_conversations Table (404 Error)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.services_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    provider_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    listing_id uuid,  -- No FK constraint to avoid errors if service_listings doesn't exist
    last_message text,
    last_message_at timestamptz,
    is_archived boolean DEFAULT false,
    is_read_by_provider boolean DEFAULT false,
    is_read_by_client boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services_conversations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS services_conversations_provider_id_idx 
ON public.services_conversations(provider_id);
CREATE INDEX IF NOT EXISTS services_conversations_client_id_idx 
ON public.services_conversations(client_id);
CREATE INDEX IF NOT EXISTS services_conversations_last_message_at_idx 
ON public.services_conversations(last_message_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Create Missing services_messages Table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.services_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.services_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    content text,
    message_type text DEFAULT 'text'::text,
    attachment_url text,
    attachment_name text,
    attachment_size bigint,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS services_messages_conversation_id_idx 
ON public.services_messages(conversation_id);
CREATE INDEX IF NOT EXISTS services_messages_sender_id_idx 
ON public.services_messages(sender_id);
CREATE INDEX IF NOT EXISTS services_messages_created_at_idx 
ON public.services_messages(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Create Missing trading_conversations Table (404 Error)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.trading_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_type text NOT NULL CHECK (conversation_type IN (
        'product_inquiry', 
        'custom_request', 
        'deal_negotiation', 
        'factory_order'
    )),
    product_id uuid,  -- No FK constraint to avoid errors
    deal_id uuid,
    initiator_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    initiator_role text NOT NULL,
    receiver_role text NOT NULL,
    is_custom_request boolean DEFAULT false,
    custom_request_details jsonb,
    factory_id uuid,  -- No FK constraint to avoid errors
    middleman_id uuid,  -- No FK constraint to avoid errors
    last_message text,
    last_message_at timestamptz,
    is_archived boolean DEFAULT false,
    is_closed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_conversations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS trading_conversations_initiator_id_idx 
ON public.trading_conversations(initiator_id);
CREATE INDEX IF NOT EXISTS trading_conversations_receiver_id_idx 
ON public.trading_conversations(receiver_id);
CREATE INDEX IF NOT EXISTS trading_conversations_last_message_at_idx 
ON public.trading_conversations(last_message_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Create Missing trading_messages Table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.trading_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.trading_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    content text,
    message_type text DEFAULT 'text'::text,
    attachment_url text,
    attachment_name text,
    attachment_size bigint,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS trading_messages_conversation_id_idx 
ON public.trading_messages(conversation_id);
CREATE INDEX IF NOT EXISTS trading_messages_sender_id_idx 
ON public.trading_messages(sender_id);
CREATE INDEX IF NOT EXISTS trading_messages_created_at_idx 
ON public.trading_messages(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Create Missing health_conversations Table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.health_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    appointment_id uuid NOT NULL,  -- No FK constraint to avoid errors
    last_message text,
    last_message_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_conversations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS health_conversations_appointment_id_idx 
ON public.health_conversations(appointment_id);
CREATE INDEX IF NOT EXISTS health_conversations_last_message_at_idx 
ON public.health_conversations(last_message_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. Create Missing health_messages Table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.health_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.health_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    content text,
    message_type text DEFAULT 'text'::text,
    attachment_url text,
    attachment_name text,
    attachment_size bigint,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS health_messages_conversation_id_idx 
ON public.health_messages(conversation_id);
CREATE INDEX IF NOT EXISTS health_messages_sender_id_idx 
ON public.health_messages(sender_id);
CREATE INDEX IF NOT EXISTS health_messages_created_at_idx 
ON public.health_messages(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 8. Fix RLS Policies for conversation_participants
-- ═══════════════════════════════════════════════════════════════════════

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert their participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can delete their participants" ON public.conversation_participants;

-- Create new RLS policies
CREATE POLICY "Users can view their participants"
    ON public.conversation_participants
    FOR SELECT
    USING (
        user_id = auth.uid() OR
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

-- ═══════════════════════════════════════════════════════════════════════
-- 9. RLS Policies for services_conversations
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Providers can view their services conversations" ON public.services_conversations;
DROP POLICY IF EXISTS "Clients can view their services conversations" ON public.services_conversations;
DROP POLICY IF EXISTS "Users can insert services conversations" ON public.services_conversations;
DROP POLICY IF EXISTS "Users can update services conversations" ON public.services_conversations;

CREATE POLICY "Providers can view their services conversations"
    ON public.services_conversations
    FOR SELECT
    USING (provider_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Clients can view their services conversations"
    ON public.services_conversations
    FOR SELECT
    USING (provider_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Users can insert services conversations"
    ON public.services_conversations
    FOR INSERT
    WITH CHECK (provider_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Users can update services conversations"
    ON public.services_conversations
    FOR UPDATE
    USING (provider_id = auth.uid() OR client_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- 10. RLS Policies for services_messages
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view services messages" ON public.services_messages;
DROP POLICY IF EXISTS "Users can insert services messages" ON public.services_messages;

CREATE POLICY "Users can view services messages"
    ON public.services_messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id 
            FROM public.services_conversations 
            WHERE provider_id = auth.uid() OR client_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert services messages"
    ON public.services_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id 
            FROM public.services_conversations 
            WHERE provider_id = auth.uid() OR client_id = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════════════════
-- 11. RLS Policies for trading_conversations
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their trading conversations" ON public.trading_conversations;
DROP POLICY IF EXISTS "Users can insert trading conversations" ON public.trading_conversations;
DROP POLICY IF EXISTS "Users can update trading conversations" ON public.trading_conversations;

CREATE POLICY "Users can view their trading conversations"
    ON public.trading_conversations
    FOR SELECT
    USING (initiator_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert trading conversations"
    ON public.trading_conversations
    FOR INSERT
    WITH CHECK (initiator_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can update trading conversations"
    ON public.trading_conversations
    FOR UPDATE
    USING (initiator_id = auth.uid() OR receiver_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- 12. RLS Policies for trading_messages
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view trading messages" ON public.trading_messages;
DROP POLICY IF EXISTS "Users can insert trading messages" ON public.trading_messages;

CREATE POLICY "Users can view trading messages"
    ON public.trading_messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id 
            FROM public.trading_conversations 
            WHERE initiator_id = auth.uid() OR receiver_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trading messages"
    ON public.trading_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id 
            FROM public.trading_conversations 
            WHERE initiator_id = auth.uid() OR receiver_id = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════════════════
-- 13. Enable Realtime for All Tables
-- ═══════════════════════════════════════════════════════════════════════

-- Add tables to realtime publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversation_participants;
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.services_conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.services_messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.trading_conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.trading_messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.health_conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.health_messages;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 14. Create Helper Functions
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_services_conversation(
    p_provider_id uuid,
    p_client_id uuid,
    p_listing_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    SELECT id INTO v_conversation_id
    FROM public.services_conversations
    WHERE provider_id = p_provider_id
      AND client_id = p_client_id
      AND listing_id IS NOT DISTINCT FROM p_listing_id
      AND is_archived = false
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.services_conversations (provider_id, client_id, listing_id)
        VALUES (p_provider_id, p_client_id, p_listing_id)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 15. Create Helper Function for Trading Conversations
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_trading_conversation(
    p_initiator_id uuid,
    p_receiver_id uuid,
    p_conversation_type text,
    p_product_id uuid DEFAULT NULL,
    p_initiator_role text DEFAULT 'user',
    p_receiver_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    SELECT id INTO v_conversation_id
    FROM public.trading_conversations
    WHERE initiator_id = p_initiator_id
      AND receiver_id = p_receiver_id
      AND is_archived = false
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.trading_conversations (
            conversation_type,
            initiator_id,
            receiver_id,
            initiator_role,
            receiver_role,
            product_id
        )
        VALUES (
            p_conversation_type,
            p_initiator_id,
            p_receiver_id,
            COALESCE(p_initiator_role, 'user'),
            COALESCE(p_receiver_role, 'user'),
            p_product_id
        )
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 16. Update updated_at Triggers
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_services_conversations_updated_at ON public.services_conversations;
CREATE TRIGGER update_services_conversations_updated_at
    BEFORE UPDATE ON public.services_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_conversations_updated_at ON public.trading_conversations;
CREATE TRIGGER update_trading_conversations_updated_at
    BEFORE UPDATE ON public.trading_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_conversations_updated_at ON public.health_conversations;
CREATE TRIGGER update_health_conversations_updated_at
    BEFORE UPDATE ON public.health_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Setup Complete!
-- ═══════════════════════════════════════════════════════════════════════
-- All tables and policies have been created/fixed.
-- Refresh your app and the errors should be gone!
-- ═══════════════════════════════════════════════════════════════════════
