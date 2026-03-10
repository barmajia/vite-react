import type { Database } from '@/types/database';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export interface ConversationWithParticipants {
  id: string;
  user_id: string;
  seller_id: string;
  last_message_at: string | null;
  created_at: string;
  last_message?: string | null;
  participants: Array<{
    user_id: string;
    role: string;
    users: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  }>;
  otherUser?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  unreadCount: number;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
}

export interface CreateConversationInput {
  toUserId: string;
  productId?: string;
}
