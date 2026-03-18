-- ============================================================
-- Recreate conversation_participants Table
-- For legacy product messaging support
-- ============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'seller')),
  last_read_message_id UUID REFERENCES public.messages(id),
  is_muted BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
);

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conv ON public.conversation_participants(conversation_id);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_view_own_participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "users_insert_own_participants" ON public.conversation_participants;

-- Add Policies
CREATE POLICY "users_view_own_participants" ON public.conversation_participants
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_participants" ON public.conversation_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify table created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- Verify constraints
SELECT conname as constraint_name, contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.conversation_participants'::regclass;

-- ============================================================
-- Table recreated successfully!
-- Legacy product messaging will now work
-- ============================================================
