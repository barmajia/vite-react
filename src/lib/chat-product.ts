import { supabase } from "./supabase";

/**
 * Initiate a direct chat conversation about a product with the seller
 * @param sellerId - UUID of the seller
 * @param productId - UUID or ASIN of the product
 * @returns Conversation ID if successful, null otherwise
 */
export const initiateProductChat = async (
  sellerId: string,
  productId: string,
  productTitle?: string,
): Promise<string | null> => {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Prevent self-chat
    if (user.id === sellerId) {
      throw new Error("Cannot chat with yourself");
    }

    // Try to create or get existing conversation using RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_or_create_direct_conversation_v2",
      {
        p_user1_id: user.id,
        p_user2_id: sellerId,
        p_display_name: productTitle
          ? `Chat about: ${productTitle}`
          : "Product Inquiry",
        p_context_type: "product",
        p_context_id: productId,
      },
    );

    if (!rpcError && rpcData?.success && rpcData?.conversation_id) {
      return rpcData.conversation_id;
    }

    // Fallback: Create conversation manually if RPC fails
    if (rpcError) {
      console.warn("RPC failed, attempting fallback conversation creation");
      const newConversationId = crypto.randomUUID();

      // Create conversation
      const { error: convError } = await supabase.from("conversations").insert({
        id: newConversationId,
        type: "direct",
        context: "product",
        product_id: productId,
        name: productTitle ? `Chat about: ${productTitle}` : "Product Inquiry",
        last_message: null,
        last_message_at: null,
      });

      if (convError) throw convError;

      // Add participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          {
            conversation_id: newConversationId,
            user_id: user.id,
            account_type: "customer",
            role: "member",
            joined_at: new Date().toISOString(),
          },
          {
            conversation_id: newConversationId,
            user_id: sellerId,
            account_type: "seller",
            role: "member",
            joined_at: new Date().toISOString(),
          },
        ]);

      if (partError) throw partError;

      return newConversationId;
    }

    throw new Error("Failed to create conversation");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to initiate chat";
    console.error("Error initiating product chat:", errorMessage);
    throw new Error(errorMessage);
  }
};
