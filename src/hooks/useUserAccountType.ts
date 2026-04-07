import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TradingAccountType } from "../types/trading-chat";
import { getNexusProfile } from "../utils/secure-profile-storage";

export const useUserAccountType = (userId: string | null) => {
  const [accountType, setAccountType] = useState<TradingAccountType | null>(
    () => {
      const cached = getNexusProfile();
      if (cached && cached.uuid === userId) {
        return cached.account_type as TradingAccountType;
      }
      return null;
    }
  );
  const [loading, setLoading] = useState(!accountType);

  useEffect(() => {
    const fetchAccountType = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // If we already have it from cache, don't fetch unless needed
      if (accountType) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("account_type")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.debug(
            "Account type fetch error, using default:",
            error.message,
          );
          setAccountType("user");
        } else {
          setAccountType((data?.account_type as TradingAccountType) || "user");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.debug("Account type error:", errorMessage);
        setAccountType("user"); // Default to user
      } finally {
        setLoading(false);
      }
    };

    fetchAccountType();
  }, [userId, accountType]);

  return { accountType, loading };
};
