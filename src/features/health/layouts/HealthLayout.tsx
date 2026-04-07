// src/features/health/layouts/HealthLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Shield, Activity } from "lucide-react";
import HealthFAB from "../components/HealthFAB";
import { HealthHeader } from "../components/HealthHeader";
import { Button } from "@/components/ui/button";

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
          setUserRole("patient");
          setLoading(false);
          return;
        }

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

        setUserRole("patient");
      } catch (err) {
        console.error("Error checking user role:", err);
        setError("Operational failure in identification matrix.");
        setUserRole("patient");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const hideFABPaths = [
    "/health/admin/verify",
    "/health/doctor/signup",
    "/health/doctor/pending-approval",
  ];
  
  const showFAB =
    !hideFABPaths.some((path) => location.pathname.includes(path)) &&
    userRole !== null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
         <div className="w-20 h-20 glass bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <Activity className="h-10 w-10 text-rose-500" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">Syncing Nexus Identity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-8">
          <div className="w-24 h-24 rounded-[2.5rem] glass bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl">
            <Shield className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">Access Protocol Denied</h2>
             <p className="text-sm font-medium italic text-foreground/40 leading-relaxed">{error}</p>
          </div>
          <Button
            onClick={() => navigate("/health")}
            className="h-16 px-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
          >
            Purge & Return
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HealthHeader />
      <main className="pt-20">
        <Outlet />
      </main>
      {showFAB && userRole && <HealthFAB userRole={userRole} />}
      <div className="h-40" />
    </div>
  );
};

export default HealthLayout;
