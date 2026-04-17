import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  Chrome,
  Phone,
  MapPin,
  User,
  Handshake,
  ShieldCheck,
  Zap,
  Building2,
  Briefcase,
  DollarSign,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { middlemanSignup } from "@/hooks/useRoleSignup";

export function MiddlemanSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUpWithGoogle } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    company_name: "",
    currency: "USD",
    commission_rate: 5,
    specialization: "",
  });

  const [errors, setErrors] = useState<{
    full_name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    location?: string;
    company_name?: string;
    specialization?: string;
  }>({});

  // ── Google Sign-Up ──────────────────────────
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const result = await signUpWithGoogle("middleman");
      if (result.error) {
        toast.error(result.error.message ?? "Google signup failed");
      } else {
        toast.success(
          "Account created! Please complete your middleman profile.",
        );
      }
    } catch {
      toast.error("Google signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Validation ──────────────────────────────
  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Must include uppercase, lowercase, and numbers";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: typeof errors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s+()-]{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    } else if (formData.location.trim().length < 2) {
      newErrors.location = "Location must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ──────────────────────────────
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
    setErrors({});
  };

  // ── Geolocation ─────────────────────────────
  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: `${position.coords.latitude}, ${position.coords.longitude}`,
          }));
          setIsLocating(false);
          toast.success("Location retrieved successfully");
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setFormData((prev) => ({ ...prev, location: "0, 0" }));
          setIsLocating(false);
          toast.info("Using default location (0, 0)");
        },
      );
    } else {
      setFormData((prev) => ({ ...prev, location: "0, 0" }));
      setIsLocating(false);
      toast.info("Geolocation not supported. Using (0, 0).");
    }
  };

  // ── Submit ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await middlemanSignup(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone,
        formData.location,
        formData.currency,
        formData.commission_rate,
        formData.specialization,
      );

      if (result.success) {
        toast.success(
          "Middleman account created! Please check your email to verify.",
        );
        navigate("/middleman/dashboard?signup=success");
      } else {
        const errorMsg = result.error || "Signup failed";
        if (errorMsg.includes("User already registered")) {
          toast.error(
            "An account with this email already exists. Please login instead.",
          );
        } else if (errorMsg.includes("rate limit")) {
          toast.error(
            "Too many signup attempts. Please try again in a few minutes.",
          );
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(
        msg.includes("422")
          ? "Invalid signup data. Please check your inputs."
          : msg,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Password Strength ──────────────────────
  const passwordStrength = () => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const strengthLevel = passwordStrength();
  const strengthColors = [
    "bg-muted/50",
    "bg-red-500 shadow-red-500/50",
    "bg-orange-500 shadow-orange-500/50",
    "bg-yellow-500 shadow-yellow-500/50",
    "bg-emerald-500 shadow-emerald-500/50",
  ];
  const strengthLabels = ["", "Very weak", "Weak", "Fair", "Strong"];

  // ── Auto-focus ──────────────────────────────
  useEffect(() => {
    const selectors: Record<number, string> = {
      1: "#full_name",
      2: "#phone",
      3: "#company_name",
    };
    const el = document.querySelector<HTMLInputElement>(selectors[step]);
    el?.focus();
  }, [step]);

  // ── Render ──────────────────────────────────
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* ── Immersive Background ── */}
      <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-orange-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Top Controls ── */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/middleman")}
          className="glass hover:bg-white/10 text-foreground rounded-full px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="glass hover:bg-white/10 rounded-full px-4"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-amber-500" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <span className="ml-2 font-medium hidden sm:inline capitalize">
            {theme === "light" ? t("common.darkMode") : t("common.lightMode")}
          </span>
        </Button>
      </div>

      {/* ── Header ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="inline-flex items-center justify-center p-3 glass rounded-2xl mb-6 shadow-inner scale-110">
          <Handshake className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
          Become a Middleman
        </h1>
        <p className="mt-3 text-muted-foreground font-medium">
          Connect factories with sellers and earn commissions on every deal
        </p>
      </div>

      {/* ── Main Card ── */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="glass-card p-0 rounded-[2.5rem] shadow-2xl border-white/20 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Progress */}
          <div className="flex gap-1 p-1 bg-white/5 border-b border-white/10">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                  step >= s
                    ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <div className="p-8 sm:p-10">
            {/* Step label */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80">
                Step {step} of 3
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {step === 1
                  ? "Account"
                  : step === 2
                    ? "Contact & Location"
                    : "Business Details"}
              </span>
            </div>

            {/* Google Signup – only on step 1 */}
            {step === 1 && (
              <>
                <div className="mb-8">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full glass bg-white/5 border-white/10 hover:bg-white/10 text-foreground h-14 text-lg font-bold rounded-2xl transition-all active:scale-[0.98]"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                  >
                    <Chrome className="mr-3 h-6 w-6 text-amber-500" />
                    Sign up with Google
                  </Button>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
                    <span className="px-4 glass py-1 rounded-full text-muted-foreground/60 border-white/10 italic">
                      Or use email
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ════════ STEP 1 — Account ════════ */}
              {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-bold ml-1">
                      Full Name
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <User className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="full_name"
                        type="text"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.full_name ? "border-destructive/50" : ""}`}
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        placeholder="John Doe"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold ml-1">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <Mail className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.email ? "border-destructive/50" : ""}`}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="you@company.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold ml-1">
                      Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <Lock className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className={`pl-12 pr-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.password ? "border-destructive/50" : ""}`}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-amber-500 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="mt-3 px-1 space-y-2">
                        <div className="flex gap-1.5 h-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full transition-all duration-500 ${
                                level <= strengthLevel
                                  ? strengthColors[strengthLevel]
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest ${strengthLevel <= 1 ? "text-destructive" : strengthLevel <= 2 ? "text-orange-500" : "text-emerald-500"}`}
                        >
                          {strengthLabels[strengthLevel]}
                        </p>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-bold ml-1"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <Lock className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={`pl-12 pr-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.confirmPassword ? "border-destructive/50" : ""}`}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-amber-500 transition-colors"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full glass bg-amber-500 hover:bg-amber-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* ════════ STEP 2 — Contact & Location ════════ */}
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-bold ml-1">
                      Phone Number
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <Phone className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.phone ? "border-destructive/50" : ""}`}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+20 123 456 7890"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-bold ml-1">
                      Business Location
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <MapPin className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="location"
                        type="text"
                        className={`pl-12 pr-24 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.location ? "border-destructive/50" : ""}`}
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="City, Country or Coordinates"
                        disabled={isLoading || isLocating}
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating || isLoading}
                        className="absolute inset-y-0 right-2 my-2 px-3 flex items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors font-bold text-xs uppercase"
                        aria-label="Get Current Location"
                      >
                        {isLocating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Locate"
                        )}
                      </button>
                    </div>
                    {errors.location && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 glass bg-white/5 border-white/10 h-14 text-lg font-bold rounded-2xl active:scale-[0.98]"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-[2] glass bg-amber-500 hover:bg-amber-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                      onClick={handleNext}
                      disabled={isLoading}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ════════ STEP 3 — Business Details & Submit ════════ */}
              {step === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="company_name"
                      className="text-sm font-bold ml-1"
                    >
                      Company / Brand Name
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <Building2 className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="company_name"
                        type="text"
                        className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                        placeholder="Your Company Ltd."
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="specialization"
                      className="text-sm font-bold ml-1"
                    >
                      Specialization
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
                        <Briefcase className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="specialization"
                        type="text"
                        className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
                        value={formData.specialization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specialization: e.target.value,
                          })
                        }
                        placeholder="e.g., Electronics, Textiles, Food"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Currency & Commission */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold ml-1">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(v) =>
                          setFormData({ ...formData, currency: v })
                        }
                      >
                        <SelectTrigger className="glass bg-white/5 border-white/10 h-14 rounded-2xl text-lg">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground/30" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10">
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="commission_rate"
                        className="text-sm font-bold ml-1"
                      >
                        Commission %
                      </Label>
                      <div className="relative group">
                        <Input
                          id="commission_rate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className="h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg text-center"
                          value={formData.commission_rate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              commission_rate:
                                parseFloat(e.target.value) || 0,
                            })
                          }
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification notice */}
                  <div className="p-4 glass bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Your account will be{" "}
                        <strong className="text-amber-500">
                          pending verification
                        </strong>{" "}
                        until admin approval (1-3 business days). You can browse
                        deals while waiting.
                      </p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 glass bg-white/5 border-white/10 h-14 text-lg font-bold rounded-2xl active:scale-[0.98]"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-[2] glass bg-amber-500 hover:bg-amber-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Create Middleman Account"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Login link */}
              <p className="text-center text-sm text-muted-foreground font-medium mt-6">
                Already have a middleman account?{" "}
                <Link
                  to="/middleman/login"
                  className="text-amber-500 hover:underline font-bold transition-all underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>
            </form>
          </div>

          {/* ── Trust Badges ── */}
          <div className="bg-white/5 backdrop-blur-3xl px-8 py-5 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500/70" />
                <span>Verified Brokers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500/70" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-500/70" />
                <span>Global Network</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── What happens next ── */}
        <div className="mt-8 glass bg-white/5 border border-white/10 rounded-2xl p-6 animate-in fade-in duration-1000 delay-300">
          <h3 className="font-black text-sm uppercase tracking-[0.2em] text-amber-500 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            What happens next?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Your account will be created instantly</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Profile pending verification (1-3 business days)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Browse deals while waiting for approval</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Once verified, create and manage deals</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MiddlemanSignup;
