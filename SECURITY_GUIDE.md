# 🔒 Aurora Security Guide

**Last Updated:** March 24, 2026  
**Version:** 2.5.0

---

## 📋 Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [CSRF Protection](#csrf-protection)
6. [Session Management](#session-management)
7. [Database Security (RLS)](#database-security-rls)
8. [Security Best Practices](#security-best-practices)
9. [Security Checklist](#security-checklist)

---

## 🏗️ Security Architecture

### Defense in Depth

Aurora implements multiple layers of security:

```
┌─────────────────────────────────────────────────────────┐
│                    Client-Side Security                  │
│  • Input Validation  • Sanitization  • Rate Limiting    │
│  • CSRF Tokens       • XSS Prevention • SQLi Detection  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Supabase Security Layer                │
│  • JWT Authentication  • Row Level Security (RLS)       │
│  • API Rate Limiting   • Encrypted Connections (TLS)    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Database Security                     │
│  • RLS Policies  • Parameterized Queries  • Constraints │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Implementation

All authentication is handled through `src/hooks/useAuth.tsx`:

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  // Use auth methods
  await signIn(email, password);
}
```

### Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Email Verification** | ✅ Required | Users must verify email before login |
| **Password Strength** | ✅ Enforced | Min 8 chars, uppercase, lowercase, number |
| **Rate Limiting** | ✅ Active | 5 attempts per 60s, blocked for 60s |
| **Session Persistence** | ✅ Secure | Cookie-based with Secure + SameSite flags |
| **Auto Token Refresh** | ✅ Enabled | Seamless session extension |
| **PKCE Flow** | ✅ Active | Protection against authorization code attacks |

### Protected Routes

Use the `ProtectedRoute` component to guard routes:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedAccountTypes={['user', 'provider']}>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### Account Types

The system supports multiple account types with role-based access:

- `user` / `customer` - Regular buyers
- `seller` - Product sellers
- `provider` / `freelancer` - Service providers
- `factory` - Manufacturing providers
- `middleman` - Deal facilitators
- `doctor` / `patient` - Healthcare roles
- `admin` - Platform administrators

---

## 🛡️ Input Validation & Sanitization

### Location: `src/utils/sanitize.ts`

### Available Functions

```typescript
import {
  sanitizeInput,
  sanitizeSearchQuery,
  sanitizeUrl,
  sanitizeRichText,
  validateEmail,
  validatePhone,
  validatePassword,
  validateInput,
  detectSqlInjection,
  detectXss,
  sanitizeFileName,
} from '@/utils/sanitize';
```

### Usage Examples

```typescript
// Sanitize user input
const cleanName = sanitizeInput(userInput);

// Validate and sanitize search query
const cleanSearch = sanitizeSearchQuery(query, 200);

// Comprehensive validation
const result = validateInput(input, {
  maxLength: 500,
  allowHtml: false,
  checkSqlInjection: true,
  checkXss: true,
});

if (result.valid) {
  // Use result.sanitized
} else {
  // Handle result.error
}
```

### Security Checks

| Check | Enabled By Default | Description |
|-------|-------------------|-------------|
| **SQL Injection Detection** | ✅ Yes | Blocks SQL keywords and patterns |
| **XSS Detection** | ✅ Yes | Blocks script tags, event handlers |
| **HTML Sanitization** | ⚠️ Optional | Removes dangerous tags/attributes |
| **URL Protocol Validation** | ✅ Yes | Blocks javascript:, data:, vbscript: |
| **File Name Sanitization** | ✅ Yes | Removes path traversal characters |

---

## 🚦 Rate Limiting

### Location: `src/lib/security.ts`

### Rate Limiters

| Limiter | Max Attempts | Window | Block Duration | Use Case |
|---------|-------------|--------|----------------|----------|
| `authRateLimiter` | 5 | 60s | 60s | Login attempts |
| `resetRateLimiter` | 3 | 5min | 5min | Password reset |
| `signupRateLimiter` | 2 | 10min | 10min | Account creation |
| `messageRateLimiter` | 30 | 60s | 30s | Message sending |
| `checkoutRateLimiter` | 3 | 5min | 5min | Payment attempts |

### Usage

```typescript
import { authRateLimiter } from '@/lib/security';

async function handleLogin(email: string, password: string) {
  // Check rate limit
  if (!authRateLimiter.isAllowed(email)) {
    const waitTime = authRateLimiter.getBlockTimeRemaining(email);
    throw new Error(`Try again in ${waitTime} seconds`);
  }
  
  // Attempt login
  const result = await signIn(email, password);
  
  if (result.error) {
    // Record failed attempt
    authRateLimiter.recordAttempt(email);
  } else {
    // Clear on success
    authRateLimiter.clear(email);
  }
}
```

### ⚠️ Important Note

**Client-side rate limiting is NOT security!** It's a UX measure to prevent accidental abuse. 

**Server-side rate limiting is REQUIRED for production:**

1. Use Supabase Edge Functions for custom rate limiting
2. Enable Supabase's built-in rate limiting
3. Use a gateway/CDN (Cloudflare, Vercel) for additional protection

---

## 🎯 CSRF Protection

### Location: `src/lib/csrf.ts`

### Implementation

```typescript
import { getCsrfToken, getCsrfHeaders, clearCsrfToken } from '@/lib/csrf';

// Get token for API requests
const headers = getCsrfHeaders();
// { 'X-CSRF-Token': 'abc123...' }

// Manual token access
const token = getCsrfToken();

// Clear on logout
clearCsrfToken();
```

### Features

- ✅ Token stored in sessionStorage (not sent to server automatically)
- ✅ Tokens expire after 24 hours
- ✅ Automatically included in Supabase requests via headers
- ✅ Cleared on logout

### Server-Side Validation

CSRF tokens should be validated server-side for sensitive operations:

```typescript
// Example Supabase Edge Function
import { serve } from 'https://deno.land/std@http/server.ts';

serve(async (req) => {
  const csrfToken = req.headers.get('X-CSRF-Token');
  
  // Validate token (implementation depends on your setup)
  if (!isValidCsrfToken(csrfToken)) {
    return new Response('CSRF token invalid', { status: 403 });
  }
  
  // Process request...
});
```

---

## 🔑 Session Management

### Location: `src/lib/supabase.ts`

### Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Cookie Storage** | ✅ Secure | HttpOnly (server), Secure, SameSite=Strict |
| **Session Timeout** | ✅ 30 days | Configurable via `SECURITY_CONFIG` |
| **Auto Refresh** | ✅ Enabled | Tokens refresh automatically |
| **Session Validation** | ✅ Active | Checks expiry and validity |
| **Clear on Logout** | ✅ Complete | Removes all auth storage |

### Session Helpers

```typescript
import { 
  getSession, 
  getUser, 
  isSessionValid,
  clearAuthStorage 
} from '@/lib/supabase';

// Check session validity
const isValid = await isSessionValid();

// Get current user
const user = await getUser();

// Clear all auth data
clearAuthStorage();
```

### Session Timeout Configuration

```typescript
// src/lib/security.ts
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 30 * 24 * 60 * 60, // 30 days
  INACTIVITY_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
};
```

---

## 🗄️ Database Security (RLS)

### Row Level Security Policies

All tables have RLS enabled. Example policies:

```sql
-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public read access (basic info only)
CREATE POLICY "Users are publicly viewable" 
  ON public.users FOR SELECT 
  USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Users can delete own profile
CREATE POLICY "Users can delete own profile" 
  ON public.users FOR DELETE 
  USING (auth.uid() = id);
```

### RLS Best Practices

1. ✅ **Always enable RLS** on all tables
2. ✅ **Use `auth.uid()`** for user-based policies
3. ✅ **Test policies** with different user contexts
4. ✅ **Use service role** only in trusted server-side code
5. ✅ **Audit policies** regularly

### Example: Service Providers RLS

```sql
-- svc_providers table
ALTER TABLE public.svc_providers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Providers are publicly viewable" 
  ON public.svc_providers FOR SELECT 
  USING (true);

-- Owners can update own profile
CREATE POLICY "Providers can update own profile" 
  ON public.svc_providers FOR UPDATE 
  USING (auth.uid() = user_id);

-- Owners can delete own profile
CREATE POLICY "Providers can delete own profile" 
  ON public.svc_providers FOR DELETE 
  USING (auth.uid() = user_id);
```

---

## 📖 Security Best Practices

### For Developers

1. **Never Trust Client-Side Validation**
   - Always validate on server/RLS
   - Client validation is for UX only

2. **Use Parameterized Queries**
   - Supabase handles this automatically
   - Never concatenate user input into queries

3. **Sanitize All User Input**
   - Use `sanitizeInput()` before storage
   - Use `sanitizeRichText()` for HTML content

4. **Encode Output**
   - React escapes by default
   - Use `dangerouslySetInnerHTML` only with sanitized content

5. **Protect Sensitive Operations**
   - Password changes
   - Email changes
   - Account deletion
   - Payment processing

6. **Use Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as template

7. **Enable Security Headers**
   - Already configured in `vercel.json`
   - HSTS, X-Frame-Options, CSP

8. **Log Security Events**
   - Failed login attempts
   - Password changes
   - Suspicious activity

### For Users

1. **Use Strong Passwords**
   - Minimum 12 characters recommended
   - Mix of uppercase, lowercase, numbers, symbols

2. **Enable Email Verification**
   - Verify your email address
   - Required for account recovery

3. **Don't Share Credentials**
   - Never share your password
   - Use unique passwords per service

4. **Report Suspicious Activity**
   - Contact support immediately
   - Change password if compromised

---

## ✅ Security Checklist

### Pre-Deployment Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Supabase RLS enabled on all tables
- [ ] Rate limiting configured server-side
- [ ] CSRF protection enabled for forms
- [ ] Security headers configured (vercel.json)
- [ ] HTTPS enforced in production
- [ ] Error messages don't leak sensitive info
- [ ] Input validation on all forms
- [ ] Output encoding for user content
- [ ] Session timeout configured

### Post-Deployment Checklist

- [ ] Test RLS policies with different users
- [ ] Verify rate limiting works
- [ ] Test password reset flow
- [ ] Verify email verification required
- [ ] Check security headers (securityheaders.com)
- [ ] Monitor for suspicious activity
- [ ] Regular security audits scheduled

### Ongoing Maintenance

- [ ] Review and update dependencies monthly
- [ ] Audit RLS policies quarterly
- [ ] Review security logs weekly
- [ ] Update security documentation
- [ ] Conduct penetration testing annually

---

## 🚨 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** disclose publicly
2. Email: security@aurora.example.com
3. Include:
   - Description of the issue
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours.

---

## 📚 Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Checklist](https://github.com/shieldfy/API-Security-Checklist)
- [React Security Best Practices](https://react.dev/learn/escaping)

---

**Remember:** Security is an ongoing process, not a one-time fix. Stay vigilant! 🔒
