// src/features/health/pages/HealthLanding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  FileText,
  Pill,
  Ambulance,
  Video,
  Shield,
  ArrowRight,
  Search,
  Activity,
  HeartPulse,
  Sparkles,
  Zap,
  Globe,
  Database,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { HealthHeader } from "../components/HealthHeader";

const HealthLanding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const quickActions = [
    {
      title: "Diagnostic Node",
      icon: Stethoscope,
      path: "/health/doctors",
      color: "rose",
      description: "Initialize consultation with elite medical experts",
    },
    {
      title: "Biological Ledger",
      icon: FileText,
      path: "/health/patient/dashboard",
      color: "emerald",
      description: "Secure data mining for your medical histories",
      requiresAuth: true,
    },
    {
      title: "Pharmaceutical Matrix",
      icon: Pill,
      path: "/health/pharmacies",
      color: "blue",
      description: "Automated distribution for verified prescriptions",
    },
    {
      title: "Emergency Pulse",
      icon: Ambulance,
      path: "/health/doctors?emergency=true",
      color: "red",
      description: "Priority deployment for critical medical signals",
      urgent: true,
    },
  ];

  const coreAbilities = [
    {
      icon: Zap,
      title: "Instant Sync",
      description: "Deployment-ready medical scheduling with zero latency",
    },
    {
      icon: Video,
      title: "Neural Session",
      description: "High-bandwidth encrypted video consultations",
    },
    {
      icon: Lock,
      title: "Vault Privacy",
      description: "Military-grade encryption for patient data",
    },
    {
      icon: Globe,
      title: "Global Grid",
      description: "Cross-border network of certified specialists",
    },
    {
      icon: Database,
      title: "Data Integrity",
      description: "Real-time blockchain-verified health records",
    },
    {
      icon: Activity,
      title: "Life Stream",
      description: "Continuous telemetry for vital signal monitoring",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/health/doctors?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <HealthHeader />
      {/* Immersive Background Nodes */}
      <div
        className="absolute top-[5%] left-[-15%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-[5%] right-[-15%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse"
        style={{ animationDuration: "8s" }}
      />

      {/* ===== HERO COMPONENT ===== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32">
        <div className="glass-card rounded-[4rem] border-t-white/20 border-l-white/10 border-b-black/20 border-r-black/20 backdrop-blur-[50px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />

          <div className="px-8 sm:px-16 py-20 sm:py-24 relative z-10 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-10">
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="p-3 glass bg-white/10 border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                  <Activity className="h-6 w-6 text-rose-500 animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 italic">
                  Advanced Medical Core
                </span>
              </div>

              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter italic leading-[0.85] bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40">
                Biological <br />
                <span className="text-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
                  Excellence
                </span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/40 font-medium italic max-w-xl mx-auto lg:mx-0 leading-relaxed tracking-tight">
                Access the global matrix of verified medical professionals.
                Real-time diagnostics, encrypted biological ledgers, and
                priority deployments for all citizens.
              </p>

              <div className="relative max-w-2xl group/search">
                <form onSubmit={handleSearch} className="relative z-10">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-rose-500/50" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Identify Specialist / Signal / Node..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-20 pl-16 pr-44 rounded-3xl bg-black/40 backdrop-blur-3xl border-white/10 text-lg font-bold placeholder:text-white/10"
                  />
                  <Button
                    type="submit"
                    className="absolute right-3 top-3 h-14 px-8 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20"
                  >
                    Transmit
                  </Button>
                </form>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4">
                {[
                  { label: "Providers", val: "8.4K+", icon: Stethoscope },
                  { label: "Active Nodes", val: "1.2M", icon: Activity },
                  { label: "Success Rate", val: "99.9%", icon: Shield },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 glass bg-white/5 border border-white/5 rounded-xl flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-rose-500/40" />
                    </div>
                    <div>
                      <p className="text-xl font-black italic tracking-tighter leading-none">
                        {stat.val}
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-foreground/20 italic">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[450px] space-y-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => {
                    if (action.requiresAuth && !user) {
                      toast.error("Protocol requires authorization");
                      navigate("/login");
                      return;
                    }
                    navigate(action.path);
                  }}
                  className={cn(
                    "w-full group/btn relative p-8 glass-card rounded-[2.5rem] border-white/5 hover:border-rose-500/40 transition-all duration-500 text-left flex items-center gap-6 overflow-hidden",
                    action.urgent && "bg-rose-500/5",
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover/btn:scale-110",
                      `bg-${action.color}-500/10 border border-${action.color}-500/20 shadow-[0_0_20px_rgba(var(--${action.color}),0.1)]`,
                    )}
                  >
                    <action.icon
                      className={cn("h-6 w-6", `text-${action.color}-500`)}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black italic tracking-tighter leading-none mb-2">
                      {action.title}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 italic group-hover/btn:text-foreground/50 transition-colors">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-foreground/10 group-hover/btn:text-rose-500 group-hover/btn:translate-x-2 transition-all" />

                  {action.urgent && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                        Active Pulse
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CAPABILITIES SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32 relative z-10">
        <div className="text-center mb-24 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass bg-primary/10 border border-white/10 rounded-2xl">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">
              Protocol Advantages
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight">
            Aurora <span className="text-foreground/40">Bio-Systems</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {coreAbilities.map((ability) => (
            <div
              key={ability.title}
              className="group p-10 glass-card rounded-[3rem] border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="w-16 h-16 glass bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all duration-500">
                <ability.icon className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-4 group-hover:text-primary transition-colors">
                {ability.title}
              </h3>
              <p className="text-sm font-medium text-foreground/40 italic leading-relaxed tracking-tight mb-6">
                {ability.description}
              </p>
              <div className="h-1 w-12 bg-white/5 rounded-full group-hover:w-full group-hover:bg-primary/20 transition-all duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROFESSIONAL DEPLOYMENT CTA ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32 relative z-10">
        <div className="glass-card rounded-[4rem] bg-gradient-to-br from-rose-500 to-rose-700 border-white/20 p-16 sm:p-24 overflow-hidden relative group">
          <div className="absolute inset-0 bg-[url('https://grain-y.com/assets/images/noise.png')] opacity-20 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse" />

          <div className="max-w-3xl relative z-10 space-y-12">
            <div className="w-24 h-24 glass bg-white/20 border border-white/30 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
              <HeartPulse className="h-12 w-12 text-white" />
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-[0.85] text-white">
                Accelerate Your <br />
                <span className="text-white/40">Medical Practice</span>
              </h2>
              <p className="text-xl text-rose-100 font-medium italic leading-relaxed max-w-xl">
                Join the global grid of biological excellence. Access advanced
                telemetry, automated ledgering, and instant deployment
                protocols.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button
                size="xl"
                onClick={() => navigate("/health/doctor/signup")}
                className="bg-white text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-xs h-16 px-10 rounded-2xl shadow-2xl transition-all active:scale-95 group"
              >
                Register Component
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => navigate("/health/doctors")}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-black uppercase tracking-widest text-xs h-16 px-10 rounded-2xl backdrop-blur-xl"
              >
                Analyze Network
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-40" />
    </div>
  );
};

export default HealthLanding;
