-- ═══════════════════════════════════════════════════════════════════════
-- FIX: conversation_participants RLS Policies
-- Removes infinite recursion and matches your schema
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Drop ALL existing policies on conversation_participants
-- This removes any recursive policies
DROP POLICY IF EXISTS "Users can view own participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert own participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete own participants" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can view own data" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can insert own data" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can update own data" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can delete own data" ON conversation_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON conversation_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversation_participants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON conversation_participants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON conversation_participants;

-- Step 2: Drop triggers that might cause recursion
DROP TRIGGER IF EXISTS trigger_lock_account_type ON conversation_participants;
DROP TRIGGER IF EXISTS trigger_sync_account_type ON conversation_participants;

-- Step 3: Drop the trigger functions temporarily
DROP FUNCTION IF EXISTS prevent_account_type_change() CASCADE;
DROP FUNCTION IF EXISTS sync_participant_account_type() CASCADE;

-- Step 4: Recreate trigger functions (simplified, no recursion)
CREATE OR REPLACE FUNCTION prevent_account_type_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow account_type to be set on INSERT, not updated
  IF TG_OP = 'UPDATE' THEN
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sync_participant_account_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Get account_type from users table on INSERT
  IF TG_OP = 'INSERT' AND NEW.account_type IS NULL THEN
    SELECT u.account_type INTO NEW.account_type
    FROM users u
    WHERE u.id = NEW.user_id;
    
    -- Fallback to auth.users if not found in users table
    IF NEW.account_type IS NULL THEN
      SELECT au.raw_user_meta_data->>'account_type' INTO NEW.account_type
      FROM auth.users au
      WHERE au.id = NEW.user_id;
    END IF;
    
    -- Default to 'user' if still null
    IF NEW.account_type IS NULL THEN
      NEW.account_type := 'user';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate triggers
CREATE TRIGGER trigger_lock_account_type
  BEFORE UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION prevent_account_type_change();

CREATE TRIGGER trigger_sync_account_type
  BEFORE INSERT ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION sync_participant_account_type();

-- Step 6: Create NEW non-recursive RLS policies
-- These policies ONLY check user_id, avoiding any subqueries to conversation_participants

-- SELECT: Users can only see their own participant records
CREATE POLICY "Users can view own participants"
  ON conversation_participants FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can only insert their own participant records
CREATE POLICY "Users can insert own participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own participant records
CREATE POLICY "Users can update own participants"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can only delete their own participant records
CREATE POLICY "Users can delete own participants"
  ON conversation_participants FOR DELETE
  USING (user_id = auth.uid());

-- Step 7: Enable RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions
GRANT SELECT ON conversation_participants TO authenticated;
GRANT INSERT ON conversation_participants TO authenticated;
GRANT UPDATE ON conversation_participants TO authenticated;
GRANT DELETE ON conversation_participants TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION: Check policies were created
-- ═══════════════════════════════════════════════════════════════════════

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'conversation_participants'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════════
-- TEST: Try a simple query (replace with your user ID)
-- ═══════════════════════════════════════════════════════════════════════

-- Run this in a separate query to test:
-- SELECT conversation_id FROM conversation_participants WHERE user_id = 'af606390-6b5b-45fc-81b7-f72b702db12c';
