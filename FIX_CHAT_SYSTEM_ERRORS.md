# 🔧 Fix Chat System Database Errors (404 & 500)

## 🚨 Error Messages

If you're seeing these errors in your browser console:

```
GET https://your-project.supabase.co/rest/v1/services_conversations?... 404 (Not Found)
GET https://your-project.supabase.co/rest/v1/trading_conversations?... 404 (Not Found)
GET https://your-project.supabase.co/rest/v1/conversation_participants?... 500 (Internal Server Error)
```

## ✅ Quick Fix

### Step 1: Run the Fix Script

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your Aurora project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Fix Script**
   - Open the file: `fix-chat-system-errors.sql`
   - Copy all contents
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

### Step 2: Verify the Fix

After running the script, verify the tables exist:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'conversations',
    'conversation_participants',
    'messages',
    'services_conversations',
    'services_messages',
    'trading_conversations',
    'trading_messages',
    'health_conversations',
    'health_messages'
  )
ORDER BY table_name;
```

You should see **9 tables** listed.

### Step 3: Refresh Your App

- Refresh your browser
- Navigate to the chat page
- Check console for errors (should be gone)

---

## 📋 What the Fix Script Does

### 1. Fixes conversation_participants (500 Error)

```sql
- Adds missing account_type column
- Fixes foreign key constraints
- Adds proper indexes
- Updates RLS policies
```

### 2. Creates Missing Tables (404 Errors)

**Services Chat Tables:**
- `services_conversations` - Service provider ↔ client conversations
- `services_messages` - Messages for service conversations

**Trading Chat Tables:**
- `trading_conversations` - B2B trading conversations
- `trading_messages` - Messages for trading conversations

**Health Chat Tables:**
- `health_conversations` - Doctor ↔ patient conversations
- `health_messages` - Messages for health conversations

### 3. Sets Up Security

- Row Level Security (RLS) policies for all tables
- Users can only access their own conversations
- Proper authentication checks

### 4. Enables Realtime

- Adds all tables to Supabase realtime publication
- Enables live message updates

### 5. Creates Helper Functions

- `create_services_conversation()` - Create service chat
- `create_trading_conversation()` - Create trading chat
- `update_updated_at_column()` - Auto-update timestamps

---

## 🐛 Troubleshooting

### Still Getting 500 Error on conversation_participants?

**Check if account_type column exists:**

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'conversation_participants' 
  AND column_name = 'account_type';
```

**If it doesn't exist, run:**

```sql
ALTER TABLE public.conversation_participants 
ADD COLUMN account_type text;
```

### Still Getting 404 on services_conversations?

**Check if table exists:**

```sql
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'services_conversations'
);
```

**If it returns false, create the table manually:**

```sql
CREATE TABLE public.services_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    provider_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    listing_id uuid REFERENCES public.service_listings(id) ON DELETE CASCADE,
    last_message text,
    last_message_at timestamptz,
    is_archived boolean DEFAULT false,
    is_read_by_provider boolean DEFAULT false,
    is_read_by_client boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.services_conversations ENABLE ROW LEVEL SECURITY;
```

### Check RLS Policies

**Verify RLS is enabled:**

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('conversation_participants', 'services_conversations', 'trading_conversations');
```

All should have `rowsecurity = true`.

---

## 📊 Table Structure Reference

### conversation_participants

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_id | uuid | Foreign key to conversations |
| user_id | uuid | Foreign key to users |
| account_type | text | Auto-populated from users table |
| role | text | User's role in conversation |
| last_read_message_id | uuid | Last read message |
| is_muted | boolean | Whether conversation is muted |
| joined_at | timestamptz | When user joined |

### services_conversations

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| provider_id | uuid | Service provider user ID |
| client_id | uuid | Client user ID |
| listing_id | uuid | Service listing ID |
| last_message | text | Last message text |
| last_message_at | timestamptz | Last message timestamp |
| is_archived | boolean | Whether archived |
| is_read_by_provider | boolean | Provider read status |
| is_read_by_client | boolean | Client read status |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### trading_conversations

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_type | text | Type of conversation |
| product_id | uuid | Product being discussed |
| deal_id | uuid | Deal ID if applicable |
| initiator_id | uuid | User who started chat |
| receiver_id | uuid | User who received chat |
| initiator_role | text | Initiator's account type |
| receiver_role | text | Receiver's account type |
| is_custom_request | boolean | Whether custom request |
| custom_request_details | jsonb | Custom request details |
| factory_id | uuid | Factory profile ID |
| middleman_id | uuid | Middleman user ID |
| last_message | text | Last message text |
| last_message_at | timestamptz | Last message timestamp |
| is_archived | boolean | Whether archived |
| is_closed | boolean | Whether deal closed |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

## ✅ Success Checklist

After running the fix script, verify:

- [ ] No 404 errors in browser console
- [ ] No 500 errors in browser console
- [ ] All 9 tables exist in Table Editor
- [ ] RLS is enabled on all tables
- [ ] Can load chat page without errors
- [ ] Can send and receive messages
- [ ] Realtime updates work (messages appear instantly)

---

## 📞 Still Having Issues?

### Get Diagnostic Information

Run these queries and share the results:

```sql
-- 1. Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%conversation%'
ORDER BY table_name;

-- 2. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%conversation%';

-- 3. Check conversation_participants structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- 4. Check for any SQL errors
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
```

### Common Issues

**Issue: "relation does not exist"**
- Table wasn't created, run the fix script again

**Issue: "permission denied"**
- RLS policy issue, check if user is authenticated

**Issue: "column does not exist"**
- Column missing, check table structure

---

**Last Updated:** March 30, 2026  
**Status:** ✅ Ready to Fix
