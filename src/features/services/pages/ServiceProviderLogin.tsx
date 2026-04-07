// src/features/services/pages/ServiceProviderLogin.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const ServiceProviderLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        toast.success("Identity Verified. Reconnecting Matrix.");
        navigate("/services/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        
        <div className="flex flex-col items-center mb-12 space-y-6">
           <div className="p-4 bg-primary/10 border border-primary/20 rounded-[1.8rem] shadow-2xl shadow-primary/20 animate-in fade-in zoom-in duration-700">
              <Briefcase className="h-10 w-10 text-primary" />
           </div>
           <div className="text-center">
              <h1 className="text-4xl font-black italic tracking-tighter leading-none uppercase">Provider <span className="text-primary">Portal</span></h1>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 italic mt-2">Re-verify Global Identity</p>
           </div>
        </div>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <CardContent className="p-12 space-y-10">
            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-shake">
                 <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-500 leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2 italic">Access Node (Email)</Label>
                 <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-primary transition-colors" />
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="OPERATOR@AURORA.NEXUS"
                      className="bg-white/5 border-white/10 rounded-2xl h-18 pl-16 text-xs font-black uppercase tracking-widest placeholder:text-white/10 h-20 outline-none focus:border-primary transition-all"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2 italic">Private Key (Passphrase)</Label>
                 <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-primary transition-colors" />
                    <Input 
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/10 rounded-2xl h-18 pl-16 text-xs font-black uppercase tracking-widest h-20 outline-none focus:border-primary transition-all"
                      required
                    />
                 </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-20 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-primary/30 transition-all duration-700 active:scale-95"
                disabled={loading}
              >
                {loading ? (
                   <>
                     <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                     Authenticating...
                   </>
                ) : (
                   <>
                     Re-Sync Matrix
                     <ArrowRight className="ml-3 h-5 w-5" />
                   </>
                )}
              </Button>
            </form>

            <div className="text-center pt-8 border-t border-white/5 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 italic">
                 Identity Lost? <Link to="#" className="text-primary hover:text-primary-foreground/80 hover:underline transition-all">Request Recovery</Link>
               </p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 italic leading-none">
                 New Segment? <Link to="/services/provider/signup" className="text-primary hover:text-primary-foreground/80 hover:underline transition-all font-black">Register Profile</Link>
               </p>
               <div className="pt-4 flex items-center justify-center gap-4 text-white/5">
                   <div className="h-px flex-1 bg-white/5" />
                   <Shield className="h-4 w-4" />
                   <div className="h-px flex-1 bg-white/5" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceProviderLogin;
