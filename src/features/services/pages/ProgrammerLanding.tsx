// src/features/services/pages/ProgrammerLanding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Code,
  Terminal,
  Cpu,
  Layers,
  Database,
  Cloud,
  Github,
  Search,
  Star,
  Users,
  MessageSquare,
  Zap,
  Shield,
  Layout,
  Share2,
  Bookmark,
  ArrowRight,
  TrendingUp,
  Globe,
  Sparkles,
  Command,
  Activity,
  Box,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";

interface Developer {
  id: string;
  name: string;
  specialization: string;
  tech_stack: string[];
  rating: number;
  review_count: number;
  hourly_rate: number;
  image_url?: string;
  is_verified: boolean;
}

const ProgrammerLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data for initial design validation
  const featuredDevelopers: Developer[] = [
    {
      id: "1",
      name: "Alex Thorne",
      specialization: "Full Stack Architect",
      tech_stack: ["React", "Rust", "PostgreSQL", "Go"],
      rating: 5.0,
      review_count: 124,
      hourly_rate: 85,
      is_verified: true,
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop"
    },
    {
      id: "2",
      name: "Sienna Rayne",
      specialization: "Mobile Development Lead",
      tech_stack: ["Flutter", "Swift", "Firebase", "Node.js"],
      rating: 4.9,
      review_count: 89,
      hourly_rate: 75,
      is_verified: true,
      image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop"
    },
    {
      id: "3",
      name: "Marcus Vane",
      specialization: "Cloud Infrastructure Specialist",
      tech_stack: ["AWS", "Terraform", "Kubernetes", "Python"],
      rating: 4.8,
      review_count: 56,
      hourly_rate: 95,
      is_verified: true,
      image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans relative">
      <ServicesVerticalHeader />
      
      {/* Matrix Particle Background Effect (CSS only) */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="h-full w-full bg-[linear-gradient(90deg,rgba(0,255,255,.05)_1px,transparent_1px),linear-gradient(0deg,rgba(0,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#020205] via-transparent to-[#020205]" />
      </div>

      {/* Hero Section - The Matrix Link */}
      <section className="relative px-6 pt-40 pb-20 lg:pt-60 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 glass bg-cyan-500/10 border border-cyan-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
             <Terminal className="h-4 w-4 text-cyan-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 italic">{t('servicesNexus.programmer.verification', 'Neural Link Established')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-[0.85] animate-in fade-in zoom-in duration-1000 uppercase break-words px-4">
            COMPILE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">VIRTUAL FLEET</span>
          </h1>

          <p className="max-w-2xl text-foreground/40 text-xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase tracking-widest">
            {t('servicesNexus.programmer.subtitle')}
          </p>

          <div className="relative w-full max-w-4xl group animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[3.5rem] blur opacity-20 group-hover:opacity-40 transition-all duration-700" />
            <div className="glass-card flex flex-col md:flex-row items-center p-2 md:p-3 rounded-3xl md:rounded-[3.5rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative z-10 transition-all duration-700 overflow-hidden">
               <div className="hidden md:flex pl-8 pr-4">
                  <Search className="h-7 w-7 text-cyan-500/50 group-focus-within:text-cyan-500 transition-colors" />
               </div>
               <input 
                 type="text" 
                 placeholder={t('servicesNexus.programmer.searchPlaceholder')}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full flex-1 bg-transparent border-none focus:ring-0 text-lg md:text-2xl font-black italic uppercase tracking-tighter placeholder:text-white/10 h-16 md:h-24 outline-none px-6 md:px-0"
               />
               <Button className="w-full md:w-auto h-16 md:h-24 px-8 md:px-12 rounded-2xl md:rounded-[2.5rem] bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-[0.3em] text-[10px] md:text-xs transition-all shadow-xl shadow-cyan-500/20 active:scale-95">
                 Execute Search
               </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Matrix */}
      <section className="px-6 py-20 relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
               {[
                 { label: "Active Nodes", val: "2,481+", icon: Cpu },
                 { label: "Execution Success", val: "99.98%", icon: Zap },
                 { label: "Secure Protocols", val: "AES-256", icon: Shield },
                 { label: "Global Latency", val: "14ms", icon: Activity }
               ].map((stat, i) => (
                 <div key={i} className="flex flex-col items-center lg:items-start space-y-3 group">
                    <stat.icon className="h-6 w-6 text-cyan-500/40 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
                    <p className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase">{stat.val}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">{stat.label}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Featured Developers - Elite Personalities */}
      <section className="px-6 py-40 relative z-10">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-cyan-500/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 italic">Available Deployments</span>
               </div>
               <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none uppercase">Elite <span className="text-foreground/40 italic">Personnel</span></h2>
            </div>
            <Button variant="ghost" className="h-16 px-8 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 hover:bg-cyan-500/10 gap-3">
               Explore Full Catalog <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {featuredDevelopers.map((dev) => (
              <div 
                key={dev.id} 
                className="group relative glass-card p-10 rounded-[3rem] border border-white/5 hover:border-cyan-500/30 bg-white/[0.03] transition-all duration-700 hover:-translate-y-4 shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000">
                  <Code className="w-32 h-32 text-cyan-500" />
                </div>
                
                <div className="relative z-10 space-y-8 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                     <div className="relative">
                        <div className="absolute -inset-3 bg-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                        <img 
                          src={dev.image_url} 
                          alt={dev.name} 
                          className="w-24 h-24 rounded-2xl border-2 border-white/5 object-cover relative z-10 grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none group-hover:text-cyan-400 transition-colors uppercase">{dev.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">{dev.specialization}</p>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {dev.tech_stack.map((tech) => (
                      <Badge key={tech} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic">{tech}</Badge>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-cyan-500 fill-cyan-500" />
                        <span className="text-xl font-black italic tracking-tighter">{dev.rating.toFixed(1)}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase">({dev.review_count} OPS)</span>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Rate</p>
                        <p className="text-2xl font-black italic tracking-tighter text-foreground">${dev.hourly_rate}<span className="text-sm opacity-40">/HR</span></p>
                     </div>
                  </div>

                  <Button className="w-full h-16 rounded-2xl bg-white text-black hover:bg-cyan-500 hover:text-white font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all duration-500">
                     Initialize Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Matrix Categories */}
      <section className="px-6 py-40 border-t border-white/5 bg-white/[0.01]">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
               <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">{t('servicesNexus.programmer.categoriesTitle', 'Technological Domains')}</h2>
               <p className="text-foreground/40 text-lg italic max-w-xl mx-auto">Select a primary sector to filter elite personnel specialized in specialized digital environments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { title: "Web Architecture", icon: Globe, count: "1,204 Nodes", color: "from-blue-500 to-cyan-500" },
                 { title: "Systems Engineering", icon: Monitor, count: "892 Nodes", color: "from-indigo-500 to-blue-500" },
                 { title: "Cloud Ops", icon: Cloud, count: "542 Nodes", color: "from-blue-600 to-indigo-600" },
                 { title: "AI/Neural Systems", icon: Sparkles, count: "215 Nodes", color: "from-cyan-600 to-blue-700" }
               ].map((cat, i) => (
                 <div key={i} className="group glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-white/20 bg-white/[0.02] cursor-pointer transition-all duration-500 relative overflow-hidden">
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-700", cat.color)} />
                    <cat.icon className="h-8 w-8 text-cyan-500/40 group-hover:text-cyan-500 mb-6 transition-all group-hover:scale-110" />
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-1">{cat.title}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">{cat.count}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default ProgrammerLanding;
