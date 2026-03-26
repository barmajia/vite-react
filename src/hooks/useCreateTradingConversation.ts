import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  TradingAccountType,
  TradingConversationType,
} from "../types/trading-chat";

export const useCreateTradingConversation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = async (
    targetUserId: string,
    currentUserType: TradingAccountType,
    targetUserType: TradingAccountType,
    productId?: string,
    conversationType: TradingConversationType = "product_inquiry",
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      // Get current user ID from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Check product permission if applicable
      if (
        productId &&
        (currentUserType === "user" || currentUserType === "customer")
      ) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("allow_chat, seller_id")
          .eq("id", productId)
          .single();

        if (productError || !product?.allow_chat) {
          throw new Error("Chat is not enabled for this product");
        }
      }

      // Use trading_conversations table for trading roles
      const { data, error } = await supabase
        .from("trading_conversations")
        .insert({
          initiator_id: user.id,
          receiver_id: targetUserId,
          initiator_role: currentUserType,
          receiver_role: targetUserType,
          conversation_type: conversationType,
          product_id: productId || null,
          is_custom_request: conversationType === "custom_request",
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createConversation, loading, error };
};
