import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import type { HealthAppointment, HealthPatientProfile } from "../types";

const PatientDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [patientProfile, setPatientProfile] =
    useState<HealthPatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabaseHealth
          .from("health_patient_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setPatientProfile(profile);
          const { data: appts } = await supabaseHealth
            .from("health_appointments")
            .select("*, doctor:health_doctor_profiles(*)")
            .eq("patient_id", profile.id)
            .order("scheduled_at", { ascending: false });
          if (appts) setAppointments(appts);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading your records...
        </p>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (appt) =>
      new Date(appt.scheduled_at) > new Date() && appt.status !== "cancelled",
  );
  const pastAppointments = appointments.filter(
    (appt) =>
      new Date(appt.scheduled_at) <= new Date() || appt.status === "cancelled",
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        My Health Records
      </h1>

      {patientProfile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Total Visits
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {patientProfile.total_visits}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Blood Type
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {patientProfile.blood_type || "Not specified"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Last Visit
            </h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {patientProfile.last_visit_date
                ? new Date(patientProfile.last_visit_date).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
          Upcoming Appointments
        </h3>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No upcoming appointments
            </p>
            <button
              onClick={() =>
                (window.location.href = "/services/health/doctors")
              }
              className="mt-4 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >
              Book a doctor →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {appt.doctor?.specialization}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(appt.scheduled_at).toLocaleString()}
                    </p>
                    {appt.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Notes: {appt.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appt.slot_type === "emergency"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-700"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {appt.slot_type}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appt.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                          : appt.status === "confirmed"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() =>
                      (window.location.href = `/services/health/consult/${appt.id}`)
                    }
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm font-medium"
                  >
                    💬 Start Consultation
                  </button>
                  {appt.status === "pending" && (
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            "Are you sure you want to cancel this appointment?",
                          )
                        ) {
                          await supabaseHealth
                            .from("health_appointments")
                            .update({ status: "cancelled" })
                            .eq("id", appt.id);
                          setAppointments(
                            appointments.filter((a) => a.id !== appt.id),
                          );
                          alert("Appointment cancelled");
                        }
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pastAppointments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Past Appointments
          </h3>
          <div className="space-y-4">
            {pastAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 opacity-75"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {appt.doctor?.specialization}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(appt.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appt.status === "completed"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400"
                        : appt.status === "cancelled"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
