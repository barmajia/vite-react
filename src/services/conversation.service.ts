// ═══════════════════════════════════════════════════════════════════════
// AuroraChat Conversation Service
// Handles conversation creation, retrieval, and participant management
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase";
import type {
  ConversationWithParticipants,
  StartConversationResult,
  AccountType,
  User,
} from "@/types/chat";

export class ConversationService {
  /**
   * Start a conversation with another user
   * Checks if room exists, creates if not
   *
   * @param currentUserId - The ID of the current logged-in user
   * @param otherUserId - The ID of the user to start a conversation with
   * @returns Promise with conversation details or error
   */
  static async startConversation(
    currentUserId: string,
    otherUserId: string,
  ): Promise<StartConversationResult> {
    try {
      // Step 1: Check if conversation already exists between these two users
      const existingConversation = await this.findExistingConversation(
        currentUserId,
        otherUserId,
      );

      if (existingConversation) {
        return {
          success: true,
          conversation: existingConversation,
          error: null,
        };
      }

      // Step 2: Create new conversation
      const newConversation = await this.createConversation(
        currentUserId,
        otherUserId,
      );

      if (!newConversation) {
        return {
          success: false,
          conversation: null,
          error: "Failed to create conversation",
        };
      }

      return {
        success: true,
        conversation: newConversation,
        error: null,
      };
    } catch (error) {
      console.error("Error starting conversation:", error);
      return {
        success: false,
        conversation: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Find existing conversation between two users
   *
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Existing conversation with participants or null
   */
  static async findExistingConversation(
    userId1: string,
    userId2: string,
  ): Promise<ConversationWithParticipants | null> {
    // Step 1: Get conversation IDs where userId1 is a participant
    const { data: participantData, error: participantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId1);

    if (participantError || !participantData || participantData.length === 0) {
      return null;
    }

    const conversationIds = participantData.map((p) => p.conversation_id);

    // Step 2: Find conversations where userId2 is also a participant
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants (
          user_id,
          account_type,
          joined_at
        )
      `,
      )
      .eq("type", "direct")
      .in("id", conversationIds);

    if (error || !conversations || conversations.length === 0) {
      return null;
    }

    // Find the conversation that has both users
    const targetConversation = conversations.find((conv) =>
      conv.participants.some((p) => p.user_id === userId2),
    );

    if (!targetConversation) {
      return null;
    }

    return {
      id: targetConversation.id,
      name: targetConversation.name,
      type: targetConversation.type as "direct" | "group",
      created_at: targetConversation.created_at,
      updated_at: targetConversation.updated_at,
      participants: targetConversation.participants,
    };
  }

  /**
   * Create new conversation and add participants
   *
   * @param currentUserId - The ID of the current user
   * @param otherUserId - The ID of the other user
   * @returns New conversation with participants or null
   */
  static async createConversation(
    currentUserId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants | null> {
    // Step 1: Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        name: `Direct Chat`,
        type: "direct",
      })
      .select()
      .single();

    if (convError || !conversation) {
      console.error("Error creating conversation:", convError);
      return null;
    }

    // Step 2: Add both participants (account_type auto-fills via trigger)
    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert([
        {
          conversation_id: conversation.id,
          user_id: currentUserId,
        },
        {
          conversation_id: conversation.id,
          user_id: otherUserId,
        },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      // Rollback: delete the conversation
      await supabase.from("conversations").delete().eq("id", conversation.id);
      return null;
    }

    // Step 3: Fetch full conversation with participants
    const fullConversation = await this.getConversationWithParticipants(
      conversation.id,
    );

    return fullConversation;
  }

  /**
   * Get conversation with all participants
   *
   * @param conversationId - The conversation ID
   * @returns Conversation with participants or null
   */
  static async getConversationWithParticipants(
    conversationId: string,
  ): Promise<ConversationWithParticipants | null> {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants (
          user_id,
          account_type,
          joined_at
        )
      `,
      )
      .eq("id", conversationId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type as "direct" | "group",
      created_at: data.created_at,
      updated_at: data.updated_at,
      participants: data.participants,
    };
  }

  /**
   * Get user info with account type
   *
   * @param userId - The user ID
   * @returns User information or null
   */
  static async getUserInfo(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, avatar_url, account_type")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      account_type: data.account_type as AccountType,
    };
  }

  /**
   * Join existing room by ID (for aurora_room)
   *
   * @param conversationId - The conversation/room ID to join
   * @param userId - The user ID joining the room
   * @returns True if successfully joined
   */
  static async joinRoom(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if already a participant
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      return true; // Already joined
    }

    // Add as participant (account_type auto-fills via trigger)
    const { error } = await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      user_id: userId,
    });

    return !error;
  }
}
