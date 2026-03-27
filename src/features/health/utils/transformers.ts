/**
 * Healthcare Data Transformers
 * 
 * Transform database rows to type-safe interfaces
 */

import type {
  HealthDoctorProfile,
  DailySchedule,
  TimeSlot,
  PublicDoctorProfile,
  HealthPatientProfile,
  HealthAppointment,
  AppointmentSlot,
} from "../types";

/**
 * Transform Supabase row to HealthDoctorProfile
 */
export function transformDoctorProfile(row: any): HealthDoctorProfile {
  return {
    // Core fields
    id: row.id,
    user_id: row.user_id,
    specialization: row.specialization,
    license_number: row.license_number,
    license_country: row.license_country,
    license_verified: row.license_verified,
    license_document_url: row.license_document_url,
    
    // Experience
    years_of_experience: row.years_of_experience,
    education: row.education || [],
    certifications: row.certifications || [],
    languages: row.languages || [],
    
    // Practice
    hospital_affiliations: row.hospital_affiliations || [],
    clinic_name: row.clinic_name,
    clinic_address: row.clinic_address,
    location: row.location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    
    // Contact
    phone: row.phone,
    email: row.email,
    website: row.website,
    
    // Consultation
    consultation_types: row.consultation_types || ["in_clinic"],
    consultation_fee: parseFloat(row.consultation_fee) || 0,
    emergency_fee: row.emergency_fee ? parseFloat(row.emergency_fee) : null,
    currency: row.currency || "USD",
    follow_up_fee: row.follow_up_fee ? parseFloat(row.follow_up_fee) : null,
    
    // Availability - parse JSONB
    availability_schedule: parseAvailabilitySchedule(row.availability_schedule),
    is_available: row.is_available ?? true,
    advance_booking_days: row.advance_booking_days || 7,
    min_appointment_duration: row.min_appointment_duration || 30,
    max_appointments_per_day: row.max_appointments_per_day,
    
    // Stats
    rating_avg: row.rating_avg ? parseFloat(row.rating_avg) : null,
    review_count: row.review_count || 0,
    total_appointments: row.total_appointments || 0,
    response_rate: row.response_rate ? parseFloat(row.response_rate) : null,
    response_time_minutes: row.response_time_minutes,
    
    // Verification
    is_verified: row.is_verified ?? false,
    verification_status: row.verification_status || "pending",
    verification_notes: row.verification_notes,
    verified_at: row.verified_at,
    verified_by: row.verified_by,
    
    // Profile
    bio: row.bio,
    profile_image_url: row.profile_image_url,
    cover_image_url: row.cover_image_url,
    
    // Preferences
    accepts_insurance: row.accepts_insurance ?? false,
    accepted_insurances: row.accepted_insurances || [],
    emergency_availability: row.emergency_availability ?? false,
    weekend_availability: row.weekend_availability ?? false,
    
    // Metadata
    metadata: row.metadata,
    
    // Timestamps
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_active_at: row.last_active_at,
  };
}

/**
 * Parse availability_schedule JSONB with validation
 */
function parseAvailabilitySchedule(json: any): DailySchedule[] {
  if (!json || !Array.isArray(json)) return getDefaultAvailability();
  
  const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  
  return json
    .filter((day: any) => validDays.includes(day.day))
    .map((day: any): DailySchedule => ({
      day: day.day,
      is_day_off: day.is_day_off ?? false,
      slots: Array.isArray(day.slots) 
        ? day.slots.map((slot: any): TimeSlot => ({
            start: slot.start || "09:00",
            end: slot.end || "17:00",
            is_available: slot.is_available ?? true,
            max_appointments: slot.max_appointments,
          }))
        : [{ start: "09:00", end: "17:00", is_available: true }],
    }));
}

/**
 * Default availability: Mon-Fri 9AM-5PM
 */
function getDefaultAvailability(): DailySchedule[] {
  const days: DailySchedule["day"][] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  return days.map(day => ({
    day,
    slots: [{ start: "09:00", end: "17:00", is_available: true }],
  }));
}

/**
 * Create public-facing profile (sanitize sensitive data)
 */
export function toPublicProfile(
  profile: HealthDoctorProfile,
  user?: { full_name: string | null; avatar_url: string | null }
): PublicDoctorProfile {
  return {
    id: profile.id,
    user_id: profile.user_id,
    full_name: user?.full_name || null,
    avatar_url: user?.avatar_url || profile.profile_image_url || null,
    specialization: profile.specialization,
    license_number: maskLicenseNumber(profile.license_number),
    license_verified: profile.license_verified ?? false,
    years_of_experience: profile.years_of_experience,
    languages: profile.languages,
    location: profile.location,
    consultation_types: profile.consultation_types,
    consultation_fee: profile.consultation_fee,
    emergency_fee: profile.emergency_fee,
    currency: profile.currency || "USD",
    rating_avg: profile.rating_avg,
    review_count: profile.review_count,
    total_appointments: profile.total_appointments,
    is_verified: profile.is_verified,
    is_available: profile.is_available,
    bio: profile.bio,
    profile_image_url: profile.profile_image_url,
    hospital_affiliations: profile.hospital_affiliations,
    accepts_insurance: profile.accepts_insurance,
    accepted_insurances: profile.accepted_insurances,
    emergency_availability: profile.emergency_availability,
    response_rate: profile.response_rate,
    response_time_minutes: profile.response_time_minutes,
  };
}

/**
 * Mask license number for public display
 */
function maskLicenseNumber(license: string): string {
  if (!license) return "";
  const last4 = license.slice(-4);
  return `${license.slice(0, 3)}-****${last4}`;
}

/**
 * Transform patient profile row
 */
export function transformPatientProfile(row: any): HealthPatientProfile {
  return {
    id: row.id,
    user_id: row.user_id,
    date_of_birth: row.date_of_birth,
    blood_type: row.blood_type,
    medical_history: row.medical_history,
    total_visits: row.total_visits || 0,
    last_visit_date: row.last_visit_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Transform appointment row
 */
export function transformAppointment(row: any): HealthAppointment {
  return {
    id: row.id,
    doctor_id: row.doctor_id,
    patient_id: row.patient_id,
    scheduled_at: row.scheduled_at,
    duration_minutes: row.duration_minutes,
    slot_type: row.slot_type || "regular",
    status: row.status || "pending",
    payment_status: row.payment_status || "pending",
    payment_amount: row.payment_amount ? parseFloat(row.payment_amount) : null,
    payment_intent_id: row.payment_intent_id,
    notes: row.notes,
    prescription_summary: row.prescription_summary,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Generate available appointment slots from doctor's schedule
 */
export function generateAvailableSlots(
  schedule: DailySchedule[],
  startDate: Date,
  daysToShow: number = 7
): AppointmentSlot[] {
  const slots: AppointmentSlot[] = [];
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const dayName = dayNames[date.getDay()];
    const daySchedule = schedule.find(d => d.day === dayName);
    
    if (!daySchedule || daySchedule.is_day_off) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    daySchedule.slots.forEach(slot => {
      if (!slot.is_available) return;
      
      // Generate 30-minute intervals
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMin, 0, 0);
      
      while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().slice(0, 5);
        
        slots.push({
          date: dateStr,
          time: timeStr,
          available: true,
          slot_type: "regular",
          duration_minutes: 30,
          price: 0, // Will be set from doctor's fee
        });
        
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
    });
  }
  
  return slots;
}

/**
 * Calculate doctor's overall statistics
 */
export function calculateDoctorStats(
  appointments: HealthAppointment[],
  rating_avg: number | null,
  review_count: number
) {
  const completed = appointments.filter(a => a.status === "completed").length;
  const cancelled = appointments.filter(a => a.status === "cancelled").length;
  const upcoming = appointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && 
    !["cancelled", "completed"].includes(a.status)
  ).length;
  
  const total_revenue = appointments
    .filter(a => a.status === "completed" && a.payment_status === "paid")
    .reduce((sum, a) => sum + (a.payment_amount || 0), 0);
  
  return {
    total_appointments: appointments.length,
    completed_appointments: completed,
    cancelled_appointments: cancelled,
    total_revenue,
    average_rating: rating_avg || 0,
    total_reviews: review_count,
    upcoming_appointments: upcoming,
    response_rate: 0, // Would need message data
  };
}
