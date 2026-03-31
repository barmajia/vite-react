// ═══════════════════════════════════════════════════════════════════════
// AuroraChat Type Definitions
// Unified chat system supporting all account types
// ═══════════════════════════════════════════════════════════════════════

// Account types from your schema
export type AccountType =
  | "user"
  | "customer"
  | "seller"
  | "admin"
  | "factory"
  | "middleman"
  | "freelancer"
  | "service_provider"
  | "delivery_driver"
  | "doctor"
  | "patient"
  | "pharmacy";

// Chat context for different verticals
export type ChatContext =
  | "general"
  | "ecommerce"
  | "health"
  | "service"
  | "trading"
  | "logistics";

// Message types
export type MessageType =
  | "text"
  | "image"
  | "file"
  | "call_invite"
  | "voice_call"
  | "video_call";

// ═══════════════════════════════════════════════════════════════════════
// Legacy Chat System Types (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════

// User profile from your schema
export interface ChatUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  account_type: AccountType;
  is_online?: boolean;
  is_verified?: boolean;
}

// Message from your schema
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: MessageType;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  is_deleted: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: ChatUser;
}

// Conversation from your schema
export interface Conversation {
  id: string;
  product_id?: string;
  factory_id?: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  is_archived: boolean;
  context?: ChatContext;
  participants?: ChatUser[];
  unread_count?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// New AuroraChat Core Types
// ═══════════════════════════════════════════════════════════════════════

export type ConversationType = "direct" | "group";

/**
 * Core User interface for AuroraChat
 * Simplified user representation
 */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: AccountType;
}

/**
 * Core Conversation interface
 * Works with existing conversations table
 */
export interface AuroraConversation {
  id: string;
  name: string;
  type: ConversationType;
  created_at: string;
  updated_at: string;
}

/**
 * Conversation Participant
 * Links users to conversations with their account type
 * Matches schema: conversation_participants table
 */
export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  account_type: AccountType;
}

/**
 * Conversation with full participant information
 */
export interface ConversationWithParticipants extends AuroraConversation {
  participants: ConversationParticipant[];
}

/**
 * Result of starting a conversation
 */
export interface StartConversationResult {
  success: boolean;
  conversation: ConversationWithParticipants | null;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Legacy Trading/Health/Services Types (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════

export interface CustomRequestDetails {
  product_type?: string;
  specifications?: {
    material?: string;
    color?: string;
    size?: string;
    quantity?: number;
    custom_features?: string[];
  };
  target_price?: number;
  deadline?: string;
  description?: string;
  reference_images?: string[];
  notes?: string;
}

// Trading Conversation
export interface TradingConversation {
  id: string;
  conversation_type:
    | "product_inquiry"
    | "custom_request"
    | "deal_negotiation"
    | "factory_order";
  product_id?: string;
  deal_id?: string;
  initiator_id: string;
  receiver_id: string;
  initiator_role: AccountType;
  receiver_role: AccountType;
  is_custom_request: boolean;
  custom_request_details?: CustomRequestDetails;
  factory_id?: string;
  middleman_id?: string;
  last_message?: string;
  last_message_at?: string;
  is_archived: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

// Health Conversation
export interface HealthConversation {
  id: string;
  appointment_id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
}

// Services Conversation
export interface ServicesConversation {
  id: string;
  provider_id: string;
  client_id: string;
  listing_id: string;
  last_message?: string;
  last_message_at?: string;
  is_archived: boolean;
  is_read_by_provider: boolean;
  is_read_by_client: boolean;
  created_at: string;
  updated_at: string;
}

// Conversation Participant from your schema
// Matches: conversation_participants table with additional fields
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  account_type: AccountType;
  last_read_message_id?: string;
  is_muted: boolean;
  user?: ChatUser;
}

// Call types for voice/video
export interface CallSession {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: "voice" | "video";
  status: "ringing" | "connected" | "ended" | "missed";
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

// ChatBox Props
export interface ChatBoxProps {
  currentUserId: string;
  targetUserId?: string; // For direct 1-on-1 chat
  conversationId?: string; // For existing conversation
  context?: ChatContext;
  productId?: string;
  appointmentId?: string;
  listingId?: string;
  onClose?: () => void;
  className?: string;
}

// Account type configuration for UI
export interface AccountTypeConfig {
  label: string;
  icon: string;
  color: string;
  badgeColor: string;
}

// Conversation List Item
export interface ConversationListItem {
  id: string;
  context: ChatContext;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  other_user?: ChatUser;
  product?: { title: string; image?: string } | null;
  appointment?: { scheduled_at: string; status: string } | null;
  listing?: { title: string } | null;
}
