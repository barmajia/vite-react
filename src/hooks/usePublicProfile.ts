// src/hooks/usePublicProfile.ts
// Hook to fetch public profile data using RPC function
// This avoids foreign key relationship issues with Supabase

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PublicProfile } from "../types/public-profile";

interface UsePublicProfileReturn {
  profile: PublicProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePublicProfile = (userId: string): UsePublicProfileReturn => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the get_public_profile RPC function
      // This avoids foreign key relationship issues and provides unified data
      const { data: profileData, error: profileError } = await supabase.rpc(
        "get_public_profile",
        { p_user_id: userId },
      );

      if (profileError) {
        console.error("RPC Error:", profileError);
        throw new Error(profileError.message || "Failed to fetch profile");
      }

      if (!profileData || profileData.length === 0) {
        throw new Error("Profile not found");
      }

      setProfile(profileData[0] as PublicProfile);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load profile";
      setError(errorMessage);
      console.error("Error fetching public profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const refresh = async () => {
    await fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    refresh,
  };
};
