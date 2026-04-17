// src/features/services/layouts/ServicesLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";
import { Shield, Activity, Code, Globe, Palette, Wrench } from "lucide-react";
import { ServicesChatFAB } from "../components/ServicesChatFAB";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ServicesLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Basic loading simulation for consistency with other modules
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Determine current color theme
  const getThemeColor = () => {
    if (location.pathname.includes("/services/programmer")) return "cyan";
    if (location.pathname.includes("/services/translator")) return "amber";
    if (location.pathname.includes("/services/designer")) return "violet";
    if (location.pathname.includes("/services/home")) return "emerald";
    return "primary";
  };

  const getThemeClasses = (color: string) => {
    const themes: Record<string, string> = {
      cyan: "bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/30 text-cyan-500",
      amber: "bg-amber-500/10 border-amber-500/20 shadow-amber-500/30 text-amber-500",
      violet: "bg-violet-500/10 border-violet-500/20 shadow-violet-500/30 text-violet-500",
      emerald: "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/30 text-emerald-500",
      primary: "bg-primary/10 border-primary/20 shadow-primary/30 text-primary",
    };
    return themes[color] || themes.primary;
  };

  const themeColor = getThemeColor();
  const themeClasses = getThemeClasses(themeColor);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
         <div className={cn(
           "w-20 h-20 glass rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-1000 animate-float",
           themeClasses.split(' ').slice(0, 3).join(' ')
         )}>
            <Activity className={cn("h-10 w-10", themeClasses.split(' ').pop())} />
         </div>
         <p className="text-[11px] font-black uppercase tracking-[0.5em] text-foreground/40 animate-pulse">Establishing Neural Link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-8 p-12 glass rounded-[3rem] border-destructive/20 shadow-destructive/10">
          <div className="w-20 h-20 rounded-[2rem] glass bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto shadow-2xl">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-4">
             <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">Fatal Error</h2>
             <p className="text-sm text-muted-foreground leading-relaxed font-medium uppercase tracking-tight">{error}</p>
          </div>
          <Button
            onClick={() => navigate("/services")}
            className="h-14 w-full rounded-2xl bg-destructive text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-destructive/40 hover:scale-105 active:scale-95 transition-all"
          >
            Reconnect Terminal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 transition-colors duration-1000">
      <ServicesVerticalHeader />
      <main className="pt-24 min-h-screen">
        <Outlet />
      </main>
      
      {/* 💎 Premium Floating Module Navigator */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] hidden lg:block">
         <div className="p-3 glass rounded-full flex items-center gap-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/20">
             {[
               { icon: Code, color: "cyan", path: "/services/programmer", activeClass: "bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" },
               { icon: Globe, color: "amber", path: "/services/translator", activeClass: "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]" },
               { icon: Palette, color: "violet", path: "/services/designer", activeClass: "bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]" },
               { icon: Wrench, color: "emerald", path: "/services/home", activeClass: "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" },
             ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 relative group",
                    location.pathname.includes(item.path)
                      ? cn(item.activeClass, "text-white scale-110")
                      : "text-foreground/30 hover:text-foreground hover:bg-white/5 active:scale-90"
                  )}
                >
                   <item.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", location.pathname.includes(item.path) && "animate-pulse")} />
                   {location.pathname.includes(item.path) && (
                     <div className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                   )}
                </button>
             ))}
         </div>
      </div>
      
      <ServicesChatFAB />
    </div>
  );
};

export default ServicesLayout;
