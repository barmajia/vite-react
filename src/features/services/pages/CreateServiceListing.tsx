// src/features/services/pages/CreateServiceListing.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Info, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Globe, 
  Palette, 
  Code, 
  Wrench,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CreateServiceListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price_min: "",
    listing_type: "service_package",
    currency: "USD",
    metadata: {
      tags: [] as string[],
      delivery_time: "3-5 Business Days",
      specialized_stats: {} as any
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("svc_categories")
        .select("id, name, slug")
        .order("name");
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const selectedCategorySlug = categories.find(c => c.id === formData.category_id)?.slug;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Shield Failure: Identity signature required.");
      return;
    }

    setLoading(true);
    try {
      const { data: providerData, error: providerError } = await supabase
        .from("svc_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (providerError || !providerData) {
        toast.error("Node Initialization Failed: Create a provider profile first.");
        navigate("/services/onboarding");
        return;
      }

      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data, error } = await supabase
        .from("svc_listings")
        .insert({
          provider_id: providerData.id,
          title: formData.title,
          slug,
          category_id: formData.category_id || null,
          price_numeric: formData.price_min ? parseFloat(formData.price_min) : null,
          price_min: formData.price_min ? parseFloat(formData.price_min) : null,
          description: formData.description,
          listing_type: formData.listing_type,
          currency: formData.currency,
          metadata: formData.metadata,
          is_active: true,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Sector Initialized: Service Listing Deployed");
      navigate(`/services/listing/${data.id}`);
    } catch (err: any) {
      toast.error(`Matrix Write Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-40 relative overflow-hidden font-sans">
      
      {/* Background Matrix FX */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/20 blur-[150px] opacity-10 rounded-full" />
         <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto max-w-4xl px-6 relative z-10">
        
        {/* Navigation Stepper */}
        <div className="mb-16 flex items-center justify-between">
           <Button 
             variant="ghost" 
             onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
             className="h-12 px-6 rounded-xl glass border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-white transition-all flex items-center gap-3"
           >
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? "Abort Sequence" : "Back to Phase 01"}
           </Button>
           
           <div className="flex gap-4 items-center">
              {[1, 2, 3].map(i => (
                 <div key={i} className={cn(
                    "h-1.5 w-12 rounded-full transition-all duration-700",
                    step === i ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]" : step > i ? "bg-primary/40" : "bg-white/10"
                 )} />
              ))}
           </div>
        </div>

        <div className="space-y-12">
           
           {/* Step Header */}
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Activity className="h-5 w-5 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Initialization Phase 0{step}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                {step === 1 ? "Sector" : step === 2 ? "Payload" : "Final"} 
                <span className="text-foreground/40 italic"> Config</span>
              </h1>
              <p className="text-foreground/40 text-lg font-medium italic leading-relaxed max-w-2xl px-2">
                 {step === 1 ? "Define the primary identity and classification of your service sector." : 
                  step === 2 ? "Analyze and input the technical specifications and delivery metrics." : 
                  "Finalize deployment protocols and authorize sector activation."}
              </p>
           </div>

           <div className="glass-card p-10 md:p-16 rounded-[3.5rem] border-white/5 bg-white/5 shadow-2xl relative overflow-hidden active-within:border-primary/20 transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 {selectedCategorySlug === 'programming' ? <Code className="w-32 h-32" /> :
                  selectedCategorySlug === 'design' ? <Palette className="w-32 h-32" /> :
                  selectedCategorySlug === 'translation' ? <Globe className="w-32 h-32" /> :
                  <Zap className="w-32 h-32" />}
              </div>

              {step === 1 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Sector Classification</Label>
                         <select
                           value={formData.category_id}
                           onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                           className="w-full h-16 px-6 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white focus:border-primary/40 focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                         >
                           <option value="">SELECT SECTOR</option>
                           {categories.map((cat) => (
                             <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                           ))}
                         </select>
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Operation Mode</Label>
                         <select
                           value={formData.listing_type}
                           onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                           className="w-full h-16 px-6 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white focus:border-primary/40 focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                         >
                           <option value="service_package">PHASED_PROJECT</option>
                           <option value="appointment">SYNC_APPOINTMENT</option>
                           <option value="quote_request">OPEN_QUOTE</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Mission Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="E.G. NEURAL NETWORK ARCHITECTURE DEPLOYMENT"
                        className="h-16 px-8 bg-black/40 border-white/10 rounded-2xl text-sm font-black italic tracking-tighter uppercase placeholder:text-white/5 focus:border-primary/40 transition-all"
                      />
                   </div>

                   <Button 
                      onClick={() => {
                        if (!formData.title || !formData.category_id) {
                           toast.error("Initialization Failed: Sectors incomplete.");
                           return;
                        }
                        setStep(2);
                      }}
                      className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                   >
                     Continue To Payload <ArrowRight className="h-4 w-4" />
                   </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Mission Narrative & Technical Specs</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="IDENTIFY GOALS, DELIVERABLES, AND PROTOCOLS..."
                        className="min-h-[250px] p-8 bg-black/40 border-white/10 rounded-3xl text-sm font-medium italic placeholder:text-white/5 focus:border-primary/40 transition-all resize-none leading-relaxed"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Minimum Allocation ({formData.currency})</Label>
                         <div className="relative group/price">
                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within/price:text-primary transition-colors" />
                            <Input
                              type="number"
                              value={formData.price_min}
                              onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                              placeholder="0.00"
                              className="h-16 pl-14 pr-6 bg-black/40 border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-primary/40 transition-all"
                            />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Target Delivery Latency</Label>
                         <Input
                           value={formData.metadata.delivery_time}
                           onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, delivery_time: e.target.value } })}
                           placeholder="E.G. 14 SYNC CYCLES"
                           className="h-16 px-8 bg-black/40 border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-primary/40 transition-all"
                         />
                      </div>
                   </div>

                   <Button 
                      onClick={() => {
                        if (!formData.description || !formData.price_min) {
                           toast.error("Initialization Failed: Payload unstable.");
                           return;
                        }
                        setStep(3);
                      }}
                      className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                   >
                     Authorize Final Phase <ArrowRight className="h-4 w-4" />
                   </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="p-10 rounded-[3rem] glass bg-emerald-500/5 border border-emerald-500/10 space-y-8">
                       <div className="flex items-center gap-4">
                          <ShieldCheck className="h-8 w-8 text-emerald-500" />
                          <h3 className="text-xl font-black italic tracking-tighter uppercase">Final Security Review</h3>
                       </div>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                             <span className="text-white/20 uppercase font-black tracking-widest text-[9px]">Sector Integrity</span>
                             <span className="text-emerald-500 font-black italic tracking-tighter uppercase">OPTIMAL</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                             <span className="text-white/20 uppercase font-black tracking-widest text-[9px]">Vault Encryption</span>
                             <span className="text-emerald-500 font-black italic tracking-tighter uppercase">AES-256 ACTIVE</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                             <span className="text-white/20 uppercase font-black tracking-widest text-[9px]">Protocol Type</span>
                             <span className="text-white/60 font-black italic tracking-tighter uppercase">{formData.listing_type}</span>
                          </div>
                       </div>
                    </div>

                    <p className="text-[10px] font-medium text-foreground/20 italic text-center max-w-sm mx-auto leading-relaxed">
                       By initializing this sector, you agree to the Aurora Ecosystem Service Protocols and the Decentralized Trust Bond.
                    </p>

                    <Button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                    >
                      {loading ? (
                         <>
                           <Loader2 className="h-6 w-6 animate-spin" /> INITIALIZING MATRIX...
                         </>
                      ) : (
                         <>
                           <CheckCircle2 className="h-5 w-5" /> DEPLOY SERVICE SECTOR
                         </>
                      )}
                    </Button>
                </div>
              )}
           </div>

           {/* Sidebar Intel */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
              {[
                { icon: Zap, label: "Instant Sync", desc: "Listings are immediately visible across all neural nodes." },
                { icon: ShieldCheck, label: "Vault Secured", desc: "All contract values are escrowed by the Aurora Protocol." },
                { icon: Activity, label: "Elastic Scaling", desc: "Dynamically adjust your service capacity in real-time." }
              ].map((item, i) => (
                <div key={i} className="glass-card p-8 rounded-3xl border-white/5 bg-white/5 space-y-4">
                   <item.icon className="h-5 w-5 text-primary opacity-40" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest italic">{item.label}</h3>
                   <p className="text-[9px] font-medium text-white/20 italic leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>

        </div>

      </div>
    </div>
  );
}
