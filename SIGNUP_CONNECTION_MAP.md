# Signup System Connection Map

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SignupPage.tsx                                                  │
│  ├─ Renders: CustomerSignupForm, SellerSignupForm, etc.        │
│  └─ Manages: selectedRole, loading, error, success states      │
│                            ↓                                     │
│  **Form Components Pass Data:**                                 │
│  CustomerSignupForm                                             │
│  ├─ Collects: email, password, full_name, phone                │
│  └─ Calls: onSubmit(formData)                                  │
│                            ↓                                     │
│  onSubmit Handlers (in SignupPage)                             │
│  ├─ Extract form data                                           │
│  ├─ Call: signUp() hook                                        │
│  └─ Pass: account_type + metadata                              │
│                            ↓                                     │
├─────────────────────────────────────────────────────────────────┤
│                   AUTHENTICATION LAYER (React)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  useAuth Hook (hooks/useAuth.tsx)                               │
│  ├─ Input: email, password, fullName, account_type, metadata   │
│  ├─ Validate: email format, password strength                  │
│  ├─ Sanitize: input data                                        │
│  ├─ Call: supabase.auth.signUp()                               │
│  └─ Pass: raw_user_meta_data = {                              │
│       account_type: "customer" | "seller" | "factory" | ...   │
│       full_name, phone, location, currency, ...                │
│     }                                                            │
│                            ↓                                     │
├─────────────────────────────────────────────────────────────────┤
│           SUPABASE AUTHENTICATION SERVICE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  supabase.auth.signUp()                                         │
│  ├─ Create: new user in auth.users table                       │
│  ├─ Store: metadata in raw_user_meta_data JSON                │
│  └─ Trigger: ON INSERT - execute handle_new_user()           │
│                            ↓                                     │
│  ⚡ **TRIGGER FIRES** ⚡                                       │
│                            ↓                                     │
├─────────────────────────────────────────────────────────────────┤
│     DATABASE TRIGGER (PostgreSQL - THIS IS WHERE WE NEED YOU)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  handle_new_user() trigger function                             │
│  │                                                               │
│  ├─ Step 1: Extract metadata                                   │
│  │   v_account_type := NEW.raw_user_meta_data->>'account_type' │
│  │   v_currency := NEW.raw_user_meta_data->>'currency'        │
│  │                                                               │
│  ├─ Step 2: Create base user record                            │
│  │   INSERT INTO public.users (                                │
│  │     user_id, email, full_name, phone, account_type, ...    │
│  │   )                                                          │
│  │                                                               │
│  ├─ Step 3: Create role-specific record (based on account_type)│
│  │   CASE v_account_type                                       │
│  │   WHEN 'customer' THEN INSERT INTO public.customers        │
│  │   WHEN 'seller' THEN INSERT INTO public.sellers            │
│  │   WHEN 'factory' THEN INSERT INTO public.sellers           │
│  │                   with is_factory=TRUE               ← FIXED│
│  │   WHEN 'delivery' THEN INSERT INTO public.delivery_profiles│
│  │   WHEN 'middleman' THEN INSERT INTO public.sellers    ← NEW│
│  │   END CASE                                                  │
│  │                                                               │
│  └─ Step 4: Create wallet for user                            │
│      INSERT INTO public.user_wallets (              ← CRITICAL │
│        user_id, balance=0, currency, ...                       │
│      )                                                          │
│      └─ ✅ FIXED: Wallet now auto-created!                   │
│                            ↓                                     │
├─────────────────────────────────────────────────────────────────┤
│        DATABASE TABLES (PostgreSQL - Data Storage)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  public.users ← Base user record created by trigger            │
│  │                                                               │
│  ├─ public.customers ← Customer-specific (if account_type=    │
│  │                     'customer')                             │
│  │                                                               │
│  ├─ public.sellers ← Seller/Factory/Middleman records          │
│  │                (with is_factory flag for factories)         │
│  │                                                               │
│  ├─ public.delivery_profiles ← Delivery-specific (if account_  │
│  │                            type='delivery')                 │
│  │                                                               │
│  └─ public.user_wallets ← Wallet record created for ALL users │
│                          (balance=0, currency from metadata)   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Customer Signup

```
USER fills form
│
├─ Name: John Doe
├─ Email: john@example.com
├─ Phone: +1 234 567 8900
└─ Password: Test@1234

    ↓ FRONTEND PROCESSES

SignupPage.tsx sends onSubmit
│
├─ Calls: signUp(
│   email: "john@example.com",
│   password: "Test@1234",
│   fullName: "John Doe",
│   account_type: "customer",
│   metadata: { phone: "+1 234 567 8900" }
│ )

    ↓ useAuth HOOK VALIDATES & CALLS SUPABASE

supabase.auth.signUp() with metadata:
│
└─ raw_user_meta_data: {
     account_type: "customer",
     full_name: "John Doe",
     phone: "+1 234 567 8900"
   }

    ↓ SUPABASE CREATES AUTH USER

✨ handle_new_user TRIGGER FIRES AUTOMATICALLY ✨

    ↓ TRIGGER EXTRACTS ACCOUNT TYPE

v_account_type = "customer"

    ↓ TRIGGER CREATES RECORDS

✅ INSERT INTO public.users:
   user_id: (from auth.users.id)
   email: john@example.com
   full_name: John Doe
   phone: +1 234 567 8900
   account_type: customer

✅ INSERT INTO public.customers:
   user_id: (same)
   name: John Doe
   email: john@example.com
   phone: +1 234 567 8900

✅ INSERT INTO public.user_wallets:  ← NEW!
   user_id: (same)
   balance: 0
   currency: USD

    ↓ FRONTEND SHOWS SUCCESS

"Account Created! 🎉"
"Verification sent to john@example.com"
```

## Connection Status Checklist

### ✅ Already Connected (Frontend)

- [x] SignupPage.tsx passes account_type to signUp()
- [x] All form components pass required metadata
- [x] useAuth hook validates and sanitizes input
- [x] supabase.auth.signUp() sends metadata in raw_user_meta_data
- [x] Error handling and loading states in place
- [x] Success screen shows verification message

### ⏳ Needs Deployment (Backend)

- [ ] **Deploy HANDLE_NEW_USER_IMPROVED.sql to Supabase**
  - Contains fixes for: wallet creation, factory table, error handling
  - Status: Ready in VS Code, needs manual deployment

- [ ] **Test Signup Flow**
  - Verify trigger fires when user signs up
  - Check that wallet is created
  - Confirm factory records have is_factory=TRUE

### 📋 Already Applied (Database Schema)

- [x] atall.sql deployed (all tables created)
- [x] RLS policies deployed (via SIGNUP_FIX_FINAL.sql included in atall.sql)
- [x] User tables: users, customers, sellers, delivery_profiles
- [x] Wallet table: user_wallets
- [x] Auth trigger reference: handle_new_user exists (but needs upgrade)

---

## Quick Start: Get Signup Working

### Step 1: Deploy the Trigger (3 minutes)

```
1. Open VS Code: HANDLE_NEW_USER_IMPROVED.sql
2. Copy all content
3. Go to: https://app.supabase.com → SQL Editor
4. Paste and Run
5. Done! ✅
```

### Step 2: Test Signup (2 minutes)

```
1. npm run dev
2. Go to: http://localhost:5173/signup/customer
3. Fill form with test email
4. Submit
5. Should see: "Account Created! 🎉"
```

### Step 3: Verify Database (1 minute)

```sql
-- Test this query in Supabase SQL Editor:
SELECT COUNT(*) as wallets FROM public.user_wallets
WHERE user_id = (SELECT user_id FROM public.users
  WHERE email = 'your-test-email@example.com');
-- Should return: 1
```

---

## What Each File Does

| File                             | Role                                        | Status              |
| -------------------------------- | ------------------------------------------- | ------------------- |
| **SignupPage.tsx**               | Main signup entry point, form orchestration | ✅ Ready            |
| **CustomerSignupForm.tsx**       | Customer form UI & data collection          | ✅ Ready            |
| **SellerSignupForm.tsx**         | Seller form UI & data collection            | ✅ Ready            |
| **FactorySignupForm.tsx**        | Factory form UI & data collection           | ✅ Ready            |
| **DeliverySignupForm.tsx**       | Delivery form UI & data collection          | ✅ Ready            |
| **useAuth.tsx**                  | Signup hook, validation, Supabase call      | ✅ Ready            |
| **HANDLE_NEW_USER_IMPROVED.sql** | Database trigger (needs deployment)         | ⏳ Pending          |
| **SIGNUP_FIX_FINAL.sql**         | RLS policies                                | ✅ Already deployed |

---

## Key Improvements in HANDLE_NEW_USER_IMPROVED.sql

### Before (Current - May Have Issues)

```sql
WHEN 'factory' THEN
  INSERT INTO public.factories (...)  -- ❌ Table doesn't exist!

-- ❌ Wallet creation missing
-- ❌ No error handling
-- ❌ No SECURITY DEFINER
-- ❌ No middleman support
```

### After (HANDLE_NEW_USER_IMPROVED.sql)

```sql
WHEN 'factory' THEN
  INSERT INTO public.sellers (..., is_factory=TRUE, ...)  -- ✅ Correct!

WHEN 'middleman' THEN  -- ✅ New support
  INSERT INTO public.sellers (..., is_factory=FALSE, ...)

-- ✅ Wallet creation for ALL users:
INSERT INTO public.user_wallets (user_id, balance, currency)

-- ✅ Exception handling:
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Error: %', SQLERRM;

-- ✅ Security:
SECURITY DEFINER SET search_path = public
```

---

## Troubleshooting

**Q: Where do I deploy the trigger?**
A: Go to Supabase Dashboard → SQL Editor → New Query → Paste → Run

**Q: Will the frontend change?**
A: No! Frontend is already ready. Only need to update the database trigger.

**Q: How do I know if it's working?**
A: After signup, check Supabase → Table Browser → user_wallets. Should have new record.

**Q: Can I undo the changes?**
A: Yes, but trigger will fail on new signups. Keep HANDLE_NEW_USER_IMPROVED.sql.

---

## Success = This Flow Completes Without Errors

```
Customer fills form
    👇
Frontend sends data to useAuth.signUp()
    👇
useAuth validates and calls supabase.auth.signUp()
    👇
Supabase creates auth user
    👇
✨ handle_new_user TRIGGER FIRES
    👇
Trigger creates: users + customers + wallet
    👇
Frontend shows: "Account Created! 🎉"
    👇
Supabase shows: 3 new records in users, customers, user_wallets
    ✅ SUCCESS!
```

---

## Next After Signup Works

1. Test other account types (seller, factory, delivery)
2. Deploy Health Module RPC functions
3. Test health features end-to-end
4. Replace service stubs (conversation, profile, order, etc.)
