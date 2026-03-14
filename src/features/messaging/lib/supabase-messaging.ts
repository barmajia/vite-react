import { supabase } from "@/lib/supabase";
import type { ConversationType } from "@/types/database";

/**
 * Get user's conversation IDs from conversation_participants table
 * This avoids the complex or() filter that causes 400 errors
 */
export const getUserConversationIds = async (
  userId: string,
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (error) throw error;
  return data?.map((p) => p.conversation_id) || [];
};

/**
 * Get conversations with full details using conversation IDs
 */
export const getConversationsWithDetails = async (
  _userId: string,
  conversationIds: string[],
) => {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      product_id,
      deal_id,
      conversation_type,
      user_id,
      seller_id,
      last_message,
      last_message_at,
      created_at,
      updated_at,
      is_archived,
      conversation_participants!inner (
        user_id,
        role
      ),
      messages (
        id,
        content,
        sender_id,
        message_type,
        message_subtype,
        read_at,
        created_at
      )
    `,
    )
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  // Fetch user profiles separately
  const conversations = data || [];
  if (conversations.length > 0) {
    const participantIds = new Set<string>();
    const senderIds = new Set<string>();

    conversations.forEach((conv) => {
      conv.conversation_participants?.forEach((p) =>
        participantIds.add(p.user_id),
      );
      conv.messages?.forEach((m) => senderIds.add(m.sender_id));
    });

    const allUserIds = [...participantIds, ...senderIds];
    if (allUserIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("user_id, full_name, avatar_url, account_type")
        .in("user_id", allUserIds);

      if (usersError) throw usersError;

      const userMap = new Map((users || []).map((u) => [u.user_id, u]));

      // Attach user profiles to participants
      conversations.forEach((conv) => {
        if (conv.conversation_participants) {
          conv.conversation_participants = conv.conversation_participants.map(
            (p) => ({
              ...p,
              users: userMap.get(p.user_id) || null,
            }),
          );
        }
        // Attach sender profiles to messages
        if (conv.messages) {
          conv.messages = conv.messages.map((m) => ({
            ...m,
            sender: userMap.get(m.sender_id) || null,
          }));
        }
      });
    }
  }

  return conversations;
};

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
  fromUserId: string,
  toUserId: string,
  productId?: string,
  conversationType: ConversationType = "general",
): Promise<string | null> => {
  try {
    // Check if conversation already exists
    const { data: existingConversations } = await supabase
      .from("conversations")
      .select("id, product_id, conversation_type")
      .eq("product_id", productId || null)
      .eq("conversation_type", conversationType);

    if (existingConversations && existingConversations.length > 0) {
      // Find mutual conversation
      for (const conv of existingConversations) {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.id);

        const participantIds = participants?.map((p) => p.user_id) || [];
        if (
          participantIds.includes(fromUserId) &&
          participantIds.includes(toUserId)
        ) {
          return conv.id;
        }
      }
    }

    // Create new conversation with new columns
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        product_id: productId || null,
        deal_id: null,
        conversation_type: conversationType,
        user_id: fromUserId,
        seller_id: toUserId,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Get user roles for participants
    const { data: fromUser } = await supabase
      .from("users")
      .select("account_type")
      .eq("user_id", fromUserId)
      .maybeSingle();

    const { data: toUser } = await supabase
      .from("users")
      .select("account_type")
      .eq("user_id", toUserId)
      .maybeSingle();

    // Add participants
    await supabase.from("conversation_participants").insert([
      {
        conversation_id: conversation.id,
        user_id: fromUserId,
        role: fromUser?.account_type || "user",
      },
      {
        conversation_id: conversation.id,
        user_id: toUserId,
        role: toUser?.account_type || "user",
      },
    ]);

    return conversation.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
};
