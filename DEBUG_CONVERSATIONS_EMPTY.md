# 🔍 Debug: No Conversations Showing

## ✅ Problem Identified

Your chat page is empty, but Supabase queries return data.

**Reason:** The `conversation_participants` table requires a `role` column (NOT NULL), but:
- Your existing conversations might not have `role` set
- OR the user isn't in the `conversation_participants` table at all

---

## 🧪 Step 1: Check Browser Console

After opening the chat page, you should see:

```
Fetching conversations for user: af606390-...
Participant query result: { data: [...], error: null }
Conversation IDs found: X
```

### If you see:
```
Conversation IDs found: 0
No conversations found for this user
```

**Problem:** You're not in `conversation_participants` table

**Fix:** Run the SQL below to add yourself

---

## 🗄️ Step 2: Run SQL in Supabase

### Check if you exist in conversation_participants:

```sql
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  cp.joined_at,
  u.email,
  u.account_type
FROM conversation_participants cp
JOIN users u ON cp.user_id = u.user_id
ORDER BY cp.joined_at DESC
LIMIT 10;
```

**Expected:** Should show conversation participants with roles

### If EMPTY - Add test data:

```sql
-- 1. Find your user_id
SELECT user_id, email, account_type 
FROM public.users 
WHERE user_id = auth.uid();

-- 2. Create a test conversation
INSERT INTO conversations (id, product_id, created_at, updated_at)
VALUES (gen_random_uuid(), NULL, NOW(), NOW());

-- 3. Get the conversation_id (run this after insert)
SELECT id FROM conversations 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Add yourself as participant (replace {conversation_id} with actual ID)
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
VALUES (
  '{conversation_id}',  -- Replace with actual UUID
  auth.uid(),
  'customer'::user_role,  -- Your role
  NOW()
);

-- 5. Verify
SELECT * FROM conversation_participants 
WHERE user_id = auth.uid();
```

---

## 🔧 Step 3: Fix Existing Conversations

If you have conversations without proper participants:

```sql
-- Find conversations with missing participants
SELECT c.id, c.created_at
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
WHERE cp.conversation_id IS NULL;

-- Delete orphaned conversations
DELETE FROM conversations 
WHERE id NOT IN (SELECT DISTINCT conversation_id FROM conversation_participants);
```

---

## 🎯 Step 4: Check RLS Policies

Make sure you can read conversation_participants:

```sql
-- Check policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'conversation_participants';

-- Expected: Should have SELECT policy for authenticated users
```

### If missing, add policy:

```sql
-- Allow users to see their own conversations
CREATE POLICY "Users can view own conversations" 
ON conversation_participants 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Allow users to insert themselves
CREATE POLICY "Users can insert own conversations" 
ON conversation_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());
```

---

## 📊 Step 5: Test Complete Setup

### Full test query:

```sql
-- Check everything is connected
SELECT 
  'users' as table_name, 
  COUNT(*) as count 
FROM public.users
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'conversation_participants', COUNT(*) FROM conversation_participants
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;
```

**Expected:**
```
table_name              | count
------------------------|-------
users                   | 5
conversations           | 3
conversation_participants | 6
messages                | 10
```

---

## 🐛 Common Issues

### Issue 1: "No conversations found"
**Cause:** Not in `conversation_participants` table  
**Fix:** Add yourself using SQL above

### Issue 2: "Permission denied"
**Cause:** RLS policy blocking access  
**Fix:** Add RLS policies (see Step 4)

### Issue 3: "null value in role column"
**Cause:** Inserting participants without role  
**Fix:** Always provide `role` when inserting:
```typescript
{
  conversation_id: convId,
  user_id: userId,
  role: 'customer'  // ← Required!
}
```

### Issue 4: Conversations exist but empty
**Cause:** No messages yet  
**Normal:** Conversations show even with 0 messages

---

## ✅ What Console Should Show

When working correctly:

```
Fetching conversations for user: af606390-...
Participant query result: { 
  data: [
    { conversation_id: "uuid-1" },
    { conversation_id: "uuid-2" }
  ], 
  error: null 
}
Conversation IDs found: 2
```

Then conversations will display!

---

## 🚀 Quick Fix (Copy-Paste in Supabase)

```sql
-- 1. Create conversation
INSERT INTO conversations (id, created_at, updated_at)
VALUES (gen_random_uuid(), NOW(), NOW());

-- 2. Get conversation ID (copy the UUID from result)
-- 3. Add yourself (replace YOUR-CONV-ID below)
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
VALUES (
  'YOUR-CONV-ID',  -- Paste UUID from step 2
  auth.uid(),
  'customer'::user_role,
  NOW()
);

-- 4. Verify
SELECT cp.*, u.email 
FROM conversation_participants cp
JOIN users u ON cp.user_id = u.user_id
WHERE cp.user_id = auth.uid();
```

Then refresh the chat page!

---

Last Updated: 2026-03-30
