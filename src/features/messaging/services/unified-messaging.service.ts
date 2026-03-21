import { supabase } from "@/lib/supabase";
import type { ConversationContext, UnifiedMessage } from "../types/messaging";

export interface CreateConversationParams {
  context: ConversationContext;
  participantId: string;
  productId?: string;
  serviceListingId?: string;
  healthcareAppointmentId?: string;
  factoryDealId?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageParams {
  conversationId: string;
  content: string;
  messageType?:
    | "text"
    | "image"
    | "file"
    | "system"
    | "deal_proposal"
    | "prescription";
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  metadata?: Record<string, any>;
}

export interface GetConversationsOptions {
  context?: ConversationContext;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export class UnifiedMessagingService {
  /**
   * Get or create a conversation based on context
   */
  static async getOrCreateConversation(params: CreateConversationParams) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use RPC function if available
      const { data, error } = await supabase.rpc(
        "get_or_create_unified_conversation",
        {
          p_participant_id: params.participantId,
          p_context: params.context,
          p_product_id: params.productId,
          p_service_listing_id: params.serviceListingId,
          p_healthcare_appointment_id: params.healthcareAppointmentId,
          p_factory_deal_id: params.factoryDealId,
          p_metadata: params.metadata || {},
        },
      );

      if (error) throw error;

      // Fetch full conversation details
      const { data: fullConv } = await supabase
        .from("unified_conversations")
        .select(
          `
          *,
          other_user:users!participant_id(id, full_name, avatar_url),
          product:products(id, title, price),
          service_listing:service_listings(id, title, price),
          appointment:health_appointments(id, scheduled_at, status),
          deal:deals(id, title, status)
        `,
        )
        .eq("id", data)
        .single();

      return fullConv;
    } catch (error: any) {
      console.error("Error getting/creating conversation:", error);
      throw error;
    }
  }

  /**
   * Find existing conversation
   */
  static async findConversation(params: CreateConversationParams) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from("unified_conversations")
        .select(
          `
          *,
          other_user:users!participant_id(id, full_name, avatar_url)
        `,
        )
        .or(
          `user_id.eq.${params.participantId},participant_id.eq.${params.participantId}`,
        )
        .eq("context", params.context);

      if (params.productId) query = query.eq("product_id", params.productId);
      if (params.serviceListingId)
        query = query.eq("service_listing_id", params.serviceListingId);
      if (params.healthcareAppointmentId)
        query = query.eq(
          "healthcare_appointment_id",
          params.healthcareAppointmentId,
        );

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error: any) {
      console.error("Error finding conversation:", error);
      return null;
    }
  }

  /**
   * Send message
   */
  static async sendMessage(params: SendMessageParams) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("unified_messages")
        .insert({
          conversation_id: params.conversationId,
          sender_id: user.id,
          content: params.content,
          message_type: params.messageType || "text",
          attachment_url: params.attachmentUrl,
          attachment_name: params.attachmentName,
          attachment_size: params.attachmentSize,
          metadata: params.metadata || {},
        })
        .select(
          `
          *,
          sender:users!sender_id(id, full_name, avatar_url)
        `,
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get user's conversations with pagination
   */
  static async getConversations(options?: GetConversationsOptions) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Try RPC function first
      const { data, error } = await supabase.rpc(
        "get_user_unified_conversations",
        {
          p_limit: options?.limit || 50,
          p_offset: options?.offset || 0,
        },
      );

      if (error) {
        console.error("RPC error, falling back to direct query:", error);

        // Fallback to direct query
        let query = supabase
          .from("unified_conversations")
          .select(
            `
            *,
            other_user:users!participant_id(id, full_name, avatar_url),
            product:products(id, title, price),
            service_listing:service_listings(id, title, price),
            appointment:health_appointments(id, scheduled_at, status),
            deal:deals(id, title, status)
          `,
            { count: "exact" },
          )
          .or(`user_id.eq.${user.id},participant_id.eq.${user.id}`)
          .order("updated_at", { ascending: false });

        if (options?.context) {
          query = query.eq("context", options.context);
        }

        if (!options?.includeArchived) {
          query = query.eq("is_archived", false);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        if (options?.offset && options.limit) {
          query = query.range(
            options.offset,
            options.offset + options.limit - 1,
          );
        }

        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    } catch (error: any) {
      console.error("Error getting conversations:", error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    options?: {
      limit?: number;
      before?: string; // timestamp for pagination
    },
  ) {
    try {
      let query = supabase
        .from("unified_messages")
        .select(
          `
          *,
          sender:users!sender_id(id, full_name, avatar_url)
        `,
          { count: "exact" },
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.before) {
        query = query.lt("created_at", options.before);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error getting messages:", error);
      return [];
    }
  }

  /**
   * Subscribe to real-time messages
   */
  static subscribeToConversation(
    conversationId: string,
    callbacks: {
      onMessage?: (message: UnifiedMessage) => void;
      onTyping?: (userId: string) => void;
      onRead?: (messageId: string) => void;
    },
  ) {
    const channel = supabase
      .channel(`unified-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "unified_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callbacks.onMessage?.(payload.new as UnifiedMessage);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("unified_messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error marking as read:", error);
    }
  }

  /**
   * Get unread count for a conversation
   */
  static async getUnreadCount(conversationId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from("unified_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      return count || 0;
    } catch (error: any) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Archive conversation
   */
  static async archiveConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from("unified_conversations")
        .update({ is_archived: true })
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error archiving conversation:", error);
      throw error;
    }
  }

  /**
   * Delete conversation (soft delete)
   */
  static async deleteConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from("unified_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Get context label for display
   */
  static getContextLabel(context: ConversationContext): string {
    const labels: Record<ConversationContext, string> = {
      product: "Product Inquiry",
      service: "Service Booking",
      healthcare: "Medical Consultation",
      factory: "Factory Deal",
      support: "Customer Support",
      general: "General Chat",
    };
    return labels[context] || "Chat";
  }

  /**
   * Get context icon for display
   */
  static getContextIcon(context: ConversationContext): string {
    const icons: Record<ConversationContext, string> = {
      product: "🛍️",
      service: "🛠️",
      healthcare: "🏥",
      factory: "🏭",
      support: "💬",
      general: "💭",
    };
    return icons[context] || "💬";
  }
}
