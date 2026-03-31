# 🔍 StartNewChat Debug Guide - "Can't See Any Users"

## Problem
When you open "Start New Chat" in localhost/chat, you can't see any users in the search results.

## Root Cause
Your `public.users` table has **overly restrictive RLS policies** that prevent users from seeing other users.

### Current Policy (Problem):
```sql
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (("auth"."uid"() = "user_id"));
```

This policy says: "Users can ONLY view their own profile" ❌

## ✅ Solution

### Step 1: Run the SQL Fix
Execute this in your **Supabase SQL Editor**:

```sql
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create new policy that allows viewing all users (needed for chat search)
CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT
TO authenticated
USING (true);
```

Or run the file: `fix-users-chat-rls-policy.sql`

### Step 2: Verify It Works
After running the SQL, test this query in Supabase:

```sql
-- This should now return all users
SELECT id, user_id, email, full_name, account_type 
FROM public.users 
LIMIT 10;
```

If you see results, the fix worked! ✅

---

## 🔍 Debug Checklist

### 1. Check if users table has data
```sql
SELECT COUNT(*) FROM public.users;
```

**Expected:** At least 1 (your user)

If 0, you need to insert users or ensure the `handle_new_user` trigger is working.

---

### 2. Check RLS Policies on users table
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
```

**Expected:** Should have SELECT policy that allows authenticated users to view other users.

---

### 3. Test RPC Function (if created)
```sql
-- Test the search function
SELECT * FROM search_users_for_chat('test', 'your-user-id-here');
```

---

### 4. Check Browser Console
Open browser DevTools (F12) → Console tab, then search for users.

**Look for:**
- "RPC search failed" → RPC function doesn't exist (normal, will use fallback)
- "Direct query error" → RLS policy blocking access
- "Search results: []" → No users match or RLS blocking

---

## 🛠️ Alternative Fixes

### Option A: Allow All Authenticated Users to View (Recommended for Chat)
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view all users" ON public.users
FOR SELECT
TO authenticated
USING (true);
```

### Option B: Allow Viewing Only Other Users (Not Self)
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view other users" ON public.users
FOR SELECT
TO authenticated
USING (user_id != auth.uid());
```

### Option C: Disable RLS Temporarily (Development Only!)
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning:** This makes the table public! Only use in local development.

---

## 🧪 Testing After Fix

1. **Refresh** your chat page
2. Click **"Start New Chat"** button
3. Type **2+ characters** in search box
4. Check browser console for logs
5. You should see users in the results

### Expected Console Output:
```
RPC search failed, falling back to direct query: function ... does not exist
Search results: [
  {
    id: "...",
    user_id: "...",
    email: "user@example.com",
    full_name: "Test User",
    account_type: "seller"
  }
]
```

---

## 📋 Complete SQL Migration

Run this complete fix in Supabase SQL Editor:

```sql
-- =====================================================
-- Complete Chat System Fix
-- =====================================================

-- 1. Fix users table RLS policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT
TO authenticated
USING (true);

-- 2. Create search function (optional but recommended)
CREATE OR REPLACE FUNCTION public.search_users_for_chat(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.account_type
  FROM public.users u
  WHERE
    u.user_id != p_current_user_id
    AND (
      u.full_name ILIKE '%' || p_query || '%'
      OR u.email ILIKE '%' || p_query || '%'
    )
  ORDER BY
    CASE WHEN u.full_name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    u.full_name
  LIMIT 50;
END;
$$;

-- 3. Create conversation function
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_conversation_id UUID;
  v_user1_role public.user_role;
  v_user2_role public.user_role;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user1_id THEN
    RAISE EXCEPTION 'Access denied: can only create conversations for yourself';
  END IF;

  IF p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself';
  END IF;

  SELECT account_type::user_role INTO v_user1_role FROM public.users WHERE user_id = p_user1_id;
  SELECT account_type::user_role INTO v_user2_role FROM public.users WHERE user_id = p_user2_id;

  IF NOT public.can_start_conversation(p_user1_id, p_user2_id, NULL) THEN
    RAISE EXCEPTION 'Conversation not allowed between these user types';
  END IF;

  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE
    c.product_id IS NULL
    AND cp1.user_id = p_user1_id
    AND cp2.user_id = p_user2_id
  ORDER BY c.created_at ASC
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  v_conversation_id := gen_random_uuid();

  INSERT INTO public.conversations (id, product_id, created_at, updated_at)
  VALUES (v_conversation_id, NULL, NOW(), NOW());

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES
    (v_conversation_id, p_user1_id, v_user1_role, NOW()),
    (v_conversation_id, p_user2_id, v_user2_role, NOW());

  RETURN v_conversation_id;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.search_users_for_chat TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation TO authenticated;

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_search
ON public.users USING gin (full_name gin_trgm_ops, email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
ON public.conversation_participants(user_id);

-- 6. Verify
SELECT 'Users count:' as info, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Policies:', COUNT(*) FROM pg_policies WHERE tablename = 'users';
```

---

## 🎯 Quick Test Commands

### Check if you can see users:
```sql
SELECT user_id, email, full_name, account_type FROM public.users LIMIT 5;
```

### Check policies:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
```

### Check if trigger is working (creates users on signup):
```sql
SELECT event_object_table, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';
```

---

## ❓ Still Not Working?

### 1. No users in database?
Check if the trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';
```

If missing, the `handle_new_user()` function should run on auth.users INSERT.

### 2. Check your user exists:
```sql
SELECT * FROM public.users WHERE user_id = auth.uid();
```

### 3. Check account_type values:
```sql
SELECT DISTINCT account_type FROM public.users;
```

Should return values like: 'user', 'seller', 'factory', 'middleman', etc.

---

## 📝 Summary

**Problem:** RLS policy blocks viewing other users  
**Solution:** Run `fix-users-chat-rls-policy.sql` in Supabase  
**Test:** Search for users in chat, check browser console

After the fix, you'll see all users in the search results! ✅

---

Last Updated: 2026-03-30
