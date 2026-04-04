import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Conversation, User } from "@/types/chat";

interface ConversationWithDetails extends Conversation {
  otherUser?: User | null;
  unreadCount?: number;
}

export const useConversations = (currentUserId: string) => {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // STEP 1: Get conversation IDs user participates in (SIMPLE QUERY)
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (participantError) {
        console.error("Participant query error:", participantError);
        throw participantError;
      }

      const conversationIds =
        participantData?.map((p) => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // STEP 2: Fetch conversations by IDs (SIMPLE QUERY - no nested joins)
      const { data: conversationsData, error: convError } = await supabase
        .from("conversations")
        .select(
          "id, name, type, category, created_at, updated_at, last_message, last_message_at",
        )
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) {
        console.error("Conversations query error:", convError);
        throw convError;
      }

      // STEP 3: For each conversation, fetch the OTHER participant separately
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          try {
            // Fetch other participant (not current user)
            const { data: participants, error: partError } = await supabase
              .from("conversation_participants")
              .select(
                `
                user_id,
                account_type,
                users:users!inner (
                  id,
                  email,
                  full_name,
                  avatar_url,
                  account_type
                )
              `,
              )
              .eq("conversation_id", conv.id)
              .neq("user_id", currentUserId)
              .limit(1)
              .maybeSingle();

            if (partError) {
              console.warn(
                `Participant fetch error for conv ${conv.id}:`,
                partError,
              );
            }

            const otherUser = (participants?.users as User) || null;

            return {
              ...conv,
              otherUser,
              unreadCount: 0, // Simplified - can add receipt logic later
            };
          } catch (err) {
            console.warn(
              `Failed to fetch participant for conversation ${conv.id}:`,
              err,
            );
            return { ...conv, otherUser: null, unreadCount: 0 };
          }
        }),
      );

      setConversations(conversationsWithDetails);
    } catch (err: any) {
      console.error("Failed to fetch conversations:", err);

      // Provide user-friendly error messages
      let errorMessage = "Failed to load conversations";
      if (err?.code === "PGRST301") {
        errorMessage = "Permission denied. Please check your account settings.";
      } else if (err?.code === "42P01" || err?.code === "42P17") {
        errorMessage = "Database configuration error. Please contact support.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Create new conversation
  const createConversation = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!currentUserId) return null;

      try {
        // Check if conversation already exists between these users
        const { data: existingParticipants } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", currentUserId);

        if (existingParticipants) {
          for (const p of existingParticipants) {
            const { data: check } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", p.conversation_id)
              .eq("user_id", otherUserId)
              .maybeSingle();

            if (check) {
              return p.conversation_id; // Already exists
            }
          }
        }

        // Create new conversation (your schema only has: id, product_id, created_at, updated_at, last_message, last_message_at, is_archived)
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .insert({
            product_id: null,
          })
          .select("id")
          .single();

        if (convError) throw convError;

        // Add both participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversation.id, user_id: currentUserId },
            { conversation_id: conversation.id, user_id: otherUserId },
          ]);

        if (participantsError) throw participantsError;

        return conversation.id;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
      }
    },
    [currentUserId],
  );

  // Delete conversation (soft delete by removing participant)
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        // Remove current user from participants (soft delete)
        const { error } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", currentUserId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        return false;
      }
    },
    [currentUserId],
  );

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refresh: fetchConversations,
    createConversation,
    deleteConversation,
  };
};
