# User Preferences & Cookie Consent Implementation Guide

## Overview

This implementation provides a complete preferences system for the Aurora e-commerce platform, including:
- **Theme** (Light/Dark/System)
- **Language** (EN/AR/FR/ES)
- **Currency** (USD/EUR/EGP/GBP/SAR/AED)
- **Sidebar State** (Expanded/Collapsed)
- **Cookie Consent** (GDPR/CCPA compliant)

## Architecture

### 1. Storage Strategy

| Preference | Storage | Sync | Reason |
|------------|---------|------|--------|
| **Auth Token** | Cookie (`aurora-auth-token`) | Supabase Auth | Security, automatic refresh |
| **Theme** | LocalStorage + DB | Yes | Fast UI + cross-device sync |
| **Language** | LocalStorage + DB | Yes | Fast UI + cross-device sync |
| **Currency** | LocalStorage + DB | Yes | Fast UI + cross-device sync |
| **Sidebar** | LocalStorage + DB | Yes | Fast UI + cross-device sync |
| **Cookie Consent** | LocalStorage | No | Legal requirement, device-specific |

### 2. Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- File: add-user-preferences.sql
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "preferred_language" text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS "preferred_currency" text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "theme_preference" text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS "sidebar_state" text DEFAULT 'expanded';

ALTER TABLE "public"."users" 
ADD CONSTRAINT "check_theme_preference" CHECK ("theme_preference" IN ('light', 'dark', 'system')),
ADD CONSTRAINT "check_sidebar_state" CHECK ("sidebar_state" IN ('expanded', 'collapsed'));

CREATE POLICY "users_update_own_preferences" ON "public"."users" 
FOR UPDATE TO "authenticated" 
USING ("auth"."uid"() = "user_id") 
WITH CHECK ("auth"."uid"() = "user_id");
```

### 3. File Structure

```
src/
├── context/
│   └── PreferencesContext.tsx      # Central preferences management
├── components/
│   └── CookieConsentBanner.tsx     # GDPR compliance banner
├── pages/
│   └── public/
│       └── SettingsPage.tsx        # User settings UI
├── lib/
│   └── cookies.ts                   # Cookie utilities
├── hooks/
│   ├── useUserPreferences.ts       # Preference hooks
│   └── useAuth.tsx                 # Auth hook (updated)
└── App.tsx                          # Wrapped with PreferencesProvider
```

## Usage

### 1. Access Preferences in Components

```tsx
import { usePreferences } from '@/context/PreferencesContext';

function MyComponent() {
  const { preferences, updatePreference } = usePreferences();

  return (
    <div>
      <p>Current theme: {preferences.theme}</p>
      <button onClick={() => updatePreference('theme', 'dark')}>
        Set Dark Mode
      </button>
    </div>
  );
}
```

### 2. Settings Page

Navigate to `/settings` to access the full settings UI:
- Theme selection (Light/Dark/System)
- Language selection
- Currency selection
- Sidebar layout
- Cookie consent management

### 3. Cookie Consent Banner

The banner appears automatically on first visit:
- **Accept All**: Stores essential + preference cookies
- **Reject Optional**: Stores only essential auth cookie
- Can be reset anytime in Settings

## Features

### Automatic Theme Application
```tsx
// System theme follows OS preference
if (preferences.theme === 'system') {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', systemDark);
} else {
  document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
}
```

### RTL Support for Arabic
```tsx
// Automatically sets RTL for Arabic
document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = preferences.language;
```

### Cross-Device Sync
```tsx
// Changes sync to Supabase when user is logged in
await updatePreference('theme', 'dark');
// → Updates localStorage immediately
// → Updates database in background
// → Available on all devices next login
```

## API Reference

### `usePreferences()` Hook

```typescript
{
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    currency: string;
    sidebar: 'expanded' | 'collapsed';
    cookieConsent: 'accepted' | 'rejected' | null;
  };
  updatePreference: (key, value) => Promise<void>;
  setCookieConsent: (status) => void;
  resetCookieConsent: () => void;
  loading: boolean;
}
```

### Cookie Utilities (`src/lib/cookies.ts`)

```typescript
setCookie(name, value, options)
getCookie(name)
removeCookie(name)
hasCookie(name)
getAllCookies()
getCookieJSON<T>(name)
setCookieJSON(name, value, options)
```

## GDPR/CCPA Compliance

### What We Store

| Cookie Name | Purpose | Required? | Expiry |
|------------|---------|-----------|--------|
| `aurora-auth-token` | Authentication | ✅ Yes | 30 days |
| `aurora-preferences` | User settings | ⚠️ Optional | 1 year |
| `aurora-theme` | Theme preference | ⚠️ Optional | 1 year |
| `aurora-language` | Language preference | ⚠️ Optional | 1 year |
| `aurora-cookie-consent` | Consent record | ✅ Yes | 1 year |

### Consent Flow
1. User visits site → Banner appears after 2 seconds
2. User accepts → All preferences saved
3. User rejects → Only auth cookie stored
4. User can change anytime in Settings

## Flutter Integration

Since you're also building a Flutter app, here's how to sync preferences:

### 1. Use Same Supabase Columns
```dart
// Fetch user preferences
final response = await supabase
    .from('users')
    .select('preferred_language,preferred_currency,theme_preference,sidebar_state')
    .eq('user_id', userId)
    .single();
```

### 2. Store Locally with `shared_preferences`
```dart
final prefs = await SharedPreferences.getInstance();
await prefs.setString('theme', 'dark');
await prefs.setString('language', 'ar');
```

### 3. Sync on Login/Logout
```dart
// On login: fetch from DB, store locally
// On preference change: update local, sync to DB
// On logout: clear local, keep DB
```

## Testing

### 1. Test Cookie Consent
```bash
# Clear localStorage
localStorage.clear()
# Refresh page → Banner should appear
```

### 2. Test Theme Sync
```bash
# Login as user
# Change theme to dark
# Logout, login on different device
# Theme should be dark
```

### 3. Test RTL
```bash
# Change language to Arabic
# Check if layout flips (RTL)
# Check if text aligns right
```

## Troubleshooting

### Preferences Not Saving
1. Check if user is logged in (DB sync requires auth)
2. Check browser console for errors
3. Verify `users` table has preference columns

### Cookie Banner Not Showing
1. Check `preferences.cookieConsent` value
2. Clear localStorage to reset
3. Check if component is rendered (check App.tsx)

### Theme Not Applying
1. Check if `ThemeProvider` is wrapping app
2. Verify `document.documentElement.classList` has 'dark'
3. Check Tailwind dark mode config (`darkMode: 'class'`)

## Related Files

- `src/context/PreferencesContext.tsx` - Main logic
- `src/components/CookieConsentBanner.tsx` - GDPR banner
- `src/pages/public/SettingsPage.tsx` - Settings UI
- `src/lib/cookies.ts` - Cookie utilities
- `src/App.tsx` - Provider setup
- `add-user-preferences.sql` - Database migration

## Next Steps

1. ✅ Run SQL migration (`add-user-preferences.sql`)
2. ✅ Test cookie consent banner
3. ✅ Test settings page
4. ✅ Test cross-device sync
5. ⏳ Implement Flutter sync (when ready)
