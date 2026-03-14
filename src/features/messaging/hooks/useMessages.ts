import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { subscribeToMessages } from "../lib/supabase-realtime";
import type { Message } from "../types/messaging";

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const [newMessages, setNewMessages] = useState<Message[]>([]);

  const fetchMessages = async () => {
    if (!conversationId) return [];

    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        message_subtype,
        attachment_url,
        is_read,
        read_at,
        created_at,
        updated_at
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Fetch sender profiles separately
    let messagesWithSenders = data || [];
    if (messagesWithSenders.length > 0) {
      const senderIds = [
        ...new Set(messagesWithSenders.map((m) => m.sender_id)),
      ];
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("user_id, full_name, avatar_url")
        .in("user_id", senderIds);

      if (usersError) throw usersError;

      const userMap = new Map((users || []).map((u) => [u.user_id, u]));
      messagesWithSenders = messagesWithSenders.map((msg) => ({
        ...msg,
        sender: userMap.get(msg.sender_id) || null,
      }));
    }

    return messagesWithSenders as Message[];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: fetchMessages,
    enabled: !!conversationId,
    staleTime: 0,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      setNewMessages((prev) => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, queryClient]);

  const allMessages = [...(data || []), ...newMessages];

  return { messages: allMessages, isLoading, error, refetch };
};
