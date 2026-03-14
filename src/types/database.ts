/**
 * Aurora E-commerce Database Types
 * Generated from Supabase schema for customer-facing application
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ==================== User Types ====================
export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// ==================== Product Types ====================
export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  quantity: number;
  images: Json; // Array of image URLs
  category: string | null;
  seller_id: string;
  title_description: string | null; // tsvector for search
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  average_rating?: number;
  review_count?: number;
  seller_name?: string;
}

// ==================== Cart Types ====================
export interface CartItem {
  id: string;
  user_id: string;
  asin: string; // Product ID
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

// ==================== Order Types ====================
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type ProductionStatus =
  | 'pending'
  | 'in_production'
  | 'quality_check'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  seller_id: string | null;
  status: OrderStatus;
  production_status: ProductionStatus | null;
  production_started_at: string | null;
  production_completed_at: string | null;
  quality_check_passed: boolean | null;
  total: number;
  payment_status: PaymentStatus;
  shipping_address_snapshot: Json;
  deal_id: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  title: string;
  image_url: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// ==================== Address Types ====================
export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Review Types ====================
export interface Review {
  id: string;
  user_id: string;
  asin: string; // Product ID
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

// ==================== Conversation & Message Types ====================
export type ConversationType = 'general' | 'deal_negotiation' | 'order_support';

export interface Conversation {
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
  seller?: UserProfile;
}

export type MessageType = 'text' | 'image' | 'file';
export type MessageSubtype = 'text' | 'deal_proposal' | 'deal_counter' | 'deal_accepted' | 'deal_rejected' | 'file' | 'image';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  message_subtype: MessageSubtype;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
}

export interface ConversationDeal {
  id: string;
  conversation_id: string;
  deal_id: string | null;
  proposer_id: string;
  recipient_id: string;
  proposal_data: Json;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactoryConnection {
  id: string;
  factory_id: string | null;
  seller_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requested_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactoryRating {
  id: string;
  factory_id: string | null;
  seller_id: string | null;
  rating: number | null;
  review: string | null;
  delivery_rating: number | null;
  quality_rating: number | null;
  communication_rating: number | null;
  created_at: string;
}

export interface Deal {
  id: string;
  middleman_id: string;
  party_a_id: string;
  party_b_id: string;
  product_id: string | null;
  commission_rate: number | null;
  status: 'active' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// ==================== Category Types ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithProducts extends Category {
  product_count?: number;
}

// ==================== Notification Types ====================
export type NotificationType = 'order_update' | 'message' | 'promotion' | 'review' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType | null;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Partial<Record<NotificationType, number>>;
}

// ==================== Database Schema Type ====================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      cart: {
        Row: CartItem;
        Insert: Omit<CartItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CartItem, 'id' | 'created_at' | 'updated_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
      shipping_addresses: {
        Row: ShippingAddress;
        Insert: Omit<ShippingAddress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShippingAddress, 'id' | 'created_at' | 'updated_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at' | 'updated_at'>>;
      };
      conversation_deals: {
        Row: ConversationDeal;
        Insert: Omit<ConversationDeal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ConversationDeal, 'id' | 'created_at' | 'updated_at'>>;
      };
      factory_connections: {
        Row: FactoryConnection;
        Insert: Omit<FactoryConnection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FactoryConnection, 'id' | 'created_at' | 'updated_at'>>;
      };
      factory_ratings: {
        Row: FactoryRating;
        Insert: Omit<FactoryRating, 'id' | 'created_at'>;
        Update: Partial<Omit<FactoryRating, 'id' | 'created_at'>>;
      };
      deals: {
        Row: Deal;
        Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Omit<{ id: string; user_id: string; product_id: string; created_at: string }, 'id' | 'created_at'>;
        Update: Partial<Omit<{ id: string; user_id: string; product_id: string; created_at: string }, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
