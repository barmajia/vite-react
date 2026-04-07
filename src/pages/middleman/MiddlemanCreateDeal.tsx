import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Factory,
  User,
  Percent,
  FileText,
  Loader2,
  Search,
  AlertTriangle,
  Package,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  NotebookText,
  Eye,
  Sparkles,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

type Factory = {
  user_id: string;
  full_name: string;
  company_name: string | null;
  location: string | null;
  phone: string | null;
  email: string;
  specialization: string | null;
  production_capacity: number | null;
  is_verified: boolean;
};

type Seller = {
  user_id: string;
  full_name: string;
  location: string | null;
  phone: string | null;
  email: string;
  is_verified: boolean;
  bio: string | null;
};

type DealFormData = {
  factoryId: string;
  sellerId: string;
  commissionRate: string;
  dealTerms: string;
  expectedOrderVolume: string;
  notes: string;
};

type ValidationErrors = Partial<Record<keyof DealFormData, string>>;

// ── Step Configuration ──────────────────────────────────────────────────────

const STEPS = [
  { key: "factory", label: "Select Factory", icon: Factory },
  { key: "seller", label: "Select Seller", icon: User },
  { key: "terms", label: "Commission & Terms", icon: Percent },
  { key: "review", label: "Review & Submit", icon: FileText },
];

// ── Component ───────────────────────────────────────────────────────────────

export function MiddlemanCreateDeal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [factories, setFactories] = useState<Factory[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [factorySearch, setFactorySearch] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");

  // Form
  const [formData, setFormData] = useState<DealFormData>({
    factoryId: "",
    sellerId: "",
    commissionRate: "5",
    dealTerms: "",
    expectedOrderVolume: "",
    notes: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // ── Fetch factories and sellers on mount ────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [{ data: factoriesData }, { data: sellersData }] =
          await Promise.all([
            supabase
              .from("factories")
              .select(
                "user_id, full_name, company_name, location, phone, email, specialization, production_capacity, is_verified",
              )
              .order("full_name"),
            supabase
              .from("sellers")
              .select(
                "user_id, full_name, location, phone, email, is_verified, bio",
              )
              .order("full_name"),
          ]);

        setFactories((factoriesData as Factory[]) ?? []);
        setSellers((sellersData as Seller[]) ?? []);
      } catch (err) {
        console.error("Error fetching factories/sellers:", err);
        toast.error("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ── Redirect if not authenticated ──────────────────────────────────────

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth/sign-in", { replace: true });
    }
  }, [user, loading, navigate]);

  // ── Filtered lists ──────────────────────────────────────────────────────

  const filteredFactories = useMemo(() => {
    if (!factorySearch.trim()) return factories;
    const q = factorySearch.toLowerCase();
    return factories.filter(
      (f) =>
        f.full_name.toLowerCase().includes(q) ||
        f.company_name?.toLowerCase().includes(q) ||
        f.location?.toLowerCase().includes(q) ||
        f.specialization?.toLowerCase().includes(q),
    );
  }, [factories, factorySearch]);

  const filteredSellers = useMemo(() => {
    if (!sellerSearch.trim()) return sellers;
    const q = sellerSearch.toLowerCase();
    return sellers.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.bio?.toLowerCase().includes(q),
    );
  }, [sellers, sellerSearch]);

  const selectedFactory = useMemo(
    () => factories.find((f) => f.user_id === formData.factoryId) ?? null,
    [factories, formData.factoryId],
  );

  const selectedSeller = useMemo(
    () => sellers.find((s) => s.user_id === formData.sellerId) ?? null,
    [sellers, formData.sellerId],
  );

  // ── Validation ──────────────────────────────────────────────────────────

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: ValidationErrors = {};

      switch (step) {
        case 0: // Factory
          if (!formData.factoryId) {
            newErrors.factoryId = "Please select a factory";
          }
          break;

        case 1: // Seller
          if (!formData.sellerId) {
            newErrors.sellerId = "Please select a seller";
          }
          if (formData.sellerId && formData.factoryId === formData.sellerId) {
            newErrors.sellerId = "Seller cannot be the same as the factory";
          }
          break;

        case 2: { // Terms
          const rate = parseFloat(formData.commissionRate);
          if (!formData.commissionRate || isNaN(rate)) {
            newErrors.commissionRate = "Commission rate is required";
          } else if (rate < 0 || rate > 100) {
            newErrors.commissionRate =
              "Commission rate must be between 0 and 100";
          }
          if (!formData.dealTerms.trim()) {
            newErrors.dealTerms = "Deal terms are required";
          } else if (formData.dealTerms.trim().length < 10) {
            newErrors.dealTerms = "Deal terms must be at least 10 characters";
          }
          if (formData.expectedOrderVolume) {
            const vol = parseInt(formData.expectedOrderVolume, 10);
            if (isNaN(vol) || vol <= 0) {
              newErrors.expectedOrderVolume =
                "Expected order volume must be a positive number";
            }
          }
          break;
        }

        case 3: // Review — always passes
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      setErrors({});
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      const uniqueSlug = `deal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const commissionRate = parseFloat(formData.commissionRate);

      const { data, error: insertError } = await supabase
        .from("middle_man_deals")
        .insert({
          middle_man_id: user.id,
          product_asin: uniqueSlug,
          commission_rate: commissionRate,
          margin_amount: 0,
          unique_slug: uniqueSlug,
          is_active: true,
          clicks: 0,
          conversions: 0,
          total_revenue: 0,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const dealId = data.id;

      // Optionally insert deal metadata/notes into a separate table or use a column
      // For now we store the deal and could add a notes column later if the schema supports it

      toast.success("Deal created successfully!", {
        description: `Your deal has been set up and is now active.`,
        icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
      });

      navigate(`/middleman/deals/${dealId}`, { replace: true });
    } catch (err: any) {
      console.error("Error creating deal:", err);
      toast.error("Failed to create deal", {
        description:
          err?.message ?? "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [user, formData, validateStep, navigate]);

  // ── Render helpers ──────────────────────────────────────────────────────

  if (!user && !loading) return null;

  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-32 space-y-8">
      {/* ===== HEADER ===== */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/middleman/deals")}
            className="p-2 rounded-xl glass-card border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              New Deal
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Create Deal
            </h1>
          </div>
        </div>
      </div>

      {/* ===== STEP INDICATOR ===== */}
      <div className="glass-card p-4 sm:p-6 rounded-[2rem] border-white/5 bg-white/5">
        {/* Desktop stepper */}
        <div className="hidden sm:flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded transition-all duration-500"
              style={{
                width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div
                key={step.key}
                className="relative flex flex-col items-center gap-2 z-10"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
                      : isActive
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white/5 border border-white/10 text-muted-foreground/40"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "text-foreground"
                      : isCompleted
                        ? "text-emerald-400"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile stepper */}
        <div className="sm:hidden flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              currentStep < 3
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                : "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
            }`}
          >
            <CurrentIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {STEPS[currentStep].label}
            </p>
          </div>
          <div className="text-xs font-semibold text-muted-foreground/60">
            {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
          </div>
        </div>
      </div>

      {/* ===== STEP CONTENT ===== */}

      {/* Step 0: Select Factory */}
      {currentStep === 0 && (
        <Card className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Factory className="h-5 w-5 text-blue-400" />
              Select Factory
            </CardTitle>
            <CardDescription>
              Search and choose a factory to include in this deal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search by name, company, location, or specialization..."
                value={factorySearch}
                onChange={(e) => {
                  setFactorySearch(e.target.value);
                  if (errors.factoryId)
                    setErrors((prev) => ({ ...prev, factoryId: undefined }));
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
              />
            </div>

            {errors.factoryId && (
              <p className="flex items-center gap-2 text-sm text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                {errors.factoryId}
              </p>
            )}

            {/* Factory list */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredFactories.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {factorySearch
                      ? "No factories match your search."
                      : "No factories available."}
                  </p>
                </div>
              ) : (
                filteredFactories.map((factory) => {
                  const isSelected = formData.factoryId === factory.user_id;
                  return (
                    <button
                      key={factory.user_id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          factoryId: factory.user_id,
                        }));
                        if (errors.factoryId)
                          setErrors((prev) => ({
                            ...prev,
                            factoryId: undefined,
                          }));
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-500/10 border-blue-500/30 shadow-md shadow-blue-500/5"
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-white/5 text-muted-foreground"
                          }`}
                        >
                          <Factory className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {factory.company_name || factory.full_name}
                            </p>
                            {factory.is_verified && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {factory.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {factory.location}
                              </span>
                            )}
                            {factory.specialization && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {factory.specialization}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground/60">
                            {factory.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {factory.phone}
                              </span>
                            )}
                            {factory.production_capacity && (
                              <span className="flex items-center gap-1">
                                Capacity:{" "}
                                {factory.production_capacity.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Seller */}
      {currentStep === 1 && (
        <Card className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-emerald-400" />
              Select Seller
            </CardTitle>
            <CardDescription>
              Search and choose a seller to include in this deal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search by name, location, or bio..."
                value={sellerSearch}
                onChange={(e) => {
                  setSellerSearch(e.target.value);
                  if (errors.sellerId)
                    setErrors((prev) => ({ ...prev, sellerId: undefined }));
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
              />
            </div>

            {errors.sellerId && (
              <p className="flex items-center gap-2 text-sm text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                {errors.sellerId}
              </p>
            )}

            {/* Seller list */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredSellers.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <User className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {sellerSearch
                      ? "No sellers match your search."
                      : "No sellers available."}
                  </p>
                </div>
              ) : (
                filteredSellers.map((seller) => {
                  const isSelected = formData.sellerId === seller.user_id;
                  return (
                    <button
                      key={seller.user_id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          sellerId: seller.user_id,
                        }));
                        if (errors.sellerId)
                          setErrors((prev) => ({
                            ...prev,
                            sellerId: undefined,
                          }));
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/5"
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-muted-foreground"
                          }`}
                        >
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {seller.full_name}
                            </p>
                            {seller.is_verified && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {seller.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {seller.location}
                              </span>
                            )}
                          </div>
                          {seller.bio && (
                            <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">
                              {seller.bio}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Commission & Terms */}
      {currentStep === 2 && (
        <Card className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Percent className="h-5 w-5 text-amber-400" />
              Commission &amp; Terms
            </CardTitle>
            <CardDescription>
              Set the commission rate, deal terms, and other details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Commission Rate */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Commission Rate (%)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      commissionRate: e.target.value,
                    }));
                    if (errors.commissionRate)
                      setErrors((prev) => ({
                        ...prev,
                        commissionRate: undefined,
                      }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all ${
                    errors.commissionRate
                      ? "border-rose-500/30"
                      : "border-white/10"
                  }`}
                  placeholder="e.g. 5"
                />
              </div>
              {errors.commissionRate && (
                <p className="flex items-center gap-2 text-sm text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.commissionRate}
                </p>
              )}
              <p className="text-xs text-muted-foreground/60">
                Percentage of each sale that goes to you as commission.
              </p>
            </div>

            {/* Deal Terms */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Deal Terms
              </label>
              <Textarea
                value={formData.dealTerms}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    dealTerms: e.target.value,
                  }));
                  if (errors.dealTerms)
                    setErrors((prev) => ({ ...prev, dealTerms: undefined }));
                }}
                placeholder="Describe the terms of this deal, responsibilities, timelines, etc."
                rows={5}
                className={`rounded-xl bg-white/5 border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all resize-none ${
                  errors.dealTerms ? "border-rose-500/30" : "border-white/10"
                }`}
              />
              {errors.dealTerms && (
                <p className="flex items-center gap-2 text-sm text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.dealTerms}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                <span>Minimum 10 characters</span>
                <span>{formData.dealTerms.length} / 10</span>
              </div>
            </div>

            {/* Expected Order Volume */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Expected Order Volume{" "}
                <span className="text-muted-foreground/40 font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.expectedOrderVolume}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    expectedOrderVolume: e.target.value,
                  }));
                  if (errors.expectedOrderVolume)
                    setErrors((prev) => ({
                      ...prev,
                      expectedOrderVolume: undefined,
                    }));
                }}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all ${
                  errors.expectedOrderVolume
                    ? "border-rose-500/30"
                    : "border-white/10"
                }`}
                placeholder="e.g. 100"
              />
              {errors.expectedOrderVolume && (
                <p className="flex items-center gap-2 text-sm text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.expectedOrderVolume}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Notes{" "}
                <span className="text-muted-foreground/40 font-normal">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <NotebookText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Additional notes or context for this deal..."
                  rows={3}
                  className="pl-10 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <Card className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Eye className="h-5 w-5 text-violet-400" />
              Review &amp; Submit
            </CardTitle>
            <CardDescription>
              Please review all details before creating the deal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Factory */}
            {selectedFactory && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Factory
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Factory className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedFactory.company_name ||
                        selectedFactory.full_name}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {selectedFactory.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedFactory.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedFactory.email}
                      </span>
                    </div>
                    {selectedFactory.specialization && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {selectedFactory.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Seller */}
            {selectedSeller && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Seller
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedSeller.full_name}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {selectedSeller.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedSeller.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedSeller.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Commission & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Commission Rate
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formData.commissionRate}%
                </p>
              </div>
              {formData.expectedOrderVolume && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                    Expected Volume
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {parseInt(
                      formData.expectedOrderVolume,
                      10,
                    ).toLocaleString()}{" "}
                    orders
                  </p>
                </div>
              )}
            </div>

            {/* Deal Terms */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                Deal Terms
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {formData.dealTerms}
              </p>
            </div>

            {/* Notes */}
            {formData.notes && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Notes
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {formData.notes}
                </p>
              </div>
            )}

            {/* Estimated earnings */}
            {formData.expectedOrderVolume && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-amber-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/60">
                    Estimated Earnings
                  </p>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(
                    (parseFloat(formData.commissionRate) / 100) *
                      parseInt(formData.expectedOrderVolume, 10) *
                      100, // placeholder avg order value
                  )}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Based on expected volume and commission rate (actual earnings
                  may vary).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== NAVIGATION BUTTONS ===== */}
      <div className="flex items-center justify-between gap-4">
        {currentStep > 0 ? (
          <Button
            variant="outline"
            size="md"
            onClick={handleBack}
            disabled={submitting}
            className="glass-card border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            disabled={submitting}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/20"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="success"
            size="md"
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/20"
            leftIcon={!submitting ? <Check className="h-4 w-4" /> : undefined}
          >
            {submitting ? "Creating Deal..." : "Create Deal"}
          </Button>
        )}
      </div>
    </div>
  );
}
