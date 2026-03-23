// src/hooks/usePublicProfile.ts
// Hook to fetch public profile data based on account type

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PublicProfile, AccountType } from "../types/public-profile";

interface UsePublicProfileReturn {
  profile: PublicProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePublicProfile = (
  userId: string,
  accountType?: AccountType,
): UsePublicProfileReturn => {
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
      let type = accountType;

      // If account type not provided, fetch from users table first
      if (!type) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("account_type")
          .eq("user_id", userId)
          .single();

        if (userError) {
          // If users table fails, try auth.users via RPC or default to 'user'
          console.warn(
            "Could not fetch account type from users table:",
            userError.message,
          );
          type = "user";
        } else {
          type = userData?.account_type as AccountType;
        }
      }

      let data: any = null;

      // Fetch based on account type
      switch (type) {
        case "seller":
        case "factory": {
          const { data: sellerData, error: sellerError } = await supabase
            .from("sellers")
            .select(
              `
              *,
              users!sellers_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (sellerError) throw sellerError;
          data = sellerData;
          break;
        }

        case "middleman": {
          const { data: middlemanData, error: middlemanError } = await supabase
            .from("middle_men")
            .select(
              `
              *,
              users!middle_men_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (middlemanError) throw middlemanError;
          data = middlemanData;
          break;
        }

        case "freelancer": {
          const { data: freelancerData, error: freelancerError } =
            await supabase
              .from("svc_providers")
              .select(
                `
              *,
              users!svc_providers_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
              )
              .eq("user_id", userId)
              .single();

          if (freelancerError) throw freelancerError;
          data = freelancerData;
          break;
        }

        case "service_provider": {
          const { data: providerData, error: providerError } = await supabase
            .from("svc_providers")
            .select(
              `
              *,
              users!svc_providers_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (providerError) throw providerError;
          data = providerData;
          break;
        }

        case "doctor": {
          const { data: doctorData, error: doctorError } = await supabase
            .from("health_doctor_profiles")
            .select(
              `
              *,
              users!health_doctor_profiles_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (doctorError) throw doctorError;
          data = doctorData;
          break;
        }

        case "patient": {
          const { data: patientData, error: patientError } = await supabase
            .from("health_patient_profiles")
            .select(
              `
              *,
              users!health_patient_profiles_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (patientError) throw patientError;
          data = patientData;
          break;
        }

        case "pharmacy": {
          const { data: pharmacyData, error: pharmacyError } = await supabase
            .from("health_pharmacy_profiles")
            .select(
              `
              *,
              users!health_pharmacy_profiles_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (pharmacyError) throw pharmacyError;
          data = pharmacyData;
          break;
        }

        case "delivery_driver": {
          const { data: driverData, error: driverError } = await supabase
            .from("delivery_profiles")
            .select(
              `
              *,
              users!delivery_profiles_user_id_fkey (
                full_name,
                avatar_url,
                phone,
                email
              )
            `,
            )
            .eq("user_id", userId)
            .single();

          if (driverError) throw driverError;
          data = driverData;
          break;
        }

        case "user":
        case "customer":
        default: {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (userError) throw userError;
          data = userData;
          break;
        }
      }

      // Merge user data with profile data
      if (data?.users) {
        const mergedProfile = {
          ...data,
          ...data.users,
          user_id: data.user_id || userId,
        };
        delete mergedProfile.users;
        setProfile(mergedProfile as PublicProfile);
      } else {
        setProfile({
          ...data,
          user_id: userId,
        } as PublicProfile);
      }
    } catch (err: any) {
      console.error("Error fetching public profile:", err);
      setError(err.message || "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId, accountType]);

  return { profile, loading, error, refresh: fetchProfile };
};
