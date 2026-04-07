import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingDoctors, verifyDoctor } from "../api/supabaseHealth";
import type { HealthDoctorProfile } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const AdminVerification: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState<HealthDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        toast.error("You must be logged in to access this page");
        navigate("/login");
        return;
      }

      const accountType = user.user_metadata?.account_type;
      if (accountType !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading, navigate]);

  // Load doctors data (must be before early return to satisfy Rules of Hooks)
  useEffect(() => {
    if (isAdmin) {
      loadPendingDoctors();
    }
  }, [isAdmin]);

  const loadPendingDoctors = async () => {
    try {
      const pending = await getPendingDoctors();
      setDoctors(pending);
    } catch (error) {
      console.error("Error loading pending doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, approved: boolean) => {
    if (verifying) return;
    try {
      setVerifying(id);
      await verifyDoctor(id, approved);
      setDoctors(doctors.filter((d) => d.id !== id));
      toast.success(
        `Doctor ${approved ? "approved" : "rejected"} successfully`,
      );
    } catch (error) {
      console.error("Error verifying doctor:", error);
      toast.error("Failed to verify doctor. Please try again.");
    } finally {
      setVerifying(null);
    }
  };

  // Don't render until admin check is complete
  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading pending verifications...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          🔐 Admin Verification
        </h1>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {doctors.length} pending {doctors.length === 1 ? "doctor" : "doctors"}
        </span>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No pending doctor verifications
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {doc.specialization}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    License: {doc.license_number}
                  </p>
                  {doc.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {doc.bio}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Consultation Fee:
                      </span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${doc.consultation_fee}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Emergency Fee:
                      </span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${doc.emergency_fee}
                      </p>
                    </div>
                  </div>
                  {doc.license_document_url && (
                    <div className="mt-4">
                      <a
                        href={doc.license_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 underline text-sm"
                      >
                        📄 View License Document
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Applied: {new Date(doc.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleVerify(doc.id, true)}
                    disabled={verifying === doc.id}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying === doc.id ? "Processing..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleVerify(doc.id, false)}
                    disabled={verifying === doc.id}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying === doc.id ? "Processing..." : "✕ Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
