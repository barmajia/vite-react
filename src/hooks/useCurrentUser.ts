import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ChatUser, AccountType } from "../types/chat";
import { getNexusProfile } from "../utils/secure-profile-storage";

export const useCurrentUser = () => {
  const [user, setUser] = useState<ChatUser | null>(() => {
    const cached = getNexusProfile();
    if (cached) {
      return {
        id: cached.uuid,
        user_id: cached.uuid,
        email: "", // Email not in nexus cache, will fill on fetch
        full_name: cached.full_name,
        phone: undefined,
        avatar_url: undefined,
        account_type: cached.account_type as AccountType,
        is_online: true,
        is_verified: false,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // We already have core info from cache, but we may want to fetch full data once
        const { data, error: err } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", authUser.id)
          .single();

        if (err) throw err;

        setUser({
          id: data.id,
          user_id: data.user_id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          account_type: data.account_type,
          is_online: true,
          is_verified: false,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};
