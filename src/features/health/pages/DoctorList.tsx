// src/features/health/pages/DoctorList.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Calendar,
  Video,
  Building,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Activity,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { getVerifiedDoctors } from "../api/supabaseHealth";
import type { HealthDoctorProfile } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DoctorList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<HealthDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [consultationType, setConsultationType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  const isEmergency = searchParams.get("emergency") === "true";

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await getVerifiedDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Error loading doctors:", error);
      toast.error("Failed to load medical components.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors];
    if (isEmergency) filtered = filtered.filter((d) => d.emergency_availability);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.specialization.toLowerCase().includes(query) ||
          d.bio?.toLowerCase().includes(query) ||
          d.location?.toLowerCase().includes(query)
      );
    }
    if (selectedSpecialization !== "all") {
      filtered = filtered.filter((d) => d.specialization.toLowerCase() === selectedSpecialization.toLowerCase());
    }
    if (consultationType !== "all") {
      filtered = filtered.filter((d) => d.consultation_types?.includes(consultationType as any));
    }
    const feeField = isEmergency ? "emergency_fee" : "consultation_fee";
    filtered = filtered.filter((d) => (d[feeField] || 0) >= priceRange[0] && (d[feeField] || 0) <= priceRange[1]);

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating": return (b.rating_avg || 0) - (a.rating_avg || 0);
        case "fee_low": return (a[feeField] || 0) - (b[feeField] || 0);
        case "fee_high": return (b[feeField] || 0) - (a[feeField] || 0);
        case "experience": return (b.years_of_experience || 0) - (a.years_of_experience || 0);
        default: return 0;
      }
    });
    return filtered;
  }, [doctors, searchQuery, selectedSpecialization, sortBy, consultationType, priceRange, isEmergency]);

  const getSpecializationIcon = (specialization: string) => {
    const spec = specialization.toLowerCase();
    if (spec.includes("cardio")) return <Heart className="h-6 w-6 text-rose-500" />;
    if (spec.includes("neuro")) return <Brain className="h-6 w-6 text-indigo-500" />;
    if (spec.includes("ortho")) return <Bone className="h-6 w-6 text-amber-500" />;
    if (spec.includes("pediatric")) return <Baby className="h-6 w-6 text-emerald-500" />;
    if (spec.includes("eye")) return <Eye className="h-6 w-6 text-blue-500" />;
    return <Stethoscope className="h-6 w-6 text-rose-500" />;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialization("all");
    setConsultationType("all");
    setPriceRange([0, 500]);
    setSortBy("rating");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-6">
           <div className="w-20 h-20 glass bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.3)]">
              <Activity className="h-10 w-10 text-rose-500" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">Syncing Diagnostic Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      
      {/* ===== IMMERSIVE DIRECTORY HERO ===== */}
      <section className="relative px-6 lg:px-12 py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
           <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-16">
              <div className="space-y-6 max-w-2xl">
                 <div className="inline-flex items-center gap-3 px-4 py-2 glass bg-white/5 border border-white/10 rounded-2xl">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic">Personnel Database</span>
                 </div>
                 <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-[0.85] text-foreground">
                    Directory <br />
                    <span className="text-foreground/20">Index</span>
                 </h1>
                 <p className="text-lg font-medium italic text-foreground/40 leading-relaxed tracking-tight max-w-lg">
                    Real-time access to the elite diagnostic medical network. Filters applied for operational excellence.
                 </p>
              </div>

              <div className="w-full lg:w-[450px] space-y-4">
                 <div className="glass-card p-2 rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-3xl">
                    <div className="relative group/search">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500/40 group-focus-within/search:text-rose-500 transition-colors" />
                       <input
                          type="text"
                          placeholder="IDENTIFY SPECIALIST..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-16 pl-16 pr-6 bg-transparent border-0 text-[10px] font-black uppercase tracking-[0.3em] text-foreground placeholder:text-foreground/10 focus:ring-0 outline-none"
                       />
                       <Button 
                          onClick={() => setShowFilters(!showFilters)}
                          className={cn(
                            "absolute right-2 top-2 h-12 px-6 rounded-2xl glass transition-all",
                            showFilters ? "bg-rose-500 text-white" : "bg-white/5 text-foreground/40 hover:bg-white/10"
                          )}
                       >
                          <Filter className="h-4 w-4 mr-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                       </Button>
                    </div>
                 </div>
              </div>
           </div>

           {/* ===== FILTER MATRIX ===== */}
           {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
                 {[
                   { label: "Matrix Sector", value: selectedSpecialization, setter: setSelectedSpecialization, options: ["all", "cardiology", "neurology", "pediatrics", "orthopedics", "ophthalmology"] },
                   { label: "Session Mode", value: consultationType, setter: setConsultationType, options: ["all", "online", "in_clinic", "home_visit"] },
                   { label: "Deployment Cost", value: sortBy, setter: setSortBy, options: ["rating", "fee_low", "fee_high", "experience"] },
                 ].map((filter) => (
                    <div key={filter.label} className="glass-card p-6 rounded-[2rem] border-white/5">
                       <label className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 italic mb-4 block">{filter.label}</label>
                       <Select value={filter.value} onValueChange={filter.setter}>
                          <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl uppercase text-[10px] font-black tracking-widest">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-card rounded-2xl border-white/10">
                             {filter.options.map(opt => <SelectItem key={opt} value={opt} className="uppercase text-[10px] font-black tracking-widest">{opt.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                 ))}
                 <div className="glass-card p-6 rounded-[2rem] border-white/5 flex items-end">
                    <Button onClick={clearFilters} variant="ghost" className="w-full h-10 rounded-xl hover:bg-rose-500/10 text-rose-500 uppercase text-[10px] font-black tracking-widest">
                       Purge Filters
                    </Button>
                 </div>
              </div>
           )}

           {/* ===== RESULTS MATRIX ===== */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="group glass-card rounded-[3.5rem] border-white/5 hover:border-rose-500/40 transition-all duration-700 hover:-translate-y-2 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]">
                   <div className="relative h-48 bg-gradient-to-br from-rose-500/20 to-indigo-500/10 p-8 flex items-center justify-center">
                       <div className="absolute inset-0 bg-[url('https://grain-y.com/assets/images/noise.png')] opacity-10 pointer-events-none" />
                       <div className="p-6 glass bg-white/5 border border-white/10 rounded-[2.5rem] group-hover:scale-110 transition-transform duration-700 shadow-2xl relative z-10">
                          {getSpecializationIcon(doctor.specialization)}
                       </div>
                       {doctor.is_verified && (
                          <div className="absolute top-6 right-8 p-1.5 glass bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                             <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                       )}
                   </div>

                   <div className="p-10 space-y-8 relative">
                      <div>
                         <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-rose-500 transition-colors">
                            {doctor.specialization}
                         </h3>
                         <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">
                            <span>Lic: {doctor.license_number}</span>
                            <span className="w-1 h-1 rounded-full bg-rose-500/30" />
                            <span>{doctor.years_of_experience}+ Years Deployment</span>
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-foreground/40 italic text-sm leading-relaxed tracking-tight line-clamp-2">
                         {doctor.bio}
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                         <div>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">Session Cost</span>
                            <p className="text-3xl font-black italic tracking-tighter">${isEmergency ? doctor.emergency_fee : doctor.consultation_fee}</p>
                         </div>
                         <Button 
                            onClick={() => navigate(`/health/book/${doctor.id}${isEmergency ? '?emergency=true' : ''}`)}
                            className="h-14 px-8 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
                         >
                            Initialize
                            <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           {filteredDoctors.length === 0 && (
              <div className="py-40 text-center space-y-6">
                 <div className="w-24 h-24 glass bg-white/5 border border-white/10 rounded-[3rem] mx-auto flex items-center justify-center">
                    <Search className="h-10 w-10 text-foreground/10" />
                 </div>
                 <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground/20">No Component Identified</h2>
                 <Button onClick={clearFilters} variant="outline" className="rounded-2xl h-14 border-white/10 text-[10px] font-black uppercase tracking-widest">Reset Discovery</Button>
              </div>
           )}
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-40" />
    </div>
  );
};

export default DoctorList;
