// src/features/services/pages/TranslatorLanding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Languages,
  Book,
  FileText,
  Mic,
  MessageSquare,
  Search,
  Star,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
  Command,
  BookOpen,
  MapPin,
  CheckCircle2,
  Lock,
  Headphones,
  Award,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";

const TranslatorLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const languagePairs = [
    { from: "English", to: "Arabic", leads: "2.4K+" },
    { from: "German", to: "English", leads: "1.8K+" },
    { from: "French", to: "Spanish", leads: "1.2K+" },
    { from: "Japanese", to: "English", leads: "950+" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#060402] text-white selection:bg-amber-500/30 overflow-x-hidden font-sans relative">
      <ServicesVerticalHeader />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="h-full w-full bg-[linear-gradient(90deg,rgba(251,191,36,.03)_1px,transparent_1px),linear-gradient(0deg,rgba(251,191,36,.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#060402] via-transparent to-[#060402]" />
      </div>

      <div className="absolute top-0 left-0 w-[50%] h-[50%] -translate-x-1/4 -translate-y-1/4 bg-amber-500/10 rounded-full blur-[150px] animate-pulse z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] translate-x-1/4 translate-y-1/4 bg-orange-500/10 rounded-full blur-[150px] animate-pulse delay-700 z-0 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 pt-40 pb-20 lg:pt-60 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 glass bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
             <Globe className="h-4 w-4 text-amber-500 animate-spin-slow" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 italic uppercase">Linguistic Supremacy Active</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-[0.85] animate-in fade-in zoom-in duration-1000 uppercase break-words px-4">
            DECODE THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]">{t('servicesNexus.translator.title')}</span>
          </h1>

          <p className="max-w-2xl text-foreground/40 text-xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase tracking-widest leading-loose">
            {t('servicesNexus.translator.subtitle')}
          </p>

          <div className="relative w-full max-w-4xl group animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="glass-card flex flex-col items-center p-2 md:p-3 rounded-3xl md:rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative z-10 transition-all duration-700 hover:border-amber-500/30 overflow-hidden">
               <div className="flex flex-col md:flex-row w-full mb-2 md:mb-0">
                  <div className="flex-1 flex items-center px-6 md:px-8 w-full border-b md:border-b-0 md:border-r border-white/5 h-16 md:h-24">
                     <Languages className="h-5 md:h-6 w-5 md:w-6 text-amber-500 border-r border-white/10 pr-4 md:pr-6 mr-4 md:mr-6 flex-shrink-0" />
                     <Input 
                       placeholder={t('servicesNexus.translator.searchPlaceholder')}
                       className="bg-transparent border-none focus:ring-0 text-sm md:text-lg font-black uppercase tracking-widest placeholder:text-white/10 outline-none w-full"
                     />
                  </div>
                  <div className="flex-1 flex items-center px-6 md:px-8 w-full h-16 md:h-24">
                     <ArrowRight className="h-5 md:h-6 w-5 md:w-6 text-amber-500/30 border-r border-white/10 pr-4 md:pr-6 mr-4 md:mr-6 flex-shrink-0" />
                     <Input 
                       placeholder="To / Target Language"
                       className="bg-transparent border-none focus:ring-0 text-sm md:text-lg font-black uppercase tracking-widest placeholder:text-white/10 outline-none w-full"
                     />
                  </div>
               </div>
               <Button className="w-full h-16 md:h-24 px-12 rounded-2xl md:rounded-[2.2rem] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-[0.3em] text-[10px] md:text-xs transition-all shadow-xl shadow-amber-500/20 active:scale-95 group">
                 Locate Linguist
                 <Search className="ml-4 h-4 md:h-5 w-4 md:w-5 group-hover:scale-110 transition-transform" />
               </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-6 animate-in fade-in duration-1000">
             {languagePairs.map((pair, i) => (
               <div key={i} className="flex items-center gap-4 px-6 py-4 glass bg-white/5 border border-white/10 rounded-[2rem] group hover:border-amber-500/50 cursor-pointer transition-all">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-amber-500">{pair.from}</span>
                     <ArrowRight className="h-3 w-3 text-white/10 group-hover:text-amber-500/40" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white italic group-hover:text-amber-500">{pair.to}</span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black">{pair.leads} Nodes</Badge>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="px-6 py-40 border-t border-white/5 bg-white/[0.01] relative z-10">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { icon: BookOpen, title: "LITERARY NEXUS", desc: "Expert translation for journals, books, and creative manuscripts with semantic preservation." },
                 { icon: Headphones, title: "REAL-TIME SYNC", desc: "Simultaneous interpretation modules for global events and private protocols." },
                 { icon: Award, title: "LEGAL CERTIFIED", desc: "Triple-verified legal and sworn translations for official global compliance." }
               ].map((box, i) => (
                  <div key={i} className="glass-card p-12 rounded-[3.5rem] border border-white/5 bg-white/5 group hover:bg-white/10 transition-all duration-700">
                     <box.icon className="h-8 w-8 text-amber-500 mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4">{box.title}</h3>
                     <p className="text-foreground/40 text-sm font-medium italic leading-relaxed uppercase tracking-widest leading-loose">{box.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default TranslatorLanding;
