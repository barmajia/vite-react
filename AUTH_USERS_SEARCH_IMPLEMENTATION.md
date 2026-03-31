# ✅ Updated: Search Users from auth.users Directly

## 🎯 What Changed

**Before:** Searched users from `public.users` table  
**After:** Searches users directly from `auth.users` table

### Why This is Better

1. ✅ **No dependency on public.users table** - Works even if profile doesn't exist
2. ✅ **Always up-to-date** - Gets data directly from auth system
3. ✅ **Simpler architecture** - One less table to manage
4. ✅ **Better security** - Uses auth.users with SECURITY DEFINER

---

## 🔧 Changes Made

### 1. Updated StartNewChat.tsx

#### Current User Account Type Fetch
```typescript
// ✅ Now tries public.users first, falls back to auth metadata
const { data: profileData } = await supabase
  .from("users")
  .select("account_type")
  .eq("user_id", user.id)
  .maybeSingle();

// Fallback to auth user metadata
const accountType = profileData?.account_type || 
                   user.user_metadata?.account_type || 
                   'user';
```

#### Search Users from auth.users
```typescript
// ✅ Primary: Query auth.users via RPC
const { data, error } = await supabase.rpc("search_auth_users", {
  p_query: searchQuery,
  p_current_user_id: user.id,
});

// Transform auth.users data to UserResult format
const transformed = (data || []).map((u: any) => ({
  id: u.id,
  user_id: u.id,
  email: u.email,
  full_name: u.raw_user_meta_data?.full_name || u.email?.split('@')[0],
  avatar_url: u.raw_user_meta_data?.avatar_url,
  account_type: u.raw_user_meta_data?.account_type || 'user',
}));

// Fallback: Still works with public.users if RPC fails
```

---

## 🛠️ Required SQL (Run This)

**File:** `add-search-auth-users-rpc.sql`

```sql
-- Search users directly from auth.users table
CREATE OR REPLACE FUNCTION public.search_auth_users(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO auth, pg_catalog
AS $$
BEGIN
  -- Security check
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  -- Search auth.users directly
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
  FROM auth.users au
  WHERE 
    au.id != p_current_user_id
    AND (
      au.email ILIKE '%' || p_query || '%'
      OR au.raw_user_meta_data->>'full_name' ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE WHEN au.email ILIKE p_query || '%' THEN 0 ELSE 1 END,
    au.email
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_auth_users TO authenticated;
```

---

## 📊 Data Flow

### Search Flow (Updated)

```
User types 2+ characters
  ↓
Call RPC: search_auth_users()
  ↓
Queries auth.users table directly:
  - au.email
  - au.raw_user_meta_data->>'full_name'
  ↓
Returns: id, email, raw_user_meta_data, created_at
  ↓
Transform to UserResult format:
  - full_name from raw_user_meta_data
  - account_type from raw_user_meta_data
  - avatar_url from raw_user_meta_data
  ↓
Display results with badges
```

### Fallback Flow

```
If RPC fails (function doesn't exist)
  ↓
Fallback to public.users table query
  ↓
Search by email or full_name
  ↓
Return results
```

---

## 🎯 User Metadata Structure

### auth.users.raw_user_meta_data

```json
{
  "full_name": "John Doe",
  "account_type": "seller",
  "avatar_url": "https://...",
  "phone": "+1234567890"
}
```

### How to Set Metadata on Signup

```typescript
// When creating user in auth
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: "John Doe",
      account_type: "seller",  // ✅ Set account_type here
      avatar_url: "...",
      phone: "..."
    }
  }
});
```

---

## ✅ Benefits

### 1. No public.users Dependency
```typescript
// ❌ BEFORE: Required public.users table
await supabase.from("users").select(...)

// ✅ AFTER: Queries auth.users directly
await supabase.rpc("search_auth_users", {...})
```

### 2. Always Accurate
- auth.users is the source of truth
- No sync issues with public.users
- Email changes reflected immediately

### 3. Simpler Architecture
```
Before:
auth.users → trigger → public.users → search

After:
auth.users → search (direct)
```

### 4. Better Security
- SECURITY DEFINER function
- Runs with elevated privileges
- User can only search, not modify

---

## 🧪 Testing

### Test 1: RPC Function

In Supabase SQL Editor:
```sql
-- Replace with your actual user ID
SELECT * FROM search_auth_users('test', 'your-user-id-here');
```

Expected output:
```
id | email | raw_user_meta_data | created_at
---|-------|-------------------|------------
uuid | user@example.com | {"full_name": "Test User"} | 2026-03-31
```

### Test 2: Browser Console

After running SQL:
```
Calling RPC: search_auth_users
Auth users RPC response: { data: [...], error: null, dataLength: 3 }
Setting transformed auth results: [...]
```

### Test 3: Search Results

Type in search box → Should see users from auth.users:
- ✅ Email matches
- ✅ Full name from metadata
- ✅ Account type badge shows

---

## ⚠️ Important Notes

### 1. Account Type Source

**Option A: Store in auth metadata (Recommended)**
```typescript
// On signup
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      account_type: 'seller'  // ✅ Stored in auth.users
    }
  }
});
```

**Option B: Store in public.users (Fallback)**
```sql
-- Insert into public.users
INSERT INTO users (user_id, email, account_type)
VALUES (auth.uid(), 'email@example.com', 'seller');
```

Component checks both, so either works!

### 2. RLS Policies

auth.users is protected by default. The RPC function uses `SECURITY DEFINER` to bypass RLS safely.

### 3. Performance

- auth.users has indexes on email
- Search is fast (ILIKE with LIMIT 50)
- No joins needed

---

## 🔄 Migration Path

### If You Have Existing public.users Data

1. **Keep public.users** for now (component supports both)
2. **Run SQL** to add search_auth_users RPC
3. **Test** - should work immediately
4. **Optional:** Migrate account_type to auth metadata

### Migration Script (Optional)

```sql
-- Copy account_type from public.users to auth.users metadata
UPDATE auth.users au
SET raw_user_meta_data = 
  COALESCE(au.raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('account_type', pu.account_type)
FROM public.users pu
WHERE pu.user_id = au.id
AND pu.account_type IS NOT NULL;
```

---

## ✅ Summary

**Changed:**
- ✅ Search now queries auth.users directly
- ✅ Uses RPC function: search_auth_users
- ✅ Falls back to public.users if needed
- ✅ Transforms auth data to UserResult format

**Benefits:**
- ✅ No public.users dependency
- ✅ Always accurate data
- ✅ Simpler architecture
- ✅ Better security

**Required:**
- ⚠️ Run add-search-auth-users-rpc.sql
- ⚠️ Ensure users have metadata on signup

---

**Last Updated:** 2026-03-31  
**Status:** ✅ Ready to deploy after SQL migration
