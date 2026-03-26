import { useState } from "react";
import { supabase } from "../lib/supabase";
import { ChatContext } from "../types/chat";

export const useCreateConversation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = async (
    targetUserId: string,
    context: ChatContext = "general",
    productId?: string,
    appointmentId?: string,
    listingId?: string,
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      // Call your SQL function that handles conversation creation for all 4 verticals
      const { data, error: err } = await supabase.rpc(
        "create_direct_conversation",
        {
          p_target_user_id: targetUserId,
          p_context: context,
          p_product_id: productId || null,
          p_appointment_id: appointmentId || null,
          p_listing_id: listingId || null,
        },
      );

      if (err) throw err;
      return data; // Returns conversation_id
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
