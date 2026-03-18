import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export interface Conversation {
  id: string;
  initiator_id: string;
  receiver_id: string;
  product_id: string | null;
  deal_id: string | null;
  conversation_type: string | null;
  last_message: string | null;
  last_message_at: string | null;
  updated_at: string;
  is_archived: boolean;
  otherUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  unreadCount: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch if auth is loaded and user exists
    if (!authLoading && user) {
      fetchConversations();
    } else if (!authLoading && !user) {
      // Auth loaded but no user - clear conversations
      setConversations([]);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Simplified query without foreign key joins to avoid PGRST200 error
      const { data: convos, error } = await supabase
        .from("trading_conversations")
        .select(
          `
          id,
          initiator_id,
          receiver_id,
          product_id,
          deal_id,
          conversation_type,
          last_message,
          last_message_at,
          updated_at,
          is_archived
        `,
        )
        .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Map to Conversation interface (otherUser will be fetched separately if needed)
      const mapped = (convos || []).map((conv: any) => {
        const otherUserId =
          conv.initiator_id === user.id ? conv.receiver_id : conv.initiator_id;
        return {
          ...conv,
          otherUser: {
            id: otherUserId,
            full_name: null, // Will be null until we fetch user details
            avatar_url: null,
          },
          unreadCount: 0,
        };
      });

      setConversations(mapped as Conversation[]);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      // Don't show error toast if table doesn't exist yet
      if (
        error.message?.includes("relation") ||
        error.message?.includes("does not exist")
      ) {
        console.warn("trading_conversations table does not exist yet");
        setConversations([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    conversations,
    isLoading,
  };
};
