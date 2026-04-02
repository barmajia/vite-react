# Complete Signup Trigger Integration Guide

## Overview

The Aurora signup system is already fully connected and ready to work. Here's how it flows:

```
Customer fills signup form
    ↓
SignupPage.tsx calls signUp() hook
    ↓
signUp() passes email, password, and metadata (including account_type)
    ↓
Supabase auth.signUp() creates auth user
    ↓
✨ handle_new_user trigger AUTOMATICALLY runs
    ↓
Trigger creates user profile in public.users
    ↓
Trigger creates role-specific record (customers/sellers/delivery_profiles)
    ↓
Trigger creates wallet for user
    ↓
✅ User is fully set up and ready to use the platform
```

---

## Step 1: Deploy the Improved Trigger (5 minutes)

### Method A: Direct Deployment (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit https://app.supabase.com
   - Select your project "aurora_ecommerse"

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and Paste the Trigger:**
   - Open `HANDLE_NEW_USER_IMPROVED.sql` in VS Code
   - Copy ALL content
   - Paste into Supabase SQL Editor

4. **Execute:**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message
   - Should see: "Successfully executed 1 statement"

5. **Verify Deployment:**
   - Open new SQL Query
   - Paste this verification query:

```sql
SELECT
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
LIMIT 1;
```

- Run it
- You should see:
  - routine_name: `handle_new_user`
  - security_type: `SECURITY DEFINER` ← **IMPORTANT: Must be SECURITY DEFINER**

---

## Step 2: Test the Signup Flow (5 minutes)

### Test Customer Signup

1. **Start Dev Server:**

   ```bash
   npm run dev
   # Server running at http://localhost:5173
   ```

2. **Open Signup Page:**
   - Navigate to http://localhost:5173/signup/customer
   - Or go to http://localhost:5173 → Click "Sign up"

3. **Fill Form:**

   ```
   Name: John Doe
   Email: testcustomer+20260401@example.com (use different email each time)
   Phone: +1 234 567 8900
   Password: Test@1234
   ```

4. **Submit:**
   - Click "Create Account"
   - Should see success screen: "Account Created! 🎉"
   - Email verification link sent (check console logs)

5. **Verify in Supabase:**
   - Go to Supabase Dashboard
   - Go to Auth → Users
   - Find your test email
   - Click it, expand "Raw user metadata"
   - Should show: `account_type: "customer"`

### Verify Database Records Created

1. **Check public.users:**

   ```sql
   SELECT user_id, email, account_type, created_at
   FROM public.users
   WHERE email = 'testcustomer+20260401@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   - Should return 1 row

2. **Check public.customers:**

   ```sql
   SELECT user_id, email, created_at
   FROM public.customers
   WHERE user_id = (
     SELECT user_id FROM public.users
     WHERE email = 'testcustomer+20260401@example.com'
   )
   LIMIT 1;
   ```

   - Should return 1 row

3. **Check public.user_wallets (MOST IMPORTANT):**
   ```sql
   SELECT user_id, balance, currency, created_at
   FROM public.user_wallets
   WHERE user_id = (
     SELECT user_id FROM public.users
     WHERE email = 'testcustomer+20260401@example.com'
   )
   LIMIT 1;
   ```

   - Should return 1 row with balance = 0 and currency = "USD"
   - ✅ **If wallet exists = TRIGGER IS WORKING PERFECTLY**

### Test Other Account Types

#### Seller Signup

```bash
# URL: http://localhost:5173/signup/seller
Email: testseller+20260401@example.com
Phone: +1 234 567 8901
Location: Cairo, Egypt
Currency: EGP
Password: Test@1234
```

Verify in Supabase:

```sql
SELECT user_id, email, is_factory, created_at FROM public.sellers
WHERE email = 'testseller+20260401@example.com' LIMIT 1;
```

#### Factory Signup

```bash
# URL: http://localhost:5173/signup/factory
Email: testfactory+20260401@example.com
Password: Test@1234
```

Verify:

```sql
SELECT user_id, email, is_factory, created_at FROM public.sellers
WHERE email = 'testfactory+20260401@example.com' AND is_factory = TRUE LIMIT 1;
```

- Note: is_factory should be **TRUE** (Fixed by improved trigger!)

#### Delivery Signup

```bash
# URL: http://localhost:5173/signup/delivery
Email: testdelivery+20260401@example.com
Vehicle Type: motorcycle
Vehicle Number: ABC123
Password: Test@1234
```

Verify:

```sql
SELECT user_id, full_name, vehicle_type, created_at FROM public.delivery_profiles
WHERE email = 'testdelivery+20260401@example.com' LIMIT 1;
```

---

## Step 3: Monitor Trigger Execution

### View Trigger Logs (if enabled)

```sql
-- Check PostgreSQL logs for trigger activity
-- Errors will appear as WARNING messages
SELECT
  current_timestamp,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';
```

### Check for Common Issues

**Issue: Wallet not created**

```sql
SELECT COUNT(*) as wallets_without_balance
FROM public.user_wallets
WHERE balance IS NULL OR balance = 0;
```

**Issue: Factory stored as separate record instead of sellers with is_factory**

```sql
-- Should return 0 rows (fixed by improved trigger)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'factories';
```

---

## Step 4: Frontend Configuration (Already Done ✅)

The signup pages are already configured to pass account_type to the trigger:

### Customer Signup - [src/components/signup/CustomerSignupForm.tsx](src/components/signup/CustomerSignupForm.tsx)

```typescript
const { error } = await signUp(
  formData.email,
  formData.password,
  formData.full_name,
  "customer", // ← Account type passed to trigger
  {
    phone: formData.phone, // ← Metadata passed to trigger
  },
);
```

### Seller Signup - [src/components/signup/SellerSignupForm.tsx](src/components/signup/SellerSignupForm.tsx)

```typescript
const { error } = await signUp(
  formData.email,
  formData.password,
  formData.full_name,
  "seller", // ← Account type passed to trigger
  {
    phone: formData.phone,
    location: formData.location,
    currency: formData.currency,
  },
);
```

### useAuth Hook - [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx#L250-L300)

Calls `supabase.auth.signUp()` with metadata:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: sanitizedEmail,
  password,
  options: {
    data: {
      account_type: resolvedAccountType, // ← Sent to trigger!
      full_name: sanitizedName,
      phone: sanitizedPhone,
      location: sanitizedLocation,
      currency: sanitizedCurrency,
      // ... more fields
    },
  },
});
```

---

## How the Trigger Works (Technical Details)

### Trigger Execution Flow

1. **User signs up** via Supabase Auth
2. **New record created** in `auth.users` table
3. **Trigger fires** automatically (on INSERT)
4. **Extract metadata** from `NEW.raw_user_meta_data`
5. **Create records:**
   - `public.users` (base user record)
   - `public.customers` OR `public.sellers` OR `public.delivery_profiles` (role-specific)
   - `public.user_wallets` (wallet created with 0 balance, DEFAULT currency)
6. **Exception handling** - any errors logged as WARNING messages

### Improvements in HANDLE_NEW_USER_IMPROVED.sql

| Issue             | Old Behavior                                 | Fixed Behavior                                    |
| ----------------- | -------------------------------------------- | ------------------------------------------------- |
| Wallet Creation   | ❌ Not created                               | ✅ Auto-created for all users                     |
| Factory Table     | ❌ References non-existent `factories` table | ✅ Uses `sellers` with `is_factory=TRUE`          |
| Error Handling    | ❌ Silent failures                           | ✅ EXCEPTION blocks log warnings                  |
| Security Context  | ❌ `SECURITY INVOKER` (default)              | ✅ `SECURITY DEFINER` prevents RLS issues         |
| Middleman Support | ❌ Not supported                             | ✅ Full support added                             |
| Timestamps        | ❌ May be NULL                               | ✅ Always uses NOW()                              |
| Permissions       | ⚠️ Limited                                   | ✅ GRANT to postgres, service_role, authenticated |

---

## Troubleshooting

### Signup Shows "Database error saving new user"

**Cause:** Usually RLS policy blocking trigger
**Solution:** Check SIGNUP_FIX_FINAL.sql has been applied

```bash
# Verify RLS policies exist:
supabase db push SIGNUP_FIX_FINAL.sql
```

### Wallet not created on signup

**Cause:** Old trigger still in place
**Solution:** Replace with HANDLE_NEW_USER_IMPROVED.sql

```sql
-- Verify current trigger:
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- Should contain: INSERT INTO public.user_wallets
```

### Factory signup creates separate record

**Cause:** Using old factory table
**Solution:** Trigger should use `sellers` with `is_factory=TRUE`

```sql
-- Check if factories table exists:
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'factories');
-- Should return: false

-- Verify seller record was created:
SELECT is_factory FROM public.sellers
WHERE email = 'your-factory@example.com';
-- Should return: true
```

### "Email not confirmed" on login

**Normal behavior** - Supabase requires email verification first:

1. Check email inbox and spam folder
2. Click confirmation link
3. Then login

---

## Next Steps

After confirming signup works:

1. **Deploy Health Module RPC Functions:**

   ```bash
   supabase db push HEALTH_MODULE_RPC_FUNCTIONS.sql
   ```

2. **Test Health Features:**
   - Navigate to /health/audit-logs
   - Navigate to /health/consent-form
   - Should see real backend calls (not stubs)

3. **Deploy Additional Services:**
   - Replace conversation service stubs
   - Replace profile service stubs
   - Replace order service stubs

---

## Files Reference

| File                                                                                         | Purpose                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [HANDLE_NEW_USER_IMPROVED.sql](HANDLE_NEW_USER_IMPROVED.sql)                                 | **DEPLOY THIS** - Better trigger function                |
| [SIGNUP_FIX_FINAL.sql](SIGNUP_FIX_FINAL.sql)                                                 | RLS policies for signup (already deployed via atall.sql) |
| [src/pages/signup/SignupPage.tsx](src/pages/signup/SignupPage.tsx)                           | Main signup page                                         |
| [src/components/signup/CustomerSignupForm.tsx](src/components/signup/CustomerSignupForm.tsx) | Customer form                                            |
| [src/components/signup/SellerSignupForm.tsx](src/components/signup/SellerSignupForm.tsx)     | Seller form                                              |
| [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)                                               | Auth hook - passes metadata to trigger                   |

---

## Success Criteria ✅

After completing this guide, you should have:

- ✅ Improved trigger deployed to Supabase
- ✅ Customer signup creates users + wallet
- ✅ Seller signup creates sellers record + wallet
- ✅ Factory signup sets is_factory=TRUE
- ✅ Delivery signup creates delivery_profiles + wallet
- ✅ All wallets created with correct currency
- ✅ No "Database error" messages on signup
- ✅ Email verification working correctly
- ✅ All test emails show in Supabase Auth & public tables

**Ready to continue with health module, services, and user dashboard!** 🚀
