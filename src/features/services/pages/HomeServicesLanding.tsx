// src/features/services/pages/HomeServicesLanding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wrench,
  Home,
  Shield,
  Zap,
  Droplets,
  Search,
  Star,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  Globe,
  Sparkles,
  Command,
  Sun,
  Wind,
  Phone,
  CheckCircle2,
  Lock,
  Box,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";

const HomeServicesLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const popularServices = [
    { label: "Emergency Repair", icon: Zap, color: "emerald", desc: "Response in <1Hr" },
    { label: "Plumbing Ops", icon: Droplets, color: "blue", desc: "Expert Hydraulics" },
    { label: "HVAC Climate", icon: Wind, color: "emerald", desc: "Smart Air Control" },
    { icon: Home, label: "Smart Home", val: "Installation", color: "emerald" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#020503] text-white selection:bg-emerald-500/30 overflow-x-hidden font-sans relative">
      <ServicesVerticalHeader />
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="h-full w-full bg-[linear-gradient(90deg,rgba(16,185,129,.03)_1px,transparent_1px),linear-gradient(0deg,rgba(16,185,129,.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#020503] via-transparent to-[#020503]" />
      </div>

      <div className="absolute top-0 right-0 w-[50%] h-[50%] translate-x-1/4 -translate-y-1/4 bg-emerald-500/10 rounded-full blur-[150px] animate-pulse z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] -translate-x-1/4 translate-y-1/4 bg-teal-500/10 rounded-full blur-[150px] animate-pulse delay-700 z-0 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 pt-40 pb-20 lg:pt-60 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 glass bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
             <Shield className="h-4 w-4 text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 italic uppercase">Certified Facility Maintenance</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-[0.85] animate-in fade-in zoom-in duration-1000 uppercase break-words px-4">
            OPTIMIZE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">LIVING MATRIX</span>
          </h1>

          <p className="max-w-2xl text-foreground/40 text-xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase tracking-widest leading-loose">
            Professional Grade Maintenance, Smart Home Installation, and Emergency Protocols for Your Residence. Securely Managed. Fully Verified.
          </p>

          <div className="relative w-full max-w-4xl group animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="glass-card flex flex-col items-center p-2 md:p-3 rounded-3xl md:rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative z-10 transition-all duration-700 hover:border-emerald-500/30 overflow-hidden">
               <div className="flex flex-col md:flex-row w-full mb-2 md:mb-0">
                  <div className="flex-1 flex items-center px-6 md:px-8 w-full border-b md:border-b-0 md:border-r border-white/5 h-16 md:h-24">
                     <MapPin className="h-5 md:h-6 w-5 md:w-6 text-emerald-500 border-r border-white/10 pr-4 md:pr-6 mr-4 md:mr-6 flex-shrink-0" />
                     <Input 
                       placeholder="ENTER LOCATION / ZIP"
                       className="bg-transparent border-none focus:ring-0 text-sm md:text-lg font-black uppercase tracking-widest placeholder:text-white/10 outline-none w-full"
                     />
                  </div>
                  <div className="flex-1 flex items-center px-6 md:px-8 w-full h-16 md:h-24">
                     <Wrench className="h-5 md:h-6 w-5 md:w-6 text-emerald-500/30 border-r border-white/10 pr-4 md:pr-6 mr-4 md:mr-6 flex-shrink-0" />
                     <Input 
                       placeholder="FIND SERVICE (PLUMBING, AC, ROOF...)"
                       className="bg-transparent border-none focus:ring-0 text-sm md:text-lg font-black uppercase tracking-widest placeholder:text-white/10 outline-none w-full"
                     />
                  </div>
               </div>
               <Button className="w-full h-16 md:h-24 px-12 rounded-2xl md:rounded-[2.2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.3em] text-[10px] md:text-xs transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group">
                 Locate Specialist
                 <Search className="ml-4 h-4 md:h-5 w-4 md:w-5 group-hover:scale-110 transition-transform" />
               </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-6 animate-in fade-in duration-1000">
             {popularServices.map((service, i) => (
               <div key={i} className="flex items-center gap-4 px-6 py-4 glass bg-white/5 border border-white/10 rounded-[2rem] group hover:border-emerald-500/50 cursor-pointer transition-all">
                  <service.icon className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-start text-left">
                     <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-emerald-500 leading-none">{service.label}</span>
                     {service.desc && <p className="text-[8px] font-black uppercase tracking-widest text-foreground/10 italic leading-none mt-1">{service.desc}</p>}
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Trust Grid Section */}
      <section className="px-6 py-40 relative z-10 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="grid md:grid-cols-3 gap-8">
             {[
               { icon: Clock, title: "EXPRESS RESPONSE", desc: "Dispatch under 60 minutes for emergency protocols." },
               { icon: Shield, title: "TRIPLE VERIFIED", desc: "Background checks, licensing, and insurance certifications." },
               { icon: Lock, title: "SECURE ESCROW", desc: "Payment released only after full satisfaction log." }
             ].map((box, i) => (
                <div key={i} className="glass-card p-12 rounded-[3.5rem] border border-white/5 bg-white/5 group hover:bg-white/10 transition-all duration-700">
                   <box.icon className="h-8 w-8 text-emerald-500 mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                   <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4">{box.title}</h3>
                   <p className="text-foreground/40 text-sm font-medium italic leading-relaxed uppercase tracking-widest leading-loose">{box.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-40 bg-white/5 relative border-y border-white/5 overflow-hidden z-10">
         <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-emerald-500/10 blur-[100px] rounded-full skew-x-12" />
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10 text-left">
            <div className="flex-1 space-y-10">
               <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                 Home Care, <br /> <span className="text-emerald-400">Re-Engineered.</span>
               </h2>
               <p className="text-foreground/40 text-lg font-medium leading-relaxed italic max-w-xl uppercase tracking-widest leading-loose">
                 Connect with the most reliable local technicians through our high-performance facility management nexus. Zero latency, total accountability.
               </p>
               <div className="flex gap-4">
                  <div className="p-6 glass border border-white/10 rounded-[2.5rem]">
                     <p className="text-4xl font-black italic tracking-tighter text-emerald-500">2,400+</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">Global Experts</p>
                  </div>
                  <div className="p-6 glass border border-white/10 rounded-[2.5rem]">
                     <p className="text-4xl font-black italic tracking-tighter text-emerald-500">99.8%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">SLA Compliance</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 w-full flex flex-col gap-4">
               {[
                 { label: "Emergency Breakdown", price: "Starts at $85", icon: Zap },
                 { label: "HVAC Maintenance", price: "Starts at $120", icon: Wind },
                 { label: "Smart Node Install", price: "Starts at $150", icon: Home },
                 { label: "Elite Deep Cleaning", price: "Starts at $90", icon: Sparkles },
               ].map((item, i) => (
                  <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 bg-black/20 flex items-center justify-between group hover:border-emerald-500/40 transition-all cursor-pointer">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5">
                           <item.icon className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">{item.label}</h4>
                     </div>
                     <div className="flex flex-col items-end">
                        <p className="text-xl font-black italic tracking-tighter text-emerald-500">{item.price}</p>
                        <ArrowRight className="h-4 w-4 text-foreground/10 group-hover:text-emerald-500 group-hover:translate-x-2 transition-all mt-1" />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default HomeServicesLanding;
