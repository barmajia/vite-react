import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  getDoctorById,
  createAppointment,
  getPatientProfile,
} from "../api/supabaseHealth";
import type { HealthDoctorProfile } from "../types";

const BookingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [doctor, setDoctor] = useState<HealthDoctorProfile | null>(null);
  const [slotType, setSlotType] = useState<"regular" | "emergency">("regular");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const isEmergency = searchParams.get("emergency") === "true";

  useEffect(() => {
    if (isEmergency) setSlotType("emergency");
  }, [isEmergency]);

  useEffect(() => {
    if (id) {
      getDoctorById(id)
        .then(setDoctor)
        .catch((error) => console.error("Error loading doctor:", error));
    }
  }, [id]);

  const handleBook = async () => {
    if (!id || !dateTime) {
      alert("Please select a date and time");
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Login required");
        navigate("/login");
        return;
      }

      let patientProfile = await getPatientProfile(user.id);
      if (!patientProfile) {
        patientProfile = await supabase
          .from("health_patient_profiles")
          .insert({ user_id: user.id, medical_history: [], total_visits: 0 })
          .select()
          .single()
          .then((res) => res.data);
      }

      if (!patientProfile) {
        alert("Unable to create patient profile. Please try again.");
        return;
      }

      const selectedDate = new Date(dateTime);
      if (selectedDate <= new Date()) {
        alert("Please select a future date and time");
        return;
      }

      const amount =
        slotType === "emergency"
          ? doctor!.emergency_fee
          : doctor!.consultation_fee;

      await createAppointment({
        doctor_id: id,
        patient_id: patientProfile.id,
        scheduled_at: selectedDate.toISOString(),
        slot_type: slotType,
        payment_amount: amount,
        status: "pending",
        payment_status: "pending",
        notes: notes || null,
      });

      alert("Booking created successfully! Redirecting to your dashboard...");
      navigate("/services/health/patient/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading doctor details...
        </p>
      </div>
    );
  }

  const amount =
    slotType === "emergency" ? doctor.emergency_fee : doctor.consultation_fee;
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Book Appointment
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          with Dr. {doctor.specialization}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Appointment Type
            </label>
            <select
              value={slotType}
              onChange={(e) =>
                setSlotType(e.target.value as "regular" | "emergency")
              }
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
              disabled={isEmergency}
            >
              <option value="regular">Regular Consultation</option>
              <option value="emergency">Emergency (2x Fee)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
              min={minDateTime}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Describe your symptoms or reason for visit..."
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Consultation Fee:
              </span>
              <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                ${amount}
              </span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={loading || !dateTime}
            className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
