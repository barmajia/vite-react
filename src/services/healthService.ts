import { supabase } from "@/lib/supabase";

/**
 * Health Module Service
 * Handles all health-related backend operations via Supabase RPC functions
 */

// =====================================================
// TYPES
// =====================================================

export interface DoctorProfile {
  doctor_id: string;
  user_id: string;
  full_name: string;
  specialty: string;
  rating: number;
  experience_years: number;
  is_verified: boolean;
  verified_at: string;
  consultation_fee: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  reason: string;
  appointment_type: string;
  status: string;
  created_at: string;
}

export interface Medicine {
  medicine_id: string;
  medicine_name: string;
  generic_name: string;
  category: string;
  manufacturer: string;
  price: number;
  stock_quantity: number;
  requires_prescription: boolean;
  availability_status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface MedicineOrder {
  success: boolean;
  message: string;
  order_id: string;
  total_amount: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  accessed_at: string;
  notes: string;
  accessed_by: string;
}

export interface ConsentForm {
  success: boolean;
  message: string;
  consent_id: string;
  submitted_at: string;
}

export interface DataExport {
  success: boolean;
  message: string;
  export_id: string;
  export_url: string;
  exported_at: string;
}

// =====================================================
// DOCTOR VERIFICATION
// =====================================================

export async function verifyDoctor(
  doctorId: string,
  notes?: string,
): Promise<{
  success: boolean;
  message: string;
  doctor_id: string;
  is_verified: boolean;
  verified_at: string;
}> {
  try {
    const { data, error } = await supabase.rpc("verify_doctor", {
      p_doctor_id: doctorId,
      p_notes: notes || null,
    });

    if (error) {
      throw error;
    }

    return (
      data[0] || {
        success: false,
        message: "Failed to verify doctor",
        doctor_id: doctorId,
        is_verified: false,
        verified_at: null,
      }
    );
  } catch (error) {
    console.error("Error verifying doctor:", error);
    throw error;
  }
}

// =====================================================
// APPOINTMENTS
// =====================================================

export async function scheduleAppointment(
  patientId: string,
  doctorId: string,
  appointmentDate: Date,
  reason: string,
  appointmentType: string = "consultation",
): Promise<{
  success: boolean;
  message: string;
  appointment_id: string;
  scheduled_at: string;
}> {
  try {
    const { data, error } = await supabase.rpc("schedule_appointment", {
      p_patient_id: patientId,
      p_doctor_id: doctorId,
      p_appointment_date: appointmentDate.toISOString(),
      p_reason: reason,
      p_appointment_type: appointmentType,
    });

    if (error) {
      throw error;
    }

    return (
      data[0] || {
        success: false,
        message: "Failed to schedule appointment",
        appointment_id: null,
        scheduled_at: null,
      }
    );
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    throw error;
  }
}

// =====================================================
// CONSENT FORMS
// =====================================================

export async function submitConsentForm(
  patientId: string,
  consentType: string,
  consentData: Record<string, any>,
  signatureUrl: string,
): Promise<ConsentForm> {
  try {
    const { data, error } = await supabase.rpc("submit_consent_form", {
      p_patient_id: patientId,
      p_consent_type: consentType,
      p_consent_data: consentData,
      p_signature_url: signatureUrl,
    });

    if (error) {
      throw error;
    }

    return (
      data[0] || {
        success: false,
        message: "Failed to submit consent form",
        consent_id: null,
        submitted_at: null,
      }
    );
  } catch (error) {
    console.error("Error submitting consent form:", error);
    throw error;
  }
}

// =====================================================
// DATA EXPORT
// =====================================================

export async function exportPatientHealthData(
  patientId: string,
  exportFormat: "json" | "pdf" | "csv" = "json",
): Promise<DataExport> {
  try {
    const { data, error } = await supabase.rpc("export_patient_health_data", {
      p_patient_id: patientId,
      p_export_format: exportFormat,
    });

    if (error) {
      throw error;
    }

    return (
      data[0] || {
        success: false,
        message: "Failed to export health data",
        export_id: null,
        export_url: null,
        exported_at: null,
      }
    );
  } catch (error) {
    console.error("Error exporting health data:", error);
    throw error;
  }
}

// =====================================================
// AUDIT LOGS
// =====================================================

export async function getHealthAuditLogs(
  userId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase.rpc("get_health_audit_logs", {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

// =====================================================
// DOCTOR DISCOVERY
// =====================================================

export async function getVerifiedDoctors(
  specialty?: string,
  limit: number = 50,
  offset: number = 0,
): Promise<DoctorProfile[]> {
  try {
    const { data, error } = await supabase.rpc("get_verified_doctors", {
      p_specialty: specialty || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }
}

// =====================================================
// PHARMACY
// =====================================================

export async function getPharmacyMedicines(
  search?: string,
  categoryId?: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Medicine[]> {
  try {
    const { data, error } = await supabase.rpc("get_pharmacy_medicines", {
      p_search: search || null,
      p_category_id: categoryId || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return [];
  }
}

// =====================================================
// MEDICINE ORDERS
// =====================================================

export async function createMedicineOrder(
  userId: string,
  items: Array<{
    medicine_id: string;
    quantity: number;
    requires_prescription?: boolean;
  }>,
  deliveryAddress: Record<string, any>,
): Promise<MedicineOrder> {
  try {
    const { data, error } = await supabase.rpc("create_medicine_order", {
      p_user_id: userId,
      p_items: items,
      p_delivery_address: deliveryAddress,
    });

    if (error) {
      throw error;
    }

    return (
      data[0] || {
        success: false,
        message: "Failed to create medicine order",
        order_id: null,
        total_amount: 0,
        created_at: null,
      }
    );
  } catch (error) {
    console.error("Error creating medicine order:", error);
    throw error;
  }
}

// =====================================================
// DOCTOR PROFILE OPERATIONS (Direct DB)
// =====================================================

export async function getDoctorProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("health_doctor_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return null;
  }
}

export async function updateDoctorProfile(
  userId: string,
  updates: Partial<{
    full_name: string;
    specialty: string;
    bio: string;
    experience_years: number;
    consultation_fee: number;
    avg_rating: number;
  }>,
) {
  try {
    const { data, error } = await supabase
      .from("health_doctor_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    throw error;
  }
}

// =====================================================
// PATIENT APPOINTMENTS (Direct DB)
// =====================================================

export async function getPatientAppointments(
  patientId: string,
  status?: string,
) {
  try {
    let query = supabase
      .from("health_appointments")
      .select(
        `
        *,
        doctor:doctor_id(
          id,
          full_name,
          specialty,
          consultation_fee
        )
      `,
      )
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
}

export async function getDoctorAppointments(doctorId: string, status?: string) {
  try {
    let query = supabase
      .from("health_appointments")
      .select(
        `
        *,
        patient:patient_id(
          id,
          email,
          full_name
        )
      `,
      )
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "scheduled" | "completed" | "cancelled" | "no-show",
) {
  try {
    const { data, error } = await supabase
      .from("health_appointments")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
}

// =====================================================
// PATIENT MEDICAL RECORDS
// =====================================================

export async function getPatientMedicines(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("health_medicines")
      .select("*")
      .eq("user_id", patientId)
      .order("prescribed_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching patient medicines:", error);
    return [];
  }
}

export async function getPatientMedicineOrders(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("health_medicine_orders")
      .select(
        `
        *,
        items:health_medicine_order_items(
          *,
          medicine:Medicine_id(
            medicine_name,
            generic_name,
            manufacturer
          )
        )
      `,
      )
      .eq("user_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching medicine orders:", error);
    return [];
  }
}

// =====================================================
// APPOINTMENTS WITH NOTIFICATIONS
// =====================================================

export function subscribeToAppointmentChanges(
  patientId: string,
  callback: (appointment: Appointment) => void,
) {
  return supabase
    .from("health_appointments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "health_appointments",
        filter: `patient_id=eq.${patientId}`,
      },
      (payload) => {
        callback(payload.new);
      },
    )
    .subscribe();
}

// =====================================================
// CONSULTATION ROOMS (WebRTC Setup)
// =====================================================

export async function initializeConsultationRoom(
  appointmentId: string,
  rtcConfig?: RTCConfiguration,
) {
  try {
    // Update appointment status to 'in_progress'
    const { data, error } = await supabase
      .from("health_appointments")
      .update({
        status: "in_progress",
        consultation_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      appointment: data,
      rtcConfig: rtcConfig || {
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
        ],
      },
    };
  } catch (error) {
    console.error("Error initializing consultation room:", error);
    throw error;
  }
}

export async function endConsultationRoom(
  appointmentId: string,
  notes?: string,
) {
  try {
    const { data, error } = await supabase
      .from("health_appointments")
      .update({
        status: "completed",
        consultation_ended_at: new Date().toISOString(),
        consultation_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error ending consultation room:", error);
    throw error;
  }
}

// =====================================================
// EMERGENCY CALLS
// =====================================================

export async function createEmergencyCall(
  userId: string,
  location: { latitude: number; longitude: number },
  emergencyType: string,
) {
  try {
    const { data, error } = await supabase
      .from("calls")
      .insert({
        caller_id: userId,
        emergency_type: emergencyType,
        location: `POINT(${location.longitude} ${location.latitude})`,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating emergency call:", error);
    throw error;
  }
}

export default {
  verifyDoctor,
  scheduleAppointment,
  submitConsentForm,
  exportPatientHealthData,
  getHealthAuditLogs,
  getVerifiedDoctors,
  getPharmacyMedicines,
  createMedicineOrder,
  getDoctorProfile,
  updateDoctorProfile,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getPatientMedicines,
  getPatientMedicineOrders,
  subscribeToAppointmentChanges,
  initializeConsultationRoom,
  endConsultationRoom,
  createEmergencyCall,
};
