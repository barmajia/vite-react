import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TradingAccountType } from "../types/trading-chat";

export const useUserAccountType = (userId: string | null) => {
  const [accountType, setAccountType] = useState<TradingAccountType | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountType = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("account_type")
          .eq("user_id", userId)
          .maybeSingle(); // Use maybeSingle to handle no rows gracefully

        if (error) {
          // Log but don't fail - default to 'user'
          console.warn(
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
        console.warn("Account type error:", errorMessage);
        setAccountType("user"); // Default to user
      } finally {
        setLoading(false);
      }
    };

    fetchAccountType();
  }, [userId]);

  return { accountType, loading, error };
};
