# SignupPage to SQL Schema Mapping

## Overview

This document explains how the SignupPage.tsx correlates with the database schema in atall.sql and the triggered functions that create user records.

---

## Signup Flow Architecture

```
User Selects Role → Fills Form → Data Submitted
       ↓
signUp(email, password, name, accountType)
       ↓
Supabase Auth Creates auth.users record
       ↓
handle_new_user TRIGGER fires
       ↓
Calls create_customer_on_signup, seller insert, or delivery insert
       ↓
User profile records created in appropriate tables
```

---

## Account Types & Database Tables

### 1. CUSTOMER Account Type

**Frontend Role**: `"customer"`  
**Database Account Type**: `"customer"`  
**Tables Created**:

- `public.users` (via handle_new_user trigger)
- `public.customers` (via create_customer_on_signup trigger)

**Data Required**:

```typescript
{
  email: string                    // → users.email, customers.email
  password: string                 // → auth_users.password_hash
  full_name: string               // → users.full_name, customers.name
  phone?: string                  // → customers.phone (optional)
}
```

**Database Records Created**:

```sql
-- public.users
INSERT INTO users (user_id, email, full_name, phone, account_type)
VALUES (auth_id, email, full_name, phone, 'customer');

-- public.customers
INSERT INTO customers (user_id, name, email, phone, created_at)
VALUES (auth_id, full_name, email, phone, NOW());
```

---

### 2. SELLER Account Type

**Frontend Role**: `"seller"`  
**Database Account Type**: `"seller"`  
**Tables Created**:

- `public.users` (via handle_new_user trigger)
- `public.sellers` (via handle_new_user trigger, when account_type='seller')

**Data Required**:

```typescript
{
  email: string                    // → users.email, sellers.email
  password: string                 // → auth_users.password_hash
  full_name: string               // → users.full_name, sellers.full_name
  phone?: string                  // → sellers.phone
  location?: string               // → sellers.location
  currency?: string               // → sellers.currency (default: 'USD')
}
```

**Database Records Created**:

```sql
-- public.users
INSERT INTO users (user_id, email, full_name, phone, account_type)
VALUES (auth_id, email, full_name, phone, 'seller');

-- public.sellers
INSERT INTO sellers (
  user_id, email, full_name, phone, location, currency,
  account_type, is_verified
) VALUES (auth_id, email, full_name, phone, location, 'USD', 'seller', FALSE);
```

---

### 3. FACTORY Account Type

**Frontend Role**: `"factory"`  
**Database Account Type**: `"factory"`  
**Tables Created**:

- `public.users` (via handle_new_user trigger)
- `public.sellers` (with `is_factory=TRUE`)

**Data Required**:

```typescript
{
  email: string                    // → users.email, sellers.email
  password: string                 // → auth_users.password_hash
  full_name: string               // → users.full_name, sellers.full_name
  phone?: string                  // → sellers.phone
  location?: string               // → sellers.location
  currency?: string               // → sellers.currency
  production_capacity?: string    // → sellers.production_capacity
  min_order_quantity?: number     // → sellers.min_order_quantity
}
```

**Database Records Created**:

```sql
-- public.users
INSERT INTO users (user_id, email, full_name, phone, account_type)
VALUES (auth_id, email, full_name, phone, 'factory');

-- public.sellers (with factory-specific fields)
INSERT INTO sellers (
  user_id, email, full_name, phone, location, currency,
  account_type, is_verified, is_factory,
  production_capacity, min_order_quantity
) VALUES (
  auth_id, email, full_name, phone, location, 'USD',
  'factory', FALSE, TRUE,
  production_capacity, min_order_quantity
);
```

---

### 4. DELIVERY Account Type

**Frontend Role**: `"delivery"`  
**Database Account Type**: `"delivery"`  
**Tables Created**:

- `public.users` (via handle_new_user trigger)
- `public.delivery_profiles` (via handle_new_user trigger, when account_type='delivery')

**Data Required**:

```typescript
{
  email: string                    // → users.email
  password: string                 // → auth_users.password_hash
  full_name: string               // → users.full_name, delivery_profiles.full_name
  phone?: string                  // → users.phone, delivery_profiles.phone
  vehicle_type?: string           // → delivery_profiles.vehicle_type (motorcycle, car, bike, truck)
  vehicle_number?: string         // → delivery_profiles.vehicle_number
}
```

**Database Records Created**:

```sql
-- public.users
INSERT INTO users (user_id, email, full_name, phone, account_type)
VALUES (auth_id, email, full_name, phone, 'delivery');

-- public.delivery_profiles
INSERT INTO delivery_profiles (
  user_id, full_name, phone, vehicle_type,
  vehicle_number, is_verified, is_active
) VALUES (
  auth_id, full_name, phone, vehicle_type,
  vehicle_number, FALSE, TRUE
);
```

---

### 5. MIDDLEMAN Account Type

**Frontend Role**: `"middleman"`  
**Database Account Type**: `"middleman"`  
**Tables Created**:

- `public.users` (via handle_new_user trigger)
- `public.middle_men` (custom creation)

**Note**: Middleman has a special flow - redirects to `/signup/middleman` for separate application process.

**Data Required**:

```typescript
{
  email: string
  password: string
  full_name: string
  phone?: string
}
```

---

## Form Data Collection by Role

### CustomerSignupForm Collects:

```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}
```

### SellerSignupForm Collects:

```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  location?: string;              // NEW
  currency?: string;              // NEW (default: USD)
}
```

### FactorySignupForm Collects:

```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  location?: string;              // NEW
  currency?: string;              // NEW
  production_capacity?: string;   // NEW
  min_order_quantity?: number;    // NEW
}
```

### DeliverySignupForm Collects:

```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  vehicle_type?: string;          // NEW (motorcycle, car, bike, truck)
  vehicle_number?: string;        // NEW
}
```

---

## Authentication Metadata Structure

When calling `signUp()`, metadata is passed via `raw_user_meta_data`:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: "User Name",
      phone: "+1234567890",
      account_type: "customer", // ← This determines which trigger fires
      // Additional role-specific data:
      location: "Cairo, Egypt",
      currency: "EGP",
      vehicle_type: "motorcycle",
      vehicle_number: "ABC-123",
    },
  },
});
```

---

## Trigger Execution Order

### Step 1: `handle_new_user` Trigger (auth.users insert)

```sql
-- Creates public.users record
-- Checks account_type to determine role
IF account_type = 'seller' THEN
  -- Create sellers record
ELSIF account_type = 'delivery' THEN
  -- Create delivery_profiles record
END IF;
```

### Step 2: `create_customer_on_signup` Trigger (auth.users insert)

```sql
-- Only for customers
IF account_type = 'customer' THEN
  -- Create customers record
END IF;
```

### Step 3: Other Role-Specific Triggers

- `auto_create_user_wallet` → Creates wallet for all users
- `create_user_wallet_on_signup` → Backup wallet creation

---

## RLS Policies Applied

Each table has Row Level Security (RLS) policies:

### Users Table

```sql
-- Users can read their own profile
SELECT: auth.uid() = user_id

-- Users can update their own profile
UPDATE: auth.uid() = user_id

-- Service role can do anything (for backend)
ALL: auth.role() = 'service_role'
```

### Customers Table

```sql
-- Customers can view/update their own record
SELECT/UPDATE: auth.uid() = user_id

-- Service role access
ALL: auth.role() = 'service_role'
```

### Sellers Table

```sql
-- All authenticated users can view seller profiles (public)
SELECT: auth.role() = 'authenticated'

-- Sellers can update their own profile
UPDATE: auth.uid() = user_id

-- Service role access
ALL: auth.role() = 'service_role'
```

---

## Signup Validation & Security

**In useAuth.tsx signUp() function**:

1. ✅ Email validation (format check)
2. ✅ SQL injection detection
3. ✅ XSS detection
4. ✅ Password validation (min 6 chars)
5. ✅ Rate limiting (max 5 attempts per email)
6. ✅ Email sanitization (lowercase, trim)

---

## Error Handling

### Common Signup Errors:

| Error                            | Cause                      | Solution                                     |
| -------------------------------- | -------------------------- | -------------------------------------------- |
| "Database error saving new user" | RLS policy blocking insert | Check RLS policies on users/customers tables |
| "User already exists"            | Email already registered   | Use different email or reset password        |
| "Invalid email format"           | Email validation failed    | Check email format                           |
| "Password too weak"              | Password < 6 characters    | Use stronger password                        |
| "Too many signup attempts"       | Rate limit exceeded        | Wait 15 minutes before retrying              |

---

## Post-Signup Actions

After successful signup:

1. **Customer**:
   - Account created in users & customers tables
   - Wallet created automatically
   - Can add location later via profile update
   - Can start placing orders

2. **Seller**:
   - Account created in users & sellers tables
   - Wallet created automatically
   - Awaiting verification (is_verified=FALSE)
   - Can add products after verification

3. **Factory**:
   - Account created in users & sellers tables (is_factory=TRUE)
   - Wallet created automatically
   - Awaiting verification
   - Can manage wholesale orders

4. **Delivery Driver**:
   - Account created in users & delivery_profiles tables
   - Awaiting verification (is_verified=FALSE)
   - Vehicle info stored for assignments
   - Ready to receive delivery orders

---

## Database Consistency Checklist

Before deploying, verify:

- [ ] `handle_new_user` trigger exists on auth.users
- [ ] `create_customer_on_signup` trigger exists on auth.users
- [ ] RLS policies are correctly set on users, customers, sellers, delivery_profiles
- [ ] Location columns exist in customers table (latitude, longitude)
- [ ] All account_type values match trigger conditions
- [ ] Metadata is passed correctly to auth.signUp()
- [ ] Wallet creation triggers are active

---

## Example Complete Flow

```typescript
// User fills form
const formData = {
  email: "john@example.com",
  password: "securepass123",
  full_name: "John Doe",
  phone: "+201001234567",
  location: "Cairo",
};

// Frontend calls signUp
const { error } = await signUp(
  formData.email,
  formData.password,
  formData.full_name,
  "seller",
);

// Backend Flow:
// 1. Supabase validates credentials
// 2. Creates auth.users record with metadata
// 3. handle_new_user trigger fires:
//    - Creates public.users record
//    - Detects account_type='seller'
//    - Creates public.sellers record
// 4. auto_create_user_wallet trigger fires:
//    - Creates wallet record
// 5. Verification email sent
// 6. Frontend shows success screen
// 7. User clicks verification link
// 8. Account fully activated
```

---

## Testing Checklist

```bash
# Test Customer Signup
- Create account with "customer" role
- Verify users table has record
- Verify customers table has record
- Verify wallet created
- Test profile update

# Test Seller Signup
- Create account with "seller" role
- Verify users table has record
- Verify sellers table with is_factory=FALSE
- Verify is_verified=FALSE (awaiting verification)
- Test adding products

# Test Factory Signup
- Create account with "factory" role
- Verify sellers table with is_factory=TRUE
- Verify production_capacity stored
- Test wholesale orders

# Test Delivery Signup
- Create account with "delivery" role
- Verify users table has record
- Verify delivery_profiles has record
- Verify vehicle info stored
- Test receiving deliveryorders
```
