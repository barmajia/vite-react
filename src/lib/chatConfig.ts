import { AccountType, AccountTypeConfig } from '../types/chat';

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, AccountTypeConfig> = {
  user: { label: 'Customer', icon: 'User', color: 'bg-blue-500', badgeColor: 'text-blue-600' },
  customer: { label: 'Customer', icon: 'User', color: 'bg-blue-500', badgeColor: 'text-blue-600' },
  seller: { label: 'Seller', icon: 'Store', color: 'bg-green-500', badgeColor: 'text-green-600' },
  admin: { label: 'Admin', icon: 'Shield', color: 'bg-red-500', badgeColor: 'text-red-600' },
  factory: { label: 'Factory', icon: 'Factory', color: 'bg-orange-500', badgeColor: 'text-orange-600' },
  middleman: { label: 'Broker', icon: 'Handshake', color: 'bg-purple-500', badgeColor: 'text-purple-600' },
  freelancer: { label: 'Freelancer', icon: 'Laptop', color: 'bg-indigo-500', badgeColor: 'text-indigo-600' },
  service_provider: { label: 'Provider', icon: 'Briefcase', color: 'bg-teal-500', badgeColor: 'text-teal-600' },
  delivery_driver: { label: 'Driver', icon: 'Truck', color: 'bg-yellow-500', badgeColor: 'text-yellow-600' },
  doctor: { label: 'Doctor', icon: 'Stethoscope', color: 'bg-red-600', badgeColor: 'text-red-700' },
  patient: { label: 'Patient', icon: 'Heart', color: 'bg-pink-500', badgeColor: 'text-pink-600' },
  pharmacy: { label: 'Pharmacy', icon: 'Pill', color: 'bg-emerald-500', badgeColor: 'text-emerald-600' },
};

export const CONTEXT_LABELS: Record<string, string> = {
  general: 'General Chat',
  ecommerce: 'Product Inquiry',
  health: 'Health Consultation',
  service: 'Service Request',
  trading: 'Trade Discussion',
  logistics: 'Delivery Coordination',
};
