import { TradingAccountType } from '../types/trading-chat';

export interface TradingAccountConfig {
  label: string;
  icon: string;
  color: string;
  badgeColor: string;
  description: string;
  canInitiateProductChat: boolean;
  requiresProductPermission: boolean;
}

export const TRADING_ACCOUNT_CONFIG: Record<TradingAccountType, TradingAccountConfig> = {
  user: {
    label: 'Customer',
    icon: 'User',
    color: 'bg-blue-500',
    badgeColor: 'text-blue-600',
    description: 'Product buyer',
    canInitiateProductChat: true,
    requiresProductPermission: true, // Must check products.allow_chat
  },
  customer: {
    label: 'Customer',
    icon: 'User',
    color: 'bg-blue-500',
    badgeColor: 'text-blue-600',
    description: 'Product buyer',
    canInitiateProductChat: true,
    requiresProductPermission: true,
  },
  seller: {
    label: 'Seller',
    icon: 'Store',
    color: 'bg-green-500',
    badgeColor: 'text-green-600',
    description: 'Product merchant',
    canInitiateProductChat: true,
    requiresProductPermission: false, // Controls the permission
  },
  factory: {
    label: 'Factory',
    icon: 'Factory',
    color: 'bg-orange-500',
    badgeColor: 'text-orange-600',
    description: 'Manufacturing partner',
    canInitiateProductChat: true,
    requiresProductPermission: false, // B2B always allowed
  },
  middleman: {
    label: 'Middle Man',
    icon: 'Handshake',
    color: 'bg-purple-500',
    badgeColor: 'text-purple-600',
    description: 'Broker/Commission agent',
    canInitiateProductChat: true,
    requiresProductPermission: false, // B2B always allowed
  },
};

// Allowed conversation flows (who can chat with whom)
export const ALLOWED_CONVERSATION_FLOWS: Record<TradingAccountType, TradingAccountType[]> = {
  user: ['seller', 'factory', 'middleman'],
  customer: ['seller', 'factory', 'middleman'],
  seller: ['user', 'customer', 'factory', 'middleman'],
  factory: ['user', 'customer', 'seller', 'middleman'],
  middleman: ['user', 'customer', 'seller', 'factory'],
};

// Conversation type labels
export const CONVERSATION_TYPE_LABELS: Record<string, string> = {
  product_inquiry: 'Product Inquiry',
  custom_request: 'Custom Request',
  deal_negotiation: 'Deal Negotiation',
  factory_order: 'Factory Order',
  wholesale: 'Wholesale Order',
  manufacturing: 'Manufacturing Request',
  brokerage: 'Brokerage Deal',
  general: 'General Chat',
};
