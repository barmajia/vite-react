import React from "react";
import { useNavigate } from "react-router-dom";

const HealthLanding: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Find a Doctor",
      icon: "👨‍⚕️",
      path: "/services/health/doctors",
      isEmergency: false,
    },
    {
      title: "My Records",
      icon: "📋",
      path: "/services/health/patient/dashboard",
      isEmergency: false,
    },
    {
      title: "Pharmacies",
      icon: "💊",
      path: "/services/health/pharmacies",
      isEmergency: false,
    },
    {
      title: "Emergency",
      icon: "🚑",
      path: "/services/health/doctors?emergency=true",
      isEmergency: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome to Health Services</h1>
        <p className="text-violet-100 mt-2">
          Book appointments, consult doctors, and track your health records
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-left hover:scale-105 border-2 ${
              card.isEmergency
                ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3
              className={`text-xl font-bold ${
                card.isEmergency
                  ? "text-red-700 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {card.title}
            </h3>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Find a Doctor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Browse verified doctors by specialization
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Book Appointment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Schedule regular or emergency visits
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Consult & Track
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Chat with doctors and view history
            </p>
          </div>
        </div>
      </div>

      {/* Doctor CTA */}
      <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">👨‍⚕️ Are You a Doctor?</h2>
        <p className="text-violet-100 mb-4">
          Join our healthcare platform and connect with patients
        </p>
        <button
          onClick={() => navigate("/services/health/doctor/signup")}
          className="bg-white text-violet-600 px-8 py-3 rounded-lg font-bold hover:bg-violet-50 transition-colors"
        >
          Register as a Doctor
        </button>
      </div>
    </div>
  );
};

export default HealthLanding;
