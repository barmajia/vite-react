# ⚡ Quick SQL Application Guide

## 🎯 Goal

Apply the chat system SQL fixes to your Supabase project to enable full chat functionality.

---

## 📋 Prerequisites

- Supabase account with access to your project
- [`sql-edit.sql`](sql-edit.sql) file ready

---

## 🚀 5-Minute Application Steps

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: **Aurora** (or your project name)
3. In left sidebar, click: **SQL Editor**
4. Click: **New Query**

### Step 2: Copy SQL

1. Open [`sql-edit.sql`](sql-edit.sql) file in VS Code
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 3: Paste & Execute

1. In Supabase SQL Editor, click in the text area
2. **Paste** (Ctrl+V) - the entire SQL content
3. Click the **"Run"** button (or Ctrl+Shift+Enter)

### Step 4: Wait for Success ✅

You should see:

```
Query successful
```

If you see errors, scroll up to see which line failed.

---

## ✅ Verification (After Success)

Run these quick checks to confirm everything was created:

### Check 1: Functions Created

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%search_users%'
OR routine_name LIKE '%get_or_create%'
OR routine_name LIKE '%get_user_account_type%';
```

**Expected Result:**

```
search_users
get_or_create_direct_conversation_v2
get_user_account_type
```

### Check 2: Account Types Updated

```sql
SELECT account_type, COUNT(*) as count
FROM public.users
GROUP BY account_type;
```

**Expected Result:** (Mix of different types)

```
customer    | 12
seller      | 3
doctor      | 2
patient     | 1
delivery    | 1
```

(NOT all "user")

### Check 3: Indexes Created

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
```

**Expected Result:**

```
idx_users_account_type
idx_sellers_user_id
idx_conversations_direct
idx_conversation_participants_lookup
... (10+ indexes)
```

---

## 🧪 Test Connection After SQL

### Terminal Command (Optional)

```bash
# From your project directory
npx supabase db pull
# This syncs local schema with remote
```

### Browser Test (Recommended)

1. Refresh: http://localhost:5174/chat
2. Click "Start New Chat"
3. Type: "a" or "e" to search
4. **Should see:** Users appearing with correct account_type
5. **Should NOT see:** Console error about "search_users function not found"

---

## 🆘 Troubleshooting

### Error: "Column does not exist"

- **Cause:** Running old sql-edit.sql version
- **Fix:** Use latest [`sql-edit.sql`](sql-edit.sql) file
- **Action:** Copy entire file again and re-run

### Error: "Syntax error"

- **Cause:** Partial copy-paste
- **Fix:** Make sure you copied ENTIRE file (lines 1-442+)
- **Action:** Copy all again, paste into fresh query

### Error: "Permission denied"

- **Cause:** Auth role doesn't have permission
- **Fix:** This shouldn't happen with authenticated user
- **Action:** Use Supabase admin credentials if prompted

### Functions created but search still returns "no matches"

- **Cause:** Could be RLS (Row Level Security) policies
- **Fix:** Check `/Security` → Policies in Supabase
- **Action:** Ensure policies allow `search_users` to read from users table

---

## ⏱️ Expected Timing

| Step         | Time             |
| ------------ | ---------------- |
| Copy SQL     | 30 seconds       |
| Paste        | 10 seconds       |
| Click Run    | 5 seconds        |
| Execution    | 10-30 seconds    |
| Verification | 1 minute         |
| **Total**    | **~2-3 minutes** |

---

## 📊 What Gets Created

| Object Type | Count | Purpose                  |
| ----------- | ----- | ------------------------ |
| Functions   | 3     | RPC endpoints for chat   |
| Triggers    | 5     | Auto-sync account types  |
| Indexes     | 8+    | Performance optimization |
| Views       | 1     | User discovery view      |

---

## 🎉 Success Indicators

After running this SQL, you'll have:

✅ `search_users(query, exclude_id, limit)` - Search users by name/email  
✅ `get_or_create_direct_conversation_v2(...)` - Create/resume chats  
✅ `get_user_account_type(user_id)` - Detect user role (seller, doctor, etc.)  
✅ Automatic account_type sync when profiles are created  
✅ Performance indexes for fast lookups  
✅ Account types properly populated for all users

---

## 🔄 If You Need to Revert

If something goes wrong:

1. In Supabase SQL Editor
2. New Query
3. Copy this (be careful!):

```sql
-- Drop everything (use with caution)
DROP FUNCTION IF EXISTS public.search_users CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation_v2 CASCADE;
DROP FUNCTION IF EXISTS public.get_user_account_type CASCADE;
DROP VIEW IF EXISTS public.users_discovery;
DROP TRIGGER IF EXISTS update_user_account_type_on_seller_create ON public.sellers;
DROP TRIGGER IF EXISTS update_user_account_type_on_doctor_create ON public.health_doctor_profiles;
-- ... (etc. for each trigger)
```

Then re-run the full [`sql-edit.sql`](sql-edit.sql) again.

---

## 🚀 Next Steps

After successful SQL application:

1. Refresh your browser at http://localhost:5174/chat
2. Test search functionality
3. See [TESTING_REPORT.md](TESTING_REPORT.md) for full test cases
4. Check [CHAT_IMPLEMENTATION_GUIDE.md](CHAT_IMPLEMENTATION_GUIDE.md) for deployment checklist

---

**⏱️ Estimated Time:** 2-3 minutes  
**Difficulty:** Easy (copy-paste)  
**Risk:** Low (can always revert from backups)
