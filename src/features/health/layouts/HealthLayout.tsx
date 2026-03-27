// src/features/health/layouts/HealthLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { HeartPulse, Shield, Loader2 } from "lucide-react";
import HealthFAB from "../components/HealthFAB";
import { HealthHeader } from "../components/HealthHeader";
import { toast } from "sonner";

type UserRole = "patient" | "doctor" | "admin" | null;

const HealthLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setUserRole("patient"); // Default for public pages
          setLoading(false);
          return;
        }

        // Check Admin
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminData) {
          setUserRole("admin");
          setLoading(false);
          return;
        }

        // Check Doctor
        const { data: doctorData } = await supabase
          .from("health_doctor_profiles")
          .select("id, is_verified")
          .eq("user_id", user.id)
          .maybeSingle();

        if (doctorData) {
          setUserRole("doctor");
          setLoading(false);
          return;
        }

        // Default to patient
        setUserRole("patient");
      } catch (err) {
        console.error("Error checking user role:", err);
        setError("Failed to load user role");
        toast.error("Failed to load healthcare portal");
        setUserRole("patient");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  // Hide FAB on certain pages
  const hideFABPaths = [
    "/services/health/admin/verify",
    "/services/health/doctor/signup",
    "/services/health/doctor/pending-approval",
  ];
  const showFAB =
    !hideFABPaths.some((path) => location.pathname.includes(path)) &&
    userRole !== null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
        <HealthHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Loading */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-inner" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-500 animate-spin" />
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center z-10">
                <HeartPulse className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
              Aurora Health
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Securely accessing your health portal...
            </p>
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
        <HealthHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md px-4">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Access Error
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/services/health")}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Return to Health Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
      <HealthHeader />

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Role-Based FAB */}
      {showFAB && userRole && <HealthFAB userRole={userRole} />}

      {/* Footer Spacer */}
      <div className="h-24 bg-slate-50 dark:bg-slate-950" />
    </div>
  );
};

export default HealthLayout;
