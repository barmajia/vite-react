// src/features/services/pages/ServicesSignupLanding.tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Code,
  Globe,
  Palette,
  Wrench,
  ArrowRight,
  Users,
  Sparkles,
  Shield,
  Zap,
  Star,
  Briefcase,
  ShoppingBag,
  Terminal,
  Activity,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";

const verticals = [
  {
    id: "programmer",
    icon: Code,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    bgGlow: "bg-cyan-500/10",
    borderGlow: "border-cyan-500/20",
    label: "Developer",
    desc: "Full-stack, DevOps, Mobile",
  },
  {
    id: "translator",
    icon: Globe,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
    borderGlow: "border-amber-500/20",
    label: "Translator",
    desc: "Localization, Interpretation",
  },
  {
    id: "designer",
    icon: Palette,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/10",
    borderGlow: "border-violet-500/20",
    label: "Designer",
    desc: "UI/UX, Branding, Motion",
  },
  {
    id: "home",
    icon: Wrench,
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    bgGlow: "bg-emerald-500/10",
    borderGlow: "border-emerald-500/20",
    label: "Home Services",
    desc: "Plumbing, Electrical, Repair",
  },
];

export function ServicesSignupLanding() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white selection:bg-primary/30 overflow-x-hidden font-sans relative">
      <ServicesVerticalHeader />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#020205] via-transparent to-[#020205]" />
      </div>

      <div className="absolute top-0 left-0 w-[60%] h-[60%] -translate-x-1/4 -translate-y-1/4 bg-primary/5 rounded-full blur-[150px] animate-pulse z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[60%] h-[60%] translate-x-1/4 translate-y-1/4 bg-blue-500/5 rounded-full blur-[150px] animate-pulse delay-700 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-20 lg:pt-60 lg:pb-40">
        {/* Header - Neural Entry */}
        <div className="text-center mb-24 space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-4 px-6 py-2.5 glass bg-white/5 border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
             <Terminal className="h-4 w-4 text-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 italic">
               {t('servicesNexus.signup.tagline')}
             </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.8] animate-in fade-in zoom-in duration-1000 uppercase">
            {t('servicesNexus.signup.title').split(' ')[0]} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
              {t('servicesNexus.signup.title').split(' ')[1]}
            </span>
          </h1>

          <p className="text-xl text-white/40 font-medium italic leading-relaxed uppercase tracking-[0.2em] max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t('servicesNexus.signup.subtitle')}
          </p>
        </div>

        {/* Path Selection Matrix */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Service Provider Path */}
          <div className="group relative glass-card p-12 lg:p-16 rounded-[4rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl transition-all duration-700 hover:border-primary/40 hover:-translate-y-4 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000">
               <Briefcase className="w-48 h-48 text-primary" />
            </div>
            
            <div className="relative z-10 space-y-10">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                     <Briefcase className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                       {t('servicesNexus.signup.provider.title')}
                     </h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 italic mt-2">
                       {t('servicesNexus.signup.provider.subtitle')}
                     </p>
                  </div>
               </div>

               <p className="text-white/40 text-lg font-medium italic leading-relaxed">
                 {t('servicesNexus.signup.provider.desc')}
               </p>

               {/* Sub-Path Grid */}
               <div className="grid grid-cols-2 gap-4">
                  {verticals.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => navigate(`/services/provider/signup?vertical=${v.id}`)}
                      className={cn(
                        "group/pill flex flex-col items-start gap-4 p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] transition-all duration-500 text-left hover:bg-white/[0.05]",
                        `hover:border-${v.color}-500/40`
                      )}
                    >
                       <v.icon className={cn("h-6 w-6 transition-all duration-500 group-hover/pill:scale-110 group-hover/pill:rotate-6", `text-${v.color}-500/40 group-hover/pill:text-${v.color}-500`)} />
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest">{v.label}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/10 italic group-hover/pill:text-white/20">{v.desc.split(',')[0]}</p>
                       </div>
                    </button>
                  ))}
               </div>

               <Button
                 onClick={() => navigate("/services/provider/signup?vertical=programmer")}
                 className="w-full h-20 rounded-[2.2rem] bg-primary text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20"
               >
                 {t('servicesNexus.signup.provider.cta')}
                 <ArrowRight className="ml-4 h-5 w-5" />
               </Button>
            </div>
          </div>

          {/* Client Path */}
          <div className="group relative glass-card p-12 lg:p-16 rounded-[4rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl transition-all duration-700 hover:border-blue-500/40 hover:-translate-y-4 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000">
               <ShoppingBag className="w-48 h-48 text-blue-500" />
            </div>

            <div className="relative z-10 space-y-10">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                     <ShoppingBag className="h-10 w-10 text-blue-400" />
                  </div>
                  <div>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                       {t('servicesNexus.signup.consumer.title')}
                     </h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/40 italic mt-2">
                       {t('servicesNexus.signup.consumer.subtitle')}
                     </p>
                  </div>
               </div>

               <p className="text-white/40 text-lg font-medium italic leading-relaxed">
                 {t('servicesNexus.signup.consumer.desc')}
               </p>

               {/* Benefits Matrix */}
               <div className="space-y-4">
                  {[
                    { icon: Star, label: t('servicesNexus.signup.benefits.compare'), desc: t('servicesNexus.signup.benefits.compareDesc') },
                    { icon: Shield, label: t('servicesNexus.signup.benefits.payments'), desc: t('servicesNexus.signup.benefits.paymentsDesc') },
                    { icon: Zap, label: t('servicesNexus.signup.benefits.booking'), desc: t('servicesNexus.signup.benefits.bookingDesc') },
                    { icon: Users, label: t('servicesNexus.signup.benefits.chat'), desc: t('servicesNexus.signup.benefits.chatDesc') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 group/benefit hover:bg-white/[0.04] transition-all">
                       <item.icon className="h-6 w-6 text-blue-400/40 group-hover/benefit:text-blue-400 transition-colors" />
                       <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-widest">{item.label}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/10 italic group-hover/benefit:text-white/20">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <Button
                 onClick={() => navigate("/signup")}
                 className="w-full h-20 rounded-[2.2rem] bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20"
               >
                 {t('servicesNexus.signup.consumer.cta')}
                 <ArrowRight className="ml-4 h-5 w-5" />
               </Button>
            </div>
          </div>
        </div>

        {/* System Terminal Footer */}
        <div className="mt-32 text-center space-y-8">
           <div className="flex items-center justify-center gap-12">
              <div className="flex items-center gap-3">
                 <Activity className="h-4 w-4 text-emerald-500" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">Node v18.2.1 Stable</span>
              </div>
              <div className="flex items-center gap-3">
                 <Shield className="h-4 w-4 text-primary" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">Encrypted TSL 1.3</span>
              </div>
              <div className="flex items-center gap-3">
                 <Layers className="h-4 w-4 text-blue-500" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">Nexus Core Reactive</span>
              </div>
           </div>
           
           <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20">
             Already established identity?{" "}
             <button
               onClick={() => navigate("/services/provider/login")}
               className="text-primary hover:text-white transition-colors underline underline-offset-8"
             >
               Sign in to Matrix
             </button>
           </p>
        </div>
      </div>
    </div>
  );
}
