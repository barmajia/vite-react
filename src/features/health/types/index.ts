/**
 * Healthcare Module TypeScript Types
 * Strictly typed interfaces for all health-related data structures
 */

export interface HealthDoctorProfile {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  license_document_url?: string | null;
  consultation_fee: number;
  emergency_fee: number;
  availability_schedule: any[];
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthPatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string | null;
  blood_type?: string | null;
  medical_history: any[];
  total_visits: number;
  last_visit_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthPharmacyProfile {
  id: string;
  user_id: string;
  license_number: string;
  location_address: any;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthAppointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  slot_type: 'regular' | 'emergency';
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_amount?: number | null;
  payment_intent_id?: string | null;
  notes?: string | null;
  prescription_summary?: string | null;
  created_at: string;
  updated_at: string;
  doctor?: HealthDoctorProfile;
  patient?: HealthPatientProfile;
}

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
  message_type: 'text' | 'image' | 'file';
  attachment_url?: string | null;
  created_at: string;
}

export interface HealthPrescription {
  id: string;
  appointment_id: string;
  medicine_name: string;
  dosage_instructions: string;
  duration_days?: number | null;
  is_dispensed: boolean;
  created_at: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface HealthDashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalSpent?: number;
  totalEarned?: number;
}
