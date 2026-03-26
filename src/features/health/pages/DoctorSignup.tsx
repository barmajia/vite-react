import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { HealthDoctorProfile } from "../types";

interface DoctorSignupFormData {
  email: string;
  password: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: string;
  emergencyFee: string;
  bio: string;
  licenseDocumentUrl: string;
}

const DoctorSignup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DoctorSignupFormData>({
    email: "",
    password: "",
    fullName: "",
    specialization: "",
    licenseNumber: "",
    consultationFee: "",
    emergencyFee: "",
    bio: "",
    licenseDocumentUrl: "",
  });
  const [error, setError] = useState<string | null>(null);

  const specializations = [
    "General Practitioner",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedic",
    "Neurologist",
    "Psychiatrist",
    "Gynecologist",
    "Dentist",
    "Other",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Please fill all required fields");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.specialization ||
      !formData.licenseNumber ||
      !formData.consultationFee ||
      !formData.emergencyFee
    ) {
      setError("Please fill all required fields");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const { error: patientError } = await supabase
        .from("health_patient_profiles")
        .insert({
          user_id: authData.user.id,
          medical_history: [],
          total_visits: 0,
        });
      if (patientError) throw patientError;

      const doctorProfile: Partial<HealthDoctorProfile> = {
        user_id: authData.user.id,
        specialization: formData.specialization,
        license_number: formData.licenseNumber,
        license_document_url: formData.licenseDocumentUrl || null,
        consultation_fee: parseFloat(formData.consultationFee),
        emergency_fee: parseFloat(formData.emergencyFee),
        bio: formData.bio || null,
        is_verified: false,
        verification_status: "pending",
        availability_schedule: [],
      };

      const { error: doctorError } = await supabase
        .from("health_doctor_profiles")
        .insert(doctorProfile);
      if (doctorError) throw doctorError;

      navigate("/services/health/doctor/pending-approval", {
        state: { email: formData.email },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">
            👨‍⚕️ Doctor Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join our healthcare platform as a verified doctor
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <div
              className={`w-1/3 h-2 rounded-full ${step >= 1 ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}`}
            ></div>
            <div
              className={`w-1/3 h-2 rounded-full ${step >= 2 ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}`}
            ></div>
            <div
              className={`w-1/3 h-2 rounded-full ${step >= 3 ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}`}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Step 1: Account Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must be at least 8 characters
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold hover:bg-violet-700 transition disabled:opacity-50"
            >
              Next: Professional Info
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Step 2: Professional Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Specialization *
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Specialization</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Number *
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Consultation Fee ($) *
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Fee ($) *
                </label>
                <input
                  type="number"
                  name="emergencyFee"
                  value={formData.emergencyFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio (Optional)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                placeholder="Tell patients about your experience..."
              />
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-violet-600 text-white py-3 rounded-lg font-bold hover:bg-violet-700 transition disabled:opacity-50"
              >
                Next: Documents
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Step 3: License Verification
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                ⚠️ Your account will be <strong>pending verification</strong>{" "}
                until admin approves your license. You won't appear in doctor
                listings until verified.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Document URL
              </label>
              <input
                type="url"
                name="licenseDocumentUrl"
                value={formData.licenseDocumentUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
                placeholder="https://example.com/license.pdf"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload your license to cloud storage and paste the link here
              </p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;
