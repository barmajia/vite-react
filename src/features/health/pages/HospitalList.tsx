// src/features/health/pages/HospitalList.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Phone,
  Filter,
  Building2,
  Shield,
  Share2,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Hospital {
  id: string;
  name: string;
  location?: string;
  phone?: string;
  email?: string;
  bio?: string;
  is_verified: boolean;
  created_at: string;
  logo_url?: string;
  specialization?: string;
}

const HospitalList: React.FC = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    verifiedOnly: false,
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      // First try to fetch from hospitals table
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("is_verified", true);

      if (error) {
        console.warn(
          "Hospitals table not found, falling back to health_facilities",
        );
        // Fallback: try health_facilities table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("health_facilities")
          .select("*")
          .eq("facility_type", "hospital")
          .eq("is_verified", true);

        if (fallbackError) throw fallbackError;
        if (fallbackData) {
          // Map fallback data to Hospital interface
          const mapped = fallbackData.map((f: any) => ({
            id: f.id,
            name: f.name || f.facility_name,
            location: f.location,
            phone: f.phone,
            email: f.email,
            bio: f.description || f.bio,
            is_verified: f.is_verified ?? true,
            created_at: f.created_at,
            logo_url: f.logo_url || f.image_url,
            specialization: f.specialization,
          }));
          setHospitals(mapped);
        }
      } else if (data) {
        setHospitals(data as Hospital[]);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      toast.error("Failed to load hospital matrix.");
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = useMemo(() => {
    let filtered = [...hospitals];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.full_name?.toLowerCase().includes(q) ||
          h.location?.toLowerCase().includes(q),
      );
    }
    if (filters.verifiedOnly) filtered = filtered.filter((h) => h.is_verified);

    if (sortBy === "name")
      filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
    else if (sortBy === "newest")
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    return filtered;
  }, [hospitals, searchQuery, filters, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 pt-20">
        <div className="w-20 h-20 glass bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.3)]">
          <Building2 className="h-10 w-10 text-rose-500" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">
          Scanning Facility Grid...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* ===== IMMERSIVE FACILITY HERO ===== */}
      <section className="relative px-6 lg:px-12 py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-16">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-4 py-2 glass bg-white/5 border border-white/10 rounded-2xl">
                <Activity className="h-4 w-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic">
                  Centralized Health Facilities
                </span>
              </div>
              <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-[0.85] text-foreground">
                Facility <br />
                <span className="text-foreground/20">Matrix</span>
              </h1>
              <p className="text-lg font-medium italic text-foreground/40 leading-relaxed tracking-tight max-w-lg">
                Real-time telemetry for verified hospital and clinic nodes.
                Advanced diagnostic centers, automated appointment scheduling,
                and full medical integration.
              </p>
            </div>

            <div className="w-full lg:w-[450px] space-y-4">
              <div className="glass-card p-2 rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-3xl">
                <div className="relative group/search">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500/40 group-focus-within/search:text-rose-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="IDENTIFY FACILITY NODE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 pl-16 pr-6 bg-transparent border-0 text-[10px] font-black uppercase tracking-[0.3em] text-foreground placeholder:text-foreground/10 focus:ring-0 outline-none"
                  />
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "absolute right-2 top-2 h-12 px-6 rounded-2xl glass transition-all",
                      showFilters
                        ? "bg-rose-500 text-white"
                        : "bg-white/5 text-foreground/40 hover:bg-white/10",
                    )}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Protocol
                    </span>
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
                  <Checkbox
                    id="verified"
                    checked={filters.verifiedOnly}
                    onCheckedChange={(v) =>
                      setFilters({ ...filters, verifiedOnly: !!v })
                    }
                  />
                  <label
                    htmlFor="verified"
                    className="text-[10px] font-black uppercase tracking-widest text-foreground/60 italic"
                  >
                    Verified Nodes Only
                  </label>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[2rem] border-white/5">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20 italic mb-4 block">
                  Sequence Sort
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as any)}
                >
                  <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl uppercase text-[10px] font-black tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="newest"
                      className="uppercase text-[10px] font-black tracking-widest"
                    >
                      Recent Matrix
                    </SelectItem>
                    <SelectItem
                      value="name"
                      className="uppercase text-[10px] font-black tracking-widest"
                    >
                      Alpha Sort
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="glass-card p-6 rounded-[2rem] border-white/5 flex items-end">
                <Button
                  onClick={() => setFilters({ verifiedOnly: false })}
                  variant="ghost"
                  className="w-full h-10 rounded-xl hover:bg-rose-500/10 text-rose-500 uppercase text-[10px] font-black tracking-widest"
                >
                  Reset Protocol
                </Button>
              </div>
            </div>
          )}

          {/* ===== FACILITY GRID ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="group glass-card rounded-[3.5rem] border-white/5 hover:border-rose-500/40 transition-all duration-700 hover:-translate-y-2 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]"
              >
                <div className="relative h-48 bg-gradient-to-br from-rose-500/20 to-indigo-500/10 p-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://grain-y.com/assets/images/noise.png')] opacity-10 pointer-events-none" />
                  <div className="p-6 glass bg-white/5 border border-white/10 rounded-[2.5rem] group-hover:scale-110 transition-transform duration-700 shadow-2xl relative z-10">
                    <Building2 className="h-8 w-8 text-rose-500" />
                  </div>

                  <div className="absolute top-6 left-8">
                    <Badge className="glass border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 text-foreground/60 shadow-lg">
                      Active Facility
                    </Badge>
                  </div>

                  {hospital.is_verified && (
                    <div className="absolute top-6 right-8 p-1.5 glass bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <Shield className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                </div>

                <div className="p-10 space-y-8 relative">
                  <div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-rose-500 transition-colors">
                      {hospital.name}
                    </h3>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">
                      <MapPin className="h-3 w-3 text-rose-500/40" />
                      <span>{hospital.location || "Sector Unspecified"}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-foreground/40 italic text-sm">
                      <Phone className="h-4 w-4 text-rose-500/40" />
                      <span>{hospital.phone || "Signal encrypted"}</span>
                    </div>
                    <div className="text-[11px] font-medium italic text-foreground/30 leading-snug line-clamp-2">
                      {hospital.bio ||
                        "No diagnostic array data available for this node."}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-black italic tracking-tighter leading-none uppercase">
                        Medical Node
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Facility coordinates copied.");
                        }}
                        className="w-12 h-12 rounded-2xl glass hover:bg-rose-500/10 text-rose-500"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() =>
                          navigate(`/health/hospitals/${hospital.user_id}`)
                        }
                        className="h-12 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 group"
                      >
                        Initialize
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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

export default HospitalList;
