import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { ConversationListItem, ChatContext, ChatUser } from "../types/chat";

export const useConversationList = (currentUserId: string) => {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);
    try {
      // First, get the conversation IDs the user participates in
      const { data: participantData } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      const conversationIds =
        participantData?.map((p) => p.conversation_id) || [];

      // Fetch general conversations
      let generalConversations: any[] = [];
      if (conversationIds.length > 0) {
        const { data: general, error: generalError } = await supabase
          .from("conversations")
          .select(
            `
            id,
            last_message,
            last_message_at,
            is_archived,
            product_id,
            participants:conversation_participants!inner(
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
              title,
              images
            )
          `,
          )
          .in("id", conversationIds)
          .order("last_message_at", { ascending: false })
          .limit(50);

        if (generalError) throw generalError;

        // Transform general conversations
        generalConversations = (general || []).map((conv: any) => ({
          id: conv.id,
          context: "general" as ChatContext,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: 0,
          other_user: conv.participants?.find(
            (p: any) => p.user_id !== currentUserId,
          )?.user as ChatUser | undefined,
          product: conv.products?.[0] || null,
        }));
      }

      // Fetch trading conversations
      const { data: trading, error: tradingError } = await supabase
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
            title,
            images
          )
        `,
        )
        .or(`initiator_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (tradingError) throw tradingError;

      // Transform trading conversations
      const tradingConversations = (trading || []).map((conv: any) => {
        const isInitiator = conv.initiator_id === currentUserId;
        const otherUserId = isInitiator ? conv.receiver_id : conv.initiator_id;
        const otherUserRole = isInitiator
          ? conv.receiver_role
          : conv.initiator_role;

        return {
          id: conv.id,
          context: "trading" as ChatContext,
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
        };
      });

      // Fetch health conversations
      const { data: healthData } = await supabase
        .from("health_appointments")
        .select("id")
        .or(`doctor_id.eq.${currentUserId},patient_id.eq.${currentUserId}`);

      const appointmentIds = healthData?.map((a) => a.id) || [];

      let healthConversations: any[] = [];
      if (appointmentIds.length > 0) {
        const { data: health, error: healthError } = await supabase
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
          `,
          )
          .in("appointment_id", appointmentIds)
          .order("last_message_at", { ascending: false })
          .limit(50);

        if (healthError) throw healthError;

        // Transform health conversations
        healthConversations = (health || []).map((conv: any) => {
          const appointment = conv.health_appointments;
          const isDoctor = appointment?.doctor_id === currentUserId;
          const otherUser = isDoctor
            ? appointment?.health_patient_profiles
            : appointment?.health_doctor_profiles;

          return {
            id: conv.id,
            context: "health" as ChatContext,
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
          };
        });
      }

      // Fetch services conversations
      const { data: services, error: servicesError } = await supabase
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
            title
          )
        `,
        )
        .or(`provider_id.eq.${currentUserId},client_id.eq.${currentUserId}`)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (servicesError) throw servicesError;

      // Transform services conversations
      const servicesConversations = (services || []).map((conv: any) => {
        const isProvider = conv.provider_id === currentUserId;
        const otherUserId = isProvider ? conv.client_id : conv.provider_id;

        return {
          id: conv.id,
          context: "service" as ChatContext,
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
        };
      });

      // Combine all conversations
      const allConversations = [
        ...generalConversations,
        ...tradingConversations,
        ...healthConversations,
        ...servicesConversations,
      ].sort((a, b) => {
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;
        return bTime - aTime;
      });

      setConversations(allConversations);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Realtime subscription for new conversations
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
          fetchConversations();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refresh: fetchConversations };
};
