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
           "w-20 h-20 glass border animate-pulse rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-700",
           themeClasses.split(' ').slice(0, 3).join(' ')
         )}>
            <Activity className={cn("h-10 w-10", themeClasses.split(' ').pop())} />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20 italic animate-pulse">Syncing Services Matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-8">
          <div className="w-24 h-24 rounded-[2.5rem] glass bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-2xl">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">Operational Failure</h2>
             <p className="text-sm font-medium italic text-foreground/40 leading-relaxed">{error}</p>
          </div>
          <Button
            onClick={() => navigate("/services")}
            className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
          >
            Reconnect Matrix
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-1000">
      <ServicesVerticalHeader />
      <main className="pt-24 min-h-screen">
        <Outlet />
      </main>
      
      {/* Bottom Floating Menu or Progress Indicator can go here */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] hidden lg:block">
         <div className="p-2 glass bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center gap-2 backdrop-blur-3xl shadow-2xl">
             {[
               { icon: Code, color: "cyan", path: "/services/programmer", activeClass: "bg-cyan-500 shadow-cyan-500/40" },
               { icon: Globe, color: "amber", path: "/services/translator", activeClass: "bg-amber-500 shadow-amber-500/40" },
               { icon: Palette, color: "violet", path: "/services/designer", activeClass: "bg-violet-500 shadow-violet-500/40" },
               { icon: Wrench, color: "emerald", path: "/services/home", activeClass: "bg-emerald-500 shadow-emerald-500/40" },
             ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-12 h-12 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                    location.pathname.includes(item.path)
                      ? cn(item.activeClass, "text-white shadow-lg")
                      : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                  )}
                >
                   <item.icon className="h-5 w-5" />
                </button>
             ))}
         </div>
      </div>
      
      {/* 🔮 Global Communication FAB */}
      <ServicesChatFAB />
    </div>
  );
};

export default ServicesLayout;
