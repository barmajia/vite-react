// Chat & Message Types
import type { Database } from "@/lib/database.types";

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageType = Message["message_type"];

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
