import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DoctorPendingApproval: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "your email";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Pending Verification
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for registering, <strong>{email}</strong>! Your doctor
          profile is pending admin verification.
        </p>
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4 rounded-lg mb-6 text-left">
          <h3 className="font-bold text-violet-800 dark:text-violet-400 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-violet-700 dark:text-violet-300 space-y-2">
            <li>✓ Admin will review your license documents</li>
            <li>✓ You'll receive an email when verified</li>
            <li>✓ Once approved, you'll appear in doctor listings</li>
            <li>✓ You can then accept appointments and consultations</li>
          </ul>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold hover:bg-violet-700 transition"
          >
            Return to Home
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Login to Your Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorPendingApproval;
