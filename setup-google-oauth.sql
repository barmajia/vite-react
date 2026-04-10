-- ═══════════════════════════════════════════════════════════
-- Google OAuth Provider Setup
-- ═══════════════════════════════════════════════════════════
--
-- This migration prepares your Supabase database for Google OAuth authentication.
--
-- IMPORTANT: Before running this migration:
-- 1. Enable Google OAuth in Supabase Dashboard:
--    https://app.supabase.com/project/_/auth/providers
--
-- 2. Create Google Cloud Console Credentials:
--    https://console.cloud.google.com/apis/credentials
--
-- 3. Add your Google Client ID and Secret in Supabase Dashboard
--
-- 4. Configure Redirect URLs:
--    - In Google Cloud Console:
--      https://your-project-id.supabase.co/auth/v1/callback
--    
--    - In Supabase Dashboard:
--      Site URL: https://your-domain.com
--      Redirect URLs: https://your-domain.com/auth/callback
--
-- ═══════════════════════════════════════════════════════════

-- No database schema changes are required for Google OAuth.
-- Supabase handles OAuth identities in the auth.identities table automatically.

-- ═══════════════════════════════════════════════════════════
-- Optional: Create a view to see linked OAuth providers per user
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.user_oauth_providers AS
SELECT 
    u.id AS user_id,
    u.email,
    u.created_at,
    ARRAY_AGG(
        DISTINCT i.provider
    ) FILTER (WHERE i.provider IS NOT NULL) AS linked_providers
FROM 
    auth.users u
LEFT JOIN 
    auth.identities i ON i.user_id = u.id
GROUP BY 
    u.id, u.email, u.created_at;

-- Grant access to authenticated users (for admin purposes)
GRANT SELECT ON public.user_oauth_providers TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- Optional: Function to check if user has Google account linked
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.has_google_account_linked()
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    has_google BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    SELECT EXISTS (
        SELECT 1 FROM auth.identities i
        WHERE i.user_id = current_user_id
        AND i.provider = 'google'
    ) INTO has_google;
    
    RETURN has_google;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.has_google_account_linked() TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- Optional: Trigger to log OAuth signups for analytics
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_oauth_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Log new OAuth signup (you can customize this for your analytics)
    IF EXISTS (
        SELECT 1 FROM auth.identities i
        WHERE i.user_id = NEW.id
        AND i.provider IN ('google', 'facebook', 'github', 'microsoft')
    ) THEN
        -- Insert into analytics table if you have one
        -- INSERT INTO public.signup_analytics (user_id, provider, signed_at)
        -- VALUES (NEW.id, provider, NOW());
        
        RAISE NOTICE 'OAuth signup detected for user: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;
CREATE TRIGGER on_oauth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_oauth_signup();

-- ═══════════════════════════════════════════════════════════
-- Security Notes
-- ═══════════════════════════════════════════════════════════
--
-- 1. Row Level Security (RLS) is automatically enabled by Supabase
-- 2. OAuth identities are stored in auth.identities (managed by Supabase)
-- 3. Users can link/unlink OAuth providers via the Supabase Auth SDK
-- 4. Always validate user permissions in your RLS policies
--
-- For more information:
-- https://supabase.com/docs/guides/auth/social-login/auth-google
-- ═══════════════════════════════════════════════════════════

COMMENT ON VIEW public.user_oauth_providers IS 'View showing OAuth providers linked to each user';
COMMENT ON FUNCTION public.has_google_account_linked IS 'Check if current user has Google account linked';
COMMENT ON FUNCTION public.handle_oauth_signup IS 'Trigger function to log OAuth signups';
