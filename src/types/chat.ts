// Chat & Message Types
import type { Database } from "@/lib/database.types";

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageType = Message["message_type"];

// Aliases for backward compatibility
export type User = {
  id: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  account_type?: string;
};

export type AccountType = string;

export interface ConversationWithParticipants {
  id: string;
  name: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
}

export interface StartConversationResult {
  success: boolean;
  conversation_id?: string;
  error?: string;
}

export interface CustomRequestDetails {
  product_id?: string;
  quantity?: number;
  target_price?: number;
  notes?: string;
}

export interface AuroraConversation {
  id: string;
  name: string | null;
  type: string;
  context?: string;
  product_id?: string | null;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
}

export interface ConversationListItem {
  id: string;
  context: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  other_user?: User | null;
  product?: {
    id: string;
    title: string;
    price: number;
    images?: string[];
  } | null;
  is_archived?: boolean;
}

export interface ChatContext {
  type: "general" | "trading" | "health" | "services" | "product";
  product_id?: string;
  appointment_id?: string;
  listing_id?: string;
}

export interface ChatUser {
  user_id: string;
  id?: string;
  email?: string;
  full_name: string | null;
  avatar_url?: string | null;
  account_type: string;
  is_verified?: boolean;
  phone?: string;
}

export interface ConversationWithDetails {
  id: string;
  context?: string;
  lastMessage?: Message | null;
  last_message?: string | null;
  otherUser?: User | null;
  unreadCount: number;
  unread_count?: number;
  createdAt: string;
  product?: { id: string; title: string; price: number } | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: MessageType;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
  isMine: boolean;
  isDeleted: boolean;
  readAt?: string | null;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  account_type: string;
  role: string;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount: number;
  createdAt: string;
}

// Chat Message Metadata for Deal Proposals
export interface DealProposalMetadata {
  commission_rate: number;
  min_order_quantity: number;
  expires_at: string;
  product_asin?: string;
  margin_type: "percentage" | "fixed";
  margin_value: number;
  status: "pending" | "accepted" | "rejected" | "expired";
}

// Chat Hook Types
export interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (
    content: string,
    type?: MessageType,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ChatFilters {
  conversationId: string | null;
  context?: string;
  currentUserId: string;
}
