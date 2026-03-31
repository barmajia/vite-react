-- ============================================================================
-- COMPLETE CHAT & USER ACCOUNT TYPE UNIFICATION FIX
-- ============================================================================
-- This file fixes the account_type population issue where all users default to 'user'
-- and implements proper chat routing with context awareness (product, patient, etc.)

-- ============================================================================
-- 1. CREATE HELPER FUNCTION: Detect user's actual account type
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_user_account_type(uuid);

CREATE OR REPLACE FUNCTION public.get_user_account_type(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_account_type text;
BEGIN
  -- Check in order of priority
  -- Check if they're a factory (seller with is_factory = true)
  IF EXISTS (SELECT 1 FROM public.sellers WHERE user_id = p_user_id AND is_factory = true LIMIT 1) THEN
    RETURN 'factory';
  -- Check if they're a regular seller
  ELSIF EXISTS (SELECT 1 FROM public.sellers WHERE user_id = p_user_id AND (is_factory IS NULL OR is_factory = false) LIMIT 1) THEN
    RETURN 'seller';
  -- Check if they're a doctor
  ELSIF EXISTS (SELECT 1 FROM public.health_doctor_profiles WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN 'doctor';
  -- Check if they're a patient
  ELSIF EXISTS (SELECT 1 FROM public.health_patient_profiles WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN 'patient';
  -- Check if they're a delivery driver
  ELSIF EXISTS (SELECT 1 FROM public.delivery_profiles WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN 'delivery';
  ELSE
    RETURN 'customer';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_account_type(uuid) TO authenticated, anon;

-- ============================================================================
-- 2. UPDATE EXISTING USERS: Set correct account_type based on actual profiles
-- ============================================================================
UPDATE public.users u
SET account_type = public.get_user_account_type(u.user_id)
WHERE account_type = 'user' OR account_type IS NULL;

-- ============================================================================
-- 3. CREATE TRIGGER: Auto-update account_type when seller profile is created
-- ============================================================================
DROP TRIGGER IF EXISTS update_user_account_type_on_seller_create ON public.sellers;
DROP FUNCTION IF EXISTS public.trigger_update_user_type_on_seller();

CREATE OR REPLACE FUNCTION public.trigger_update_user_type_on_seller()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.users
  SET account_type = 'seller', updated_at = NOW()
  WHERE user_id = NEW.user_id AND account_type != 'seller';
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_account_type_on_seller_create
AFTER INSERT ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_type_on_seller();

-- ============================================================================
-- 4. CREATE TRIGGER: Auto-update account_type when doctor profile is created
-- ============================================================================
DROP TRIGGER IF EXISTS update_user_account_type_on_doctor_create ON public.health_doctor_profiles;
DROP FUNCTION IF EXISTS public.trigger_update_user_type_on_doctor();

CREATE OR REPLACE FUNCTION public.trigger_update_user_type_on_doctor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.users
  SET account_type = 'doctor', updated_at = NOW()
  WHERE user_id = NEW.user_id AND account_type != 'doctor';
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_account_type_on_doctor_create
AFTER INSERT ON public.health_doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_type_on_doctor();

-- ============================================================================
-- 5. CREATE TRIGGER: Auto-update account_type when patient profile is created
-- ============================================================================
DROP TRIGGER IF EXISTS update_user_account_type_on_patient_create ON public.health_patient_profiles;
DROP FUNCTION IF EXISTS public.trigger_update_user_type_on_patient();

CREATE OR REPLACE FUNCTION public.trigger_update_user_type_on_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.users
  SET account_type = 'patient', updated_at = NOW()
  WHERE user_id = NEW.user_id AND account_type NOT IN ('doctor', 'seller', 'delivery', 'factory');
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_account_type_on_patient_create
AFTER INSERT ON public.health_patient_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_type_on_patient();

-- ============================================================================
-- 6. CREATE TRIGGER: Auto-update account_type when delivery profile is created
-- ============================================================================
DROP TRIGGER IF EXISTS update_user_account_type_on_delivery_create ON public.delivery_profiles;
DROP FUNCTION IF EXISTS public.trigger_update_user_type_on_delivery();

CREATE OR REPLACE FUNCTION public.trigger_update_user_type_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.users
  SET account_type = 'delivery', updated_at = NOW()
  WHERE user_id = NEW.user_id AND account_type != 'delivery';
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_account_type_on_delivery_create
AFTER INSERT ON public.delivery_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_type_on_delivery();

-- ============================================================================
-- 7. ENHANCE conversations TABLE: Add context columns for product/patient chats
-- ============================================================================
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS context_type text DEFAULT 'general' CHECK (context_type IN ('general', 'product', 'patient', 'order', 'service')),
ADD COLUMN IF NOT EXISTS context_id uuid,
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS context text DEFAULT 'general';

-- ============================================================================
-- 8. CREATE RPC: Get or create direct conversation with context
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation_v2(uuid, uuid, text, text, uuid);

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation_v2(
  p_user1_id uuid,
  p_user2_id uuid,
  p_display_name text DEFAULT NULL,
  p_context_type text DEFAULT 'general',
  p_context_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_conversation_id uuid;
  v_user1_type text;
  v_user2_type text;
  v_user1_role text;
  v_user2_role text;
BEGIN
  -- Validate auth
  IF auth.uid() IS NULL OR auth.uid() != p_user1_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: can only create conversations for yourself'
    );
  END IF;

  -- Prevent self-chat
  IF p_user1_id = p_user2_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot start conversation with yourself'
    );
  END IF;

  -- Get account types
  SELECT account_type INTO v_user1_type FROM public.users WHERE user_id = p_user1_id;
  SELECT account_type INTO v_user2_type FROM public.users WHERE user_id = p_user2_id;

  v_user1_type := COALESCE(v_user1_type, 'customer');
  v_user2_type := COALESCE(v_user2_type, 'customer');

  -- Map account type to role
  v_user1_role := CASE 
    WHEN v_user1_type IN ('seller', 'doctor', 'factory', 'delivery') THEN v_user1_type
    ELSE 'customer'
  END;

  v_user2_role := CASE 
    WHEN v_user2_type IN ('seller', 'doctor', 'factory', 'delivery') THEN v_user2_type
    ELSE 'customer'
  END;

  -- Check policy: can these two users chat?
  IF NOT public.can_start_conversation(p_user1_id, p_user2_id, NULL::uuid) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Chat not allowed between these user types'
    );
  END IF;

  -- Look for existing direct conversation
  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.type = 'direct'
    AND c.is_archived = false
    AND ((cp1.user_id = p_user1_id AND cp2.user_id = p_user2_id)
         OR (cp1.user_id = p_user2_id AND cp2.user_id = p_user1_id))
  ORDER BY c.created_at DESC
  LIMIT 1;

  -- If exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'conversation_id', v_conversation_id,
      'is_new', false
    );
  END IF;

  -- Create new conversation
  v_conversation_id := gen_random_uuid();

  INSERT INTO public.conversations (
    id, name, type, context_type, context_id, created_at, updated_at, is_archived
  )
  VALUES (
    v_conversation_id,
    COALESCE(p_display_name, 'Direct Chat'),
    'direct',
    COALESCE(p_context_type, 'general'),
    p_context_id,
    NOW(),
    NOW(),
    false
  );

  -- Add both participants
  INSERT INTO public.conversation_participants (
    conversation_id, user_id, role, account_type, joined_at
  )
  VALUES
    (v_conversation_id, p_user1_id, v_user1_role, v_user1_type, NOW()),
    (v_conversation_id, p_user2_id, v_user2_role, v_user2_type, NOW());

  RETURN json_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'is_new', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation_v2(uuid, uuid, text, text, uuid) TO authenticated;

-- ============================================================================
-- 9. CREATE VIEW: All users with proper account type (for discovery/search)
-- ============================================================================
DROP VIEW IF EXISTS public.users_discovery;

CREATE VIEW public.users_discovery AS
SELECT
  u.id,
  u.user_id,
  u.email,
  u.full_name,
  u.avatar_url,
  u.account_type,
  u.created_at,
  CASE
    WHEN s.id IS NOT NULL THEN 'seller'
    WHEN d.id IS NOT NULL THEN 'doctor'
    WHEN p.id IS NOT NULL THEN 'patient'
    WHEN dp.id IS NOT NULL THEN 'delivery'
    ELSE 'customer'
  END AS actual_account_type,
  COALESCE(s.business_name, d.full_name, p.full_name, u.full_name) AS display_name
FROM public.users u
LEFT JOIN public.sellers s ON u.user_id = s.user_id
LEFT JOIN public.health_doctor_profiles d ON u.user_id = d.user_id
LEFT JOIN public.health_patient_profiles p ON u.user_id = p.user_id
LEFT JOIN public.delivery_profiles dp ON u.user_id = dp.user_id
WHERE u.account_type != 'admin'; -- exclude admins from discovery

GRANT SELECT ON public.users_discovery TO authenticated, anon;

-- ============================================================================
-- 10. CREATE INDEXED FUNCTION: Fast user search by name/email
-- ============================================================================
DROP FUNCTION IF EXISTS public.search_users(text, uuid, integer);

CREATE OR REPLACE FUNCTION public.search_users(
  p_query text,
  p_exclude_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  account_type text,
  actual_account_type text,
  display_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    u.id,
    u.user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.account_type,
    CASE
      WHEN s.id IS NOT NULL THEN 'seller'
      WHEN d.id IS NOT NULL THEN 'doctor'
      WHEN p.id IS NOT NULL THEN 'patient'
      WHEN dp.id IS NOT NULL THEN 'delivery'
      ELSE 'customer'
    END AS actual_account_type,
    COALESCE(s.business_name, d.full_name, p.full_name, u.full_name) AS display_name
  FROM public.users u
  LEFT JOIN public.sellers s ON u.user_id = s.user_id
  LEFT JOIN public.health_doctor_profiles d ON u.user_id = d.user_id
  LEFT JOIN public.health_patient_profiles p ON u.user_id = p.user_id
  LEFT JOIN public.delivery_profiles dp ON u.user_id = dp.user_id
  WHERE
    (p_query IS NULL OR p_query = '' OR
     u.email ILIKE '%' || p_query || '%' OR
     u.full_name ILIKE '%' || p_query || '%' OR
     s.business_name ILIKE '%' || p_query || '%' OR
     d.full_name ILIKE '%' || p_query || '%' OR
     p.full_name ILIKE '%' || p_query || '%'
    )
    AND (p_exclude_user_id IS NULL OR u.user_id != p_exclude_user_id)
    AND u.account_type != 'admin'
  ORDER BY
    CASE WHEN u.email ILIKE p_query THEN 0 ELSE 1 END,
    u.updated_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_users(text, uuid, integer) TO authenticated, anon;

-- ============================================================================
-- 11. CREATE INDEXES: Optimize performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_health_doctor_profiles_user_id ON public.health_doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_health_patient_profiles_user_id ON public.health_patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_profiles_user_id ON public.delivery_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_conversations_context ON public.conversations(context_type, context_id) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup ON public.conversation_participants(conversation_id, user_id);

-- ============================================================================
-- 12. UPDATE conversation_participants to use synced account_type on insert
-- ============================================================================
DROP TRIGGER IF EXISTS sync_account_type_on_participant_insert ON public.conversation_participants;
DROP FUNCTION IF EXISTS public.trigger_sync_account_type_on_participant_insert();

CREATE OR REPLACE FUNCTION public.trigger_sync_account_type_on_participant_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_account_type text;
BEGIN
  -- Get the actual account_type from users table
  SELECT account_type INTO v_account_type FROM public.users WHERE user_id = NEW.user_id;
  
  IF v_account_type IS NOT NULL THEN
    NEW.account_type := v_account_type;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_account_type_on_participant_insert
BEFORE INSERT ON public.conversation_participants
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sync_account_type_on_participant_insert();

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. get_user_account_type() - Detects actual account type from profile tables
-- 2. Backfill existing users with correct account_type
-- 3. Triggers on seller/doctor/patient/delivery table INSERTs to auto-update users.account_type
-- 4. Enhanced conversations table with context_type and context_id for product/patient chats
-- 5. get_or_create_direct_conversation_v2() - New RPC with context awareness and json response
-- 6. users_discovery VIEW - Unified search view showing all users with correct types
-- 7. search_users() - RPC function for efficient user search
-- 8. Indexes for performance
-- 9. Trigger to sync account_type into conversation_participants
--
-- USAGE IN FRONTEND:
-- 1. Search users: SELECT * FROM public.search_users('query', current_user_id)
-- 2. Create chat: SELECT * FROM public.get_or_create_direct_conversation_v2(user1, user2, 'name', 'general', NULL)
-- 3. Product chat: SELECT * FROM public.get_or_create_direct_conversation_v2(user1, user2, 'name', 'product', product_id)
-- 4. Patient chat: SELECT * FROM public.get_or_create_direct_conversation_v2(user1, user2, 'name', 'patient', patient_id)
--
-- ROUTING:
-- /chat?id={current_user_id} - Browse & search users to chat with
-- /chat?id={current_user_id}&connectedTo={selected_user_id} - Actual chat room
-- /chat?id={current_user_id}&connectedTo={selected_user_id}&context=product&contextId={product_id} - Product chat
