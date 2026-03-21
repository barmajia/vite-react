import type {
  Database,
  ConversationType,
  MessageType,
  MessageSubtype,
} from "@/types/database";

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type ConversationDeal =
  Database["public"]["Tables"]["conversation_deals"]["Row"];

// Unified Messaging Types
export type ConversationContext =
  | "product"
  | "service"
  | "healthcare"
  | "factory"
  | "support"
  | "general";

export type UnifiedMessageType =
  | "text"
  | "image"
  | "file"
  | "system"
  | "deal_proposal"
  | "deal_counter"
  | "deal_accepted"
  | "prescription"
  | "appointment_reminder";

export interface UnifiedConversation {
  id: string;
  context: ConversationContext;
  conversation_type: string;
  user_id: string;
  participant_id: string;

  // Context references
  product_id?: string;
  service_listing_id?: string;
  healthcare_appointment_id?: string;
  factory_deal_id?: string;

  // State
  last_message: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Relations
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  product?: {
    id: string;
    title: string;
    price: number;
  };
  service_listing?: {
    id: string;
    title: string;
    price: number;
  };
  appointment?: {
    id: string;
    scheduled_at: string;
    status: string;
  };
  deal?: {
    id: string;
    title: string;
    status: string;
  };

  // Computed
  unread_count?: number;
  context_label?: string;
}

export interface UnifiedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: UnifiedMessageType;
  message_subtype?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  is_read: boolean;
  read_at?: string;
  metadata: Record<string, any>;
  created_at: string;

  // Relations
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageMetadata {
  edited?: boolean;
  edited_at?: string;
  reactions?: Array<{
    emoji: string;
    user_id: string;
  }>;
  reply_to?: string; // message_id
  deal_data?: {
    offer_price: number;
    quantity: number;
    expires_at: string;
  };
  prescription_data?: {
    medicine_name: string;
    dosage: string;
    duration_days: number;
  };
}

export interface ConversationWithParticipants {
  id: string;
  product_id: string | null;
  deal_id: string | null;
  conversation_type: ConversationType;
  user_id: string | null;
  seller_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  participants: Array<{
    user_id: string;
    role: string;
    users: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      account_type?: string;
    };
  }>;
  otherUser?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    account_type?: string;
  };
  unreadCount: number;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  messageSubtype?: MessageSubtype;
  attachmentUrl?: string;
}

export interface CreateConversationInput {
  toUserId: string;
  productId?: string;
  conversationType?: ConversationType;
}
