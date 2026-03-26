// Enhanced useConversations Hook for Aurora Chat System
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ConversationListItem, ChatUser } from "@/lib/chat-types";

export function useConversations(currentUserId: string | null) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllConversations = useCallback(async () => {
    if (!currentUserId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        fetchGeneralConversations(currentUserId),
        fetchTradingConversations(currentUserId),
        fetchHealthConversations(currentUserId),
        fetchServicesConversations(currentUserId),
      ]);

      const allConversations: ConversationListItem[] = [];

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          allConversations.push(...result.value);
        } else if (result.status === "rejected") {
          console.warn("Error fetching conversations:", result.reason);
        }
      });

      // Sort by last message time
      allConversations.sort((a, b) => {
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;
        return bTime - aTime;
      });

      setConversations(allConversations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Fetch general/product conversations
  const fetchGeneralConversations = async (
    userId: string
  ): Promise<ConversationListItem[]> => {
    try {
      // Get conversation IDs from participants table
      const { data: participantData } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      const conversationIds =
        participantData?.map((p) => p.conversation_id) || [];

      if (conversationIds.length === 0) return [];

      const { data: general } = await supabase
        .from("conversations")
        .select(
          `
          id,
          last_message,
          last_message_at,
          is_archived,
          product_id,
          context,
          participants:conversation_participants!inner(
            conversation_id,
            user_id,
            role,
            user:users(
              user_id,
              full_name,
              avatar_url,
              account_type
            )
          ),
          products(
            id,
            title,
            price,
            images
          )
        `
        )
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false })
        .limit(50);

      return (general || []).map((conv) => {
        const otherParticipant = conv.participants?.find(
          (p: any) => p.user_id !== userId
        );

        return {
          id: conv.id,
          context: (conv.context as any) || "general",
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: 0,
          other_user: otherParticipant?.user as ChatUser | undefined,
          product: conv.products?.[0] || null,
          is_archived: conv.is_archived,
        };
      });
    } catch (error) {
      console.warn("Error fetching general conversations:", error);
      return [];
    }
  };

  // Fetch trading conversations
  const fetchTradingConversations = async (
    userId: string
  ): Promise<ConversationListItem[]> => {
    try {
      const { data: trading } = await supabase
        .from("trading_conversations")
        .select(
          `
          id,
          last_message,
          last_message_at,
          is_archived,
          conversation_type,
          product_id,
          initiator_id,
          receiver_id,
          initiator_role,
          receiver_role,
          products(
            id,
            title,
            price,
            images
          )
        `
        )
        .or(`initiator_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(50);

      return (trading || []).map((conv) => {
        const isInitiator = conv.initiator_id === userId;
        const otherUserId = isInitiator ? conv.receiver_id : conv.initiator_id;
        const otherUserRole = isInitiator
          ? conv.receiver_role
          : conv.initiator_role;

        return {
          id: conv.id,
          context: "trading",
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: 0,
          other_user: otherUserId
            ? ({
                user_id: otherUserId,
                id: otherUserId,
                email: "",
                full_name: "Trading Partner",
                account_type: otherUserRole,
              } as ChatUser)
            : undefined,
          product: conv.products?.[0] || null,
          is_archived: conv.is_archived,
        };
      });
    } catch (error) {
      console.warn("Error fetching trading conversations:", error);
      return [];
    }
  };

  // Fetch health conversations
  const fetchHealthConversations = async (
    userId: string
  ): Promise<ConversationListItem[]> => {
    try {
      // Get appointment IDs first
      const { data: appointmentData } = await supabase
        .from("health_appointments")
        .select("id")
        .or(`doctor_id.eq.${userId},patient_id.eq.${userId}`);

      const appointmentIds = appointmentData?.map((a) => a.id) || [];
      if (appointmentIds.length === 0) return [];

      const { data: health } = await supabase
        .from("health_conversations")
        .select(
          `
          id,
          last_message,
          last_message_at,
          appointment_id,
          health_appointments(
            id,
            scheduled_at,
            status,
            doctor_id,
            patient_id,
            health_doctor_profiles(
              user_id,
              full_name
            ),
            health_patient_profiles(
              user_id,
              full_name
            )
          )
        `
        )
        .in("appointment_id", appointmentIds)
        .order("last_message_at", { ascending: false })
        .limit(50);

      return (health || []).map((conv) => {
        const appointment = conv.health_appointments;
        const isDoctor = appointment?.doctor_id === userId;
        const otherUser = isDoctor
          ? appointment?.health_patient_profiles
          : appointment?.health_doctor_profiles;

        return {
          id: conv.id,
          context: "health",
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: 0,
          other_user: otherUser
            ? ({
                user_id: otherUser.user_id,
                id: otherUser.user_id,
                email: "",
                full_name: otherUser.full_name,
                account_type: isDoctor ? "patient" : "doctor",
              } as ChatUser)
            : undefined,
          appointment: appointment
            ? {
                scheduled_at: appointment.scheduled_at,
                status: appointment.status,
              }
            : null,
          is_archived: false,
        };
      });
    } catch (error) {
      console.warn("Error fetching health conversations:", error);
      return [];
    }
  };

  // Fetch services conversations
  const fetchServicesConversations = async (
    userId: string
  ): Promise<ConversationListItem[]> => {
    try {
      const { data: services } = await supabase
        .from("services_conversations")
        .select(
          `
          id,
          last_message,
          last_message_at,
          is_archived,
          provider_id,
          client_id,
          listing_id,
          service_listings(
            id,
            title,
            price
          )
        `
        )
        .or(`provider_id.eq.${userId},client_id.eq.${userId}`)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(50);

      return (services || []).map((conv) => {
        const isProvider = conv.provider_id === userId;
        const otherUserId = isProvider ? conv.client_id : conv.provider_id;

        return {
          id: conv.id,
          context: "service",
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: 0,
          other_user: {
            user_id: otherUserId,
            id: otherUserId,
            email: "",
            full_name: isProvider ? "Client" : "Provider",
            account_type: isProvider ? "user" : "service_provider",
          } as ChatUser,
          listing: conv.service_listings
            ? {
                title: conv.service_listings.title,
              }
            : null,
          is_archived: conv.is_archived,
        };
      });
    } catch (error) {
      console.warn("Error fetching services conversations:", error);
      return [];
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`conversations:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchAllConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchAllConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trading_conversations",
        },
        () => {
          fetchAllConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "services_conversations",
        },
        () => {
          fetchAllConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchAllConversations]);

  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);

  return {
    conversations,
    loading,
    error,
    refresh: fetchAllConversations,
  };
}
