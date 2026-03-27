/**
 * Healthcare Module Type Definitions
 *
 * Comprehensive type-safe interfaces for healthcare features
 */

// ==================== Availability & Scheduling ====================

export interface TimeSlot {
  start: string; // "09:00"
  end: string; // "17:00"
  is_available: boolean;
  max_appointments?: number; // Optional capacity limit
}

export interface DailySchedule {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  slots: TimeSlot[];
  is_day_off?: boolean;
}

export type AvailabilitySchedule = DailySchedule[];

export type ConsultationType = "in_clinic" | "online" | "home_visit" | "phone";

// ==================== Doctor Profile ====================

export interface HealthDoctorProfile {
  // Primary Keys
  id: string;
  user_id: string;

  // Professional Information
  specialization: string;
  specialization_id?: string;
  license_number: string;
  license_country?: string;
  license_verified?: boolean;
  license_document_url?: string | null;

  // Experience & Credentials
  years_of_experience?: number | null;
  education?: string[] | null;
  certifications?: string[] | null;
  languages?: string[] | null;

  // Practice Information
  hospital_affiliations?: string[] | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Contact
  phone?: string | null;
  email?: string | null;
  website?: string | null;

  // Consultation Settings
  consultation_types: ConsultationType[];
  consultation_fee: number;
  emergency_fee?: number | null;
  currency?: string;
  follow_up_fee?: number | null;

  // Availability
  availability_schedule: AvailabilitySchedule;
  is_available: boolean;
  advance_booking_days?: number;
  min_appointment_duration?: number;
  max_appointments_per_day?: number;

  // Ratings & Statistics
  rating_avg?: number | null;
  review_count?: number;
  total_appointments?: number;
  response_rate?: number | null;
  response_time_minutes?: number | null;

  // Verification & Status
  is_verified: boolean;
  verification_status: "pending" | "verified" | "rejected";
  verification_notes?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;

  // Profile Content
  bio?: string | null;
  profile_image_url?: string | null;
  cover_image_url?: string | null;

  // Preferences
  accepts_insurance?: boolean;
  accepted_insurances?: string[] | null;
  emergency_availability?: boolean;
  weekend_availability?: boolean;

  // Metadata
  metadata?: Record<string, any> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  last_active_at?: string | null;
}

export interface HealthDoctorProfileWithUser extends HealthDoctorProfile {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    created_at: string;
  } | null;
}

export interface PublicDoctorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  specialization: string;
  license_number: string;
  license_verified: boolean;
  years_of_experience?: number | null;
  languages?: string[] | null;
  location?: string | null;
  consultation_types: ConsultationType[];
  consultation_fee: number;
  emergency_fee?: number | null;
  currency: string;
  rating_avg?: number | null;
  review_count?: number;
  total_appointments?: number;
  is_verified: boolean;
  is_available: boolean;
  bio?: string | null;
  profile_image_url?: string | null;
  hospital_affiliations?: string[] | null;
  accepts_insurance?: boolean;
  accepted_insurances?: string[] | null;
  emergency_availability?: boolean;
  response_rate?: number | null;
  response_time_minutes?: number | null;
}

export interface DoctorSearchFilters {
  specialization?: string;
  location?: string;
  radius_km?: number;
  min_rating?: number;
  consultation_type?: ConsultationType;
  min_fee?: number;
  max_fee?: number;
  language?: string;
  accepts_insurance?: boolean;
  is_available_today?: boolean;
  is_verified_only?: boolean;
  sort_by?: "rating" | "fee_low" | "fee_high" | "distance" | "experience";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  slot_type: "regular" | "emergency";
  duration_minutes: number;
  price: number;
}

export interface DoctorUpcomingAppointment {
  id: string;
  patient_name: string;
  patient_avatar?: string | null;
  scheduled_at: string;
  appointment_type: "regular" | "emergency" | "follow_up";
  slot_type: "in_clinic" | "online" | "home_visit";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
  consultation_fee: number;
}

// ==================== Patient Profile ====================

export interface HealthPatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string | null;
  blood_type?: string | null;
  medical_history?: Record<string, any> | null;
  total_visits?: number;
  last_visit_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthPatientProfileWithUser extends HealthPatientProfile {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

// ==================== Appointments ====================

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface HealthAppointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  slot_type?: "regular" | "emergency";
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  payment_amount?: number | null;
  payment_intent_id?: string | null;
  notes?: string | null;
  prescription_summary?: string | null;
  created_at: string;
  updated_at: string;

  // Relations (optional, from joins)
  doctor?: HealthDoctorProfileWithUser | null;
  patient?: HealthPatientProfileWithUser | null;
}

export interface AppointmentWithDetails extends HealthAppointment {
  doctor_name?: string;
  patient_name?: string;
  doctor_avatar?: string | null;
  patient_avatar?: string | null;
}

// ==================== Prescriptions ====================

export interface HealthPrescription {
  id: string;
  appointment_id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  notes?: string | null;
  is_dispensed?: boolean;
  dispensed_at?: string | null;
  created_at: string;

  // Relations
  appointment?: HealthAppointment | null;
}

// ==================== Health Conversations ====================

export interface HealthConversation {
  id: string;
  appointment_id: string;
  created_at: string;
  updated_at: string;
}

export interface HealthMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file";
  attachment_url?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
}

// ==================== Pharmacy ====================

export interface HealthPharmacyProfile {
  id: string;
  user_id: string;
  license_number: string;
  location_address?: Record<string, any> | null;
  is_verified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operating_hours?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// ==================== Admin & Verification ====================

export interface DoctorVerificationRequest {
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  license_number: string;
  license_document_url?: string | null;
  submitted_at: string;
  status: "pending" | "verified" | "rejected";
  admin_notes?: string | null;
}

// ==================== Statistics & Analytics ====================

export interface DoctorStats {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
  response_rate: number;
  upcoming_appointments: number;
}

export interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  total_spent: number;
  active_prescriptions: number;
  total_prescriptions: number;
}

// ==================== API Response Types ====================

export interface DoctorSearchResponse {
  doctors: PublicDoctorProfile[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface AppointmentAvailabilityResponse {
  doctor_id: string;
  slots: AppointmentSlot[];
  date_range: {
    start: string;
    end: string;
  };
}
