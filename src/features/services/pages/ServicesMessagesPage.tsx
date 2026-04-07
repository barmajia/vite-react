// src/features/services/pages/ServicesMessagesPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowLeft,
  Clock,
  CheckCheck,
  Zap,
  Briefcase,
  ExternalLink,
  Loader2,
  Settings,
  Bell,
  Activity,
  History,
  Star,
  Users,
  Lock,
  Flag,
  Trash2,
  Share2,
  ChevronRight,
  GripVertical,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  type?: "text" | "system" | "milestone_update";
}

interface Conversation {
  id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: "active" | "archived" | "project";
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    status: "online" | "away" | "offline";
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    category?: string;
  };
}

export const ServicesMessagesPage = () => {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "projects" | "unread">("all");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // High-fidelity mock data mimicking WhatsApp's logical structure but Aurora's theme
        const mockConvos: Conversation[] = [
          {
            id: "conv_nexus_1",
            last_message: "The primary architecture manifest has been staged for production.",
            last_message_at: new Date().toISOString(),
            unread_count: 2,
            status: "project",
            other_user: { id: "u2", full_name: "Dr. Aris Thorne", avatar_url: null, status: "online" },
            listing: { id: "l1", title: "Neural Network Deployment", price: 3400, category: "Programmer" }
          },
          {
            id: "conv_lingua_2",
            last_message: "Sync confirmed. Localization matrix updated in the vault.",
            last_message_at: new Date(Date.now() - 5400000).toISOString(),
            unread_count: 0,
            status: "active",
            other_user: { id: "u3", full_name: "Sienna Vance", avatar_url: null, status: "away" },
            listing: { id: "l2", title: "Linguistic Transformation", price: 1200, category: "Translator" }
          },
          {
             id: "conv_design_3",
             last_message: "How many revisions are included in the Creative Sprint?",
             last_message_at: new Date(Date.now() - 86400000).toISOString(),
             unread_count: 0,
             status: "active",
             other_user: { id: "u4", full_name: "Jaxom Rayne", avatar_url: null, status: "offline" },
             listing: { id: "l3", title: "Visual Prototype Matrix", price: 850, category: "Designer" }
          }
        ];
        
        setConversations(mockConvos);
        
        if (conversationId) {
          const selected = mockConvos.find(c => c.id === conversationId);
          if (selected) {
            setActiveConversation(selected);
            setMessages([
              { id: "m0", sender_id: "system", content: t('servicesNexus.chat.systemEstablish'), created_at: new Date(Date.now() - 86400000).toISOString(), is_read: true, type: "system" },
              { id: "m1", sender_id: "u2", content: "Initializing protocol sequence for the Neural Network Deployment.", created_at: new Date(Date.now() - 3600000).toISOString(), is_read: true },
              { id: "m2", sender_id: "u2", content: "The primary architecture manifest has been staged for production.", created_at: new Date().toISOString(), is_read: false }
            ]);
          } else {
            setActiveConversation(null);
            setMessages([]);
          }
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      } catch (err: any) {
        toast.error("Shield Failure: Could not sync with Messaging Matrix");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, conversationId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    const msg: Message = {
      id: Math.random().toString(),
      sender_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
         <div className="glass-card p-12 rounded-[3.5rem] border-white/5 text-center space-y-8 max-w-lg">
            <MessageSquare className="h-20 w-20 text-primary mx-auto opacity-20 animate-pulse" />
            <div className="space-y-4">
               <h1 className="text-4xl font-black italic tracking-tighter uppercase">Communications <span className="text-primary italic">Vault</span></h1>
               <p className="text-foreground/40 text-sm font-medium italic">Identification required to access secure intelligence threads.</p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">Authorize Node Link</Button>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      
      {/* 🌌 Top Identity Bar (Aurora Matrix Header) */}
      <header className="h-24 glass bg-black/40 border-b border-white/5 flex items-center justify-between px-10 relative z-[100] shrink-0">
         <div className="flex items-center gap-8">
            <Link to="/services" className="h-14 w-14 glass border-white/5 flex items-center justify-center rounded-2xl group hover:border-primary/40 transition-all duration-500 hover:rotate-[-5deg]">
               <ArrowLeft className="h-5 w-5 text-foreground/40 group-hover:text-primary transition-all" />
            </Link>
            <div className="h-12 w-px bg-white/5" />
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Intelligence Network v2.4</span>
               </div>
               <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">The <span className="text-foreground/40 italic">Nexus</span> Hub</h1>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="relative group/search hidden lg:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/search:text-primary transition-colors" />
               <Input 
                 placeholder="{t('common.search')}" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-64 xl:w-96 h-14 pl-12 pr-6 bg-white/5 border-white/5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest placeholder:text-white/10 focus:bg-black/40 transition-all font-sans"
               />
            </div>
            <Button variant="ghost" className="h-14 w-14 p-0 rounded-2xl glass border-white/5 opacity-40 hover:opacity-100 hover:bg-white hover:text-black transition-all"><Bell className="h-5 w-5" /></Button>
            <Button variant="ghost" className="h-14 w-14 p-0 rounded-2xl glass border-white/5 opacity-40 hover:opacity-100 hover:bg-white hover:text-black transition-all"><Settings className="h-5 w-5" /></Button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* 📟 LEFT: Navigation Matrix (The WhatsApp-like Sidebar) */}
        <div className="w-[450px] shrink-0 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl relative z-50">
           
           {/* Filters & Status */}
           <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] italic">Active Nodes</h2>
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="h-10 px-4 rounded-xl glass border-white/5 text-[9px] font-black uppercase tracking-widest flex items-center gap-3">
                          <Filter className="h-3 w-3" /> {activeFilter.toUpperCase()}
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass-card rounded-2xl border-white/10 shadow-2xl">
                       <DropdownMenuItem onClick={() => setActiveFilter('all')} className="rounded-xl p-4 text-[9px] font-black uppercase tracking-widest focus:bg-primary/10">All Transmissions</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setActiveFilter('projects')} className="rounded-xl p-4 text-[9px] font-black uppercase tracking-widest focus:bg-primary/10">Project Deployments</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setActiveFilter('unread')} className="rounded-xl p-4 text-[9px] font-black uppercase tracking-widest focus:bg-primary/10">Unread Logs</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/5">
                 <Button onClick={() => setActiveFilter('all')} variant="ghost" className={cn("flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeFilter === 'all' ? "bg-white text-black" : "text-white/40 hover:text-white")}>ALL</Button>
                 <Button onClick={() => setActiveFilter('projects')} variant="ghost" className={cn("flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeFilter === 'projects' ? "bg-white text-black" : "text-white/40 hover:text-white")}>PROJECTS</Button>
                 <Button onClick={() => setActiveFilter('unread')} variant="ghost" className={cn("flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeFilter === 'unread' ? "bg-white text-black" : "text-white/40 hover:text-white")}>UNREAD</Button>
              </div>
           </div>
           
           {/* Conversation List */}
           <ScrollArea className="flex-1">
              <div className="px-6 pb-20 space-y-3">
                 {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => navigate(`/services/chat/${conv.id}`)}
                      className={cn(
                        "w-full glass-card p-6 rounded-[2.5rem] border border-white/5 text-left transition-all duration-700 relative overflow-hidden group",
                        conversationId === conv.id ? "bg-white/[0.08] border-primary/40 shadow-2xl scale-[1.02]" : "bg-white/[0.02] hover:bg-white/[0.05]"
                      )}
                    >
                       <div className="flex items-start gap-6 relative z-10">
                          <div className="relative">
                             <Avatar name={conv.other_user.full_name} className="h-16 w-16 rounded-[1.5rem] border-2 border-white/10 group-hover:border-primary transition-all shadow-xl" />
                             <div className={cn(
                                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                conv.other_user.status === 'online' ? "bg-emerald-500 animate-pulse" : conv.other_user.status === 'away' ? "bg-amber-500" : "bg-zinc-700"
                             )} />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                             <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black italic tracking-tighter uppercase text-white/90 group-hover:text-primary transition-colors truncate">{conv.other_user.full_name}</h3>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             
                             <p className={cn(
                                "text-[10px] font-medium italic line-clamp-1 leading-relaxed",
                                conv.unread_count > 0 ? "text-white font-bold" : "text-white/30"
                             )}>
                                {conv.unread_count > 0 && <span className="text-primary mr-1 italic">●</span>}
                                "{conv.last_message}"
                             </p>
                             
                             <div className="flex items-center justify-between pt-2">
                                <Badge className={cn(
                                   "text-[7px] font-black uppercase tracking-widest px-3 py-1 rounded-lg italic",
                                   conv.status === 'project' ? "bg-primary text-white" : "bg-white/5 text-white/30"
                                )}>
                                   {conv.status === 'project' ? "ELITE_PROJECT" : "SECTOR_LOG"}
                                </Badge>
                                {conv.unread_count > 0 && (
                                   <div className="bg-primary text-black text-[9px] font-black w-5 h-5 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary),0.4)]">
                                      {conv.unread_count}
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    </button>
                 ))}
                 
                 <Button variant="ghost" className="w-full h-20 rounded-[2.5rem] border border-dashed border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white hover:bg-white/5 transition-all">
                    START NEW ENCRYPTION
                 </Button>
              </div>
           </ScrollArea>
        </div>

        {/* 📬 RIGHT: Intelligence Thread (The Chat Window) */}
        <div className="flex-1 flex flex-col relative bg-[#050505]">
           
           {activeConversation ? (
              <>
                 {/* Thread Detail Header */}
                 <div className="h-24 px-12 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/60 backdrop-blur-3xl z-40 relative">
                    <div className="flex items-center gap-8">
                       <Avatar name={activeConversation.other_user.full_name} className="h-16 w-16 rounded-[1.5rem] border-2 border-white/20 shadow-2xl" />
                       <div className="space-y-1">
                          <div className="flex items-center gap-4">
                             <h2 className="text-2xl font-black italic tracking-tighter uppercase">{activeConversation.other_user.full_name}</h2>
                             <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase bg-emerald-500/5 px-3 py-1 italic tracking-widest">ENCRYPTED_NODE</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Status: <span className="text-primary italic uppercase">{activeConversation.other_user.status}</span></span>
                             <div className="h-3 w-px bg-white/10" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Node Hash: {activeConversation.other_user.id.slice(0, 12)}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-8">
                       <div className="text-right hidden xl:block">
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Operational Sector</p>
                          <p className="text-xs font-black text-primary uppercase tracking-widest italic leading-none">{activeConversation.listing?.title}</p>
                       </div>
                       <Button 
                         variant="ghost" 
                         onClick={() => activeConversation.status === 'project' && navigate(`/services/dashboard/project/${conversationId}`)}
                         className="h-14 w-14 p-0 glass border-white/10 hover:bg-white hover:text-black transition-all group rounded-2xl"
                       >
                          {activeConversation.status === 'project' ? <Briefcase className="h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
                       </Button>
                    </div>
                 </div>

                 {/* Real-time Message Stream */}
                 <ScrollArea className="flex-1 p-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] bg-fixed opacity-95">
                    <div className="max-w-4xl mx-auto space-y-12 pb-20">
                       <div className="flex justify-center my-10">
                          <span className="px-6 py-2 glass bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">Encryption Sequence Initialized: {new Date(activeConversation.last_message_at).toLocaleDateString()}</span>
                       </div>

                       {messages.map((msg) => (
                          <div key={msg.id} className={cn(
                             "flex flex-col gap-3 group/msg",
                             msg.sender_id === user?.id ? "ml-auto items-end" : "mr-auto items-start",
                             msg.type === 'system' && "mx-auto items-center !max-w-full"
                          )}>
                             
                             {msg.type === 'system' ? (
                                <div className="px-8 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                                   {msg.content}
                                </div>
                             ) : (
                                <>
                                 <div className={cn(
                                    "p-8 rounded-[2.5rem] text-sm font-medium italic leading-relaxed shadow-2xl relative transition-all duration-500",
                                    msg.sender_id === user?.id 
                                      ? "bg-primary text-white rounded-tr-none shadow-primary/20 hover:scale-[1.01]" 
                                      : "bg-white/[0.03] glass border border-white/5 text-white/90 rounded-tl-none hover:bg-white/[0.06]"
                                 )}>
                                    {msg.content}
                                    
                                    {/* Action Hover (WhatsApp-like logic) */}
                                    <div className={cn(
                                       "absolute top-4 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                                       msg.sender_id === user?.id ? "right-[-50px]" : "left-[-50px]"
                                    )}>
                                       <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg glass border-white/5 hover:bg-white/10">
                                          <DropdownMenu>
                                             <DropdownMenuTrigger asChild><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                                             <DropdownMenuContent align="start" className="glass-card rounded-2xl border-white/10">
                                                <DropdownMenuItem className="text-[10px] uppercase font-black tracking-widest p-4 gap-3"><History className="h-3 w-3" /> Reply Thread</DropdownMenuItem>
                                                <DropdownMenuItem className="text-[10px] uppercase font-black tracking-widest p-4 gap-3"><Star className="h-3 w-3" /> Archive Node</DropdownMenuItem>
                                                <DropdownMenuItem className="text-rose-500 text-[10px] uppercase font-black tracking-widest p-4 gap-3"><Trash2 className="h-3 w-3" /> Delete Trace</DropdownMenuItem>
                                             </DropdownMenuContent>
                                          </DropdownMenu>
                                       </Button>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 px-6 text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {msg.sender_id === user?.id && (
                                       <CheckCheck className={cn("h-4 w-4", msg.is_read ? "text-primary" : "text-white/20")} />
                                    )}
                                 </div>
                                </>
                             )}
                          </div>
                       ))}
                       <div ref={messageEndRef} />
                    </div>
                 </ScrollArea>

                 {/* Transmission Input Matrix */}
                 <div className="p-10 border-t border-white/5 bg-black/60 backdrop-blur-3xl shrink-0 z-50">
                    <div className="max-w-4xl mx-auto relative group">
                       <Input 
                         value={newMessage}
                         onChange={(e) => setNewMessage(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                         placeholder="INITIALIZE NEURAL TRANSMISSION..."
                         className="h-20 pl-10 pr-48 bg-white/[0.03] border-white/10 rounded-[2.5rem] text-sm font-medium italic placeholder:text-white/5 focus:border-primary/40 focus:ring-primary/20 transition-all font-sans"
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                          <Button variant="ghost" className="h-14 w-14 p-0 rounded-[1.5rem] text-white/20 hover:text-white hover:bg-white/10 transition-all"><Paperclip className="h-5 w-5" /></Button>
                          <Button 
                             onClick={handleSendMessage}
                             className="h-16 px-10 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                           >
                              {t('common.submit')} <Send className="h-4 w-4" />
                           </Button>
                       </div>
                    </div>
                    <div className="max-w-4xl mx-auto mt-4 px-6 flex justify-between items-center opacity-20 group-focus-within:opacity-40 transition-opacity">
                       <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest italic">
                          <span className="flex items-center gap-2"><Lock className="h-3 w-3" /> END-TO-END ENCRYPTED</span>
                          <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> GLOBAL SIGNAL OPTIMAL</span>
                       </div>
                       <span className="text-[8px] font-black uppercase tracking-widest italic">{newMessage.length} BIT CHARS</span>
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] bg-fixed opacity-95">
                 <div className="w-40 h-40 rounded-[3rem] glass bg-white/5 border border-white/10 flex items-center justify-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    <MessageSquare className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-700" />
                 </div>
                 <div className="space-y-6">
                    <h2 className="text-5xl font-black italic tracking-tighter uppercase">{t('servicesNexus.chat.title')} <span className="text-primary italic">Standby</span></h2>
                    <p className="text-white/20 text-lg font-medium italic max-w-sm mx-auto leading-relaxed">
                       {t('servicesNexus.chat.noMessages')}
                    </p>
                 </div>
                 <Button className="h-16 px-12 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all">Initialize Matrix Scan</Button>
              </div>
           )}
        </div>

        {/* 🛂 RIGHT: Context Matrix (WhatsApp Business features logic) */}
        {activeConversation && (
           <div className="w-[400px] hidden 2xl:flex flex-col bg-black/60 backdrop-blur-3xl shrink-0 p-10 space-y-12 border-l border-white/5 overflow-y-auto z-50">
              
              {/* Personnel Scan */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] italic">Personnel Profile</h3>
                 </div>
                 <div className="flex flex-col items-center text-center space-y-6">
                    <Avatar name={activeConversation.other_user.full_name} className="h-32 w-32 rounded-[2.5rem] border-4 border-white/5 shadow-2xl" />
                    <div className="space-y-2">
                       <h4 className="text-2xl font-black italic tracking-tighter uppercase">{activeConversation.other_user.full_name}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Elite Verified Member</p>
                    </div>
                    <div className="flex gap-4 w-full">
                       <Button variant="ghost" className="flex-1 h-14 rounded-2xl glass border-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest gap-2">
                          <Share2 className="h-4 w-4" /> Share
                       </Button>
                       <Button variant="ghost" className="flex-1 h-14 rounded-2xl glass border-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest gap-2">
                          <Flag className="h-4 w-4" /> Report
                       </Button>
                    </div>
                 </div>
              </div>

              {/* Related Sector Ops */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] italic">Sector Operations</h3>
                 </div>
                 <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6 group hover:border-primary/20 transition-all duration-700">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Primary Sector Listing</p>
                    <h4 className="text-xl font-black italic tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">{activeConversation.listing?.title}</h4>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                       <span className="text-2xl font-black italic tracking-tighter text-foreground">${activeConversation.listing?.price}</span>
                       <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl glass border-white/5 hover:bg-primary hover:text-black transition-all">
                          <ExternalLink className="h-4 w-4" />
                       </Button>
                    </div>
                 </div>
              </div>

              {/* Shared Assets/Intelligence (WhatsApp Logic: Media) */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <History className="h-5 w-5 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] italic">Shared Assets</h3>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                       <div key={i} className="aspect-square rounded-2xl glass bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-all cursor-pointer">
                          <Paperclip className="h-5 w-5 text-white/20 group-hover:text-white transition-all" />
                       </div>
                    ))}
                 </div>
                 <Button variant="ghost" className="w-full h-12 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white italic">Scan All Documentation <ChevronRight className="h-3 w-3 ml-2" /></Button>
              </div>

           </div>
        )}

      </div>
    </div>
  );
};
