// src/features/services/pages/ProviderDashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Briefcase, 
  DollarSign, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Users, 
  TrendingUp, 
  Search,
  Settings,
  Bell,
  Code,
  Globe,
  Palette,
  Wrench,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  slug: string;
  category_slug: string;
  price_numeric: number;
  status: string;
  created_at: string;
}

export function ProviderDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [vertical, setVertical] = useState<string>("generic");
  const [stats, setStats] = useState({
    totalEarnings: 12450.00,
    totalOrders: 42,
    conversionRate: 12.4,
    responseRate: 98
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Fetch Listings
        const { data: listingsData, error: listingsError } = await supabase
          .from("svc_listings")
          .select("*")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });

        if (listingsError) throw listingsError;
        setListings(listingsData || []);

        // 2. Identify Vertical from specialized tables
        const tables = [
          { name: "svc_programmer_profiles", vertical: "programmer" },
          { name: "svc_translator_profiles", vertical: "translator" },
          { name: "svc_designer_profiles", vertical: "designer" },
          { name: "svc_home_service_profiles", vertical: "home" }
        ];

        for (const table of tables) {
          const { data, error } = await supabase
            .from(table.name)
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
            
          if (data) {
            setVertical(table.vertical);
            break;
          }
        }
      } catch (err: any) {
        toast.error("Shield Failure: Could not sync with Matrix Data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
         <div className="glass-card p-12 rounded-[3rem] border-white/5 text-center space-y-8 max-w-lg">
            <ShieldCheck className="h-16 w-16 text-rose-500 mx-auto opacity-20" />
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Auth <span className="text-rose-500">Denied</span></h1>
            <p className="text-foreground/40 text-sm font-medium italic">Identity signature required to access the Secure Command Dashboard.</p>
            <Button onClick={() => navigate("/login")} className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs">Authorize Access</Button>
         </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
         <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">Connecting to Neural Grid...</p>
         </div>
      </div>
    );
  }

  const verticalTheme = {
    programmer: { color: "cyan", icon: Code, label: "DEV OPS HUB" },
    translator: { color: "amber", icon: Globe, label: "LINGUA NODE" },
    designer: { color: "violet", icon: Palette, label: "CREATIVE CORE" },
    home: { color: "emerald", icon: Wrench, label: "SYSTEMS OP" }
  }[vertical] || { color: "primary", icon: LayoutDashboard, label: "SERVICE CENTER" };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-40 relative overflow-hidden font-sans">
      
      {/* Matrix Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className={cn("absolute top-0 right-0 w-[40%] h-[40%] blur-[150px] opacity-10 rounded-full", `bg-${verticalTheme.color}-500/20`)} />
         <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className={cn("h-px w-8", `bg-${verticalTheme.color}-500/40`)} />
                 <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic", `text-${verticalTheme.color}-500`)}>{verticalTheme.label}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">Command <span className="text-foreground/40 italic">Matrix</span></h1>
           </div>

           <div className="flex gap-4 w-full md:w-auto">
              <Button variant="ghost" className="w-14 h-14 rounded-2xl glass border-white/5 opacity-40 hover:opacity-100"><Bell className="h-5 w-5" /></Button>
              <Button variant="ghost" className="w-14 h-14 rounded-2xl glass border-white/5 opacity-40 hover:opacity-100"><Settings className="h-5 w-5" /></Button>
              <Button 
                onClick={() => navigate("/services/dashboard/create-listing")}
                className={cn(
                  "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all duration-500 active:scale-95 flex items-center gap-3",
                  `bg-${verticalTheme.color}-500 hover:bg-${verticalTheme.color}-600 shadow-${verticalTheme.color}-500/20`
                )}
              >
                 <Plus className="h-4 w-4" /> Initialize New Sector
              </Button>
           </div>
        </div>

        {/* Specialized High-Fidelity Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
           {[
             { label: "NET_REVENUE", value: `$${stats.totalEarnings.toLocaleString()}`, change: "+14.2%", icon: DollarSign, color: "emerald" },
             { label: "OPS_ACTIVE", value: stats.totalOrders.toString(), change: "+3 NEW", icon: Zap, color: "primary" },
             { label: "TRUST_INDEX", value: `${stats.conversionRate}%`, change: "OPTIMAL", icon: ShieldCheck, color: "cyan" },
             { label: "LATENCY", value: `${stats.responseRate}%`, change: "FAST_SYNC", icon: Clock, color: "amber" }
           ].map((stat, i) => (
             <div key={i} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative group bg-white/5 transition-all duration-500 hover:translate-y-[-5px]">
                <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700", `text-${stat.color}-500`)}>
                   <stat.icon className="w-16 h-16" />
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">{stat.label}</span>
                      <stat.icon className={cn("h-4 w-4 opacity-40", `text-${stat.color}-500`)} />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{stat.value}</h3>
                      <div className="flex items-center gap-2">
                         <TrendingUp className={cn("h-3 w-3", `text-${stat.color}-500`)} />
                         <span className={cn("text-[9px] font-black uppercase tracking-widest", `text-${stat.color}-500`)}>{stat.change}</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           
           {/* Main Feed: Active Sectors */}
           <div className="lg:col-span-8 space-y-12">
              
              <div className="flex items-center justify-between px-4">
                 <div className="flex items-center gap-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic">Active Operational Sectors</h2>
                 </div>
                 <div className="flex gap-4">
                    <Button variant="ghost" className="h-10 w-10 p-0 glass border-white/5 opacity-40 hover:opacity-100"><Filter className="h-4 w-4" /></Button>
                    <Button variant="ghost" className="h-10 w-10 p-0 glass border-white/5 opacity-40 hover:opacity-100"><Search className="h-4 w-4" /></Button>
                 </div>
              </div>

              {listings.length > 0 ? (
                <div className="space-y-6">
                   {listings.map((listing) => (
                      <div key={listing.id} className="group glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-xl">
                         <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                         
                         <div className="w-24 h-24 rounded-3xl glass bg-black/20 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-700 overflow-hidden relative">
                            {/* Listing Thumbnail Logic Here */}
                            <verticalTheme.icon className="h-8 w-8 text-white/5 group-hover:text-primary transition-colors" />
                         </div>

                         <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="space-y-1">
                               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black uppercase tracking-widest px-3 py-1">DEPLOYED</Badge>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 italic tracking-tighter">NODE_ID: {listing.id.slice(0, 8)}</span>
                               </div>
                               <h3 className="text-2xl font-black italic tracking-tighter uppercase group-hover:text-primary transition-colors">{listing.title}</h3>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                               <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> UPTIME: 324D</div>
                               <div className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="h-3 w-3" /> SYSTEM_OPTIMAL</div>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-center md:text-right">
                               <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Sector Value</p>
                               <p className="text-3xl font-black italic tracking-tighter text-foreground">${listing.price_numeric?.toLocaleString() || "???"}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              onClick={() => navigate(`/services/listing/${listing.slug}`)}
                              className="w-14 h-14 rounded-2xl glass border-white/5 hover:bg-white hover:text-black transition-all group/btn"
                            >
                               <ArrowUpRight className="h-6 w-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </Button>
                         </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="glass-card p-20 rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
                   <div className="w-24 h-24 rounded-full glass bg-white/5 flex items-center justify-center mx-auto opacity-20">
                      <LayoutDashboard className="h-10 w-10 text-white" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase">No Active <span className="text-primary">Sectors</span></h3>
                      <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto leading-relaxed">Your command grid is currently empty. Initialize your first vertical sector to start receiving project nodes.</p>
                   </div>
                   <Button 
                     onClick={() => navigate("/services/dashboard/create-listing")}
                     className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl"
                   >
                     Initialize First Sector
                   </Button>
                </div>
              )}

           </div>

           {/* Sidebar: Vertical-Specific Control Matrix */}
           <div className="lg:col-span-4 sticky top-40 space-y-8">
              
              <div className="glass-card p-10 rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                 <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r", `from-${verticalTheme.color}-500/50 to-transparent`)} />
                 
                 <div className="space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 italic">Neural Sync</p>
                           <h3 className="text-3xl font-black italic tracking-tighter uppercase">{vertical.toUpperCase()} <span className={cn("italic", `text-${verticalTheme.color}-500`)}>MATRIX</span></h3>
                        </div>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", `bg-${verticalTheme.color}-500/10 border-${verticalTheme.color}-500/20 text-${verticalTheme.color}-500`)}>
                           <verticalTheme.icon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="space-y-8">
                       {vertical === 'programmer' && (
                          <div className="space-y-6">
                             <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">Repo Synchronization</span>
                                   <span className="text-[9px] font-black text-emerald-500 uppercase italic">ACTIVE</span>
                                </div>
                                <Progress value={85} className="h-1.5 bg-white/5" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl glass bg-white/5 border-white/5 text-center">
                                   <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Open PRs</p>
                                   <p className="text-xl font-black italic tracking-tighter">12</p>
                                </div>
                                <div className="p-4 rounded-2xl glass bg-white/5 border-white/5 text-center">
                                   <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Code Health</p>
                                   <p className="text-xl font-black italic tracking-tighter text-cyan-500">98%</p>
                                </div>
                             </div>
                          </div>
                       )}

                       {vertical === 'translator' && (
                          <div className="space-y-6">
                             <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">Linguistic Capacity</span>
                                   <span className="text-[9px] font-black text-amber-500 uppercase italic">OPTIMAL</span>
                                </div>
                                <Progress value={62} className="h-1.5 bg-white/5" />
                             </div>
                             <div className="p-6 rounded-3xl glass bg-white/5 border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black italic tracking-widest">
                                   <span className="text-white/40 italic uppercase">EN-AR</span>
                                   <span className="text-amber-500 tracking-tighter text-lg uppercase italic">High Demand</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black italic tracking-widest border-t border-white/5 pt-4">
                                   <span className="text-white/40 italic uppercase">FR-EN</span>
                                   <span className="text-white/60 tracking-tighter text-lg uppercase italic italic">Steady</span>
                                </div>
                             </div>
                          </div>
                       )}

                       <div className="space-y-4">
                          <Button variant="ghost" className="w-full h-16 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-[0.2em] italic gap-3">
                             <MessageSquare className="h-4 w-4" /> Unresolved Comms (4)
                          </Button>
                          <Button variant="ghost" className="w-full h-16 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-[0.2em] italic gap-3">
                             <Users className="h-4 w-4" /> Personnel Network
                          </Button>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4 text-white/10 group cursor-pointer hover:text-white/40 transition-colors">
                           <ExternalLink className="h-4 w-4" />
                           <p className="text-[9px] font-black uppercase tracking-widest italic">View Public Portfolio Node</p>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Quick Actions Card */}
              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6">
                 <div className="flex items-center gap-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest italic outline-none">Global Compliance</h3>
                 </div>
                 <p className="text-[10px] font-medium text-foreground/40 italic leading-relaxed">System node is compliant with Aurora Ecosystem Protocol v4.0. No critical security patches required.</p>
                 <Button variant="ghost" className={cn("w-full h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 hover:bg-white hover:text-black transition-all", `hover:border-${verticalTheme.color}-500/50`)}>Run Security Scan</Button>
              </div>

           </div>

        </div>

      </div>
    </div>
  );
}

export default ProviderDashboardPage;
