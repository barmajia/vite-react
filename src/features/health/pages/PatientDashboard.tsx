// src/features/health/pages/PatientDashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import type { HealthAppointment, HealthPatientProfile } from "../types";
import { 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Shield, 
  Zap,
  ArrowRight,
  TrendingUp,
  Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [patientProfile, setPatientProfile] = useState<HealthPatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabaseHealth
          .from("health_patient_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setPatientProfile(profile);
          const { data: appts } = await supabaseHealth
            .from("health_appointments")
            .select("*, doctor:health_doctor_profiles(*)")
            .eq("patient_id", profile.id)
            .order("scheduled_at", { ascending: false });
          if (appts) setAppointments(appts);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
         <div className="w-16 h-16 glass bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-center justify-center animate-pulse">
            <Activity className="h-8 w-8 text-emerald-500" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic animate-pulse">Decrypting Ledger...</p>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.scheduled_at) > new Date() && appt.status !== "cancelled"
  );
  
  const pastAppointments = appointments.filter(
    (appt) => new Date(appt.scheduled_at) <= new Date() || appt.status === "cancelled"
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-16 pb-40">
      
      {/* ===== DASHBOARD HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
         <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 glass bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
               <Shield className="h-4 w-4 text-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Secure Biological Record</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-foreground">
               Clinical <br />
               <span className="text-foreground/20">Ledger</span>
            </h1>
         </div>
         <div className="flex gap-4">
            <Button 
               onClick={() => navigate("/health/doctors")}
               className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
               Request Alpha Node
            </Button>
            <Button 
               onClick={() => navigate("/health/messages")}
               className="h-16 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
            >
               Neural Stream
            </Button>
         </div>
      </div>

      {/* ===== CORE TELEMETRY ===== */}
      {patientProfile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: "Operational Integrity", value: patientProfile.total_visits, icon: TrendingUp, color: "emerald", unit: "VISITS" },
             { label: "Biological Signature", value: patientProfile.blood_type || "NA", icon: Droplets, color: "rose", unit: "TYPE" },
             { label: "Last Diagnostic", value: patientProfile.last_visit_date ? new Date(patientProfile.last_visit_date).toLocaleDateString() : "NA", icon: Clock, color: "amber", unit: "UTC" },
           ].map((stat) => (
             <div key={stat.label} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                <div className={cn("absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-20", `bg-${stat.color}-500`)} />
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
      )}

      {/* ===== ACTIVE PROTOCOLS (Appointments) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         <div className="lg:col-span-8 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic flex items-center gap-4">
               <Zap className="h-4 w-4 text-emerald-500" />
               Upcoming Deployments
            </h3>
            
            {upcomingAppointments.length === 0 ? (
              <div className="glass-card p-12 rounded-[2.5rem] border border-white/5 text-center space-y-6">
                 <div className="w-20 h-20 glass bg-white/5 border border-white/10 rounded-[2rem] mx-auto flex items-center justify-center opacity-20">
                    <Calendar className="h-8 w-8" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">No pending operational signals found.</p>
                 <Button onClick={() => navigate("/health/doctors")} variant="ghost" className="text-emerald-500 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/10">Initialize Booking Sequence →</Button>
              </div>
            ) : (
              <div className="space-y-6">
                 {upcomingAppointments.map((appt) => (
                    <div key={appt.id} className="group glass-card p-8 rounded-[3rem] border-white/5 hover:border-emerald-500/40 transition-all duration-700">
                       <div className="flex flex-col md:flex-row justify-between gap-8">
                          <div className="flex gap-6">
                             <div className="p-5 glass bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] h-fit">
                                <Activity className="h-6 w-6 text-emerald-500" />
                             </div>
                             <div>
                                <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-emerald-500 transition-colors">
                                   {appt.doctor?.specialization}
                                </h4>
                                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 italic mb-4">
                                   <Clock className="h-3 w-3" />
                                   <span>{new Date(appt.scheduled_at).toLocaleString().toUpperCase()}</span>
                                </div>
                                {appt.notes && (
                                   <div className="p-4 glass bg-white/3 border border-white/5 rounded-2xl max-w-md">
                                      <p className="text-[11px] font-medium italic text-foreground/40 leading-relaxed">{appt.notes}</p>
                                   </div>
                                )}
                             </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 justify-between">
                             <div className="flex gap-2">
                                <Badge className={cn("glass border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1", appt.slot_type === 'emergency' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "bg-white/5 text-foreground/40")}>
                                   {appt.slot_type} MODE
                                </Badge>
                                <Badge className="bg-emerald-500 text-white border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1 shadow-lg shadow-emerald-500/30">
                                   {appt.status}
                                </Badge>
                             </div>
                             <div className="flex gap-3">
                                <Button 
                                   onClick={() => navigate(`/health/consult/${appt.id}`)}
                                   className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                   <MessageSquare className="h-4 w-4 mr-2" />
                                   Neural Stream
                                </Button>
                                {appt.status === "pending" && (
                                   <Button 
                                      onClick={async () => {
                                         if (confirm("Terminate deployment protocol?")) {
                                            await supabaseHealth.from("health_appointments").update({ status: "cancelled" }).eq("id", appt.id);
                                            window.location.reload();
                                         }
                                      }}
                                      className="h-12 w-12 rounded-2xl glass hover:bg-rose-500/10 text-rose-500"
                                      variant="ghost"
                                   >
                                      &times;
                                   </Button>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            )}
         </div>

         <div className="lg:col-span-4 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic flex items-center gap-4">
               <FileText className="h-4 w-4 text-amber-500" />
               Historical Index
            </h3>
            
            <div className="space-y-4">
               {pastAppointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="glass-card p-6 rounded-[2rem] border-white/5 opacity-40 hover:opacity-100 transition-all">
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1">{appt.doctor?.specialization}</p>
                           <p className="text-[8px] font-black uppercase tracking-widest text-foreground/20 italic">{new Date(appt.scheduled_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={cn("glass border-0 text-[7px] font-black uppercase tracking-widest px-2 py-0.5", appt.status === 'completed' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500")}>
                           {appt.status}
                        </Badge>
                     </div>
                  </div>
               ))}
               
               {pastAppointments.length === 0 && (
                  <div className="py-20 text-center glass-card border-white/5 rounded-[2rem]">
                     <p className="text-[10px] font-black uppercase tracking-widest text-foreground/10">Null historical data.</p>
                  </div>
               )}
               
               {pastAppointments.length > 5 && (
                  <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-foreground/20 hover:text-foreground">View Full Historical Matrix</Button>
               )}
            </div>
         </div>

      </div>

    </div>
  );
};

export default PatientDashboard;
