// Core trading account types
export type TradingAccountType = 'user' | 'customer' | 'seller' | 'factory' | 'middleman';

// Chat context for trading vertical
export type TradingChatContext = 
  | 'product_inquiry'
  | 'custom_request'
  | 'wholesale'
  | 'manufacturing'
  | 'brokerage'
  | 'general';

// Conversation type (from trading_conversations table)
export type TradingConversationType = 
  | 'product_inquiry'
  | 'custom_request'
  | 'deal_negotiation'
  | 'factory_order';

// Message types
export type TradingMessageType = 
  | 'text'
  | 'image'
  | 'file'
  | 'product_share'
  | 'deal_offer'
  | 'quote_request'
  | 'call_invite';

// Trading User Profile
export interface TradingUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  account_type: TradingAccountType;
  is_verified?: boolean;
  
  // Seller-specific
  store_name?: string;
  location?: string;
  allow_product_chats?: boolean;
  
  // Factory-specific
  company_name?: string;
  production_capacity?: string;
  specialization?: string;
  
  // Middle Man-specific
  commission_rate?: number;
  total_earnings?: number;
}

// Product with chat permission
export interface ProductWithChatPermission {
  id: string;
  asin: string;
  title: string;
  price: number;
  seller_id: string;
  allow_chat: boolean;
  images?: string[];
}

// Trading Message
export interface TradingMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: TradingMessageType;
  attachment_url?: string;
  attachment_name?: string;
  product_id?: string;
  deal_id?: string;
  is_deleted: boolean;
  read_at?: string;
  created_at: string;
  sender?: TradingUser;
}

// Trading Conversation (from trading_conversations table)
export interface TradingConversation {
  id: string;
  conversation_type?: TradingConversationType;
  product_id?: string;
  deal_id?: string;
  factory_id?: string;
  middleman_id?: string;
  initiator_id: string;
  receiver_id: string;
  initiator_role: TradingAccountType;
  receiver_role: TradingAccountType;
  is_custom_request: boolean;
  custom_request_details?: any;
  last_message?: string;
  last_message_at?: string;
  is_archived: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  participants?: TradingUser[];
  product?: ProductWithChatPermission;
}

// Conversation Participant
export interface TradingParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: TradingAccountType;
  last_read_message_id?: string;
  is_muted: boolean;
  joined_at: string;
  user?: TradingUser;
}

// Chat Permission Check Result
export interface ChatPermissionResult {
  allowed: boolean;
  reason?: string;
  requiresProductPermission?: boolean;
  productAllowsChat?: boolean;
}

// Trading Chat Props
export interface TradingChatBoxProps {
  currentUserId: string;
  currentUserType: TradingAccountType;
  targetUserId?: string;
  targetUserType?: TradingAccountType;
  conversationId?: string;
  productId?: string;
  dealId?: string;
  context?: TradingChatContext;
  onClose?: () => void;
  className?: string;
}
