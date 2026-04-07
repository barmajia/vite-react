// src/features/services/pages/DesignerLanding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Palette,
  Layout,
  Search,
  Star,
  Zap,
  Shield,
  ArrowRight,
  TrendingUp,
  Globe,
  Sparkles,
  Command,
  Pencil,
  Image,
  Eye,
  Maximize,
  MessageSquare,
  Brush,
  Camera,
  Layers,
  Monitor,
  Figma
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";

const DesignerLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const styles = ["Minimalist", "Cyberpunk", "Bauhaus", "Brutalist", "Glassmorphism", "Neo-Retro", "Swiss"];

  return (
    <div className="min-h-screen w-full bg-[#050205] text-white selection:bg-pink-500/30 overflow-x-hidden font-sans relative">
      <ServicesVerticalHeader />
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="h-full w-full bg-[linear-gradient(90deg,rgba(236,72,153,.03)_1px,transparent_1px),linear-gradient(0deg,rgba(236,72,153,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#050205] via-transparent to-[#050205]" />
      </div>

      <div className="absolute top-0 right-0 w-[60%] h-[60%] translate-x-1/4 -translate-y-1/4 bg-pink-500/10 rounded-full blur-[150px] animate-pulse z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] -translate-x-1/4 translate-y-1/4 bg-violet-500/10 rounded-full blur-[150px] animate-pulse delay-700 z-0 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 pt-40 pb-20 lg:pt-60 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 glass bg-pink-500/10 border border-pink-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
             <Palette className="h-4 w-4 text-pink-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 italic">{t('servicesNexus.designer.verification', 'Aesthetic Matrix Active')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-[0.85] animate-in fade-in zoom-in duration-1000 uppercase break-words px-4">
            DESIGN THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.4)]">{t('servicesNexus.designer.title')}</span>
          </h1>

          <p className="max-w-2xl text-foreground/40 text-xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase tracking-widest leading-loose">
            {t('servicesNexus.designer.subtitle')}
          </p>

          <div className="relative w-full max-w-4xl group animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="glass-card flex flex-col md:flex-row items-center p-2 md:p-3 rounded-3xl md:rounded-[3.5rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative z-10 transition-all duration-700 hover:border-pink-500/30 overflow-hidden">
               <div className="hidden md:flex pl-8 pr-4">
                  <Search className="h-7 w-7 text-pink-500/50 group-focus-within:text-pink-500 transition-colors" />
               </div>
               <input 
                 type="text" 
                 placeholder={t('servicesNexus.designer.searchPlaceholder')}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full flex-1 bg-transparent border-none focus:ring-0 text-lg md:text-2xl font-black italic uppercase tracking-tighter placeholder:text-white/10 h-16 md:h-24 outline-none px-6 md:px-0"
               />
               <Button className="w-full md:w-auto h-16 md:h-24 px-8 md:px-12 rounded-2xl md:rounded-[2.5rem] bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-black uppercase tracking-[0.3em] text-[10px] md:text-xs transition-all shadow-xl shadow-pink-500/20 active:scale-95">
                 Execute Vision
               </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4 animate-in fade-in duration-1000">
             {styles.map((style) => (
               <Badge key={style} className="px-6 py-3 rounded-2xl border-white/10 glass bg-white/5 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10 cursor-pointer transition-all">
                 {style}
               </Badge>
             ))}
          </div>
        </div>
      </section>

      {/* Grid Portfolio Section */}
      <section className="px-6 py-40 relative z-10">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-px w-12 bg-pink-500/40" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 italic">Curated Artifacts</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none uppercase">Visual <span className="text-foreground/40 italic">Excellence</span></h2>
             </div>
             <Button variant="ghost" className="h-16 px-8 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 hover:bg-pink-500/10 gap-3 uppercase">
                Explore Museum <ArrowRight className="h-4 w-4" />
             </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group relative glass-card aspect-[4/5] rounded-[3.5rem] border border-white/5 overflow-hidden transition-all duration-1000 hover:-translate-y-4 hover:border-pink-500/30 shadow-2xl">
                 <img 
                   src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000}?q=80&w=800&auto=format&fit=crop`}
                   className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                   alt="Design Artifact"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                 
                 <div className="absolute inset-0 p-10 flex flex-col justify-end transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 italic">Project Node 0{i}</p>
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Aesthetic Dimension</h3>
                       <div className="flex items-center justify-between pt-6 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/10 glass flex items-center justify-center">
                                <Figma className="h-4 w-4 text-pink-500" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">UX Architect</span>
                          </div>
                          <Button variant="ghost" className="w-12 h-12 rounded-full glass border-white/10 hover:bg-pink-500 text-white p-0">
                             <ArrowRight className="h-5 w-5" />
                          </Button>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Matrix */}
      <section className="px-6 py-40 border-t border-white/5 bg-white/[0.01] relative z-10">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
               <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">Modalities of <span className="text-pink-500">Creation</span></h2>
               <p className="text-foreground/40 text-lg italic max-w-xl mx-auto uppercase tracking-widest leading-loose">Filter by specialization to connect with specialized aesthetic nodes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { title: "UI/UX Systems", icon: Figma, count: "842 Nodes", color: "from-pink-500 to-violet-500" },
                 { title: "Brand Identity", icon: Sparkles, count: "615 Nodes", color: "from-violet-500 to-indigo-500" },
                 { title: "3D Visualization", icon: Layers, count: "328 Nodes", color: "from-indigo-600 to-pink-600" },
                 { title: "Motion Matrix", icon: Zap, count: "192 Nodes", color: "from-pink-600 to-violet-700" }
               ].map((cat, i) => (
                 <div key={i} className="group glass-card p-10 rounded-[3rem] border border-white/5 hover:border-pink-500/20 bg-white/[0.02] cursor-pointer transition-all duration-500 relative overflow-hidden">
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-700", cat.color)} />
                    <cat.icon className="h-10 w-10 text-pink-500/40 group-hover:text-pink-500 mb-8 transition-all group-hover:scale-110" />
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2">{cat.title}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">{cat.count}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default DesignerLanding;
