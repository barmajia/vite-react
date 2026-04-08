// src/features/services/bookings/pages/ServiceBookingPage.tsx
import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Zap,
  ShieldCheck,
  Clock,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ServicesHeader } from "@/components/layout/ServicesHeader";

// Import Components
import { BookingCalendar } from "../components/BookingCalendar";
import { ProjectMilestoneBuilder } from "../components/ProjectMilestoneBuilder";

export const ServiceBookingPage = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form States
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Fetch Service Details
  const { data: listing, isLoading } = useQuery({
    queryKey: ["service-listing", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("svc_listings")
        .select(
          `
          *,
          provider:svc_providers (
            id,
            provider_name,
            user_id
          ),
          category:svc_categories (
            id,
            name,
            slug
          )
        `,
        )
        .eq("id", listingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const isProjectBased = useMemo(() => {
    const slug = listing?.category?.slug;
    return ["programming", "translation", "design"].includes(slug || "");
  }, [listing]);

  const handleSubmit = async () => {
    if (isProjectBased && milestones.length === 0) {
      toast.error("Critical: Define at least one project phase.");
      return;
    }
    if (!isProjectBased && (!selectedDate || !selectedTime)) {
      toast.error("Critical: Synchronization window required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) throw new Error("Neural identity not found.");

      const totalAmount = isProjectBased
        ? milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
        : listing?.price_numeric || 0;

      // Create order/booking in svc_orders
      const { data: _orderData, error: orderError } = await supabase
        .from("svc_orders")
        .insert({
          listing_id: listingId,
          provider_id: listing.provider?.id,
          user_id: user.id,
          order_type: isProjectBased ? "project" : "booking",
          status: "pending",
          agreed_price: totalAmount,
          currency: listing?.currency || "USD",
          client_message: notes || null,
          metadata: isProjectBased
            ? { milestones }
            : { selectedDate, selectedTime },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast.success("Protocol Initialized: Service Request Sent");
      navigate("/services/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`System Node Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Re-Syncing Service Data...
          </p>
        </div>
      </div>
    );
  }

  if (!listing)
    return (
      <div className="p-8 text-center bg-[#050505] min-h-screen pt-32 text-rose-500 font-black italic uppercase tracking-widest">
        Node Not Found.
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-40 relative overflow-hidden font-sans">
      <ServicesHeader />
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/20 blur-[150px] opacity-10 rounded-full" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-12 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-12 px-6 rounded-xl glass border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-white transition-all flex items-center gap-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Abandon Request
          </Button>
          <div className="flex gap-4 items-center">
            <div
              className={cn(
                "h-1.5 w-12 rounded-full transition-all duration-500",
                step === 1
                  ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  : "bg-white/10",
              )}
            />
            <div
              className={cn(
                "h-1.5 w-12 rounded-full transition-all duration-500",
                step === 2
                  ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  : "bg-white/10",
              )}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* LEFT: Main Config */}
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                  Secure Protocol Activation
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                Initialize{" "}
                <span className="text-foreground/40 italic">Booking</span>
              </h1>
              <p className="text-foreground/40 text-lg font-medium italic leading-relaxed max-w-2xl px-2">
                Requesting specialized infrastructure from{" "}
                <span className="text-foreground">
                  {listing.provider?.provider_name}
                </span>
                . Secure your deployment with phased milestones and vault
                protection.
              </p>
            </div>

            {step === 1 ? (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                {isProjectBased ? (
                  <ProjectMilestoneBuilder
                    milestones={milestones}
                    onChange={setMilestones}
                    currency={listing.currency || "USD"}
                  />
                ) : (
                  <section className="glass-card p-10 rounded-[3rem] border-white/5 bg-white/5 space-y-8">
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                        Synchronization Matrix
                      </h3>
                    </div>
                    <BookingCalendar
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      selectedTime={selectedTime}
                      setSelectedTime={setSelectedTime}
                      durationMinutes={listing.duration_minutes || 60}
                    />
                  </section>
                )}
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-20 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                >
                  Next Activation Phase <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                <section className="glass-card p-10 rounded-[3rem] border-white/5 bg-white/5 space-y-8">
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                      Supplemental Intel
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2 italic">
                      Project Narrative / Core Requirements
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="DESCRIBE YOUR VISION FOR THIS DEPLOYMENT..."
                      className="bg-black/40 border-white/5 rounded-3xl min-h-[200px] p-8 text-sm font-medium italic placeholder:text-white/5 focus:border-primary/40 transition-all resize-none leading-relaxed"
                    />
                  </div>
                </section>

                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="h-20 px-8 rounded-3xl glass border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                  >
                    Orbit Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-20 rounded-[2.5rem] bg-primary text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      "Initiate Final Protocol"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-40 space-y-8">
            <div className="glass-card p-10 rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-transparent opacity-50" />

              <div className="space-y-10">
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40 italic">
                    Request Summary
                  </p>
                  <h3 className="text-3xl font-black italic tracking-tighter leading-none uppercase">
                    {listing.title}
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                        Type
                      </span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black uppercase italic">
                        {isProjectBased ? "PROJECT_MODE" : "SYNC_MODE"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                        Provider
                      </span>
                      <span className="text-[10px] font-black italic tracking-tighter uppercase text-white/80">
                        {listing.provider?.provider_name}
                      </span>
                    </div>
                  </div>

                  {!isProjectBased && selectedDate && selectedTime && (
                    <div className="p-6 rounded-[2rem] glass bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center gap-3 text-emerald-500">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-black italic tracking-tighter uppercase">
                          {selectedDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-emerald-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-black italic tracking-tighter uppercase">
                          {selectedTime} (SYNC)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/10 text-center space-y-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">
                      Total Locked Value
                    </p>
                    <h4 className="text-4xl font-black italic tracking-tighter leading-none text-primary uppercase">
                      {listing.currency || "USD"}{" "}
                      {isProjectBased
                        ? milestones
                            .reduce(
                              (sum, m) => sum + (Number(m.amount) || 0),
                              0,
                            )
                            .toLocaleString()
                        : (listing.price_numeric || 0).toLocaleString()}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border-t border-white/5 opacity-40">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest italic">
                    Encrypted by Aurora Vault v4.2
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 text-center space-y-4">
              <Zap className="h-8 w-8 text-primary/40 mx-auto" />
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 italic max-w-[200px] mx-auto leading-relaxed">
                System protocols mandate that funds are held in escrow until
                milestone verification is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
