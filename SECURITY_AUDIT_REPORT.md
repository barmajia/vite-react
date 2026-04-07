# 🔐 Security Audit Report - Redirect Protection

## Executive Summary
Fixed **open redirect vulnerabilities** across the platform by implementing centralized, tested security utilities for URL validation.

---

## ✅ Security Fixes Completed

### 1. **Centralized Security Utilities** (`src/lib/security.ts`)

Created a comprehensive security module with three functions:

#### `isValidReturnUrl(url: string): boolean`
Validates return URLs to prevent open redirect attacks.

**Protection Against:**
- ✅ Protocol-relative URLs (`//evil.com`)
- ✅ Absolute URLs with protocols (`https://evil.com`)
- ✅ Backslash attacks (`/\evil.com`, `/\@evil.com`)
- ✅ URL-encoded bypasses (`%2f%2fevil.com`)
- ✅ Newline/tab injection attacks
- ✅ Empty/null inputs

**Test Coverage:** 7 tests, all passing ✅

#### `sanitizeReturnUrl(url: string, default?: string): string`
Returns validated URL or safe default.

**Features:**
- ✅ Returns URL if valid
- ✅ Returns default (`/`) if invalid
- ✅ Allows custom default URLs
- ✅ Fails safely (never exposes dangerous URLs)

**Test Coverage:** 3 tests, all passing ✅

#### `isDangerousUrl(url: string): boolean`
Detects dangerous URL patterns (XSS, phishing).

**Detection:**
- ✅ `javascript:` protocol (XSS)
- ✅ `data:` protocol (XSS)
- ✅ `vbscript:` protocol (legacy XSS)
- ✅ External URLs with protocols
- ✅ Protocol-relative URLs
- ✅ Backslash attacks (IE/Edge bypass)

**Test Coverage:** 5 tests, all passing ✅

---

### 2. **ProtectedRoute.tsx** - Route Guard Enhancement

**File:** `src/components/ProtectedRoute.tsx`

**Changes:**
- ✅ Imports `isValidReturnUrl` from centralized security module
- ✅ Validates `returnTo` parameter before encoding
- ✅ Rejects invalid URLs and redirects to login without returnTo
- ✅ Removed duplicate `isValidReturnUrl` implementation (DRY principle)

**Security Impact:**
- **Before:** Accepts any URL including dangerous ones
- **After:** Only accepts relative URLs starting with `/`

**Example:**
```typescript
// BEFORE: Vulnerable
const returnTo = encodeURIComponent(destination);
return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;

// AFTER: Protected
if (isValidReturnUrl(destination)) {
  const returnTo = encodeURIComponent(destination);
  return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
}
return <Navigate to={redirectTo} replace />;
```

---

### 3. **Login.tsx** - Redirect Validation

**File:** `src/pages/auth/Login.tsx`

**Changes:**
- ✅ Imports `sanitizeReturnUrl` from centralized security module
- ✅ Validates `returnTo` query parameter before navigation
- ✅ Removed duplicate `isValidReturnUrl` implementation
- ✅ Uses centralized `sanitizeReturnUrl` for consistent validation

**Security Impact:**
- **Before:** Two different validation implementations (inconsistent)
- **After:** Single source of truth, consistent validation everywhere

**Attack Vector Prevented:**
```
Attacker crafts: https://yoursite.com/login?returnTo=https://evil.com
Without validation: User logs in → Redirected to evil.com
With validation: User logs in → Redirected to / (safe default)
```

---

### 4. **AdminVerification.tsx** - Admin Authentication Guard

**File:** `src/features/health/pages/AdminVerification.tsx`

**Changes:**
- ✅ Added `useAuth()` hook to check user authentication
- ✅ Validates `account_type === "admin"` before rendering
- ✅ Redirects non-authenticated users to `/login`
- ✅ Redirects non-admin users to `/` with error message
- ✅ Shows loading state during admin check
- ✅ Replaced `alert()` with toast notifications

**Security Impact:**
- **Before:** Anyone could access admin verification page
- **After:** Only users with `account_type: "admin"` can access

**Code:**
```typescript
const checkAdmin = async () => {
  if (!user) {
    toast.error("You must be logged in to access this page");
    navigate("/login");
    return;
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== "admin") {
    toast.error("Access denied. Admin privileges required.");
    navigate("/");
    return;
  }

  setIsAdmin(true);
};
```

---

### 5. **UpdatePassword.tsx** - Session Invalidation

**File:** `src/pages/auth/UpdatePassword.tsx`

**Changes:**
- ✅ Calls `supabase.auth.signOut()` after password update
- ✅ Redirects to login with success message
- ✅ Invalidates old session to prevent session hijacking

**Security Impact:**
- **Before:** Old session remained active after password change
- **After:** All sessions invalidated, must login with new password

**Attack Vector Prevented:**
```
Attacker has access to victim's browser session
Victim resets password
Before: Attacker still has valid session
After: Attacker's session is invalidated
```

---

## 🧪 Test Results

```
✓ src/__tests__/lib/security.test.ts (15)
  ✓ isValidReturnUrl (7)
    ✓ allows safe relative URLs
    ✓ rejects protocol-relative URLs
    ✓ rejects absolute URLs with protocols
    ✓ rejects backslash attacks
    ✓ rejects URLs with newlines/tabs
    ✓ rejects empty or invalid inputs
    ✓ handles URL-encoded characters
  ✓ sanitizeReturnUrl (3)
    ✓ returns valid URLs
    ✓ returns default for invalid URLs
    ✓ allows custom default URL
  ✓ isDangerousUrl (5)
    ✓ detects javascript: protocol
    ✓ detects data: protocol
    ✓ detects external URLs
    ✓ detects backslash attacks
    ✓ allows safe relative URLs

Test Files  1 passed (1)
Tests  15 passed (15)
```

---

## 🛡️ Security Improvements Summary

| Vulnerability | Before | After | Status |
|---------------|--------|-------|--------|
| Open redirect via returnTo | ❌ Vulnerable | ✅ Protected | Fixed |
| Inconsistent URL validation | ❌ 2 implementations | ✅ Centralized | Fixed |
| Backslash attack bypass | ❌ Not checked | ✅ Blocked | Fixed |
| URL-encoded bypass | ❌ Not checked | ✅ Blocked | Fixed |
| Admin page access | ❌ Unprotected | ✅ Protected | Fixed |
| Session after password reset | ❌ Active | ✅ Invalidated | Fixed |
| XSS via javascript: protocol | ❌ Not detected | ✅ Detected | Fixed |

---

## 📋 Files Modified

1. **`src/lib/security.ts`** - NEW: Centralized security utilities
2. **`src/__tests__/lib/security.test.ts`** - NEW: 15 comprehensive tests
3. **`src/components/ProtectedRoute.tsx`** - Uses centralized validation
4. **`src/pages/auth/Login.tsx`** - Uses centralized sanitization
5. **`src/features/health/pages/AdminVerification.tsx`** - Admin auth guard
6. **`src/pages/auth/UpdatePassword.tsx`** - Session invalidation

---

## 🚀 How It Works

### Open Redirect Attack Flow

```
1. User tries to access: /checkout
2. ProtectedRoute redirects to: /login?returnTo=/checkout
3. User logs in
4. Login validates returnTo URL
5. If valid: Navigate to /checkout
6. If invalid: Navigate to / (safe default)
```

### Attack Prevention

**Attempted Attack:**
```
https://yoursite.com/login?returnTo=https://evil.com/phishing
```

**Validation Steps:**
1. `decodeURIComponent("https://evil.com/phishing")` → `"https://evil.com/phishing"`
2. Check: starts with `/`? → ❌ NO
3. Result: Invalid URL, redirect to `/`

**Backslash Attack:**
```
https://yoursite.com/login?returnTo=/\evil.com
```

**Validation Steps:**
1. `decodeURIComponent("/\\evil.com")` → `"/\evil.com"`
2. Check: contains `\`? → ❌ YES (dangerous)
3. Result: Invalid URL, redirect to `/`

---

## ✅ Security Checklist

- [x] Open redirect protection implemented
- [x] Centralized security utilities created
- [x] All URL validation functions unified
- [x] Admin authentication guards added
- [x] Session invalidation after password reset
- [x] XSS protocol detection (javascript:, data:, vbscript:)
- [x] Backslash attack protection
- [x] URL-encoded bypass protection
- [x] Comprehensive test coverage (15 tests)
- [x] All tests passing

---

## 🔍 Testing Instructions

### Manual Testing

1. **Test Open Redirect Protection:**
   ```
   Visit: http://localhost:5173/login?returnTo=/dashboard
   Expected: After login, redirects to /dashboard ✅
   
   Visit: http://localhost:5173/login?returnTo=https://evil.com
   Expected: After login, redirects to / (safe) ✅
   ```

2. **Test Admin Guard:**
   ```
   Login as non-admin user
   Visit: http://localhost:5173/health/admin/verify
   Expected: Redirected to home with "Access denied" toast ✅
   ```

3. **Test Password Reset Session:**
   ```
   Reset password via email link
   Update password
   Expected: Logged out, must login again with new password ✅
   ```

### Automated Testing

```bash
# Run security tests
npm run test:run -- src/__tests__/lib/security.test.ts

# Expected: 15 tests passing
```

---

## 📚 References

- **OWASP Open Redirect:** https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
- **CWE-601:** URL Redirection to Untrusted Site ('Open Redirect')
- **CWE-287:** Improper Authentication
- **CWE-384:** Session Fixation

---

## 🎯 Next Security Steps

1. **Implement CSRF token rotation** for all state-changing requests
2. **Add rate limiting** to authentication endpoints
3. **Implement audit logging** for admin actions
4. **Add Content Security Policy (CSP)** headers
5. **Implement HTTP Strict Transport Security (HSTS)**
6. **Add X-Frame-Options** to prevent clickjacking
7. **Implement secure cookie attributes** (HttpOnly, Secure, SameSite)

---

*Audit Completed: April 6, 2026*  
*Security Engineer: AI Assistant*  
*Tests Passing: 15/15 (100%)*  
*Critical Vulnerabilities Fixed: 4*  
*Files Modified: 6*
