/**
 * Supabase Health Client
 * Typed helper functions for healthcare module interactions
 */

import { createClient } from '@supabase/supabase-js';
import type {
  HealthDoctorProfile,
  HealthPatientProfile,
  HealthAppointment,
  HealthMessage,
  HealthPrescription,
  HealthConversation,
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseHealth = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Doctors API
// ============================================

export const getVerifiedDoctors = async (): Promise<HealthDoctorProfile[]> => {
  const { data, error } = await supabaseHealth
    .from('health_doctor_profiles')
    .select('*')
    .eq('is_verified', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as HealthDoctorProfile[];
};

export const getDoctorById = async (id: string): Promise<HealthDoctorProfile> => {
  const { data, error } = await supabaseHealth
    .from('health_doctor_profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as HealthDoctorProfile;
};

export const getPendingDoctors = async (): Promise<HealthDoctorProfile[]> => {
  const { data, error } = await supabaseHealth
    .from('health_doctor_profiles')
    .select('*')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as HealthDoctorProfile[];
};

export const verifyDoctor = async (
  doctorId: string,
  isApproved: boolean
): Promise<HealthDoctorProfile> => {
  const { data, error } = await supabaseHealth
    .from('health_doctor_profiles')
    .update({
      is_verified: isApproved,
      verification_status: isApproved ? 'verified' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', doctorId)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthDoctorProfile;
};

export const createDoctorProfile = async (
  profile: Partial<HealthDoctorProfile>
): Promise<HealthDoctorProfile> => {
  const { data, error } = await supabaseHealth
    .from('health_doctor_profiles')
    .insert(profile)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthDoctorProfile;
};

export const updateDoctorProfile = async (
  doctorId: string,
  updates: Partial<HealthDoctorProfile>
): Promise<HealthDoctorProfile> => {
  const { data, error } = await supabaseHealth
    .from('health_doctor_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', doctorId)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthDoctorProfile;
};

// ============================================
// Patients API
// ============================================

export const getPatientProfile = async (
  userId: string
): Promise<HealthPatientProfile | null> => {
  const { data, error } = await supabaseHealth
    .from('health_patient_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data as HealthPatientProfile | null;
};

export const createPatientProfile = async (
  profile: Partial<HealthPatientProfile>
): Promise<HealthPatientProfile> => {
  const { data, error } = await supabaseHealth
    .from('health_patient_profiles')
    .insert(profile)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthPatientProfile;
};

export const updatePatientProfile = async (
  patientId: string,
  updates: Partial<HealthPatientProfile>
): Promise<HealthPatientProfile> => {
  const { data, error } = await supabaseHealth
    .from('health_patient_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', patientId)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthPatientProfile;
};

// ============================================
// Appointments API
// ============================================

export const createAppointment = async (
  appointment: Partial<HealthAppointment>
): Promise<HealthAppointment> => {
  const { data, error } = await supabaseHealth
    .from('health_appointments')
    .insert(appointment)
    .select('*, doctor:health_doctor_profiles(*)')
    .single();
  
  if (error) throw error;
  return data as HealthAppointment;
};

export const getPatientAppointments = async (
  patientId: string
): Promise<HealthAppointment[]> => {
  const { data, error } = await supabaseHealth
    .from('health_appointments')
    .select('*, doctor:health_doctor_profiles(*)')
    .eq('patient_id', patientId)
    .order('scheduled_at', { ascending: false });
  
  if (error) throw error;
  return data as HealthAppointment[];
};

export const getDoctorAppointments = async (
  doctorId: string
): Promise<HealthAppointment[]> => {
  const { data, error } = await supabaseHealth
    .from('health_appointments')
    .select('*, patient:health_patient_profiles(*)')
    .eq('doctor_id', doctorId)
    .order('scheduled_at', { ascending: false });
  
  if (error) throw error;
  return data as HealthAppointment[];
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  status: HealthAppointment['status']
): Promise<HealthAppointment> => {
  const { data, error } = await supabaseHealth
    .from('health_appointments')
    .update({ 
      status, 
      updated_at: new Date().toISOString(),
      ...(status === 'completed' ? { prescription_summary: '' } : {}),
    })
    .eq('id', appointmentId)
    .select('*, doctor:health_doctor_profiles(*)')
    .single();
  
  if (error) throw error;
  return data as HealthAppointment;
};

export const cancelAppointment = async (
  appointmentId: string
): Promise<HealthAppointment> => {
  return updateAppointmentStatus(appointmentId, 'cancelled');
};

// ============================================
// Chat API
// ============================================

export const createHealthConversation = async (
  appointmentId: string
): Promise<HealthConversation> => {
  const { data, error } = await supabaseHealth
    .from('health_conversations')
    .insert({ appointment_id: appointmentId })
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthConversation;
};

export const getHealthConversation = async (
  appointmentId: string
): Promise<HealthConversation | null> => {
  const { data, error } = await supabaseHealth
    .from('health_conversations')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data as HealthConversation | null;
};

export const sendHealthMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  attachmentUrl?: string
): Promise<HealthMessage> => {
  const { data, error } = await supabaseHealth
    .from('health_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      attachment_url: attachmentUrl,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthMessage;
};

export const getHealthMessages = async (
  conversationId: string
): Promise<HealthMessage[]> => {
  const { data, error } = await supabaseHealth
    .from('health_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as HealthMessage[];
};

// ============================================
// Prescriptions API
// ============================================

export const createPrescription = async (
  prescription: Partial<HealthPrescription>
): Promise<HealthPrescription> => {
  const { data, error } = await supabaseHealth
    .from('health_prescriptions')
    .insert(prescription)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthPrescription;
};

export const getPrescriptionsByAppointment = async (
  appointmentId: string
): Promise<HealthPrescription[]> => {
  const { data, error } = await supabaseHealth
    .from('health_prescriptions')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as HealthPrescription[];
};

export const markPrescriptionDispensed = async (
  prescriptionId: string
): Promise<HealthPrescription> => {
  const { data, error } = await supabaseHealth
    .from('health_prescriptions')
    .update({ is_dispensed: true })
    .eq('id', prescriptionId)
    .select()
    .single();
  
  if (error) throw error;
  return data as HealthPrescription;
};

// ============================================
// Pharmacies API
// ============================================

export const getVerifiedPharmacies = async (): Promise<any[]> => {
  const { data, error } = await supabaseHealth
    .from('health_pharmacy_profiles')
    .select('*')
    .eq('is_verified', true);
  
  if (error) throw error;
  return data as any[];
};
