import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Message, Conversation, ConversationParticipant } from "../types/chat";

export const useChat = (
  conversationId: string | null,
  currentUserId: string,
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<ConversationParticipant[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      // First, verify the user is a participant in this conversation
      const { data: participantData, error: participantErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId)
        .single();

      if (participantErr) throw participantErr;
      if (!participantData) {
        throw new Error(
          "Unauthorized: You are not a participant in this conversation",
        );
      }

      // Then fetch the conversation details
      const { data, error: err } = await supabase
        .from("conversations")
        .select(
          `
          id,
          product_id,
          last_message,
          last_message_at,
          is_archived,
          created_at,
          updated_at,
          context
        `,
        )
        .eq("id", conversationId)
        .single();

      if (err) throw err;
      setConversation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data, error: err } = await supabase
        .from("conversation_participants")
        .select(
          `
          *,
          user:users!conversation_participants_user_id_fkey (
            user_id,
            email,
            full_name,
            phone,
            avatar_url,
            account_type
          )
        `,
        )
        .eq("conversation_id", conversationId);

      if (err) throw err;
      setParticipants(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  }, [conversationId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data, error: err } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey (
            user_id,
            email,
            full_name,
            avatar_url,
            account_type
          )
        `,
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (err) throw err;
      setMessages(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      messageType: "text" | "image" | "file" = "text",
    ) => {
      if (!conversationId || !content.trim()) return;
      try {
        const { error: err } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          message_type: messageType,
        });
        if (err) throw err;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      }
    },
    [conversationId, currentUserId],
  );

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("id", messageId)
          .eq("sender_id", currentUserId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Mark read error:", errorMessage);
      }
    },
    [currentUserId],
  );

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchParticipants();
      fetchMessages();
    }
  }, [conversationId, fetchConversation, fetchParticipants, fetchMessages]);

  return {
    messages,
    conversation,
    participants,
    loading,
    error,
    sendMessage,
    markAsRead,
    refresh: () => {
      fetchConversation();
      fetchParticipants();
      fetchMessages();
    },
  };
};
