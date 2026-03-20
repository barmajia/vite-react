import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import HealthFAB from "../components/HealthFAB";
import type { UserRole } from "../types";

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading health services...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Content */}
      <main className="w-full">
        <Outlet />
      </main>

      {/* FAB */}
      {showFAB && userRole && <HealthFAB userRole={userRole} />}
    </div>
  );
};

export default HealthLayout;
