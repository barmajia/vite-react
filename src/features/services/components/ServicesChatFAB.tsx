// src/features/services/components/ServicesChatFAB.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Zap, 
  Users, 
  X,
  ChevronRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export const ServicesChatFAB = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const mockQuickConnect = [
    { id: "p1", name: "Dr. Aris Thorne", vertical: "Programmer", status: "online" },
    { id: "p2", name: "Sienna Vance", vertical: "Translator", status: "away" },
    { id: "p3", name: "Jaxom Rayne", vertical: "Designer", status: "online" }
  ];

  return (
    <div className="fixed bottom-10 right-10 z-[200]">
      {/* 🚀 Quick Connect Panel */}
      <div className={cn(
        "absolute bottom-24 right-0 w-[340px] sm:w-[400px] max-w-[90vw] glass bg-black/80 backdrop-blur-[50px] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 origin-bottom-right overflow-hidden",
        isOpen ? "scale-100 opacity-100 rotate-0 translate-y-0" : "scale-0 opacity-0 rotate-12 translate-y-10 pointer-events-none"
      )}>
        <div className="p-8 space-y-6">
           {/* Header */}
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary italic">{t('servicesNexus.fab.nexusLink')}</span>
                 </div>
                 <h2 className="text-2xl font-black italic tracking-tighter uppercase">{t('servicesNexus.fab.quickConnect')} <span className="text-foreground/40 italic">Connect</span></h2>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="h-12 w-12 rounded-2xl glass border-white/5 opacity-40 hover:opacity-100 transition-all hover:rotate-90"
              >
                 <X className="h-5 w-5" />
              </Button>
           </div>

           {/* Search Node */}
           <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-40 transition-opacity" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input 
                 placeholder={t('servicesNexus.fab.searchIdentification')} 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="h-16 pl-14 pr-6 bg-white/5 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-white/10 focus:bg-black/40 transition-all font-sans relative z-10"
              />
           </div>

           {/* Frequent Nodes */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-white/20">
                 <Users className="h-3 w-3" />
                 <span className="text-[8px] font-black uppercase tracking-widest italic">{t('servicesNexus.fab.frequentTransmissions')}</span>
              </div>
              <div className="space-y-3">
                 {mockQuickConnect.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        navigate(`/services/chat/${node.id}`);
                        setIsOpen(false);
                      }}
                      className="w-full glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/20 hover:translate-x-1 transition-all duration-500 group flex items-center justify-between"
                    >
                       <div className="flex items-center gap-4">
                          <div className="relative">
                             <Avatar name={node.name} className="h-12 w-12 rounded-xl border-2 border-white/5 group-hover:border-primary transition-all shadow-xl" />
                             <div className={cn(
                                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black",
                                node.status === 'online' ? "bg-emerald-500" : "bg-zinc-700"
                             )} />
                          </div>
                          <div className="text-left">
                             <h4 className="text-xs font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors">{node.name}</h4>
                             <p className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">{node.vertical}</p>
                          </div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </button>
                 ))}
              </div>
           </div>

           {/* Direct Action */}
           <div className="pt-2 border-t border-white/5">
              <Button 
                onClick={() => {
                  navigate("/services/chat");
                  setIsOpen(false);
                }}
                className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-[9px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                 {t('servicesNexus.fab.fullHub')} <Zap className="h-4 w-4 fill-black" />
              </Button>
           </div>
           
           <div className="flex items-center justify-center gap-3 opacity-20">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest italic">{t('servicesNexus.fab.vaultActive')}</span>
           </div>
        </div>
      </div>

      {/* 🔮 The FAB Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
           "h-20 w-20 rounded-full flex items-center justify-center shadow-[0_15px_40px_-5px_rgba(var(--primary),0.3)] transition-all duration-700 relative group",
           isOpen ? "bg-white rotate-[-45deg] scale-90" : "bg-primary hover:scale-110 hover:shadow-primary/50"
        )}
      >
         <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
         {isOpen ? (
            <Plus className="h-8 w-8 text-black" />
         ) : (
            <MessageSquare className="h-10 w-10 text-white group-hover:rotate-12 transition-all" />
         )}
         
         <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-black text-[10px] font-black rounded-lg flex items-center justify-center shadow-xl transform rotate-12 scale-100 group-hover:scale-110 transition-transform">2</div>
      </button>
    </div>
  );
};
