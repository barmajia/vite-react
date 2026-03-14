import type { Database, ConversationType, MessageType, MessageSubtype } from '@/types/database';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type ConversationDeal = Database['public']['Tables']['conversation_deals']['Row'];

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
