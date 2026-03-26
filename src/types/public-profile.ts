// src/types/public-profile.ts
// Comprehensive Public Profile System Types for Aurora E-commerce

import { AvailabilitySchedule, MedicalHistory } from "@/features/health/types";

// All account types from schema
export type AccountType =
  | "user"
  | "customer"
  | "seller"
  | "factory"
  | "middleman"
  | "freelancer"
  | "service_provider"
  | "delivery_driver"
  | "doctor"
  | "patient"
  | "pharmacy"
  | "admin";

// Base profile interface
export interface BaseProfile {
  user_id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  account_type: AccountType;
  is_verified?: boolean;
  created_at?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

// Seller Profile
export interface SellerProfile extends BaseProfile {
  account_type: "seller" | "factory";
  store_name?: string;
  company_name?: string;
  location?: string;
  currency?: string;
  is_verified?: boolean;
  allow_product_chats?: boolean;
  allow_custom_requests?: boolean;
  min_order_quantity?: number;
  wholesale_discount?: number;
  accepts_returns?: boolean;
  production_capacity?: string;
  specialization?: string;
  total_products?: number;
  total_sales?: number;
  average_rating?: number;
  review_count?: number;
  joined_date?: string;
}

// Factory Profile (extends seller)
export interface FactoryProfile extends SellerProfile {
  account_type: "factory";
  company_name: string;
  production_capacity?: string;
  specialization?: string;
  business_license_url?: string;
  capacity_info?: {
    monthly_output?: number;
    output_unit?: "units" | "kg" | "meters" | "liters";
    lead_time_days?: number;
    min_order_quantity?: number;
    max_order_quantity?: number;
    production_lines?: number;
    workers_count?: number;
  };
  factory_connections?: number;
}

// Middle Man Profile
export interface MiddleManProfile extends BaseProfile {
  account_type: "middleman";
  company_name?: string;
  commission_rate?: number;
  total_earnings?: number;
  pending_earnings?: number;
  is_verified?: boolean;
  total_deals?: number;
  successful_deals?: number;
  average_rating?: number;
  review_count?: number;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description?: string;
  image_url?: string;
  images?: string[];
  project_url?: string;
  completed_date?: string;
  category?: string;
  tags?: string[];
}

// Freelancer Profile
export interface FreelancerProfile extends BaseProfile {
  account_type: "freelancer";
  display_name: string;
  tagline?: string;
  biography?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  hourly_rate?: number;
  currency?: string;
  location_country?: string;
  languages?: string[];
  skills?: string[];
  total_jobs_completed?: number;
  total_earnings?: number;
  average_rating?: number;
  review_count?: number;
  is_verified?: boolean;
  is_available?: boolean;
  response_time_hours?: number;
  portfolio_items?: PortfolioItem[];
}

// Service Provider Profile
export interface ServiceProviderProfile extends BaseProfile {
  account_type: "service_provider";
  provider_name: string;
  provider_type: "individual" | "company" | "hospital" | "institution" | "ngo";
  tagline?: string;
  description?: string;
  registration_number?: string;
  tax_id?: string;
  is_verified?: boolean;
  specialties?: string[];
  languages?: string[];
  year_established?: number;
  team_size_range?: string;
  logo_url?: string;
  cover_image_url?: string;
  gallery_images?: string[];
  total_jobs_completed?: number;
  total_earnings?: number;
  average_rating?: number;
  review_count?: number;
  response_time_hours?: number;
  is_available?: boolean;
  website_url?: string;
  phone_public?: string;
  email_public?: string;
}

// Doctor Profile
export interface DoctorProfile extends BaseProfile {
  account_type: "doctor";
  specialization: string;
  license_number: string;
  consultation_fee: number;
  availability_schedule?: AvailabilitySchedule[];
  is_verified?: boolean;
  bio?: string;
  hospital_affiliation?: string;
  years_of_experience?: number;
  education?: string;
  total_appointments?: number;
  average_rating?: number;
  review_count?: number;
  next_available?: string;
}

// Patient Profile (Private - Limited Public Info)
export interface PatientProfile extends BaseProfile {
  account_type: "patient";
  date_of_birth?: string;
  blood_type?: string;
  medical_history?: MedicalHistory;
  age?: number;
  gender?: string;
}

export interface OperatingHours {
  monday?: { open: string; close: string; is_open: boolean };
  tuesday?: { open: string; close: string; is_open: boolean };
  wednesday?: { open: string; close: string; is_open: boolean };
  thursday?: { open: string; close: string; is_open: boolean };
  friday?: { open: string; close: string; is_open: boolean };
  saturday?: { open: string; close: string; is_open: boolean };
  sunday?: { open: string; close: string; is_open: boolean };
  timezone?: string;
  notes?: string;
}

// Pharmacy Profile
export interface PharmacyProfile extends BaseProfile {
  account_type: "pharmacy";
  pharmacy_name: string;
  license_number: string;
  license_document_url?: string;
  license_expiry_date?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  operating_hours?: OperatingHours;
  is_verified?: boolean;
  delivery_available?: boolean;
  delivery_fee?: number;
  min_order_for_delivery?: number;
  bio?: string;
  can_sell_prescription_medicines?: boolean;
  can_sell_controlled_medicines?: boolean;
  total_medicines?: number;
  average_rating?: number;
  review_count?: number;
}

// Delivery Driver Profile
export interface DeliveryDriverProfile extends BaseProfile {
  account_type: "delivery_driver";
  vehicle_type: "motorcycle" | "car" | "bicycle" | "van" | "truck";
  vehicle_number?: string;
  driver_license_url?: string;
  is_verified?: boolean;
  is_active?: boolean;
  rating?: number;
  total_deliveries?: number;
  completed_deliveries?: number;
  cancelled_deliveries?: number;
  commission_rate?: number;
  service_areas?: string[];
}

// Customer/User Profile (Basic)
export interface CustomerProfile extends BaseProfile {
  account_type: "user" | "customer";
  total_orders?: number;
  total_spent?: number;
  member_since?: string;
  reviews_written?: number;
}

// Union type for all profiles
export type PublicProfile =
  | SellerProfile
  | FactoryProfile
  | MiddleManProfile
  | FreelancerProfile
  | ServiceProviderProfile
  | DoctorProfile
  | PatientProfile
  | PharmacyProfile
  | DeliveryDriverProfile
  | CustomerProfile;

// Profile Tab Types
export type ProfileTab =
  | "overview"
  | "products"
  | "services"
  | "reviews"
  | "portfolio"
  | "about"
  | "contact"
  | "appointments"
  | "medicines";

// Profile Props
export interface PublicProfilePageProps {
  userId: string;
  accountType?: AccountType;
  currentUserId?: string;
  className?: string;
}

// Profile Search Types (existing)
export interface ProfileSearchResult {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: string;
  location: string | null;
  is_verified: boolean;
  product_count: number;
  total_revenue: number;
  average_rating: number;
  store_name: string | null;
}

export interface ProfileSearchParams {
  search_term?: string;
  account_type?: "user" | "seller" | "factory" | "middleman";
  location?: string;
  limit?: number;
  offset?: number;
}
