/**
 * Secure Profile Storage Utility
 * 
 * Provides obfuscated local storage for critical user profile data
 * to minimize redundant Supabase database queries.
 */

const STORAGE_KEY = "_aurora_nexus_init_v3";

export interface NexusProfile {
  full_name: string;
  uuid: string;
  account_type: string;
}

/**
 * Obfuscates and saves profile data to local storage
 */
export const saveNexusProfile = (profile: NexusProfile): void => {
  try {
    const data = JSON.stringify(profile);
    // Base64 obfuscation to prevent casual inspection
    const obfuscated = btoa(encodeURIComponent(data));
    localStorage.setItem(STORAGE_KEY, obfuscated);
  } catch (error) {
    console.warn("Failed to cache nexus profile:", error);
  }
};

/**
 * Retrieves and de-obfuscates profile data from local storage
 */
export const getNexusProfile = (): NexusProfile | null => {
  try {
    const obfuscated = localStorage.getItem(STORAGE_KEY);
    if (!obfuscated) return null;

    const data = decodeURIComponent(atob(obfuscated));
    return JSON.parse(data) as NexusProfile;
  } catch (error) {
    // Silently fail and return null to trigger a fresh fetch
    console.debug("Nexus cache invalid or missing");
    return null;
  }
};

/**
 * Clears the cached profile
 */
export const clearNexusProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
