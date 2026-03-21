import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type ThemePreference = 'light' | 'dark' | 'system';
export type SidebarState = 'expanded' | 'collapsed';

export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  currency: string;
  sidebar: SidebarState;
  cookieConsent: 'accepted' | 'rejected' | null;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  setCookieConsent: (status: 'accepted' | 'rejected') => void;
  resetCookieConsent: () => void;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const PREFERENCES_STORAGE_KEY = 'aurora-preferences';
const COOKIE_CONSENT_KEY = 'aurora-cookie-consent';

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  currency: 'USD',
  sidebar: 'expanded',
  cookieConsent: null,
};

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  // Load from LocalStorage immediately (fast UI)
  useEffect(() => {
    const loadLocalPreferences = () => {
      try {
        const localPrefs = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        const cookieConsent = localStorage.getItem(COOKIE_CONSENT_KEY) as UserPreferences['cookieConsent'];
        
        const stored = localPrefs ? JSON.parse(localPrefs) : {};
        setPreferences(prev => ({
          ...prev,
          ...stored,
          cookieConsent: cookieConsent || prev.cookieConsent,
        }));
      } catch (error) {
        console.error('Error loading local preferences:', error);
      }
      setLoading(false);
    };

    loadLocalPreferences();
  }, []);

  // Apply theme preference
  useEffect(() => {
    if (preferences.theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemDark);
    } else {
      document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
    }
  }, [preferences.theme]);

  // Apply language preference
  useEffect(() => {
    if (preferences.language) {
      document.documentElement.lang = preferences.language;
      // Set RTL for Arabic
      document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [preferences.language]);

  // Sync with Supabase when user logs in
  useEffect(() => {
    if (user && !loading) {
      fetchUserPreferences();
    }
  }, [user, loading]);

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferred_language, preferred_currency, theme_preference, sidebar_state')
        .eq('user_id', user!.id)
        .single();
      
      if (data && !error) {
        const dbPrefs = {
          theme: (data.theme_preference as ThemePreference) || preferences.theme,
          language: data.preferred_language || preferences.language,
          currency: data.preferred_currency || preferences.currency,
          sidebar: (data.sidebar_state as SidebarState) || preferences.sidebar,
          cookieConsent: preferences.cookieConsent, // Keep local consent
        };
        
        setPreferences(dbPrefs);
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(dbPrefs));
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPrefs));

    // Sync with Supabase if user is logged in
    if (user && key !== 'cookieConsent') {
      const dbMap: Record<string, string> = {
        theme: 'theme_preference',
        language: 'preferred_language',
        currency: 'preferred_currency',
        sidebar: 'sidebar_state',
      };
      
      if (dbMap[key]) {
        try {
          await supabase
            .from('users')
            .update({ [dbMap[key]]: value })
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Error updating preference in database:', error);
          // Revert to previous preference on error
          setPreferences(preferences);
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
        }
      }
    }
  };

  const setCookieConsent = (status: 'accepted' | 'rejected') => {
    setPreferences(prev => ({ ...prev, cookieConsent: status }));
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
  };

  const resetCookieConsent = () => {
    setPreferences(prev => ({ ...prev, cookieConsent: null }));
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  };

  const value = {
    preferences,
    updatePreference,
    setCookieConsent,
    resetCookieConsent,
    loading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
