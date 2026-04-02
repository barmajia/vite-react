# Login Flow Architecture & Authentication

## Login Flow Overview

```
User → Login Page → useAuth.signIn() → Supabase Auth → Session Created
       ↓
   Validate Email/Password
       ↓
   Check Rate Limiting
       ↓
   Auth Check
       ↓
   Check Provider Profile (if applicable)
       ↓
   Navigate to Dashboard/Services
```

---

## 1. DATABASE TABLES INVOLVED

### Users Table

- **Purpose**: Core user profile for all account types
- **Columns**:
  - `user_id` (UUID) - References `auth.users.id`
  - `email` (TEXT) - User's email
  - `full_name` (TEXT) - User's name
  - `phone` (TEXT) - User's phone
  - `account_type` (TEXT) - 'customer', 'seller', 'factory', 'delivery', etc.
  - `created_at`, `updated_at` - Timestamps

### Customers Table (NEW WITH LOCATION)

- **Purpose**: Customer-specific profile for buyers
- **Columns**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - References `auth.users.id` (FK)
  - `name` (TEXT) - Customer name
  - `email` (TEXT) - Customer email
  - `phone` (TEXT) - Customer phone
  - `latitude` (NUMERIC) - **NEW** - Customer location
  - `longitude` (NUMERIC) - **NEW** - Customer location
  - `age_range` (TEXT) - Age demographic
  - `total_orders` (INTEGER) - Statistics
  - `total_spent` (NUMERIC) - Statistics
  - `last_purchase_date` (TIMESTAMP) - Last activity
  - `created_at`, `updated_at` - Timestamps

### Sellers Table

- **Purpose**: Seller-specific profile
- **Columns**:
  - `user_id` (UUID) - References `auth.users.id` (FK)
  - `email`, `full_name`, `phone` - Contact info
  - `location`, `latitude`, `longitude` - Seller location
  - `account_type` (TEXT) - 'seller'
  - `is_verified` (BOOLEAN) - Seller verification status
  - Other business info...

---

## 2. LOGIN FLOW - DETAILED STEPS

### Step 1: User Submits Login Form

**File**: `src/pages/auth/Login.tsx`

```typescript
// User enters email and password
const handleSubmit = async (e: React.FormEvent) => {
  // 1. Validate form (email format, password length)
  // 2. Call signIn(email, password)
  // 3. Handle response
};
```

### Step 2: signIn Function (useAuth Hook)

**File**: `src/hooks/useAuth.tsx`

```typescript
const signIn = async (email: string, password: string) => {
  // 1. Validate inputs (email format)
  // 2. Check for malicious input (SQL injection, XSS)
  // 3. Rate limiting check - prevent brute force
  // 4. Call supabase.auth.signInWithPassword()
  // 5. Return { data, error }
};
```

**Security Checks**:

- Email validation via `validateEmail()`
- Malicious input detection via `detectSqlInjection()` and `detectXss()`
- Rate limiting via `authRateLimiter`
- Password must be >= 6 characters

### Step 3: Supabase Authentication

**Flow**:

```
Supabase Auth Service
  ↓
1. Check if user exists in auth.users table
2. Verify password hash
3. Create session token
4. Return user data + session
```

### Step 4: Post-Login Checks

**File**: `src/pages/auth/Login.tsx` (Lines 60-90)

```typescript
if (error) {
  // Show error message
  toast.error(error.message);
} else {
  // Successful login
  toast.success("Welcome back!");

  // Check if user is a service provider
  const { data: provider } = await supabase
    .from("svc_providers")
    .select("id, status")
    .eq("user_id", data.user.id)
    .single();

  if (provider) {
    if (provider.status === "pending_review") {
      navigate("/services/dashboard/pending");
    } else {
      navigate("/services/dashboard");
    }
  } else {
    navigate("/services");
  }
}
```

### Step 5: Session Persistence

**File**: `src/hooks/useAuth.tsx` (AuthProvider)

```typescript
useEffect(() => {
  // Get existing session on app load
  getSession().then((sessionData) => {
    setSession(sessionData);
    setUser(sessionData?.user ?? null);
    setLoading(false);
  });

  // Listen for auth changes
  const subscription = onAuthStateChange(
    (_event, sessionData: Session | null) => {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      setLoading(false);
    },
  );

  return () => subscription.unsubscribe();
}, []);
```

---

## 3. AUTHENTICATION STATE MANAGEMENT

**Auth Context provides:**

- `session` - Current Supabase session
- `user` - Current logged-in user object
- `loading` - Loading state during auth checks
- `signIn()` - Login function
- `signUp()` - Registration function
- `signOut()` - Logout function

**Usage in Components**:

```typescript
const { user, session, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) return <LoginPage />;
return <Dashboard />;
```

---

## 4. CUSTOMER RECORD CREATION

### When Customer Signs Up:

1. **User submits signup form** (email, password, name)
2. **signUp() called** with `accountType = "customer"`
3. **Supabase creates auth.users record**
4. **handle_new_user TRIGGER fires**
   - Creates `public.users` record with account_type='customer'
   - Does NOT create customers record (only for sellers)
5. **create_customer_on_signup TRIGGER fires** (NEW)
   - Creates `public.customers` record
   - Links customer to auth.users via user_id

### Customer Table Creation Flow:

```
Auth Signup
  ↓
handle_new_user trigger
  → Insert into public.users (account_type='customer')
  ↓
create_customer_on_signup trigger
  → Insert into public.customers
    - user_id (from auth.users.id)
    - name (from user metadata)
    - email (from auth.users.email)
    - phone (optional, from metadata)
    - latitude, longitude (NULL initially)
  ↓
Customer record ready for location updates
```

---

## 5. HOW TO USE CUSTOMER LOCATION

### In Frontend Component:

```typescript
// Get current user's location
const { user } = useAuth();

// Update customer location
const updateCustomerLocation = async (latitude: number, longitude: number) => {
  const { error } = await supabase
    .from("customers")
    .update({
      latitude,
      longitude,
      updated_at: new Date(),
    })
    .eq("user_id", user.id);

  if (error) {
    toast.error("Failed to update location");
  } else {
    toast.success("Location saved!");
  }
};

// Request browser location
const requestLocationPermission = async () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      updateCustomerLocation(latitude, longitude);
    },
    (error) => {
      toast.error("Location permission denied");
    },
  );
};
```

### In Backend (Getting nearby customers):

```sql
-- Find all customers within 5km of a location
SELECT id, name, email, phone, latitude, longitude
FROM public.customers
WHERE
  SQRT(
    POW(latitude - 24.7136, 2) +
    POW(longitude - 46.6753, 2)
  ) * 111.32 < 5  -- 111.32 km per degree
ORDER BY SQRT(
  POW(latitude - 24.7136, 2) +
  POW(longitude - 46.6753, 2)
)
LIMIT 10;
```

---

## 6. AUTHENTICATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     Login Page Component                     │
│                   (src/pages/auth/Login.tsx)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   Form Validation                  │
        │ - Email format                     │
        │ - Password length (min 6)          │
        │ - Check for empty fields           │
        └────────┬─────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │  useAuth.signIn()                  │
        │  (src/hooks/useAuth.tsx)           │
        └────────┬─────────────────────────────┘
                 │
        ┌────────▼──────────────────────────┐
        │ Security Checks:                   │
        │ - SQL Injection detection          │
        │ - XSS detection                    │
        │ - Rate limiting                    │
        └────────┬──────────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────────┐
  │  Supabase Auth.signInWithPassword()      │
  │  → Verify email & password               │
  │  → Create session token                  │
  │  → Return user + session                 │
  └──────────┬───────────────────────────────┘
             │
  ┌──────────▼──────────────────────────────┐
  │  Post-Login Checks                       │
  │  - Check provider profile (if exists)   │
  │  - Route to appropriate dashboard       │
  └──────────┬───────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────────────┐
  │  AuthProvider Updates State               │
  │  - session = user session                 │
  │  - user = user object                     │
  │  - Accessible via useAuth() hook          │
  └──────────────────────────────────────────┘
```

---

## 7. FILES INVOLVED IN LOGIN FLOW

| File                                        | Purpose                          |
| ------------------------------------------- | -------------------------------- |
| `src/pages/auth/Login.tsx`                  | Login UI form                    |
| `src/hooks/useAuth.tsx`                     | Authentication logic and context |
| `src/lib/supabase.ts`                       | Supabase client initialization   |
| `src/lib/security.ts`                       | Rate limiter, validation helpers |
| `src/utils/sanitize.ts`                     | Input sanitization functions     |
| `all.sql` / `add-location-to-customers.sql` | Database setup & triggers        |

---

## 8. NEXT STEPS

1. ✅ Run `add-location-to-customers.sql` in Supabase
2. ✅ Verify customers table has new location columns
3. ✅ Test signup flow - customers table should auto-populate
4. ✅ Implement location tracking in profile page
5. ✅ Add geolocation permission request on first login

---

## TROUBLESHOOTING

### If customer record isn't created:

- Check `create_customer_on_signup` trigger is enabled
- Verify RLS policies allow insert to customers table
- Check auth metadata is being passed correctly

### If location columns not visible:

- Run the SQL migration again
- Refresh your Supabase dashboard
- Check indexes were created

### If login fails:

- Check rate limiting isn't blocking the IP
- Verify email/password validation rules
- Check RLS policies on `users` table
