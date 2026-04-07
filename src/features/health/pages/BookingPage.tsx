// src/features/health/pages/BookingPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";

export default function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      toast.error("Authorized session required for engagement.");
      navigate("/login");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      patient_name: user.user_metadata?.full_name || "",
      patient_email: user.email || "",
      patient_phone: user.user_metadata?.phone || "",
      appointment_time: searchParams.get("slot") || "",
    }));

    fetchDoctor();
  }, [doctorId, user]);

  const fetchDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from("health_doctor_profiles")
        .select(`*, users:user_id (*)`)
        .eq("user_id", doctorId)
        .single();
      if (error) throw error;
      if (data) setDoctor(data);
    } catch (error) {
       console.error("Error fetching doctor:", error);
       toast.error("Node synchronization failure.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: patientData } = await supabase
        .from("health_patient_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      let patientId = patientData?.id;

      if (!patientId) {
        const { data: newPatient } = await supabase
          .from("health_patient_profiles")
          .insert({ user_id: user!.id })
          .select("id")
          .single();
        patientId = newPatient?.id;
      }

      const { error } = await supabase.from("health_appointments").insert({
        doctor_id: doctorId,
        patient_id: patientId,
        scheduled_at: `${formData.appointment_date}T${formData.appointment_time}`,
        status: "pending",
        payment_status: "pending",
        notes: formData.reason,
        metadata: {
          patient_name: formData.patient_name,
          patient_email: formData.patient_email,
          patient_phone: formData.patient_phone,
        },
      });

      if (error) throw error;

      toast.success("Engagement initialized. Matrix updated.");
      navigate("/health/patient/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Engagement protocol failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background pb-32">
      
      {/* ===== ENGAGEMENT PROTOCOL HERO ===== */}
      <section className="relative pt-32 pb-16 px-6 lg:px-12 border-b border-white/5 overflow-hidden">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
         
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20 italic mb-8">
               <Link to="/health" className="hover:text-rose-500 transition-colors">Sector / Health</Link>
               <span className="opacity-50">/</span>
               <span className="text-foreground/40">Engagement Protocol</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-[0.85] text-foreground mb-4">
               INITIALIZE <br /> <span className="text-rose-500">ENGAGEMENT</span>
            </h1>
            <p className="text-sm font-medium italic text-foreground/40 max-w-lg">Configuring neural sync with medical node personnel. Ensure all telemetry data is accurate before finalizing protocol.</p>
         </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
         
         {/* FORM MATRIX */}
         <div className="lg:col-span-8 space-y-12">
            <form onSubmit={handleSubmit} className="space-y-16">
               
               {/* 01. Personnel Identity */}
               <div className="space-y-10">
                  <div className="flex items-center gap-6">
                     <span className="text-4xl font-black italic text-rose-500/20">01</span>
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">Personnel Identity</h3>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Full Name Index</Label>
                        <Input name="patient_name" value={formData.patient_name} onChange={handleChange} required className="h-14 rounded-2xl glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Communication Channel</Label>
                        <Input name="patient_email" type="email" value={formData.patient_email} onChange={handleChange} required className="h-14 rounded-2xl glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight" />
                     </div>
                     <div className="space-y-3 sm:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Veri-Link Phone</Label>
                        <Input name="patient_phone" value={formData.patient_phone} onChange={handleChange} required className="h-14 rounded-2xl glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight" />
                     </div>
                  </div>
               </div>

               {/* 02. Chronos Mapping */}
               <div className="space-y-10">
                  <div className="flex items-center gap-6">
                     <span className="text-4xl font-black italic text-rose-500/20">02</span>
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">Chronos Mapping</h3>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Deployment Date</Label>
                        <Input name="appointment_date" type="date" value={formData.appointment_date} onChange={handleChange} min={minDate} required className="h-14 rounded-2xl glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Sync Window</Label>
                        <Input name="appointment_time" value={formData.appointment_time} onChange={handleChange} placeholder="e.g., 09:30 AM" required className="h-14 rounded-2xl glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight" />
                     </div>
                  </div>
               </div>

               {/* 03. Diagnostic Objectives */}
               <div className="space-y-10">
                  <div className="flex items-center gap-6">
                     <span className="text-4xl font-black italic text-rose-500/20">03</span>
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">Diagnostic Objectives</h3>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Primary Objective (Symptoms)</Label>
                        <Textarea name="reason" value={formData.reason} onChange={handleChange} required rows={3} placeholder="Describe bio-signal anomalies..." className="rounded-[2.5rem] glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight p-8" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic ml-1">Peripheral Data (Notes)</Label>
                        <Textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Additional medical ledger data..." className="rounded-[2rem] glass bg-white/3 border-white/10 focus:border-rose-500/40 text-[12px] font-black uppercase tracking-tight p-8" />
                     </div>
                  </div>
               </div>

               <Button type="submit" disabled={loading} className="w-full h-20 rounded-[2.5rem] bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-rose-500/20 group">
                  {loading ? "Synchronizing Matrix..." : (
                     <span className="flex items-center gap-4">
                        Authorize Engagement Protocol
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                     </span>
                  )}
               </Button>
            </form>
         </div>

         {/* SUMMARY SIDEBAR */}
         <aside className="lg:col-span-4 sticky top-32">
            <div className="glass-card p-10 rounded-[3.5rem] border-white/5 space-y-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5"><Zap className="h-24 w-24 text-rose-500" /></div>
               
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic">Engagement Summary</h3>
               
               {doctor && (
                  <div className="flex gap-6 items-center">
                     <Avatar name={doctor.users?.full_name} src={doctor.users?.avatar_url} className="h-20 w-20 rounded-3xl" />
                     <div className="space-y-1">
                        <p className="text-xl font-black italic tracking-tighter uppercase text-foreground leading-none">{doctor.users?.full_name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/60">{doctor.specialization}</p>
                     </div>
                  </div>
               )}

               <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end">
                     <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Temporal Node</span>
                     <span className="text-sm font-black italic tracking-tighter text-foreground uppercase">{formData.appointment_date || "Pending Selection"}</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Sync Window</span>
                     <span className="text-sm font-black italic tracking-tighter text-foreground uppercase">{formData.appointment_time || "Pending Sync"}</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Engagement Credit</span>
                     <span className="text-sm font-black italic tracking-tighter text-emerald-500 uppercase">${doctor?.consultation_fee || "0.00"}</span>
                  </div>
               </div>

               <div className="p-6 rounded-[2rem] glass bg-emerald-500/5 border-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-3 text-emerald-500">
                     <Shield className="h-4 w-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Secured Node</span>
                  </div>
                  <p className="text-[11px] font-medium italic text-foreground/30 leading-snug">Engagement is protected by Aurora's medical encryption matrix. Clinical confidentiality is absolute.</p>
               </div>
            </div>
         </aside>
      </main>

    </div>
  );
}
