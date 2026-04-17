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
       <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-6">
             <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
             <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Loading Workspace...</p>
          </div>
       </div>
     );
  }

  const isProvider = user?.id === project?.provider?.user_id;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* Top Header Navigation */}
      <header className="h-16 glass bg-white/5 border-b border-border flex items-center justify-between px-6 relative z-[100] shrink-0">
         <div className="flex items-center gap-4">
            <Button 
               variant="ghost" 
               onClick={() => navigate(-1)}
               className="h-9 w-9 p-0 rounded-lg hover:bg-white/5"
            >
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-px bg-border" />
            <div className="space-y-0.5">
               <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0">SECURE PROJECT</Badge>
                  <span className="text-[10px] text-muted-foreground uppercase tabular-nums">ID: {projectId?.slice(0, 8)}</span>
               </div>
               <h1 className="text-sm font-bold tracking-tight">{project?.listing?.title}</h1>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 mr-4">
               <div className="text-right">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase">Status</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Secure Connection</p>
               </div>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <Avatar name={project?.provider?.provider_name} className="h-9 w-9 border border-border rounded-lg" />
            <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg"><MoreVertical className="h-4 w-4" /></Button>
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
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                 {msg.sender_id === user?.id ? "Client" : "Partner"}
                              </span>
                              <span className="text-[9px] text-muted-foreground/50">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        )}
                        <div className={cn(
                           "p-4 rounded-2xl text-[13px] leading-relaxed",
                           msg.sender_id === user?.id 
                             ? "bg-primary text-primary-foreground shadow-lg rounded-tr-none" 
                             : msg.sender_id === 'system'
                               ? "bg-muted text-[10px] uppercase font-bold tracking-wider"
                               : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
                        )}>
                           {msg.content}
                        </div>
                    </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           {/* Input Area */}
            <div className="p-6 border-t border-border bg-background/50 shrink-0">
               <div className="max-w-3xl mx-auto relative group">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="h-12 pl-6 pr-24 bg-background border-border rounded-xl text-[13px] focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
                     <Button 
                       onClick={handleSendMessage}
                       size="icon"
                       className="h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-all"
                     >
                        <Send className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
            </div>
        </div>

        {/* RIGHT: Management Section */}
        <div className="w-[380px] hidden xl:flex flex-col bg-card/30 backdrop-blur-xl shrink-0 p-6 space-y-8 overflow-y-auto border-l border-border">
           
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider">Project Overview</h2>
                 </div>
                 <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-white/5"><Info className="h-3.5 w-3.5 text-muted-foreground" /></Button>
              </div>

              <div className="glass-card p-6 rounded-2xl border-border bg-card/50 space-y-5 shadow-sm">
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Overall Progress</span>
                       <span className="text-lg font-bold tabular-nums">32%</span>
                    </div>
                    <Progress value={32} className="h-1.5" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                       <p className="text-[9px] font-medium uppercase text-muted-foreground mb-1">Contract Value</p>
                       <p className="text-base font-bold tabular-nums">{project?.currency} {project?.agreed_price?.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                       <p className="text-[9px] font-medium uppercase text-muted-foreground mb-1">Active Phases</p>
                       <p className="text-base font-bold text-emerald-500 tabular-nums">1 / {milestones.length}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6 flex-1">
              <div className="flex items-center gap-2.5">
                 <Layers className="h-4 w-4 text-primary" />
                 <h2 className="text-[11px] font-bold uppercase tracking-wider">Milestones</h2>
              </div>
              
              <div className="space-y-3">
                 {milestones.map((milestone, idx) => (
                    <div key={milestone.id} className={cn(
                       "group glass-card p-5 rounded-2xl bg-card/40 border border-border relative overflow-hidden transition-all duration-300",
                       milestone.status === 'approved' ? "opacity-50" : "hover:border-primary/20"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className={cn("w-7 h-7 rounded-lg glass bg-muted flex items-center justify-center text-[11px] font-bold", milestone.status === 'approved' && "text-emerald-500")}>
                                  {milestone.status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                               </div>
                               <h4 className="text-[13px] font-bold tracking-tight">{milestone.title}</h4>
                            </div>
                            <span className="text-[9px] font-medium text-muted-foreground uppercase">{milestone.dueDate || "TBD"}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-border/50 pt-3">
                           <div className="space-y-0.5">
                              <p className="text-[9px] font-medium text-muted-foreground uppercase">Phase Value</p>
                              <p className="text-base font-bold tabular-nums">{project?.currency} {milestone.amount.toLocaleString()}</p>
                           </div>
                           
                           {isProvider ? (
                              milestone.status === 'pending' && (
                                 <Button size="sm" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">Submit Phase</Button>
                              )
                           ) : (
                              milestone.status === 'submitted' && (
                                 <Button size="sm" className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide">Approve & Release</Button>
                              )
                           )}
                        </div>
                    </div>
                 ))}
                 
                 <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-border text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    Request Change
                 </Button>
              </div>
           </div>

           <div className="space-y-4 pb-8 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="h-4 w-4 text-emerald-500" />
                 <h3 className="text-[10px] font-bold uppercase tracking-wider">Secure Escrow Protection</h3>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Your transaction is protected. Funds are held securely in escrow and only released when milestones are verified and approved.</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectWorkspace;
