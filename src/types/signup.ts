export type UserRole =
  | "customer"
  | "seller"
  | "factory"
  | "middleman"
  | "delivery";

export interface BaseSignupData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  account_type: UserRole;
}

export type CustomerSignupData = Omit<BaseSignupData, "account_type"> & {
  account_type: "customer";
};

// Minimal payload shape for server-side customer creation (matches public.customers)
export interface CustomerSignupPayload {
  email: string;
  full_name: string;
  phone: string;
}

export interface SellerSignupData extends BaseSignupData {
  account_type: "seller";
  company_name: string;
  location: string;
  currency: string;
  store_name?: string;
}

export interface FactorySignupData extends BaseSignupData {
  account_type: "factory";
  company_name: string;
  location: string;
  currency: string;
  production_capacity?: string;
  min_order_quantity?: number;
  wholesale_discount?: number;
}

export interface MiddlemanSignupData extends BaseSignupData {
  account_type: "middleman";
  company_name: string;
  location: string;
  currency: string;
  commission_rate: number;
  specialization?: string;
  years_of_experience?: number;
  tax_id?: string;
}

export interface DeliverySignupData extends BaseSignupData {
  account_type: "delivery";
  vehicle_type: "motorcycle" | "car" | "bicycle" | "van" | "truck";
  vehicle_number: string;
  location: string;
  currency: string;
  commission_rate: number;
}

export type SignupFormData =
  | CustomerSignupData
  | SellerSignupData
  | FactorySignupData
  | MiddlemanSignupData
  | DeliverySignupData;
