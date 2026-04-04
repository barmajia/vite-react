import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  supabaseHealth,
  getDoctorAppointments,
  updateAppointmentStatus,
} from "../api/supabaseHealth";
import type { HealthAppointment, HealthDoctorProfile } from "../types";

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [doctorProfile, setDoctorProfile] =
    useState<HealthDoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">(
    "upcoming",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab as any);
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabaseHealth
          .from("health_doctor_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          setDoctorProfile(profile);
          const appts = await getDoctorAppointments(profile.id);
          setAppointments(appts);
        }
      } catch (error) {
        console.error("Error loading doctor data:", error);
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
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          No Doctor Profile Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to create a doctor profile to access the dashboard.
        </p>
        <button
          onClick={() => navigate("/services/health/doctor/signup")}
          className="bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-violet-700"
        >
          Create Profile
        </button>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (appt) =>
      new Date(appt.scheduled_at) > new Date() && appt.status !== "cancelled",
  );
  const completedAppointments = appointments.filter(
    (appt) => appt.status === "completed",
  );
  const filteredAppointments =
    activeTab === "upcoming"
      ? upcomingAppointments
      : activeTab === "completed"
        ? completedAppointments
        : appointments;

  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: HealthAppointment["status"],
  ) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(
        appointments.map((appt) =>
          appt.id === appointmentId ? { ...appt, status: newStatus } : appt,
        ),
      );
      alert(`Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Doctor Dashboard
        </h1>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {doctorProfile.is_verified ? "✓ Verified" : "⏳ Pending Verification"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Total Appointments
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {appointments.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Upcoming</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {upcomingAppointments.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Completed</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {completedAppointments.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Consultation Fee
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${doctorProfile.consultation_fee}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["upcoming", "completed", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${activeTab === tab ? "border-b-2 border-violet-600 text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            {tab} (
            {tab === "upcoming"
              ? upcomingAppointments.length
              : tab === "completed"
                ? completedAppointments.length
                : appointments.length}
            )
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              No appointments in this category
            </p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
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
                            : appt.status === "active"
                              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                              : appt.status === "completed"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Scheduled: {new Date(appt.scheduled_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Patient ID: {appt.patient_id.slice(0, 8)}...
                  </p>
                  {appt.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Notes: {appt.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {appt.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appt.id, "confirmed")}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appt.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "active")}
                      className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700"
                    >
                      Start Session
                    </button>
                  )}
                  {appt.status === "active" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appt.id, "completed")}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/services/health/consult/${appt.id}`)
                        }
                        className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700"
                      >
                        💬 Chat
                      </button>
                    </>
                  )}
                  {appt.status === "completed" && (
                    <button
                      onClick={() =>
                        navigate(`/services/health/consult/${appt.id}`)
                      }
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
                    >
                      View Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
