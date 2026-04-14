// src/features/health/pages/DoctorProfile.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Award,
  CheckCircle2,
  Heart,
  Share2,
  MessageSquare,
  Stethoscope,
  Building,
  GraduationCap,
  Languages,
  Video,
  DollarSign,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabaseHealth } from "../api/supabaseHealth";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { HealthDoctorProfile } from "../types";

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  patient_name: string;
  is_verified: boolean;
}

const DoctorProfile: React.FC = () => {
  const { t } = useTranslation();
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<HealthDoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState("about");

  const fetchDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHealth
        .from("health_doctor_profiles")
        .select(`*, users:user_id (*)`)
        .eq("user_id", doctorId)
        .single();
      if (error) throw error;
      if (data) setDoctor(data);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      toast.error("Matrix synchronization failed for this node.");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await supabaseHealth
        .from("health_reviews")
        .select(`*, patients:user_id (full_name, avatar_url)`)
        .eq("doctor_id", doctorId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (data) setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctor();
    fetchReviews();
  }, [doctorId, fetchDoctor, fetchReviews]);

  const handleBookAppointment = () => {
    if (!user) {
      toast.error("Authorized session required.");
      navigate("/login");
      return;
    }
    navigate(`/health/doctor/${doctorId}/book`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
         <div className="w-20 h-20 glass bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <Stethoscope className="h-10 w-10 text-rose-500" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">Syncing Personnel Matrix...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
       <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="w-24 h-24 rounded-[2.5rem] glass bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">Node Not Found</h2>
             <p className="text-sm font-medium italic text-foreground/40 leading-relaxed max-w-md mx-auto">The personnel identifier provided does not match any active medical nodes in the current sector.</p>
          </div>
          <Button onClick={() => navigate("/health/doctors")} className="h-16 px-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20">
             Return to Matrix
          </Button>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      
      {/* ===== IMMERSIVE PROFILE HERO ===== */}
      <section className="relative pt-32 pb-20 px-6 lg:px-12 overflow-hidden border-b border-white/5">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-rose-500/5 rounded-full blur-[160px] pointer-events-none" />
         
         <div className="max-w-7xl mx-auto relative z-10">
            {/* Breadcrumb Matrix */}
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20 italic mb-12">
               <Link to="/health" className="hover:text-rose-500 transition-colors">Sector / Health</Link>
               <span className="opacity-50">/</span>
               <Link to="/health/doctors" className="hover:text-rose-500 transition-colors">Nodes / Personnel</Link>
               <span className="opacity-50">/</span>
               <span className="text-foreground/40">Diagnostic / {doctor.users?.full_name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
               {/* Personnel Core */}
               <div className="lg:col-span-8 flex flex-col md:flex-row gap-12">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-rose-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-[3.5rem] glass-card p-2 border-white/10 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
                        <Avatar name={doctor.users?.full_name} src={doctor.users?.avatar_url} className="w-full h-full rounded-[3rem]" />
                     </div>
                     {doctor.is_verified && (
                        <div className="absolute -bottom-4 -right-4 p-4 glass bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/30">
                           <Shield className="h-6 w-6" />
                        </div>
                     )}
                  </div>

                  <div className="space-y-8 flex-1">
                     <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                           <Badge className="glass border-0 text-[8px] font-black uppercase tracking-widest px-4 py-1.5 bg-rose-500/10 text-rose-500">Personnel Rank: Alpha</Badge>
                           <Badge className="glass border-0 text-[8px] font-black uppercase tracking-widest px-4 py-1.5 bg-white/5 text-foreground/40">{doctor.specialization}</Badge>
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-[0.85] text-foreground">
                           {doctor.users?.full_name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">
                           <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{doctor.location || "Sector Unknown"}</div>
                           <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-rose-500/40" />{doctor.years_of_experience}+ Years Duty</div>
                           <div className="flex items-center gap-2">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                              <span className="text-foreground/40">{doctor.rating_avg?.toFixed(1) || "5.0"} Integrity Index</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-4 pt-4">
                        <Button onClick={handleBookAppointment} className="h-16 px-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 grow sm:grow-0">
                           Initialize Engagement Matrix
                           <ArrowRight className="ml-3 h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-16 w-16 rounded-2xl glass hover:bg-rose-500/10 text-rose-500 border-white/5">
                           <Share2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-16 w-16 rounded-2xl glass hover:bg-rose-500/10 text-rose-500 border-white/5">
                           <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                        </Button>
                     </div>
                  </div>
               </div>

               {/* Telemetry Panel */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-10 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><Stethoscope className="h-20 w-20" /></div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic">Personnel Telemetry</h3>
                     
                     <div className="space-y-6">
                        {[
                           { label: "Matrix Operations", value: doctor.total_appointments || 0, icon: Activity, color: "rose" },
                           { label: "Positive Feedback", value: `${((doctor.rating_avg || 5) * 20).toFixed(0)}%`, icon: TrendingUp, color: "emerald" },
                           { label: "Standard Credit Rate", value: `$${doctor.consultation_fee}`, icon: DollarSign, color: "rose" }
                        ].map((stat, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className={cn("p-2.5 rounded-xl glass", `bg-${stat.color}-500/10 border-${stat.color}-500/20`)}>
                                    <stat.icon className={cn("h-4 w-4", `text-${stat.color}-500`)} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{stat.label}</span>
                              </div>
                              <span className="text-lg font-black italic tracking-tighter text-foreground">{stat.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ===== DETAILED ANALYTICS ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 relative">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
            <div className="flex justify-center">
               <TabsList className="h-14 p-1.5 glass bg-white/5 border border-white/10 rounded-2xl backdrop-blur-2xl">
                  {['about', 'education', 'availability', 'reviews'].map(tab => (
                     <TabsTrigger key={tab} value={tab} className="px-8 h-full rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all">
                        {tab} Segment
                     </TabsTrigger>
                  ))}
               </TabsList>
            </div>

            <TabsContent value="about" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="glass-card p-10 rounded-[3rem] border-white/5 space-y-8">
                     <h3 className="text-3xl font-black italic tracking-tighter uppercase text-foreground leading-none">Diagnostic Summary</h3>
                     <p className="text-[15px] font-medium italic text-foreground/40 leading-relaxed tracking-tight">
                        {doctor.bio || "Null description. Node requires manual telemetry."}
                     </p>
                  </div>
                  <div className="space-y-6">
                     <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic">Deployment Compatibility</h4>
                        <div className="flex flex-wrap gap-2">
                           {doctor.consultation_types?.map(type => (
                              <Badge key={type} className="glass border-white/10 text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white/3">
                                 {type === 'online' ? <Video className="h-3 w-3 mr-2 text-indigo-500" /> : <Building className="h-3 w-3 mr-2 text-rose-500" />}
                                 {type} stream active
                              </Badge>
                           ))}
                        </div>
                     </div>
                     <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Neural Linguistics</h4>
                        <div className="flex flex-wrap gap-2">
                           {doctor.languages?.map(lang => (
                              <Badge key={lang} className="glass border-white/10 text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white/3">
                                 <Languages className="h-3 w-3 mr-2" />
                                 {lang} indexed
                              </Badge>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </TabsContent>
            
            {/* Additional TabContents would follow similar high-fidelity patterns */}
            <TabsContent value="education" className="animate-in fade-in duration-700">
               <div className="glass-card p-12 rounded-[3.5rem] border-white/5 grid md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                     <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl glass bg-rose-500/10 border-rose-500/20 text-rose-500"><GraduationCap className="h-8 w-8" /></div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Academic Index</h3>
                     </div>
                     <ul className="space-y-6">
                        {doctor.education?.map((edu, i) => (
                           <li key={i} className="flex gap-6 items-start group">
                              <span className="text-[10px] font-black text-rose-500/40 italic pt-1 group-hover:text-rose-500 transition-colors">[{i+1}]</span>
                              <p className="text-[14px] font-black italic text-foreground/40 leading-snug group-hover:text-foreground transition-colors uppercase tracking-tight">{edu}</p>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="space-y-12">
                     <div className="p-8 rounded-[2.5rem] glass border-white/10 bg-white/3">
                         <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic">Verified License Node</span>
                            <Shield className="h-5 w-5 text-emerald-500" />
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-white/5 pb-2">
                               <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Serial Identifier</span>
                               <span className="text-lg font-black italic tracking-tighter text-foreground uppercase">{doctor.license_number}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-2">
                               <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Operational Sector</span>
                               <span className="text-lg font-black italic tracking-tighter text-foreground uppercase">{doctor.license_country || "Global"}</span>
                            </div>
                         </div>
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="availability" className="animate-in fade-in duration-700">
                <div className="max-w-4xl mx-auto space-y-10">
                   <div className="flex items-center justify-between">
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">Operational Window</h3>
                       <Badge className="bg-rose-500 text-white border-0 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-lg shadow-rose-500/20">Real-time Telemetry</Badge>
                   </div>
                   <div className="grid gap-4">
                      {doctor.availability_schedule?.map((day, i) => (
                         <div key={i} className="group glass-card p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between hover:border-rose-500/40 transition-all duration-500">
                            <span className="text-2xl font-black italic tracking-tighter uppercase text-foreground/40 group-hover:text-foreground transition-colors">{day.day} Matrix</span>
                            <div className="flex gap-3">
                               {day.is_day_off ? (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/40 italic">Offline Mode</span>
                               ) : (
                                  day.slots.map((slot, j) => (
                                     <Badge key={j} className="h-10 px-6 glass bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                        {slot.start} — {slot.end}
                                     </Badge>
                                  ))
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
            </TabsContent>

            <TabsContent value="reviews" className="animate-in fade-in duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4 space-y-8">
                     <div className="p-12 rounded-[3.5rem] glass-card border-white/10 text-center space-y-6">
                        <p className="text-[80px] font-black italic tracking-tighter leading-none text-foreground">{doctor.rating_avg?.toFixed(1) || "5.0"}</p>
                        <div className="flex justify-center gap-2 text-amber-500">
                           {[...Array(5)].map((_, i) => <Star key={i} className="h-6 w-6 fill-current" />)}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic">{doctor.review_count || 0} Neural Impressions</p>
                     </div>
                  </div>
                  <div className="lg:col-span-8 space-y-6">
                     {reviews.length > 0 ? reviews.map((review, i) => (
                        <div key={i} className="glass-card p-10 rounded-[3rem] border-white/5 space-y-6">
                           <div className="flex justify-between items-start">
                              <div className="flex gap-6 items-center">
                                 <Avatar name={review.patient_name} className="h-14 w-14 rounded-2xl" />
                                 <div>
                                    <p className="text-xl font-black italic tracking-tighter uppercase text-foreground">{review.patient_name}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">{new Date(review.created_at).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <div className="flex gap-1 text-amber-500">
                                 {[...Array(review.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <p className="text-[11px] font-black uppercase tracking-widest text-rose-500 italic">{review.title}</p>
                              <p className="text-[14px] font-medium italic text-foreground/40 leading-relaxed">{review.comment}</p>
                           </div>
                        </div>
                     )) : (
                        <div className="py-20 text-center glass-card border-white/5 rounded-[3rem]">
                           <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">No neural logs identified for this node.</p>
                        </div>
                     )}
                  </div>
               </div>
            </TabsContent>
         </Tabs>
      </section>

    </div>
  );
};

export default DoctorProfile;
