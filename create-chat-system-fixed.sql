-- ============================================================================
-- Chat System Complete Migration (Fixed)
-- ============================================================================
-- Purpose: Complete chat system setup with RLS policies and functions
-- Context: Fixes "function already exists" error
-- Date: March 23, 2026
-- ============================================================================

-- =====================================================
-- 1. DROP EXISTING FUNCTION FIRST
-- =====================================================
DROP FUNCTION IF EXISTS public.create_direct_conversation(uuid, text, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.create_direct_conversation(uuid, text);
DROP FUNCTION IF EXISTS public.create_direct_conversation(uuid);

-- =====================================================
-- 2. UPDATE CONVERSATION_PARTICIPANTS ROLE CONSTRAINT
-- =====================================================
ALTER TABLE public.conversation_participants 
DROP CONSTRAINT IF EXISTS conversation_participants_role_check;

ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_role_check 
CHECK (role = ANY (ARRAY[
  'customer'::text,
  'seller'::text,
  'factory'::text,
  'middleman'::text,
  'admin'::text,
  'freelancer'::text,
  'service_provider'::text,
  'delivery_driver'::text,
  'doctor'::text,
  'patient'::text,
  'pharmacy'::text
]));

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY ON ALL CHAT TABLES
-- =====================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_conversations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. DROP EXISTING RLS POLICIES (IF ANY)
-- =====================================================
-- General conversations
DROP POLICY IF EXISTS conversations_view_own ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
DROP POLICY IF EXISTS participants_view_own ON public.conversation_participants;
DROP POLICY IF EXISTS participants_insert_own ON public.conversation_participants;
DROP POLICY IF EXISTS messages_view_own ON public.messages;
DROP POLICY IF EXISTS messages_insert_own ON public.messages;
DROP POLICY IF EXISTS messages_update_own ON public.messages;

-- Trading conversations
DROP POLICY IF EXISTS trading_conversations_view_own ON public.trading_conversations;
DROP POLICY IF EXISTS trading_conversations_insert_own ON public.trading_conversations;

-- Health conversations
DROP POLICY IF EXISTS health_conversations_view_own ON public.health_conversations;
DROP POLICY IF EXISTS health_conversations_insert_own ON public.health_conversations;

-- Services conversations
DROP POLICY IF EXISTS services_conversations_view_own ON public.services_conversations;
DROP POLICY IF EXISTS services_conversations_insert_own ON public.services_conversations;

-- =====================================================
-- 5. CREATE RLS POLICIES FOR GENERAL CHAT
-- =====================================================

-- Conversations: Users can view conversations they participate in
CREATE POLICY conversations_view_own ON public.conversations
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Conversations: Users can create conversations
CREATE POLICY conversations_insert_own ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (true);

-- Participants: Users can view their own participation
CREATE POLICY participants_view_own ON public.conversation_participants
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Participants: Users can add themselves to conversations
CREATE POLICY participants_insert_own ON public.conversation_participants
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Messages: Users can view messages in their conversations
CREATE POLICY messages_view_own ON public.messages
FOR SELECT TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Messages: Users can send messages
CREATE POLICY messages_insert_own ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Messages: Users can update their own messages
CREATE POLICY messages_update_own ON public.messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- =====================================================
-- 6. CREATE RLS POLICIES FOR TRADING CHAT
-- =====================================================
CREATE POLICY trading_conversations_view_own ON public.trading_conversations
FOR SELECT TO authenticated
USING (
  initiator_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY trading_conversations_insert_own ON public.trading_conversations
FOR INSERT TO authenticated
WITH CHECK (initiator_id = auth.uid());

-- =====================================================
-- 7. CREATE RLS POLICIES FOR HEALTH CHAT
-- =====================================================
CREATE POLICY health_conversations_view_own ON public.health_conversations
FOR SELECT TO authenticated
USING (
  appointment_id IN (
    SELECT id FROM public.health_appointments
    WHERE doctor_id = (SELECT id FROM public.health_doctor_profiles WHERE user_id = auth.uid())
       OR patient_id = (SELECT id FROM public.health_patient_profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY health_conversations_insert_own ON public.health_conversations
FOR INSERT TO authenticated
WITH CHECK (
  appointment_id IN (
    SELECT id FROM public.health_appointments
    WHERE doctor_id = (SELECT id FROM public.health_doctor_profiles WHERE user_id = auth.uid())
       OR patient_id = (SELECT id FROM public.health_patient_profiles WHERE user_id = auth.uid())
  )
);

-- =====================================================
-- 8. CREATE RLS POLICIES FOR SERVICES CHAT
-- =====================================================
CREATE POLICY services_conversations_view_own ON public.services_conversations
FOR SELECT TO authenticated
USING (
  provider_id = auth.uid() OR client_id = auth.uid()
);

CREATE POLICY services_conversations_insert_own ON public.services_conversations
FOR INSERT TO authenticated
WITH CHECK (provider_id = auth.uid() OR client_id = auth.uid());

-- =====================================================
-- 9. CREATE UNIVERSAL CHAT FUNCTION (FIXED)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_direct_conversation(
  p_target_user_id uuid,
  p_context text DEFAULT 'general'::text,
  p_product_id uuid DEFAULT NULL::uuid,
  p_appointment_id uuid DEFAULT NULL::uuid,
  p_listing_id uuid DEFAULT NULL::uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
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

  -- Check based on context
  IF p_context = 'trading' THEN
    -- Check trading_conversations
    SELECT id INTO v_conversation_id
    FROM public.trading_conversations
    WHERE (initiator_id = auth.uid() AND receiver_id = p_target_user_id)
       OR (initiator_id = p_target_user_id AND receiver_id = auth.uid())
    AND is_archived = false
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      INSERT INTO public.trading_conversations (
        initiator_id, receiver_id, initiator_role, receiver_role,
        product_id, conversation_type
      ) VALUES (
        auth.uid(), p_target_user_id, v_initiator_role, v_receiver_role,
        p_product_id, 'product_inquiry'
      )
      RETURNING id INTO v_conversation_id;
    END IF;

  ELSIF p_context = 'health' THEN
    -- Check health_conversations
    SELECT id INTO v_conversation_id
    FROM public.health_conversations
    WHERE appointment_id = p_appointment_id
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      INSERT INTO public.health_conversations (appointment_id)
      VALUES (p_appointment_id)
      RETURNING id INTO v_conversation_id;
    END IF;

  ELSIF p_context = 'services' THEN
    -- Check services_conversations
    SELECT id INTO v_conversation_id
    FROM public.services_conversations
    WHERE (provider_id = auth.uid() AND client_id = p_target_user_id)
       OR (provider_id = p_target_user_id AND client_id = auth.uid())
    AND listing_id = p_listing_id
    AND is_archived = false
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      INSERT INTO public.services_conversations (
        provider_id, client_id, listing_id
      ) VALUES (
        CASE WHEN v_initiator_role = 'service_provider' THEN auth.uid() ELSE p_target_user_id END,
        CASE WHEN v_initiator_role = 'service_provider' THEN p_target_user_id ELSE auth.uid() END,
        p_listing_id
      )
      RETURNING id INTO v_conversation_id;
    END IF;

  ELSE
    -- General conversations
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() 
      AND cp2.user_id = p_target_user_id
      AND c.is_archived = false
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      INSERT INTO public.conversations (product_id)
      VALUES (p_product_id)
      RETURNING id INTO v_conversation_id;

      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (v_conversation_id, auth.uid(), v_initiator_role);

      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (v_conversation_id, p_target_user_id, v_receiver_role);
    END IF;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- =====================================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON public.conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_trading_conversations_initiator ON public.trading_conversations(initiator_id);
CREATE INDEX IF NOT EXISTS idx_trading_conversations_receiver ON public.trading_conversations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_health_conversations_appointment ON public.health_conversations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_services_conversations_provider ON public.services_conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_conversations_client ON public.services_conversations(client_id);

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON FUNCTION public.create_direct_conversation TO authenticated;
GRANT ALL ON TABLE public.conversations TO authenticated;
GRANT ALL ON TABLE public.conversation_participants TO authenticated;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.trading_conversations TO authenticated;
GRANT ALL ON TABLE public.health_conversations TO authenticated;
GRANT ALL ON TABLE public.services_conversations TO authenticated;

-- =====================================================
-- 12. VERIFICATION
-- =====================================================
DO $$
DECLARE
  v_function_exists boolean;
  v_policies_count integer;
  v_indexes_count integer;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_direct_conversation'
  ) INTO v_function_exists;

  -- Count policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies 
  WHERE tablename IN ('conversations', 'conversation_participants', 'messages', 
                      'trading_conversations', 'health_conversations', 'services_conversations');

  -- Count indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes 
  WHERE tablename IN ('conversations', 'messages', 'conversation_participants',
                      'trading_conversations', 'health_conversations', 'services_conversations');

  IF NOT v_function_exists THEN
    RAISE EXCEPTION '❌ create_direct_conversation function was NOT created!';
  END IF;

  RAISE NOTICE '✅ Chat System Migration Completed Successfully!';
  RAISE NOTICE '   - Function: create_direct_conversation ✓';
  RAISE NOTICE '   - RLS Policies: % ✓', v_policies_count;
  RAISE NOTICE '   - Indexes: % ✓', v_indexes_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Test the function with SELECT public.create_direct_conversation(...)';
  RAISE NOTICE '   2. Verify RLS policies are working correctly';
  RAISE NOTICE '   3. Test chat creation from the UI';
END $$;
