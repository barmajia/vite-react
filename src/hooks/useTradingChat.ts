import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  TradingMessage,
  TradingConversation,
  TradingParticipant,
  TradingMessageType,
  ProductWithChatPermission,
} from "../types/trading-chat";

export const useTradingChat = (
  conversationId: string | null,
  currentUserId: string,
) => {
  const [messages, setMessages] = useState<TradingMessage[]>([]);
  const [conversation, setConversation] = useState<TradingConversation | null>(
    null,
  );
  const [participants, setParticipants] = useState<TradingParticipant[]>([]);
  const [product, setProduct] = useState<ProductWithChatPermission | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      // Try trading_conversations table first
      let { data, error } = await supabase
        .from("trading_conversations")
        .select(
          `
          *,
          product:products!trading_conversations_product_id_fkey (
            id,
            asin,
            title,
            price,
            seller_id,
            allow_chat,
            images
          ),
          factory:factories!trading_conversations_factory_id_fkey (
            user_id,
            company_name,
            specialization
          ),
          middleman:middle_men!trading_conversations_middleman_id_fkey (
            user_id,
            commission_rate,
            total_earnings
          )
        `,
        )
        .eq("id", conversationId)
        .single();

      // Fallback to regular conversations table
      if (error || !data) {
        const { data: regularData, error: regularError } = await supabase
          .from("conversations")
          .select(
            `
            *,
            product:products!conversations_product_id_fkey (
              id,
              asin,
              title,
              price,
              seller_id,
              allow_chat,
              images
            )
          `,
          )
          .eq("id", conversationId)
          .single();

        if (regularError) throw regularError;
        data = regularData;
      }

      setConversation(data);
      if (data?.product) {
        setProduct(data.product as ProductWithChatPermission);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
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
          ),
          seller:sellers!user_id (
            user_id,
            store_name,
            location,
            allow_product_chats
          ),
          factory:factories!user_id (
            user_id,
            company_name,
            specialization
          ),
          middleman:middle_men!user_id (
            user_id,
            commission_rate,
            total_earnings
          )
        `,
        )
        .eq("conversation_id", conversationId);

      if (error) throw error;
      setParticipants(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, [conversationId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, messageType: TradingMessageType = "text") => {
      if (!conversationId || !content.trim()) return;
      try {
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          message_type: messageType,
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err.message);
      }
    },
    [conversationId, currentUserId],
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
          setMessages((prev) => [...prev, payload.new as TradingMessage]);
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
    product,
    loading,
    error,
    sendMessage,
    refresh: () => {
      fetchConversation();
      fetchParticipants();
      fetchMessages();
    },
  };
};
