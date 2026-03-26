// Chat System Types for Aurora E-commerce Platform
// Supports: General, Trading, Health, Services, and Product conversations

export type ConversationContext = 'general' | 'trading' | 'health' | 'services' | 'product';

export type MessageType = 'text' | 'image' | 'file' | 'system_notification';

export type ParticipantRole = 
  | 'customer'
  | 'seller'
  | 'factory'
  | 'middleman'
  | 'admin'
  | 'freelancer'
  | 'service_provider'
  | 'delivery_driver'
  | 'doctor'
  | 'patient'
  | 'pharmacy';

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

export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  last_read_message_id?: string;
  is_muted: boolean;
  joined_at: string;
  user?: ChatUser;
}

export interface ProductInfo {
  id: string;
  title: string;
  price: number | null;
  images?: string[];
  status?: string;
}

export interface AppointmentInfo {
  id: string;
  scheduled_at: string;
  status: string;
  doctor_id?: string;
  patient_id?: string;
}

export interface ListingInfo {
  id: string;
  title: string;
  price?: number | null;
}

export interface Conversation {
  id: string;
  context: ConversationContext;
  product_id?: string;
  factory_id?: string;
  appointment_id?: string;
  listing_id?: string;
  deal_id?: string;
  conversation_type?: string;
  last_message?: string;
  last_message_at?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  
  // General/Product conversations
  participants?: Participant[];
  products?: ProductInfo[];
  
  // Trading conversations
  initiator_id?: string;
  receiver_id?: string;
  initiator_role?: string;
  receiver_role?: string;
  
  // Health conversations
  doctor_id?: string;
  patient_id?: string;
  
  // Services conversations
  provider_id?: string;
  client_id?: string;
  is_read_by_provider?: boolean;
  is_read_by_client?: boolean;
  service_listings?: ListingInfo;
}

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

export interface ConversationListItem {
  id: string;
  context: ConversationContext;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  other_user?: ChatUser;
  product?: ProductInfo | null;
  appointment?: AppointmentInfo | null;
  listing?: ListingInfo | null;
  is_archived?: boolean;
}

export interface ChatState {
  conversations: ConversationListItem[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
}

export interface ChatPermissions {
  canSend: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canBlock: boolean;
  reason?: string;
}
