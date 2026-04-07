// src/features/services/pages/ProjectWorkspace.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Info, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  Layers, 
  Zap, 
  ExternalLink, 
  ArrowLeft,
  ChevronRight,
  GripVertical,
  Activity,
  Package,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "pending" | "submitted" | "approved";
}

export const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!user || !projectId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("svc_orders")
          .select(`
            *,
            listing:svc_listings (id, title, provider_id),
            provider:svc_providers (id, provider_name, user_id)
          `)
          .eq("id", projectId)
          .single();

        if (error) throw error;
        setProject(data);
        setMilestones(data.metadata?.milestones || []);
        
        // Mock messages for UI fidelity
        setMessages([
          { id: "1", sender_id: "system", content: "Protocol Initialized. Secure Project Workspace connected.", created_at: new Date().toISOString() },
          { id: "2", sender_id: data.provider.user_id, content: "Ready to start the deployment. I'll begin with Phase 1 architecture.", created_at: new Date().toISOString() }
        ]);

      } catch (err: any) {
        toast.error("Link Failure: Could not synchronize with Workspace Node");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [user, projectId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    const msg: Message = {
      id: Math.random().toString(),
      sender_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString()
    };
    setMessages([...messages, msg]);
    setNewMessage("");
    // In production, sync with Supabase Realtime here
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center space-y-6">
             <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">Synchronizing Neural Workspace...</p>
          </div>
       </div>
     );
  }

  const isProvider = user?.id === project?.provider?.user_id;

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Top Header Navigation */}
      <header className="h-20 glass bg-black/40 border-b border-white/5 flex items-center justify-between px-8 relative z-[100] shrink-0">
         <div className="flex items-center gap-6">
            <Button 
               variant="ghost" 
               onClick={() => navigate(-1)}
               className="h-10 w-10 p-0 rounded-xl glass border-white/5 opacity-40 hover:opacity-100 transition-all"
            >
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-10 w-px bg-white/5" />
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black uppercase tracking-[0.3em] px-2 py-0.5">PROJECT_SECURE</Badge>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter italic">ID: {projectId?.slice(0, 12)}</span>
               </div>
               <h1 className="text-sm font-black italic tracking-tighter uppercase leading-none">{project?.listing?.title}</h1>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 mr-6">
               <div className="text-right">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Workspace Status</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">Connection Optimal</p>
               </div>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <Avatar name={project?.provider?.provider_name} className="h-10 w-10 border border-white/10 rounded-xl" />
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl glass border-white/5 opacity-40 hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Chat Section */}
        <div className="flex-1 flex flex-col relative border-r border-white/5">
           <ScrollArea className="flex-1 p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                 {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                       "flex flex-col gap-2 max-w-[80%]",
                       msg.sender_id === user?.id ? "ml-auto items-end" : "mr-auto items-start",
                       msg.sender_id === 'system' && "mx-auto items-center text-center opacity-40"
                    )}>
                       {msg.sender_id !== 'system' && (
                          <div className="flex items-center gap-3 mb-1">
                             <span className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">
                                {msg.sender_id === user?.id ? "Client Node" : "Provider Node"}
                             </span>
                             <span className="text-[8px] font-black text-white/10">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                       )}
                       <div className={cn(
                          "p-6 rounded-[2rem] text-sm font-medium italic leading-relaxed",
                          msg.sender_id === user?.id 
                            ? "bg-primary text-white shadow-2xl shadow-primary/20 rounded-tr-none" 
                            : msg.sender_id === 'system'
                              ? "bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest"
                              : "bg-white/5 glass border border-white/5 text-white/80 rounded-tl-none shadow-xl"
                       )}>
                          {msg.content}
                       </div>
                    </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           {/* Input Area */}
           <div className="p-8 border-t border-white/5 bg-black/20 shrink-0">
              <div className="max-w-3xl mx-auto relative group">
                 <Input 
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Transmit intelligence to workspace node..."
                   className="h-16 pl-8 pr-32 bg-white/5 border-white/5 rounded-[2rem] text-sm font-medium italic placeholder:text-white/10 focus:border-primary/40 focus:ring-primary/10 transition-all font-sans"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl text-white/20 hover:text-white hover:bg-white/5"><Paperclip className="h-4 w-4" /></Button>
                    <Button 
                      onClick={handleSendMessage}
                      className="h-12 w-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                       <Send className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: Management Matrix */}
        <div className="w-[450px] hidden xl:flex flex-col bg-black/40 backdrop-blur-3xl shrink-0 p-8 space-y-10 overflow-y-auto border-l border-white/5">
           
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic outline-none">Operational Metrics</h2>
                 </div>
                 <Button variant="ghost" className="h-8 w-8 p-0 glass border-white/5 opacity-40 hover:opacity-100"><Info className="h-3 w-3" /></Button>
              </div>

              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6 shadow-2xl">
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Total Project Completion</span>
                       <span className="text-xl font-black italic tracking-tighter text-primary">32%</span>
                    </div>
                    <Progress value={32} className="h-2 bg-white/5 border border-white/5" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                       <p className="text-[7px] font-black uppercase tracking-widest text-white/10 mb-1">Contract Value</p>
                       <p className="text-lg font-black italic tracking-tighter text-foreground">{project?.currency} {project?.agreed_price?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                       <p className="text-[7px] font-black uppercase tracking-widest text-white/10 mb-1">Active Phases</p>
                       <p className="text-lg font-black italic tracking-tighter text-emerald-500">1 / {milestones.length}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-8 flex-1">
              <div className="flex items-center gap-3">
                 <Layers className="h-5 w-5 text-primary" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic outline-none">Deployment Roadmap</h2>
              </div>
              
              <div className="space-y-4">
                 {milestones.map((milestone, idx) => (
                    <div key={milestone.id} className={cn(
                       "group glass-card p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 relative overflow-hidden transition-all duration-500",
                       milestone.status === 'approved' ? "opacity-40" : "hover:bg-white/[0.07] hover:scale-[1.02]"
                    )}>
                        <div className="flex items-center justify-between pointer-events-none mb-4">
                            <div className="flex items-center gap-3">
                               <div className={cn("w-8 h-8 rounded-xl glass bg-white/5 border-white/5 flex items-center justify-center text-[10px] font-black italic", milestone.status === 'approved' && "text-emerald-500")}>
                                  {milestone.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                               </div>
                               <h4 className="text-sm font-black italic tracking-tighter uppercase leading-none">{milestone.title}</h4>
                            </div>
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{milestone.dueDate || "TBD"}</span>
                        </div>
                        
                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                           <div className="space-y-1">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Phase Value</p>
                              <p className="text-xl font-black italic tracking-tighter leading-none">{project?.currency} {milestone.amount.toLocaleString()}</p>
                           </div>
                           
                           {isProvider ? (
                              milestone.status === 'pending' && (
                                 <Button size="sm" className="h-10 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Submit Phase</Button>
                              )
                           ) : (
                              milestone.status === 'submitted' && (
                                 <Button size="sm" className="h-10 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Verify & Pay</Button>
                              )
                           )}
                        </div>
                    </div>
                 ))}
                 
                 <Button variant="ghost" className="w-full h-16 rounded-[2rem] border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white hover:bg-white/5 transition-all">
                    Initialize Change Order
                 </Button>
              </div>
           </div>

           <div className="space-y-6 pb-12 pt-10 border-t border-white/5">
              <div className="flex items-center gap-4">
                 <ShieldCheck className="h-5 w-5 text-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest italic outline-none">Vault Protection v4</h3>
              </div>
              <p className="text-[10px] font-medium text-foreground/40 italic leading-relaxed">System identity verified. Secure escrow channel is active. Funds are encrypted and held until milestone verification.</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectWorkspace;
