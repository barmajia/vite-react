import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import HealthFAB from "../components/HealthFAB";
import type { UserRole } from "../types";
import { HeartPulse } from "lucide-react";

const HealthLayout: React.FC = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Check Admin
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .single();

        if (adminData) {
          setUserRole("admin");
          setLoading(false);
          return;
        }

        // Check Doctor
        const { data: doctorData } = await supabaseHealth
          .from("health_doctor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (doctorData) {
          setUserRole("doctor");
          setLoading(false);
          return;
        }

        // Default to patient
        setUserRole("patient");
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("patient");
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  const showFAB =
    !location.pathname.includes("/admin/verify") && userRole !== null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-inner"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-500 animate-spin"></div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <main className="w-full relative z-0 pb-24">
        <Outlet />
      </main>

      {/* Modern FAB Component */}
      {showFAB && userRole && <HealthFAB userRole={userRole} />}
    </div>
  );
};

export default HealthLayout;
