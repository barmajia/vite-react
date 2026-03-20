import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getVerifiedDoctors } from "../api/supabaseHealth";
import type { HealthDoctorProfile } from "../types";

const DoctorList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<HealthDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const isEmergency = searchParams.get("emergency") === "true";

  useEffect(() => {
    getVerifiedDoctors()
      .then(setDoctors)
      .catch((error) => {
        console.error("Error loading doctors:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading doctors...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEmergency ? "🚑 Emergency Doctors" : "Find a Doctor"}
        </h1>
        {isEmergency && (
          <button
            onClick={() => navigate("/services/health/doctors")}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
          >
            View All Doctors
          </button>
        )}
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No verified doctors available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {doctor.specialization}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    License: {doctor.license_number}
                  </p>
                </div>
                {doctor.is_verified && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>

              {doctor.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {doctor.bio}
                </p>
              )}

              <div className="mt-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Consultation
                  </span>
                  <p
                    className={`font-bold text-lg ${
                      isEmergency
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    $
                    {isEmergency
                      ? doctor.emergency_fee
                      : doctor.consultation_fee}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/services/health/book/${doctor.id}${isEmergency ? "?emergency=true" : ""}`,
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isEmergency
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorList;
