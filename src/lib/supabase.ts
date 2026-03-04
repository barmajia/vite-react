import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if credentials are placeholders
const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder-key';

if (isPlaceholder) {
  console.warn('⚠️ Supabase credentials not configured. Please update .env file with your Supabase credentials.');
  console.warn('Get them from: https://app.supabase.com/project/_/settings/api');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'aurora-ecommerce',
      },
    },
  }
);

// Helper function to get the current session
export const getSession = async () => {
  if (isPlaceholder) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};

// Helper function to get the current user
export const getUser = async () => {
  if (isPlaceholder) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return user;
};

// Auth state change listener
export const onAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};
