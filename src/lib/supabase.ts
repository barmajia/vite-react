import { createClient, Session } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ofovfxsfazlwvcakpuer.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mb3ZmeHNmYXpsd3ZjYWtwdWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjY0MDcsImV4cCI6MjA4NzcwMjQwN30.QYx8-c9IiSMpuHeikKz25MKO5o6g112AKj4Tnr4aWzI";

// Check if credentials are placeholders
const isPlaceholder =
  supabaseUrl.includes("placeholder") || supabaseAnonKey === "placeholder-key";

if (isPlaceholder) {
  console.warn(
    "⚠️ Supabase credentials not configured. Please update .env file with your Supabase credentials.",
  );
  console.warn(
    "Get them from: https://app.supabase.com/project/_/settings/api",
  );
}

// Cookie-based storage for auth session
const cookieStorage = {
  getItem: (key: string) => {
    const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return match ? match[2] : null;
  },
  setItem: (key: string, value: string) => {
    // Set cookie with 30 days expiry, secure in production
    const isProduction = window.location.protocol === "https:";
    document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax${isProduction ? "; Secure" : ""}`;
  },
  removeItem: (key: string) => {
    document.cookie = `${key}=; path=/; max-age=0`;
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
  if (isPlaceholder) return null;
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
  if (isPlaceholder) return null;
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
