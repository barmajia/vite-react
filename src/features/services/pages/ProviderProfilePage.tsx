// src/features/services/pages/ProviderProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Share2,
  Github,
  Globe,
  Palette,
  Wrench,
  Code,
  Languages,
  Award,
  Zap,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Clock,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { ServicesHeader } from "@/components/layout/ServicesHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProviderData {
  id: string;
  user_id: string;
  provider_name: string;
  logo_url: string;
  description: string;
  location: string;
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

const ProviderProfilePage: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [specializedData, setSpecializedData] = useState<any>(null);
  const [vertical, setVertical] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (!providerId) return;
      setLoading(true);
      try {
        // Fetch base provider data
        const { data: baseProvider, error: baseError } = await supabase
          .from("svc_providers")
          .select("*")
          .eq("id", providerId)
          .single();

        if (baseError) throw baseError;
        setProvider(baseProvider);

        // Logic to determine vertical would ideally come from the base provider record
        // For now, we'll try to find it in each specialized table
        const tables = [
          { name: "svc_programmer_profiles", vertical: "programmer" },
          { name: "svc_translator_profiles", vertical: "translator" },
          { name: "svc_designer_profiles", vertical: "designer" },
          { name: "svc_home_service_profiles", vertical: "home" },
        ];

        for (const table of tables) {
          const { data, error } = await supabase
            .from(table.name)
            .select("*")
            .eq("user_id", baseProvider.user_id)
            .maybeSingle();

          if (data) {
            setSpecializedData(data);
            setVertical(table.vertical);
            break;
          }
        }
      } catch (err: any) {
        toast.error("Critical Failure: Identity Node Not Found");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Re-Syncing Matrix Identity...
          </p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="glass-card p-12 rounded-[3rem] border-white/5 text-center space-y-8 max-w-lg">
          <Zap className="h-16 w-16 text-rose-500 mx-auto opacity-20" />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            Identity <span className="text-rose-500">Lost</span>
          </h1>
          <p className="text-foreground/40 text-sm font-medium italic">
            The requested provider node does not exist in the current grid.
          </p>
          <Button
            onClick={() => navigate("/services")}
            className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs"
          >
            Back to Matrix
          </Button>
        </div>
      </div>
    );
  }

  const verticalTheme = {
    programmer: { color: "cyan", icon: Code, label: "Core Developer" },
    translator: { color: "amber", icon: Globe, label: "Global Liaison" },
    designer: { color: "violet", icon: Palette, label: "Creative Architect" },
    home: { color: "emerald", icon: Wrench, label: "Systems Op" },
  }[vertical as string] || {
    color: "primary",
    icon: UserCheck,
    label: "Provider",
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary selection:text-white relative overflow-hidden pt-32 pb-40">
      <ServicesHeader />
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-[600px] blur-[150px] opacity-20 bg-gradient-to-b",
            `from-${verticalTheme.color}-500/20 to-transparent`,
          )}
        />
        <div className="absolute top-20 right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[130px] animate-pulse" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-12 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-12 px-6 rounded-xl glass border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-white transition-all flex items-center gap-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Matrix
          </Button>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="w-12 h-12 rounded-xl glass border-white/5 text-foreground/40 hover:text-white"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="w-12 h-12 rounded-xl glass border-white/5 text-foreground/40 hover:text-white"
            >
              <ShieldCheck className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT COLUMN: Profile Info */}
          <div className="lg:col-span-8 space-y-12">
            {/* Profile Hero Card */}
            <div className="glass-card p-12 rounded-[3.5rem] border-white/5 relative overflow-hidden group shadow-2xl shadow-black/60 bg-white/5">
              <div
                className={cn(
                  "absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000",
                  `text-${verticalTheme.color}-500`,
                )}
              >
                <verticalTheme.icon className="w-40 h-40" />
              </div>

              <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      "absolute -inset-4 rounded-3xl blur-2xl opacity-40 animate-pulse",
                      `bg-${verticalTheme.color}-500/20`,
                    )}
                  />
                  <Avatar className="w-40 h-40 rounded-3xl border-4 border-white/10 shadow-2xl relative z-10">
                    <img
                      src={provider.logo_url}
                      alt={provider.provider_name}
                      className="object-cover"
                    />
                  </Avatar>
                  {provider.is_verified && (
                    <div className="absolute -bottom-4 -right-4 h-12 w-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 p-2 transform rotate-12">
                      <CheckCircle2 className="h-full w-full" />
                    </div>
                  )}
                </div>

                <div className="space-y-6 flex-1 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-px w-8",
                          `bg-${verticalTheme.color}-500/40`,
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-[0.4em] italic",
                          `text-${verticalTheme.color}-500`,
                        )}
                      >
                        {verticalTheme.label}
                      </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                      {provider.provider_name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />{" "}
                      {provider.location || "Neo City"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />{" "}
                      <span className="text-foreground">
                        {provider.rating || "5.0"}
                      </span>{" "}
                      ({provider.review_count || "124"} REVIEWS)
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> RECRUITED{" "}
                      {new Date(provider.created_at).getFullYear()}
                    </div>
                  </div>

                  <p className="text-foreground/60 text-lg font-medium italic leading-relaxed max-w-2xl">
                    "
                    {provider.description ||
                      "Leading specialist in multi-tier architectural solutions and high-performance mission critical systems."}
                    "
                  </p>
                </div>
              </div>
            </div>

            {/* Specialized Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Specialized Stats */}
              <div className="glass-card p-10 rounded-[2.5rem] border-white/5 space-y-8 bg-white/5">
                <div className="flex items-center gap-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                    System Metrics
                  </h3>
                </div>

                <div className="space-y-6">
                  {vertical === "programmer" && (
                    <>
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                          Global Deployment Level
                        </p>
                        <p className="text-2xl font-black italic tracking-tighter">
                          L9 SENIOR
                        </p>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                          Code Performance
                        </p>
                        <p className="text-2xl font-black italic tracking-tighter text-cyan-500">
                          99.8%
                        </p>
                      </div>
                    </>
                  )}
                  {vertical === "translator" && (
                    <>
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                          Native Precision
                        </p>
                        <p className="text-2xl font-black italic tracking-tighter">
                          C2 MASTERY
                        </p>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                          Ops Capacity
                        </p>
                        <p className="text-2xl font-black italic tracking-tighter text-amber-500">
                          12K WPS
                        </p>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                      Response Latency
                    </p>
                    <p className="text-2xl font-black italic tracking-tighter hover:text-primary transition-colors italic">
                      {"< 48m"}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                      Trust Factor
                    </p>
                    <p className="text-2xl font-black italic tracking-tighter text-emerald-500 italic">
                      IMMUTABLE
                    </p>
                  </div>
                </div>
              </div>

              {/* Tech Stack / Capabilities */}
              <div className="glass-card p-10 rounded-[2.5rem] border-white/5 space-y-8 bg-white/5">
                <div className="flex items-center gap-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                    Technical Core
                  </h3>
                </div>

                <div className="flex flex-wrap gap-3">
                  {vertical === "programmer" &&
                    (specializedData?.tech_stack || []).map((tech: string) => (
                      <Badge
                        key={tech}
                        className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic"
                      >
                        {tech}
                      </Badge>
                    ))}
                  {vertical === "translator" &&
                    (specializedData?.languages || []).map(
                      (lang: any, i: number) => (
                        <Badge
                          key={i}
                          className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic"
                        >
                          {lang.from} → {lang.to}
                        </Badge>
                      ),
                    )}
                  {vertical === "designer" &&
                    (specializedData?.design_tools || []).map(
                      (tool: string) => (
                        <Badge
                          key={tool}
                          className="bg-violet-500/10 text-violet-500 border-violet-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic"
                        >
                          {tool}
                        </Badge>
                      ),
                    )}
                  {(!vertical || !specializedData) &&
                    [
                      "Verified Identity",
                      "Escrow Secured",
                      "High Performance",
                      "Priority Node",
                    ].map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-white/5 text-foreground/60 border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic"
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>

                {vertical === "programmer" && specializedData?.github_url && (
                  <a
                    href={specializedData.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-14 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-widest gap-3"
                    >
                      <Github className="h-4 w-4" /> View Neural Repositories
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Portfolio / Recent Assets */}
            <div className="glass-card p-12 rounded-[3.5rem] border-white/5 space-y-10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                    Deployment Logs
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-primary italic hover:bg-transparent hover:text-primary/80"
                >
                  View Full Record
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative">
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 text-white scale-50 group-hover:scale-100 transition-transform duration-500" />
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-black/60 backdrop-blur-md text-[8px] font-black border-white/10 uppercase tracking-tighter">
                          ASSET_00{i}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 italic group-hover:text-white transition-colors tracking-tighter">
                      Confidential Deployment 2024
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Booking Sidebar */}
          <div className="lg:col-span-4 sticky top-40 space-y-8">
            <div className="glass-card p-10 rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 w-full h-2 bg-gradient-to-r",
                  `from-${verticalTheme.color}-500/50 to-transparent`,
                )}
              />

              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 mb-3 italic">
                    Contract Initialization
                  </p>
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none uppercase">
                    Secure <span className="text-primary italic">Booking</span>
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                        Initial Retainer
                      </span>
                      <span className="text-2xl font-black italic tracking-tighter">
                        $120.00
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                        System Fee
                      </span>
                      <span className="text-[10px] font-black tracking-tighter text-emerald-500 uppercase italic">
                        VAULT_SECURED
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                      onClick={() =>
                        navigate(
                          `/services/listing/new/book?providerId=${provider.id}`,
                        )
                      }
                    >
                      Request Deployment
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full h-18 rounded-[1.8rem] glass border-white/5 text-[10px] font-black uppercase tracking-[0.2em] italic gap-3"
                      onClick={() =>
                        navigate(`/services/chat?providerId=${provider.id}`)
                      }
                    >
                      <MessageSquare className="h-4 w-4" /> Secure Comms Channel
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border-t border-white/5">
                  <Clock className="h-4 w-4 text-primary/40" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 italic">
                    Next Window: 24H Ops Matrix
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 text-center space-y-4">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 italic max-w-[200px] mx-auto leading-relaxed">
                All transactions in the Aurora Ecosystem are encrypted and
                escrowed by default.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfilePage;
