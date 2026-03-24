import { createClient, Session } from "@supabase/supabase-js";
import { escapeRegExp } from "@/utils/sanitize";
import { SECURITY_CONFIG } from "@/lib/security";

// ── Supabase Credentials ──────────────────────────────────────
// NEVER hardcode credentials — they must come from environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials on initialization
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "⚠️ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n" +
      "Get them from: https://app.supabase.com/project/_/settings/api",
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(
    "⚠️ Invalid Supabase URL format. Check VITE_SUPABASE_URL in your .env file.",
  );
}

// Validate API key format (should be JWT)
if (!supabaseAnonKey.startsWith("eyJ")) {
  console.warn(
    "⚠️ Supabase anon key doesn't look like a valid JWT. Verify your credentials.",
  );
}

/**
 * Secure Cookie Storage for Auth Session
 *
 * SECURITY FEATURES:
 * - HttpOnly flag (in production via server)
 * - Secure flag (in production/HTTPS)
 * - SameSite=Strict (CSRF protection)
 * - Path restriction
 * - Max-Age expiration
 *
 * ⚠️ NOTE: Client-side cookies cannot be truly HttpOnly.
 * For maximum security, use server-side session management.
 */
const cookieStorage = {
  getItem: (key: string) => {
    try {
      const escaped = escapeRegExp(key);
      const match = document.cookie.match(
        new RegExp(`(^| )${escaped}=([^;]+)`),
      );
      return match ? match[2] : null;
    } catch (error) {
      console.error("Error reading cookie:", error);
      return null;
    }
  },

  setItem: (key: string, value: string) => {
    try {
      // Detect production environment
      const isProduction = window.location.protocol === "https:";
      const isLocalhost = window.location.hostname === "localhost";

      // Build cookie string with security flags
      const cookieParts = [
        `${key}=${value}`,
        "path=/",
        `max-age=${SECURITY_CONFIG.SESSION_TIMEOUT}`,
        "SameSite=Strict",
      ];

      // Add Secure flag only in production (HTTPS)
      if (isProduction && !isLocalhost) {
        cookieParts.push("Secure");
      }

      // In production, we rely on server-side HttpOnly setting
      // Client-side cannot set HttpOnly cookies (by design)

      document.cookie = cookieParts.join("; ");
    } catch (error) {
      console.error("Error setting cookie:", error);
    }
  },

  removeItem: (key: string) => {
    try {
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Strict`;
    } catch (error) {
      console.error("Error removing cookie:", error);
    }
  },
};

/**
 * Create Supabase client with security enhancements
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
    storageKey: SECURITY_CONFIG.AUTH_COOKIE_NAME,

    // Security: Flow for PKCE authentication
    flowType: "pkce",
  },
  global: {
    headers: {
      "x-application-name": "aurora-ecommerce",
    },
  },
  db: {
    schema: "public",
  },
});

/**
 * Helper function to get the current session
 * Includes error handling and logging
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      // Don't log session expired errors (common and expected)
      if (!error.message.includes("Session expired")) {
        console.error("Error getting session:", error.message);
      }
      return null;
    }

    return session;
  } catch (error: any) {
    // Handle network errors gracefully
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("network")
    ) {
      console.warn("Network error while getting session");
      return null;
    }
    console.error("Unexpected error getting session:", error);
    return null;
  }
};

/**
 * Helper function to get the current user
 * Includes error handling and logging
 */
export const getUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (!error.message.includes("User not found")) {
        console.error("Error getting user:", error.message);
      }
      return null;
    }

    return user;
  } catch (error: any) {
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("network")
    ) {
      console.warn("Network error while getting user");
      return null;
    }
    console.error("Unexpected error getting user:", error);
    return null;
  }
};

/**
 * Auth state change listener with error handling
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void,
) => {
  try {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Log auth events for debugging (remove in production if needed)
      if (import.meta.env.DEV) {
        console.log("Auth event:", event);
      }
      callback(event, session);
    });
    return data.subscription;
  } catch (error) {
    console.error("Error setting up auth state listener:", error);
    // Return a dummy subscription that does nothing
    return {
      unsubscribe: () => {},
    };
  }
};

/**
 * Clear all auth-related storage (on logout)
 */
export const clearAuthStorage = () => {
  try {
    // Clear CSRF token
    const { clearCsrfToken } = require("@/lib/csrf");
    clearCsrfToken();
  } catch {}

  // Clear auth cookie
  cookieStorage.removeItem(SECURITY_CONFIG.AUTH_COOKIE_NAME);

  // Clear any other auth-related storage
  try {
    sessionStorage.removeItem(SECURITY_CONFIG.AUTH_COOKIE_NAME);
    localStorage.removeItem(SECURITY_CONFIG.AUTH_COOKIE_NAME);
  } catch {}
};

/**
 * Validate session freshness
 * Returns true if session is valid and not expired
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const session = await getSession();

    if (!session) {
      return false;
    }

    // Check if session is expired
    const expiresAt = session.expires_at;
    if (!expiresAt) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (expiresAt < now) {
      console.warn("Session expired");
      return false;
    }

    // Check if session will expire soon (within 5 minutes)
    const soon = now + 5 * 60;
    if (expiresAt < soon) {
      console.warn("Session expiring soon, will refresh");
      // Supabase will auto-refresh, but we can trigger it manually if needed
    }

    return true;
  } catch (error) {
    console.error("Error validating session:", error);
    return false;
  }
};
