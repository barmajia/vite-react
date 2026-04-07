// src/features/health/pages/PharmacyList.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock,
  Phone,
  Star,
  Filter,
  CheckCircle2,
  Truck,
  Pill,
  Shield,
  Navigation,
  Share2,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabaseHealth } from "../api/supabaseHealth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Pharmacy {
  id: string;
  user_id: string;
  pharmacy_name: string;
  license_number?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  operating_hours?: any;
  delivery_available: boolean;
  prescription_acceptance: boolean;
  insurance_accepted?: string[];
  is_verified: boolean;
  rating_avg?: number;
  review_count?: number;
  services?: string[];
}

import { HealthHeader } from "../components/HealthHeader";

const PharmacyList: React.FC = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "name">("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    deliveryAvailable: false,
    prescriptionAcceptance: false,
    verifiedOnly: false,
    openNow: false,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    fetchPharmacies();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err)
      );
    }
  };

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHealth
        .from("health_pharmacy_profiles")
        .select("*")
        .eq("is_verified", true);
      if (error) throw error;
      if (data) setPharmacies(data);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      toast.error("Failed to load pharmaceutical matrix.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isOpenNow = (operatingHours: any): boolean => {
    if (!operatingHours) return false;
    const now = new Date();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);
    const dayHours = operatingHours[currentDay];
    return !!(dayHours && dayHours.is_open && currentTime >= dayHours.open && currentTime <= dayHours.close);
  };

  const filteredPharmacies = useMemo(() => {
    let filtered = [...pharmacies];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.pharmacy_name.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q));
    }
    if (filters.deliveryAvailable) filtered = filtered.filter(p => p.delivery_available);
    if (filters.prescriptionAcceptance) filtered = filtered.filter(p => p.prescription_acceptance);
    if (filters.openNow) filtered = filtered.filter(p => isOpenNow(p.operating_hours));

    if (sortBy === "rating") filtered.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    else if (sortBy === "name") filtered.sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name));
    else if (sortBy === "distance" && userLocation) {
      filtered.sort((a, b) => {
        const dA = (a.latitude !== undefined && a.longitude !== undefined) ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude!, a.longitude!) : 999;
        const dB = (b.latitude !== undefined && b.longitude !== undefined) ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude!, b.longitude!) : 999;
        return dA - dB;
      });
    }
    return filtered;
  }, [pharmacies, searchQuery, filters, sortBy, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <HealthHeader />
        <div className="flex flex-col items-center gap-6">
           <div className="w-20 h-20 glass bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <Pill className="h-10 w-10 text-emerald-500" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">Scanning Pharmaceutical Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HealthHeader />
      
      {/* ===== IMMERSIVE PHARMACY HERO ===== */}
      <section className="relative px-6 lg:px-12 py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
           <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-16">
              <div className="space-y-6 max-w-2xl">
                 <div className="inline-flex items-center gap-3 px-4 py-2 glass bg-white/5 border border-white/10 rounded-2xl">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Global Distribution Matrix</span>
                 </div>
                 <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-[0.85] text-foreground">
                    Pharma <br />
                    <span className="text-foreground/20">Nexus</span>
                 </h1>
                 <p className="text-lg font-medium italic text-foreground/40 leading-relaxed tracking-tight max-w-lg">
                    Real-time telemetry for verified pharmaceutical nodes. Instant prescriptions, automated delivery protocols, and biological ledgering.
                 </p>
              </div>

              <div className="w-full lg:w-[450px] space-y-4">
                 <div className="glass-card p-2 rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-3xl">
                    <div className="relative group/search">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500/40 group-focus-within/search:text-emerald-500 transition-colors" />
                       <input
                          type="text"
                          placeholder="IDENTIFY NODE / SIGNAL..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-16 pl-16 pr-6 bg-transparent border-0 text-[10px] font-black uppercase tracking-[0.3em] text-foreground placeholder:text-foreground/10 focus:ring-0 outline-none"
                       />
                       <Button 
                          onClick={() => setShowFilters(!showFilters)}
                          className={cn(
                            "absolute right-2 top-2 h-12 px-6 rounded-2xl glass transition-all",
                            showFilters ? "bg-emerald-500 text-white" : "bg-white/5 text-foreground/40 hover:bg-white/10"
                          )}
                       >
                          <Filter className="h-4 w-4 mr-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Protocol</span>
                       </Button>
                    </div>
                 </div>
              </div>
           </div>

           {/* ===== FILTER MATRIX ===== */}
           {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                       <Checkbox id="delivery" checked={filters.deliveryAvailable} onCheckedChange={v => setFilters({...filters, deliveryAvailable: !!v})} />
                       <label htmlFor="delivery" className="text-[10px] font-black uppercase tracking-widest text-foreground/60 italic">Delivery Deployment</label>
                    </div>
                    <div className="flex items-center gap-3">
                       <Checkbox id="presc" checked={filters.prescriptionAcceptance} onCheckedChange={v => setFilters({...filters, prescriptionAcceptance: !!v})} />
                       <label htmlFor="presc" className="text-[10px] font-black uppercase tracking-widest text-foreground/60 italic">Ledger Acceptance</label>
                    </div>
                 </div>
                 <div className="glass-card p-6 rounded-[2rem] border-white/5">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 italic mb-4 block">Sequence Sort</label>
                    <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                       <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl uppercase text-[10px] font-black tracking-widest">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="rating" className="uppercase text-[10px] font-black tracking-widest">Elite Rating</SelectItem>
                          <SelectItem value="name" className="uppercase text-[10px] font-black tracking-widest">Alpha Sort</SelectItem>
                          {userLocation && <SelectItem value="distance" className="uppercase text-[10px] font-black tracking-widest">Proximity Node</SelectItem>}
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="glass-card p-6 rounded-[2rem] border-white/5 flex items-end">
                    <Button onClick={() => setFilters({deliveryAvailable: false, prescriptionAcceptance: false, verifiedOnly: false, openNow: false})} variant="ghost" className="w-full h-10 rounded-xl hover:bg-emerald-500/10 text-emerald-500 uppercase text-[10px] font-black tracking-widest">
                       Reset Protocol
                    </Button>
                 </div>
              </div>
           )}

           {/* ===== PHARMA GRID ===== */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredPharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="group glass-card rounded-[3.5rem] border-white/5 hover:border-emerald-500/40 transition-all duration-700 hover:-translate-y-2 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]">
                   <div className="relative h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-8 flex items-center justify-center">
                       <div className="absolute inset-0 bg-[url('https://grain-y.com/assets/images/noise.png')] opacity-10 pointer-events-none" />
                       <div className="p-6 glass bg-white/5 border border-white/10 rounded-[2.5rem] group-hover:scale-110 transition-transform duration-700 shadow-2xl relative z-10">
                          <Pill className="h-8 w-8 text-emerald-500" />
                       </div>
                       
                       <div className="absolute top-6 left-8">
                          <Badge className={cn("glass border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1", isOpenNow(pharmacy.operating_hours) ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-red-500 text-white")}>
                             {isOpenNow(pharmacy.operating_hours) ? "Operational" : "Offline"}
                          </Badge>
                       </div>

                       {pharmacy.is_verified && (
                          <div className="absolute top-6 right-8 p-1.5 glass bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                             <Shield className="h-4 w-4 text-emerald-500" />
                          </div>
                       )}
                   </div>

                   <div className="p-10 space-y-8 relative">
                      <div>
                         <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-emerald-500 transition-colors">
                            {pharmacy.pharmacy_name}
                         </h3>
                         <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">
                            <MapPin className="h-3 w-3" />
                            <span>{pharmacy.location}</span>
                            {userLocation && pharmacy.latitude !== undefined && pharmacy.longitude !== undefined && (
                               <span className="text-emerald-500">
                                  {calculateDistance(userLocation.latitude, userLocation.longitude, pharmacy.latitude, pharmacy.longitude).toFixed(1)}KM
                               </span>
                            )}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-4 text-foreground/40 italic text-sm">
                            <Truck className="h-4 w-4 text-emerald-500/40" />
                            <span>{pharmacy.delivery_available ? "Deployment protocol active" : "Node collection only"}</span>
                         </div>
                         <div className="flex items-center gap-4 text-foreground/40 italic text-sm">
                            <Phone className="h-4 w-4 text-emerald-500/40" />
                            <span>{pharmacy.phone || "Signal encrypted"}</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                         <div className="flex items-center gap-2 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-xl font-black italic tracking-tighter leading-none">{pharmacy.rating_avg?.toFixed(1) || "5.0"}</span>
                            <span className="text-[10px] text-foreground/10 uppercase font-black tracking-widest italic pt-1">({pharmacy.review_count || 0} reviews)</span>
                         </div>
                         <div className="flex gap-3">
                            <Button variant="ghost" size="icon" onClick={() => {
                               navigator.clipboard.writeText(window.location.href);
                               toast.success("Node coordinates copied.");
                            }} className="w-12 h-12 rounded-2xl glass hover:bg-emerald-500/10 text-emerald-500">
                               <Share2 className="h-5 w-5" />
                            </Button>
                            <Button 
                               onClick={() => navigate(`/health/pharmacy/${pharmacy.id}`)}
                               className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
                            >
                               Access
                               <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-40" />
    </div>
  );
};

export default PharmacyList;
