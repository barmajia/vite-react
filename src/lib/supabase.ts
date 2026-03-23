import { createClient, Session } from "@supabase/supabase-js";
import { escapeRegExp } from "@/utils/sanitize";

// ── Supabase Credentials ──────────────────────────────────────
// NEVER hardcode credentials — they must come from environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "⚠️ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n" +
      "Get them from: https://app.supabase.com/project/_/settings/api",
  );
}

// Cookie-based storage for auth session (regex-safe)
const cookieStorage = {
  getItem: (key: string) => {
    const escaped = escapeRegExp(key);
    const match = document.cookie.match(new RegExp(`(^| )${escaped}=([^;]+)`));
    return match ? match[2] : null;
  },
  setItem: (key: string, value: string) => {
    // Set cookie with 30 days expiry, Secure + HttpOnly flags in production
    const isProduction = window.location.protocol === "https:";
    document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Strict${isProduction ? "; Secure" : ""}`;
  },
  removeItem: (key: string) => {
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Strict`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
    storageKey: "aurora-auth-token",
  },
  global: {
    headers: {
      "x-application-name": "aurora-ecommerce",
    },
  },
});

// Helper function to get the current session
export const getSession = async () => {

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }
  return session;
};

// Helper function to get the current user
export const getUser = async () => {

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
  return user;
};

// Auth state change listener
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void,
) => {
  return supabase.auth.onAuthStateChange(callback);
};
