import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "../types";

interface HealthFABProps {
  userRole: UserRole;
}

const HealthFAB: React.FC<HealthFABProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {expanded && (
        <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in">
          {userRole === "patient" && (
            <>
              <button
                onClick={() =>
                  navigate("/services/health/doctors?emergency=true")
                }
                className="bg-red-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors border-2 border-red-700"
              >
                <span>🚑</span>
                <span className="font-medium">Emergency</span>
              </button>
              <button
                onClick={() => navigate("/services/health/doctors")}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors border-2 border-gray-300 dark:border-gray-600"
              >
                <span>📅</span>
                <span className="font-medium">Regular Booking</span>
              </button>
            </>
          )}
          {userRole === "doctor" && (
            <button
              onClick={() =>
                navigate("/services/health/doctor/dashboard?tab=schedule")
              }
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors border-2 border-gray-300 dark:border-gray-600 col-span-2"
            >
              <span>➕</span>
              <span className="font-medium">Add Availability</span>
            </button>
          )}
          {userRole === "admin" && (
            <button
              onClick={() => navigate("/services/health/admin/verify")}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors border-2 border-gray-300 dark:border-gray-600 col-span-2"
            >
              <span>🔐</span>
              <span className="font-medium">Verify Doctors</span>
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-16 h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center text-3xl hover:shadow-2xl transition-shadow"
      >
        {expanded ? "✕" : "+"}
      </button>
    </div>
  );
};

export default HealthFAB;
