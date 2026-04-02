# Google Sign-In Setup Guide

This guide walks you through setting up Google OAuth authentication for your Aurora e-commerce application.

## Overview

The Google Sign-In feature allows users to authenticate using their Google accounts, providing a seamless login experience. This implementation uses Supabase Auth with OAuth 2.0.

---

## Prerequisites

- A Supabase project with authentication enabled
- A Google Cloud Platform account
- Admin access to your Supabase project

---

## Step 1: Configure Google Cloud Console

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something like "Aurora E-commerce"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 1.3 Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: Aurora E-commerce
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - Skip Scopes (click **Save and Continue**)
   - Skip Test users (click **Save and Continue**)

4. Create OAuth Client ID:
   - **Application type**: Web application
   - **Name**: Aurora Web Client
   - **Authorized redirect URIs**: Add the following:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     https://localhost:5173/auth/callback
     https://your-production-domain.com/auth/callback
     ```
   - Click **Create**

5. Copy your **Client ID** - you'll need this for the next steps

---

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and toggle it **ON**
4. Click on **Google** to configure

### 2.2 Add Google Credentials

1. **Client ID**: Paste the Client ID from Google Cloud Console
2. **Client Secret**: Paste the Client Secret from Google Cloud Console
3. **Redirect URL**: Should already be populated with:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
4. Click **Save**

### 2.3 Configure Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set your **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`
3. Add redirect URLs under **Redirect URLs**:
   ```
   http://localhost:5173/auth/callback
   https://your-domain.com/auth/callback
   ```
4. Click **Save**

---

## Step 3: Configure Your Application

### 3.1 Update Environment Variables

1. Copy `.env.example` to `.env` (if you haven't already):
   ```bash
   cp .env.example .env
   ```

2. Add your Google Client ID to `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### 3.2 Run Database Migration

Run the provided SQL migration in your Supabase SQL Editor:

1. Go to Supabase Dashboard > **SQL Editor**
2. Copy the contents of `setup-google-oauth.sql`
3. Paste and run the migration

This creates:
- A view to see linked OAuth providers
- A function to check Google account linkage
- A trigger for OAuth signup analytics

---

## Step 4: Test the Integration

### 4.1 Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login`
3. Click **Sign in with Google**
4. Complete the Google authentication flow
5. Verify you're redirected to `/auth/callback` and then to the app

### 4.2 Test Signup Flow

1. Navigate to `/signup`
2. Click **Sign up with Google**
3. Complete authentication
4. Verify account creation and redirect

### 4.3 Verify User Data

Check that user data is properly stored:

```sql
-- View all users and their OAuth providers
SELECT * FROM public.user_oauth_providers;

-- Check if current user has Google linked
SELECT public.has_google_account_linked();
```

---

## Features

### Implemented Features

- ✅ Google Sign-In on login page
- ✅ Google Sign-Up on signup page
- ✅ Automatic user creation via OAuth
- ✅ Secure OAuth flow with PKCE
- ✅ Auth callback handling
- ✅ Session management
- ✅ Redirect to appropriate dashboard based on user role

### Available Functions

The `useAuth` hook now includes:

```typescript
// Sign in with Google
const { signInWithGoogle } = useAuth();
await signInWithGoogle();

// Link Google account to existing user
const { linkGoogleAccount } = useAuth();
await linkGoogleAccount();
```

---

## Customization

### Changing the Redirect URL

If you need to customize where users land after OAuth:

1. Edit `src/hooks/useAuth.tsx`:
   ```typescript
   const signInWithGoogle = async () => {
     const { error } = await supabase.auth.signInWithOAuth({
       provider: "google",
       options: {
         redirectTo: `${window.location.origin}/auth/callback`,
         // Change this URL to customize post-auth behavior
       },
     });
   };
   ```

### Customizing the Callback Page

Edit `src/pages/auth/AuthCallback.tsx` to:
- Add custom loading states
- Modify redirect logic
- Add error handling
- Show welcome messages

### Styling the Google Button

The Google Sign-In button uses the `Chrome` icon from Lucide. To use Google's official branding:

1. Download Google's brand assets from [Google Brand Guidelines](https://about.google/brand-resource-center/)
2. Replace the `Chrome` icon with an `<img>` tag:
   ```tsx
   <Button onClick={handleGoogleSignIn}>
     <img src="/google-logo.svg" alt="Google" className="mr-2 h-5 w-5" />
     Sign in with Google
   </Button>
   ```

---

## Troubleshooting

### "Invalid redirect_uri" Error

**Problem**: Google rejects the redirect URI

**Solution**:
1. Verify the redirect URI in Google Cloud Console matches exactly
2. Ensure no trailing slashes
3. Check that both HTTP and HTTPS are configured correctly

### "Access blocked" Error

**Problem**: Google blocks access during testing

**Solution**:
1. In Google Cloud Console, go to **OAuth consent screen**
2. Add your test email to **Test users**
3. Or publish the app (for production)

### OAuth Flow Not Completing

**Problem**: User authenticates but doesn't land on the right page

**Solution**:
1. Check that `/auth/callback` route exists in `App.tsx`
2. Verify `redirectTo` in `signInWithOAuth` matches your callback URL
3. Check browser console for errors

### User Data Not Saved

**Problem**: User created but profile data missing

**Solution**:
1. Verify your database triggers are working
2. Check that `handle_new_user` trigger exists
3. Review Supabase logs for errors

---

## Security Considerations

### Production Checklist

- [ ] Enable **Production** mode in Google Cloud Console
- [ ] Add production domain to authorized redirect URIs
- [ ] Configure proper OAuth consent screen
- [ ] Set up rate limiting (already implemented)
- [ ] Enable 2FA for Google Cloud account
- [ ] Regularly rotate OAuth credentials
- [ ] Monitor OAuth usage in Supabase logs

### Best Practices

1. **Never commit credentials**: Keep `.env` in `.gitignore`
2. **Use environment variables**: For different environments
3. **Monitor usage**: Set up alerts for unusual OAuth activity
4. **Test thoroughly**: Test on staging before production
5. **Handle errors gracefully**: Show user-friendly error messages

---

## Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Brand Guidelines](https://about.google/brand-resource-center/)

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard > **Logs**
2. Review browser console for client-side errors
3. Test with different Google accounts
4. Clear browser cache and cookies
5. Verify all configuration steps above

---

**Last Updated**: April 2026
**Version**: 1.0.0
