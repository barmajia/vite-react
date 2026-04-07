// src/features/health/pages/DoctorDashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  supabaseHealth,
  getDoctorAppointments,
  updateAppointmentStatus,
} from "../api/supabaseHealth";
import type { HealthAppointment, HealthDoctorProfile } from "../types";
import { 
  Activity, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [doctorProfile, setDoctorProfile] = useState<HealthDoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("upcoming");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab as any);
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabaseHealth
          .from("health_doctor_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          setDoctorProfile(profile);
          const appts = await getDoctorAppointments(profile.id);
          setAppointments(appts);
        }
      } catch (error) {
        console.error("Error loading doctor data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
         <div className="w-16 h-16 glass bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-center justify-center animate-pulse">
            <Activity className="h-8 w-8 text-rose-500" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic animate-pulse">Syncing Operational Matrix...</p>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-8">
         <div className="w-24 h-24 glass bg-white/5 border border-white/10 rounded-[3rem] mx-auto flex items-center justify-center opacity-20">
            <ShieldCheck className="h-10 w-10 text-rose-500" />
         </div>
         <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">Deployment Profile Missing</h2>
         <p className="text-sm font-medium italic text-foreground/40 leading-relaxed">No medical credentials identified for this session. Initialize deployment protocol to access the dashboard.</p>
         <Button 
            onClick={() => navigate("/health/doctor/signup")}
            className="h-16 px-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
         >
            Initialize Signup Protocol
         </Button>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.scheduled_at) > new Date() && appt.status !== "cancelled"
  );
  const completedAppointments = appointments.filter((appt) => appt.status === "completed");
  const filteredAppointments =
    activeTab === "upcoming"
      ? upcomingAppointments
      : activeTab === "completed"
        ? completedAppointments
        : appointments;

  const handleStatusUpdate = async (appointmentId: string, newStatus: HealthAppointment["status"]) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(appointments.map(appt => appt.id === appointmentId ? { ...appt, status: newStatus } : appt));
      toast.success(`Protocol status updated to ${newStatus.toUpperCase()}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Status update failure.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-16 pb-40">
      
      {/* ===== DASHBOARD HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
         <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 glass bg-rose-500/5 border border-rose-500/10 rounded-2xl">
               <ShieldCheck className={cn("h-4 w-4", doctorProfile.is_verified ? "text-emerald-500" : "text-amber-500")} />
               <span className={cn("text-[10px] font-black uppercase tracking-widest italic", doctorProfile.is_verified ? "text-emerald-500" : "text-amber-500")}>
                  {doctorProfile.is_verified ? "Verified Personnel" : "Credential Pending Verification"}
               </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-foreground">
               Operational <br />
               <span className="text-foreground/20">Schedule</span>
            </h1>
         </div>
      </div>

      {/* ===== CORE TELEMETRY ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         {[
           { label: "Total Engagements", value: appointments.length, icon: TrendingUp, color: "rose", unit: "LOGS" },
           { label: "Pending Deployment", value: upcomingAppointments.length, icon: Zap, color: "amber", unit: "QUEUED" },
           { label: "Completed Matrix", value: completedAppointments.length, icon: CheckCircle2, color: "emerald", unit: "ARCHIVED" },
           { label: "Standard Credit", value: `$${doctorProfile.consultation_fee}`, icon: Activity, color: "indigo", unit: "RATE" },
         ].map((stat) => (
           <div key={stat.label} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <div className={cn("p-4 rounded-2xl glass", `bg-${stat.color}-500/10 border-${stat.color}-500/20`)}>
                       <stat.icon className={cn("h-6 w-6", `text-${stat.color}-500`)} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">{stat.unit}</span>
                 </div>
                 <div>
                    <p className="text-4xl font-black italic tracking-tighter text-foreground mb-1">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{stat.label}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div className="flex gap-4 p-1.5 glass bg-white/5 border border-white/10 rounded-2xl backdrop-blur-2xl w-fit">
        {(["upcoming", "completed", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
               "px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
               activeTab === tab ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-foreground/40 hover:text-foreground"
            )}
          >
            {tab} INDEX
          </button>
        ))}
      </div>

      {/* ===== APPOINTMENT MATRIX ===== */}
      <div className="space-y-6">
        {filteredAppointments.length === 0 ? (
          <div className="py-20 text-center glass-card border-white/5 rounded-[3rem]">
             <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Null deployments detected for this sector.</p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div key={appt.id} className="group glass-card p-10 rounded-[3.5rem] border-white/5 hover:border-rose-500/40 transition-all duration-700 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]">
               <div className="flex flex-col md:flex-row justify-between gap-10">
                  <div className="flex gap-8">
                     <div className="p-6 glass bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] h-fit">
                        <Activity className="h-8 w-8 text-rose-500" />
                     </div>
                     <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                           <Badge className={cn("glass border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1", appt.slot_type === 'emergency' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "bg-white/5 text-foreground/40")}>
                              {appt.slot_type} Protocol
                           </Badge>
                           <Badge className="bg-white/5 text-foreground/40 border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                              Status: {appt.status.toUpperCase()}
                           </Badge>
                        </div>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                           P-ID: {appt.patient_id.slice(0, 8)}
                        </h4>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">
                           <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(appt.scheduled_at).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                        {appt.notes && (
                           <div className="p-4 glass bg-white/3 border border-white/5 rounded-2xl max-w-sm mt-4">
                              <p className="text-[11px] font-medium italic text-foreground/40 leading-relaxed">{appt.notes}</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 justify-center">
                    {appt.status === "pending" && (
                      <div className="flex gap-3">
                        <Button onClick={() => handleStatusUpdate(appt.id, "confirmed")} className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px]">Identify Confirm</Button>
                        <Button onClick={() => handleStatusUpdate(appt.id, "cancelled")} variant="ghost" className="h-14 w-14 rounded-2xl glass hover:bg-rose-500/10 text-rose-500">X</Button>
                      </div>
                    )}
                    {appt.status === "confirmed" && (
                      <Button onClick={() => handleStatusUpdate(appt.id, "active")} className="h-14 px-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20">
                         Start Neural Session
                         <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    {(appt.status === "active" || appt.status === "completed") && (
                       <div className="flex gap-3">
                          <Button 
                             onClick={() => navigate(`/health/consult/${appt.id}`)}
                             className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest"
                          >
                             <MessageSquare className="h-4 w-4 mr-2" />
                             Neural Stream
                          </Button>
                          {appt.status === "active" && (
                             <Button onClick={() => handleStatusUpdate(appt.id, "completed")} className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px]">Matrix Complete</Button>
                          )}
                       </div>
                    )}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default DoctorDashboard;
