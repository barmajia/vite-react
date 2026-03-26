-- =====================================================
-- Chat System Validation Script
-- Run this in Supabase SQL Editor to check your setup
-- =====================================================

-- =====================================================
-- 1. CHECK TABLES EXIST
-- =====================================================
SELECT 
  '✅ Tables Check' as section,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations', 
  'conversation_participants', 
  'messages', 
  'trading_conversations', 
  'health_conversations', 
  'services_conversations',
  'trading_messages',
  'health_messages',
  'services_messages'
)
ORDER BY table_name;

-- =====================================================
-- 2. CHECK REALTIME PUBLICATION
-- =====================================================
SELECT 
  '✅ Realtime Check' as section,
  schemaname,
  tablename,
  '✅ Enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
  'conversations',
  'conversation_participants',
  'messages',
  'trading_conversations',
  'health_conversations',
  'services_conversations',
  'trading_messages',
  'health_messages',
  'services_messages'
)
ORDER BY tablename;

-- Check what's missing from realtime
SELECT 
  '⚠️ Missing from Realtime' as section,
  table_name as tablename,
  '❌ Not in supabase_realtime' as status
FROM (
  VALUES 
    ('conversations'),
    ('conversation_participants'),
    ('messages'),
    ('trading_conversations'),
    ('health_conversations'),
    ('services_conversations'),
    ('trading_messages'),
    ('health_messages'),
    ('services_messages')
) AS required_tables(table_name)
LEFT JOIN pg_publication_tables prt 
  ON prt.tablename = required_tables.table_name 
  AND prt.pubname = 'supabase_realtime'
WHERE prt.tablename IS NULL;

-- =====================================================
-- 3. CHECK STORAGE BUCKET
-- =====================================================
SELECT 
  '✅ Storage Bucket Check' as section,
  id,
  name,
  public,
  CASE 
    WHEN id = 'chat-attachments' THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- =====================================================
-- 4. CHECK RLS POLICIES
-- =====================================================
SELECT 
  '✅ RLS Policies Check' as section,
  tablename,
  policyname,
  cmd as operation,
  '✅ Configured' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'conversations', 
  'messages', 
  'conversation_participants',
  'trading_conversations',
  'health_conversations',
  'services_conversations'
)
ORDER BY tablename, cmd;

-- Check which tables have RLS enabled
SELECT 
  '✅ RLS Enabled Tables' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '⚠️ RLS Not Enabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'conversations', 
  'messages', 
  'conversation_participants',
  'trading_conversations',
  'health_conversations',
  'services_conversations'
)
ORDER BY tablename;

-- =====================================================
-- 5. CHECK TRIGGERS
-- =====================================================
SELECT 
  '✅ Triggers Check' as section,
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event,
  '✅ Configured' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (
  trigger_name LIKE '%message%' 
  OR trigger_name LIKE '%conversation%'
  OR event_object_table LIKE '%message%'
  OR event_object_table LIKE '%conversation%'
)
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. CHECK FUNCTIONS
-- =====================================================
SELECT 
  '✅ Functions Check' as section,
  routine_name as function_name,
  '✅ Exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
  routine_name LIKE '%conversation%' 
  OR routine_name LIKE '%chat%'
  OR routine_name LIKE '%message%'
)
ORDER BY routine_name;

-- =====================================================
-- 7. CHECK INDEXES
-- =====================================================
SELECT 
  '✅ Indexes Check' as section,
  tablename,
  indexname,
  '✅ Configured' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
  tablename IN ('messages', 'conversations', 'conversation_participants')
  OR indexname LIKE '%message%'
  OR indexname LIKE '%conversation%'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 8. CHECK TABLE COLUMNS
-- =====================================================
-- Conversations table columns
SELECT 
  '✅ conversations table columns' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Messages table columns
SELECT 
  '✅ messages table columns' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'messages'
ORDER BY ordinal_position;

-- Conversation participants columns
SELECT 
  '✅ conversation_participants table columns' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- =====================================================
-- 9. SUMMARY
-- =====================================================
SELECT 
  '📊 SUMMARY' as section,
  'Tables Found' as metric,
  COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations', 
  'conversation_participants', 
  'messages', 
  'trading_conversations', 
  'health_conversations', 
  'services_conversations'
)
UNION ALL
SELECT 
  '📊 SUMMARY',
  'Realtime Tables',
  COUNT(*)::text
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
  'conversations',
  'conversation_participants',
  'messages',
  'trading_conversations',
  'health_conversations',
  'services_conversations'
)
UNION ALL
SELECT 
  '📊 SUMMARY',
  'RLS Policies',
  COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'conversations', 
  'messages', 
  'conversation_participants'
)
UNION ALL
SELECT 
  '📊 SUMMARY',
  'Storage Bucket',
  CASE WHEN COUNT(*) > 0 THEN '✅ Exists' ELSE '❌ Missing' END
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- =====================================================
-- 10. QUICK FIX SCRIPTS
-- =====================================================
-- Run these if anything is missing:

-- Fix 1: Add tables to realtime
-- Uncomment and run if tables are missing from realtime:
/*
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.trading_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.health_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.services_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.trading_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.health_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.services_messages;
*/

-- Fix 2: Create storage bucket
-- Uncomment and run if bucket is missing:
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', true, 10485760)
ON CONFLICT (id) DO NOTHING;
*/

-- Fix 3: Storage RLS policies
-- Uncomment and run if policies are missing:
/*
CREATE POLICY "Users can upload chat attachments" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1] = 'chat'
);

CREATE POLICY "Users can view chat attachments" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete own attachments" 
ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
);
*/

-- =====================================================
-- VALIDATION COMPLETE
-- =====================================================
SELECT '✅ Chat System Validation Complete!' as message,
       'Check the results above for any ❌ missing items' as instruction;
