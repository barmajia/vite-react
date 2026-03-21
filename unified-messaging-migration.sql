-- ============================================================
-- UNIFIED MESSAGING SYSTEM MIGRATION
-- Aurora E-commerce Platform
-- ============================================================
-- This migration consolidates all messaging systems into one:
-- - Product/Trading conversations
-- - Services conversations
-- - Healthcare conversations
-- - Factory deal conversations
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE conversation_context AS ENUM (
    'product',      -- Buyer-seller product discussions
    'service',      -- Service provider-client communication
    'healthcare',   -- Doctor-patient medical consultations
    'factory',      -- Factory deal negotiations
    'support',      -- Customer support chats
    'general'       -- General user-to-user chats
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type_enum AS ENUM (
    'text',
    'image',
    'file',
    'system',
    'deal_proposal',
    'deal_counter',
    'deal_accepted',
    'deal_rejected',
    'prescription',
    'appointment_reminder'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- STEP 2: CREATE UNIFIED TABLES
-- ============================================================

-- Unified Conversations Table
CREATE TABLE IF NOT EXISTS unified_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Context & Type
  context conversation_context NOT NULL DEFAULT 'general',
  conversation_type TEXT DEFAULT 'general',
  
  -- Participants (always 2 users)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context-specific references (nullable based on context)
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_listing_id UUID REFERENCES public.service_listings(id) ON DELETE CASCADE,
  healthcare_appointment_id UUID REFERENCES public.health_appointments(id) ON DELETE CASCADE,
  factory_deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  
  -- State
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints to ensure context has required reference
  CONSTRAINT check_context_product CHECK (
    context != 'product' OR product_id IS NOT NULL
  ),
  CONSTRAINT check_context_service CHECK (
    context != 'service' OR service_listing_id IS NOT NULL
  ),
  CONSTRAINT check_context_healthcare CHECK (
    context != 'healthcare' OR healthcare_appointment_id IS NOT NULL
  ),
  
  -- Unique constraint to prevent duplicate conversations
  CONSTRAINT unique_conversation UNIQUE (
    user_id, 
    participant_id, 
    context, 
    COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(service_listing_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(healthcare_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
);

-- Unified Messages Table
CREATE TABLE IF NOT EXISTS unified_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES unified_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT,
  message_type TEXT DEFAULT 'text',
  message_subtype TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size BIGINT,
  
  -- State
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata (reactions, edits, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Full-text search
  content_tsvector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(content, ''))
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: CREATE INDEXES
-- ============================================================

-- Conversations indexes
DROP INDEX IF EXISTS idx_unified_conv_user;
CREATE INDEX idx_unified_conv_user ON unified_conversations(user_id, updated_at DESC);

DROP INDEX IF EXISTS idx_unified_conv_participant;
CREATE INDEX idx_unified_conv_participant ON unified_conversations(participant_id, updated_at DESC);

DROP INDEX IF EXISTS idx_unified_conv_context;
CREATE INDEX idx_unified_conv_context ON unified_conversations(context);

DROP INDEX IF EXISTS idx_unified_conv_product;
CREATE INDEX idx_unified_conv_product ON unified_conversations(product_id);

DROP INDEX IF EXISTS idx_unified_conv_service;
CREATE INDEX idx_unified_conv_service ON unified_conversations(service_listing_id);

DROP INDEX IF EXISTS idx_unified_conv_health;
CREATE INDEX idx_unified_conv_health ON unified_conversations(healthcare_appointment_id);

DROP INDEX IF EXISTS idx_unified_conv_updated;
CREATE INDEX idx_unified_conv_updated ON unified_conversations(updated_at DESC);

-- Messages indexes
DROP INDEX IF EXISTS idx_unified_msg_conv;
CREATE INDEX idx_unified_msg_conv ON unified_messages(conversation_id, created_at DESC);

DROP INDEX IF EXISTS idx_unified_msg_sender;
CREATE INDEX idx_unified_msg_sender ON unified_messages(sender_id);

DROP INDEX IF EXISTS idx_unified_msg_search;
CREATE INDEX idx_unified_msg_search ON unified_messages USING GIN(content_tsvector);

DROP INDEX IF EXISTS idx_unified_msg_type;
CREATE INDEX idx_unified_msg_type ON unified_messages(message_type);

DROP INDEX IF EXISTS idx_unified_msg_read;
CREATE INDEX idx_unified_msg_read ON unified_messages(is_read, sender_id);

-- ============================================================
-- STEP 4: CREATE TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_unified_timestamps()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_unified_conv_timestamp ON unified_conversations;
CREATE TRIGGER update_unified_conv_timestamp
  BEFORE UPDATE ON unified_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_timestamps();

-- Update conversation on new message
CREATE OR REPLACE FUNCTION update_unified_conv_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE unified_conversations
    SET
      last_message = CASE
        WHEN NEW.message_type = 'image' THEN '📷 Image'
        WHEN NEW.message_type = 'file' THEN '📎 Attachment'
        WHEN NEW.message_type = 'deal_proposal' THEN '🤝 Deal proposal'
        WHEN NEW.message_type = 'prescription' THEN '💊 Prescription'
        ELSE LEFT(COALESCE(NEW.content, ''), 60)
      END,
      last_message_at = NEW.created_at,
      updated_at = NOW(),
      is_archived = FALSE
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_unified_conv_update ON unified_messages;
CREATE TRIGGER trigger_unified_conv_update
  AFTER INSERT ON unified_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_conv_on_message();

-- ============================================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
DROP POLICY IF EXISTS "users_view_own_conversations" ON unified_conversations;
CREATE POLICY "users_view_own_conversations" ON unified_conversations
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR participant_id = auth.uid()
);

DROP POLICY IF EXISTS "users_create_conversations" ON unified_conversations;
CREATE POLICY "users_create_conversations" ON unified_conversations
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "users_update_own_conversations" ON unified_conversations;
CREATE POLICY "users_update_own_conversations" ON unified_conversations
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR participant_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid() OR participant_id = auth.uid()
);

-- Messages Policies
DROP POLICY IF EXISTS "users_view_messages" ON unified_messages;
CREATE POLICY "users_view_messages" ON unified_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM unified_conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR c.participant_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "users_send_messages" ON unified_messages;
CREATE POLICY "users_send_messages" ON unified_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM unified_conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR c.participant_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "users_update_own_messages" ON unified_messages;
CREATE POLICY "users_update_own_messages" ON unified_messages
FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM unified_conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR c.participant_id = auth.uid())
  )
);

-- ============================================================
-- STEP 6: HELPER FUNCTIONS
-- ============================================================

-- Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_unified_conversation(
  p_participant_id UUID,
  p_context conversation_context,
  p_product_id UUID DEFAULT NULL,
  p_service_listing_id UUID DEFAULT NULL,
  p_healthcare_appointment_id UUID DEFAULT NULL,
  p_factory_deal_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM unified_conversations
  WHERE (
    (user_id = v_user_id AND participant_id = p_participant_id) OR
    (user_id = p_participant_id AND participant_id = v_user_id)
  )
  AND context = p_context
  AND COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(p_product_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND COALESCE(service_listing_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(p_service_listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND COALESCE(healthcare_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(p_healthcare_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_conversation_id IS NULL THEN
    -- Create new conversation
    INSERT INTO unified_conversations (
      user_id,
      participant_id,
      context,
      product_id,
      service_listing_id,
      healthcare_appointment_id,
      factory_deal_id,
      metadata
    ) VALUES (
      v_user_id,
      p_participant_id,
      p_context,
      p_product_id,
      p_service_listing_id,
      p_healthcare_appointment_id,
      p_factory_deal_id,
      p_metadata
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's conversations with unread counts
CREATE OR REPLACE FUNCTION get_user_unified_conversations(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  context conversation_context,
  conversation_type TEXT,
  user_id UUID,
  participant_id UUID,
  product_id UUID,
  service_listing_id UUID,
  healthcare_appointment_id UUID,
  factory_deal_id UUID,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  other_user JSONB,
  context_data JSONB,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id,
    uc.context,
    uc.conversation_type,
    uc.user_id,
    uc.participant_id,
    uc.product_id,
    uc.service_listing_id,
    uc.healthcare_appointment_id,
    uc.factory_deal_id,
    uc.last_message,
    uc.last_message_at,
    uc.is_archived,
    uc.metadata,
    uc.created_at,
    uc.updated_at,
    -- Get other user info
    (
      SELECT jsonb_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'avatar_url', u.avatar_url
      )
      FROM users u
      WHERE u.id = CASE 
        WHEN uc.user_id = auth.uid() THEN uc.participant_id 
        ELSE uc.user_id 
      END
    )::jsonb AS other_user,
    -- Get context-specific data
    (
      CASE uc.context
        WHEN 'product' THEN (
          SELECT jsonb_build_object('title', p.title, 'price', p.price)
          FROM products p WHERE p.id = uc.product_id
        )
        WHEN 'service' THEN (
          SELECT jsonb_build_object('title', sl.title, 'price', sl.price)
          FROM service_listings sl WHERE sl.id = uc.service_listing_id
        )
        WHEN 'healthcare' THEN (
          SELECT jsonb_build_object('scheduled_at', ha.scheduled_at, 'status', ha.status)
          FROM health_appointments ha WHERE ha.id = uc.healthcare_appointment_id
        )
        WHEN 'factory' THEN (
          SELECT jsonb_build_object('title', d.title, 'status', d.status)
          FROM deals d WHERE d.id = uc.factory_deal_id
        )
        ELSE NULL
      END
    )::jsonb AS context_data,
    -- Get unread count
    (
      SELECT COUNT(*)
      FROM unified_messages um
      WHERE um.conversation_id = uc.id
      AND um.sender_id != auth.uid()
      AND um.is_read = FALSE
    ) AS unread_count
  FROM unified_conversations uc
  WHERE uc.user_id = auth.uid() OR uc.participant_id = auth.uid()
  ORDER BY uc.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 7: DATA MIGRATION (COMMENTED OUT - RUN MANUALLY)
-- ============================================================

-- IMPORTANT: Run these migrations manually after testing in staging
-- Uncomment each section after verification

-- -- Migrate Product/Trading conversations
-- INSERT INTO unified_conversations (
--   id, context, conversation_type, user_id, participant_id,
--   product_id, last_message, last_message_at, is_archived, metadata,
--   created_at, updated_at
-- )
-- SELECT 
--   tc.id, 'product', COALESCE(tc.conversation_type, 'general'),
--   tc.initiator_id, tc.receiver_id,
--   tc.product_id, tc.last_message, tc.last_message_at, 
--   COALESCE(tc.is_archived, false),
--   jsonb_build_object('deal_id', tc.deal_id),
--   tc.created_at, tc.updated_at
-- FROM trading_conversations tc
-- WHERE NOT EXISTS (
--   SELECT 1 FROM unified_conversations uc WHERE uc.id = tc.id
-- );

-- -- Migrate Services conversations
-- INSERT INTO unified_conversations (
--   id, context, user_id, participant_id, service_listing_id,
--   last_message, last_message_at, metadata, created_at, updated_at
-- )
-- SELECT 
--   sc.id, 'service', sc.provider_id, sc.client_id, sc.listing_id,
--   sc.last_message, sc.last_message_at,
--   jsonb_build_object(
--     'is_read_by_provider', sc.is_read_by_provider,
--     'is_read_by_client', sc.is_read_by_client
--   ),
--   sc.created_at, sc.updated_at
-- FROM services_conversations sc
-- WHERE NOT EXISTS (
--   SELECT 1 FROM unified_conversations uc WHERE uc.id = sc.id
-- );

-- -- Migrate Healthcare conversations
-- INSERT INTO unified_conversations (
--   id, context, user_id, participant_id, healthcare_appointment_id,
--   created_at, updated_at
-- )
-- SELECT 
--   hc.id, 'healthcare',
--   (SELECT doctor_id FROM health_appointments WHERE id = hc.appointment_id),
--   (SELECT patient_id FROM health_appointments WHERE id = hc.appointment_id),
--   hc.appointment_id,
--   hc.created_at, hc.updated_at
-- FROM health_conversations hc
-- WHERE NOT EXISTS (
--   SELECT 1 FROM unified_conversations uc WHERE uc.id = hc.id
-- );

-- -- Migrate Messages (after conversations are migrated)
-- -- Product messages
-- INSERT INTO unified_messages (
--   conversation_id, sender_id, content, message_type,
--   attachment_url, is_read, read_at, created_at
-- )
-- SELECT tm.conversation_id, tm.sender_id, tm.content, tm.message_type,
--        tm.attachment_url, tm.is_read, tm.read_at, tm.created_at
-- FROM trading_messages tm
-- WHERE NOT EXISTS (
--   SELECT 1 FROM unified_messages um WHERE um.id = tm.id
-- );

-- -- Services messages
-- INSERT INTO unified_messages (
--   conversation_id, sender_id, content, message_type,
--   attachment_url, is_read, read_at, created_at
-- )
-- SELECT sm.conversation_id, sm.sender_id, sm.content, sm.message_type,
--        sm.attachment_url, sm.is_read, sm.read_at, sm.created_at
-- FROM services_messages sm
-- WHERE NOT EXISTS (
--   SELECT 1 FROM unified_messages um WHERE um.id = sm.id
-- );

-- -- Healthcare messages
-- INSERT INTO unified_messages (
--   conversation_id, sender_id, content, message_type,
--   attachment_url, created_at
-- )
-- SELECT hm.conversation_id, hm.sender_id, hm.content, hm.message_type,
--        hm.attachment_url, hm.created_at
-- FROM health_messages hm
-- WHERE NOT EXISTS (
--   SELECT 1 FROM unified_messages um WHERE um.id = hm.id
-- );

-- ============================================================
-- STEP 8: CREATE BACKWARD COMPATIBILITY VIEWS
-- ============================================================

-- These views allow old code to continue working during migration

CREATE OR REPLACE VIEW trading_conversations AS
SELECT 
  id,
  user_id AS initiator_id,
  participant_id AS receiver_id,
  product_id,
  factory_deal_id AS deal_id,
  conversation_type,
  last_message,
  last_message_at,
  is_archived,
  created_at,
  updated_at
FROM unified_conversations
WHERE context = 'product';

CREATE OR REPLACE VIEW services_conversations AS
SELECT 
  id,
  user_id AS provider_id,
  participant_id AS client_id,
  service_listing_id AS listing_id,
  last_message,
  last_message_at,
  is_archived,
  (metadata->>'is_read_by_provider')::boolean AS is_read_by_provider,
  (metadata->>'is_read_by_client')::boolean AS is_read_by_client,
  created_at,
  updated_at
FROM unified_conversations
WHERE context = 'service';

CREATE OR REPLACE VIEW health_conversations AS
SELECT 
  id,
  healthcare_appointment_id AS appointment_id,
  created_at,
  updated_at
FROM unified_conversations
WHERE context = 'healthcare';

CREATE OR REPLACE VIEW trading_messages AS
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  message_type,
  attachment_url,
  is_read,
  read_at,
  created_at
FROM unified_messages;

CREATE OR REPLACE VIEW services_messages AS
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  message_type,
  attachment_url,
  is_read,
  read_at,
  created_at
FROM unified_messages
WHERE EXISTS (
  SELECT 1 FROM unified_conversations uc
  WHERE uc.id = conversation_id
  AND uc.context = 'service'
);

CREATE OR REPLACE VIEW health_messages AS
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  message_type,
  attachment_url,
  created_at
FROM unified_messages
WHERE EXISTS (
  SELECT 1 FROM unified_conversations uc
  WHERE uc.id = conversation_id
  AND uc.context = 'healthcare'
);

-- ============================================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON TABLE unified_conversations TO authenticated;
GRANT ALL ON TABLE unified_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_unified_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unified_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION update_unified_conv_on_message TO authenticated;
GRANT EXECUTE ON FUNCTION update_unified_timestamps TO authenticated;

-- ============================================================
-- STEP 10: VERIFICATION QUERIES
-- ============================================================

-- Verify tables created
SELECT 
  table_name,
  'Created' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('unified_conversations', 'unified_messages')
ORDER BY table_name;

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_unified_%'
ORDER BY tablename;

-- Verify triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%unified%'
ORDER BY trigger_name;

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'unified_%'
ORDER BY tablename, policyname;

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================
-- Next steps:
-- 1. Test in staging environment
-- 2. Run data migration queries (commented in Step 7)
-- 3. Deploy unified messaging UI components
-- 4. Monitor for 30 days
-- 5. Deprecate old tables
-- ============================================================
