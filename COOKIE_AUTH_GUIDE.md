# Cookie-Based Authentication Guide

## Overview

This project now uses **cookie-based authentication** with Supabase for better security and session management. The authentication token is stored in cookies instead of localStorage, providing:

- ✅ Better security against XSS attacks
- ✅ Automatic token refresh
- ✅ Session persistence across page reloads
- ✅ SameSite protection against CSRF attacks

## How It Works

### 1. Authentication Flow

```
User Login → Supabase Auth → JWT Token → Stored in Cookie → All API Requests Include Token
```

### 2. Cookie Storage

The authentication session is stored in a cookie named `aurora-auth-token` with the following properties:

- **Expiry**: 30 days
- **Path**: `/` (accessible across entire site)
- **SameSite**: `Lax` (protects against CSRF)
- **Secure**: `true` in production (HTTPS only)

### 3. Row Level Security (RLS)

Your Supabase database uses RLS policies to control data access. When a user makes a request:

1. The cookie token is automatically included in the request
2. Supabase validates the token and extracts the `user_id`
3. RLS policies check if the user can access the data
4. Only authorized data is returned

**Example RLS Policies from your SQL:**
```sql
-- Users can only view their own orders
CREATE POLICY users_manage_own_orders ON orders
  FOR ALL USING (auth.uid() = user_id);

-- Sellers can only manage their own products
CREATE POLICY sellers_manage_own_products ON products
  FOR ALL USING (auth.uid() = seller_id);

-- Public can view active products
CREATE POLICY customers_view_active_products ON products
  FOR SELECT USING (status = 'active');
```

## Usage

### 1. Authentication Hook

```tsx
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### 2. Protected Routes

```tsx
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return children;
}
```

### 3. Fetching Protected Data

```tsx
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    // RLS automatically filters to user's orders only
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      setOrders(data);
    };

    fetchOrders();
  }, [user]);

  return <div>...</div>;
}
```

### 4. User Preferences (Cookies)

```tsx
import { useUserPreferences, useThemeCookie, useLanguageCookie } from "@/hooks/useUserPreferences";

function SettingsPage() {
  const { getPreference, setPreference } = useUserPreferences();
  const { getTheme, setTheme } = useThemeCookie();
  const { getLanguage, setLanguage } = useLanguageCookie();

  return (
    <div>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
      <button onClick={() => setLanguage("ar")}>العربية</button>
    </div>
  );
}
```

## Cookie Types Used

| Cookie Name | Purpose | Expiry |
|------------|---------|--------|
| `aurora-auth-token` | Authentication session | 30 days |
| `aurora-theme` | Theme preference (light/dark) | 1 year |
| `aurora-language` | Language preference | 1 year |
| `aurora-preferences` | User preferences (JSON) | 1 year |

## Security Best Practices

### ✅ DO:
- Use HTTPS in production (cookies marked as Secure)
- Let Supabase handle token refresh automatically
- Trust RLS policies for data access control
- Use the provided hooks (`useAuth`, `useUserPreferences`)

### ❌ DON'T:
- Manually modify cookies
- Store sensitive data in cookies (only store the session token)
- Disable RLS policies
- Store passwords or personal data in cookies

## Migration from localStorage

If you previously used localStorage for auth, the migration is automatic:

1. Old localStorage sessions will continue to work
2. New logins will use cookies
3. No user action required

## Troubleshooting

### Session Lost After Refresh
- Check if cookies are enabled in browser
- Ensure you're not in incognito/private mode (cookies may be blocked)
- Check browser console for cookie-related errors

### Authentication Not Working
1. Verify Supabase credentials in `.env`
2. Check if RLS policies are enabled on tables
3. Ensure `aurora-auth-token` cookie exists (check DevTools → Application → Cookies)

### Cookie Not Set
- Check if site is using HTTPS (required for Secure cookies in production)
- Verify browser allows third-party cookies if using subdomains

## API Reference

### `useAuth()` Hook

```typescript
{
  user: User | null;           // Current user object
  session: Session | null;     // Current session
  loading: boolean;            // Loading state
  signIn: (email, password) => Promise;
  signUp: (email, password, fullName, accountType) => Promise;
  signOut: () => Promise<void>;
  resetPassword: (email) => Promise;
  checkProviderProfile: () => Promise<{hasProviderProfile, status}>;
}
```

### `useUserPreferences()` Hook

```typescript
{
  getPreferences: () => UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  getPreference: (key) => any;
  setPreference: (key, value) => void;
  clearPreferences: () => void;
}
```

### Cookie Utilities

```typescript
// From src/lib/cookies.ts
setCookie(name, value, options)
getCookie(name)
removeCookie(name)
hasCookie(name)
getAllCookies()
getCookieJSON(name)
setCookieJSON(name, value, options)
```

## Related Files

- `src/lib/supabase.ts` - Supabase client with cookie storage
- `src/lib/cookies.ts` - Cookie utility functions
- `src/hooks/useAuth.tsx` - Authentication hook
- `src/hooks/useUserPreferences.ts` - User preferences hooks
- `src/components/layout/Header.tsx` - Uses auth for user menu
- `src/pages/auth/Login.tsx` - Login page
- `src/pages/auth/Signup.tsx` - Signup page
