// useMessages Hook for Aurora Chat System
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Message, ConversationContext } from "@/lib/chat-types";
import { getMessageTable } from "@/lib/chat-utils";

interface UseMessagesProps {
  conversationId: string | null;
  context?: ConversationContext;
  currentUserId: string;
}

export function useMessages({
  conversationId,
  context = "general",
  currentUserId,
}: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tableName = getMessageTable(context);

      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey (
            user_id,
            full_name,
            avatar_url,
            account_type
          )
        `
        )
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(
        (data || []).map((msg: any) => ({
          ...msg,
          sender: msg.sender?.[0] || msg.sender,
        }))
      );

      // Mark messages as read
      await markMessagesAsRead(conversationId, tableName);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, context, currentUserId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (convId: string, tableName: string) => {
      try {
        if (!currentUserId) return;

        await supabase
          .from(tableName)
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", convId)
          .neq("sender_id", currentUserId)
          .is("read_at", null);
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [currentUserId]
  );

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      messageType: "text" | "image" | "file" = "text",
      attachmentUrl?: string,
      attachmentName?: string
    ): Promise<Message | null> => {
      if (!conversationId || !content.trim()) return null;

      setSending(true);
      setError(null);

      try {
        const tableName = getMessageTable(context);

        const { data: message, error: insertError } = await supabase
          .from(tableName)
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: content.trim(),
            message_type: messageType,
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
            is_deleted: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update conversation last message
        await updateConversationLastMessage(
          conversationId,
          content,
          messageType,
          context
        );

        return message;
      } catch (err: any) {
        setError(err.message);
        console.error("Error sending message:", err);
        return null;
      } finally {
        setSending(false);
      }
    },
    [conversationId, context, currentUserId]
  );

  // Update conversation last message
  const updateConversationLastMessage = useCallback(
    async (
      convId: string,
      content: string,
      messageType: string,
      contextType: ConversationContext
    ) => {
      try {
        const tableName =
          contextType === "trading"
            ? "trading_conversations"
            : contextType === "health"
            ? "health_conversations"
            : contextType === "services"
            ? "services_conversations"
            : "conversations";

        const lastMessage =
          messageType === "image"
            ? "📷 Image"
            : messageType === "file"
            ? "📎 Attachment"
            : content.substring(0, 100);

        await supabase
          .from(tableName)
          .update({
            last_message: lastMessage,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", convId);
      } catch (err) {
        console.error("Error updating conversation:", err);
      }
    },
    []
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const tableName = getMessageTable(context);

        const { error: updateError } = await supabase
          .from(tableName)
          .update({ is_deleted: true })
          .eq("id", messageId);

        if (updateError) throw updateError;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_deleted: true } : m
          )
        );
      } catch (err: any) {
        setError(err.message);
        console.error("Error deleting message:", err);
      }
    },
    [context]
  );

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const tableName = getMessageTable(context);

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Mark as read if from another user
          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead(conversationId, tableName);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tableName,
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, context, currentUserId, markMessagesAsRead]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    deleteMessage,
    refresh: fetchMessages,
  };
}
