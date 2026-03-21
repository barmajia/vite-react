/**
 * User Preferences Cookie Hook
 * Manages user preferences stored in cookies
 */

import { useCallback } from "react";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

export interface UserPreferences {
  language?: string;
  theme?: "light" | "dark";
  currency?: string;
  notifications?: boolean;
}

const PREFERENCES_COOKIE = "aurora-preferences";
const THEME_COOKIE = "aurora-theme";
const LANGUAGE_COOKIE = "aurora-language";

export function useUserPreferences() {
  // Get all preferences
  const getPreferences = useCallback((): UserPreferences => {
    const prefs = getCookie(PREFERENCES_COOKIE);
    if (prefs) {
      try {
        return JSON.parse(decodeURIComponent(prefs));
      } catch {
        return {};
      }
    }
    return {};
  }, []);

  // Set all preferences
  const setPreferences = useCallback((prefs: UserPreferences) => {
    setCookie(PREFERENCES_COOKIE, encodeURIComponent(JSON.stringify(prefs)), {
      days: 365,
      sameSite: "Lax",
    });
  }, []);

  // Get specific preference
  const getPreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
  ): UserPreferences[K] | undefined => {
    const prefs = getPreferences();
    return prefs[key];
  }, [getPreferences]);

  // Set specific preference
  const setPreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    const prefs = getPreferences();
    prefs[key] = value;
    setPreferences(prefs);
  }, [getPreferences, setPreferences]);

  // Remove all preferences
  const clearPreferences = useCallback(() => {
    removeCookie(PREFERENCES_COOKIE);
  }, []);

  return {
    getPreferences,
    setPreferences,
    getPreference,
    setPreference,
    clearPreferences,
  };
}

/**
 * Theme Cookie Management
 */
export function useThemeCookie() {
  const getTheme = useCallback((): "light" | "dark" => {
    const theme = getCookie(THEME_COOKIE);
    return (theme as "light" | "dark") || "light";
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => {
    setCookie(THEME_COOKIE, theme, { days: 365, sameSite: "Lax" });
    // Also update document class
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getTheme();
    setTheme(current === "light" ? "dark" : "light");
  }, [getTheme, setTheme]);

  return { getTheme, setTheme, toggleTheme };
}

/**
 * Language Cookie Management
 */
export function useLanguageCookie() {
  const getLanguage = useCallback((): string => {
    return getCookie(LANGUAGE_COOKIE) || "en";
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setCookie(LANGUAGE_COOKIE, lang, { days: 365, sameSite: "Lax" });
    // Update document lang attribute
    document.documentElement.lang = lang;
  }, []);

  return { getLanguage, setLanguage };
}
