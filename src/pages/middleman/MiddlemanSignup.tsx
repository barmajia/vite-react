import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { middlemanSignup } from "@/hooks/useRoleSignup";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  Handshake,
  ArrowRight,
  ArrowLeft,
  FileText,
  User,
  Building2,
  Settings,
  Shield,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type SignupStep =
  | "account"
  | "personal"
  | "business"
  | "verification"
  | "preferences";

interface FormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  company_name: string;
  location: string;
  currency: string;
  commission_rate: number;
  specialization: string;
  website_url: string;
  description: string;
  years_of_experience: string;
  preferred_language: string;
  theme_preference: string;
}

export function MiddlemanSignup() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState<SignupStep>("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    company_name: "",
    location: "",
    currency: "USD",
    commission_rate: 5,
    specialization: "",
    website_url: "",
    description: "",
    years_of_experience: "",
    preferred_language: "en",
    theme_preference: "system",
  });

  const steps: SignupStep[] = [
    "account",
    "personal",
    "business",
    "verification",
    "preferences",
  ];
  const currentStepIndex = steps.indexOf(currentStep);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate before submitting
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      setError("Please enter your full name");
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);

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
          "Account created successfully! Please check your email to verify.",
        );
        navigate("/middleman/dashboard?signup=success");
      } else {
        // Handle specific Supabase errors
        const errorMsg = result.error || "Signup failed";

        if (errorMsg.includes("User already registered")) {
          setError(
            "An account with this email already exists. Please login instead.",
          );
        } else if (errorMsg.includes("Password should be at least")) {
          setError("Password must be at least 8 characters long.");
        } else if (errorMsg.includes("Invalid email")) {
          setError("Please enter a valid email address.");
        } else if (errorMsg.includes("rate limit")) {
          setError(
            "Too many signup attempts. Please try again in a few minutes.",
          );
        } else {
          setError(errorMsg);
        }

        toast.error(errorMsg || "Signup failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // Better error extraction for Supabase errors
      let displayError = "An unexpected error occurred. Please try again.";

      if (typeof errorMessage === "string") {
        if (
          errorMessage.includes("422") ||
          errorMessage.includes("Unprocessable")
        ) {
          displayError =
            "Invalid signup data. Please check your email and password.";
        } else if (errorMessage.includes("User already registered")) {
          displayError =
            "An account with this email already exists. Please login instead.";
        } else if (errorMessage.includes("Password should be at least")) {
          displayError = "Password must be at least 8 characters long.";
        } else if (errorMessage.includes("Invalid email")) {
          displayError = "Please enter a valid email address.";
        } else {
          displayError = errorMessage;
        }
      }

      setError(displayError);
      toast.error(displayError);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: SignupStep) => {
    switch (step) {
      case "account":
        return <User className="h-5 w-5" />;
      case "personal":
        return <User className="h-5 w-5" />;
      case "business":
        return <Building2 className="h-5 w-5" />;
      case "verification":
        return <Shield className="h-5 w-5" />;
      case "preferences":
        return <Settings className="h-5 w-5" />;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "account":
        return (
          <div className="space-y-5">
            <div>
              <Label
                htmlFor="email"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="you@company.com"
                className={cn(
                  "glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl",
                  formData.email &&
                    !formData.email.includes("@") &&
                    "border-rose-500/50",
                )}
              />
              {formData.email && !formData.email.includes("@") && (
                <p className="text-xs text-rose-400 mt-1">
                  Please enter a valid email
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="password"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData({ password: e.target.value })}
                placeholder="Min 8 characters"
                minLength={8}
                className={cn(
                  "glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl",
                  formData.password &&
                    formData.password.length < 8 &&
                    "border-rose-500/50",
                  formData.password &&
                    formData.password.length >= 8 &&
                    "border-emerald-500/50",
                )}
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300 rounded-full",
                          formData.password.length < 8 && "bg-rose-500 w-1/3",
                          formData.password.length >= 8 &&
                            formData.password.length < 12 &&
                            "bg-amber-500 w-2/3",
                          formData.password.length >= 12 &&
                            "bg-emerald-500 w-full",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        formData.password.length < 8 && "text-rose-400",
                        formData.password.length >= 8 &&
                          formData.password.length < 12 &&
                          "text-amber-400",
                        formData.password.length >= 12 && "text-emerald-400",
                      )}
                    >
                      {formData.password.length < 8
                        ? "Weak"
                        : formData.password.length < 12
                          ? "Medium"
                          : "Strong"}
                    </span>
                  </div>
                  {formData.password.length < 8 && (
                    <p className="text-xs text-rose-400 mt-1">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleNext}
              disabled={
                !formData.email ||
                !formData.email.includes("@") ||
                !formData.password ||
                formData.password.length < 8
              }
              className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "personal":
        return (
          <div className="space-y-5">
            <div>
              <Label
                htmlFor="full_name"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Full Name
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => updateFormData({ full_name: e.target.value })}
                placeholder="John Doe"
                className="glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
              />
            </div>
            <div>
              <Label
                htmlFor="phone"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-12 glass bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="space-y-5">
            <div>
              <Label
                htmlFor="company_name"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Company Name
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  updateFormData({ company_name: e.target.value })
                }
                placeholder="Your Company Ltd."
                className="glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
              />
            </div>
            <div>
              <Label
                htmlFor="location"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Business Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData({ location: e.target.value })}
                placeholder="City, Country"
                className="glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="currency"
                  className="text-xs font-black uppercase tracking-widest text-amber-500/80"
                >
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => updateFormData({ currency: v })}
                >
                  <SelectTrigger className="glass bg-white/5 border-white/10 text-white h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="commission_rate"
                  className="text-xs font-black uppercase tracking-widest text-amber-500/80"
                >
                  Commission Rate (%)
                </Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    updateFormData({
                      commission_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  className="glass bg-white/5 border-white/10 text-white h-12 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="specialization"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Specialization
              </Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) =>
                  updateFormData({ specialization: e.target.value })
                }
                placeholder="e.g., Electronics, Textiles"
                className="glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-12 glass bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-5">
            <div className="p-4 glass bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  Your account will be{" "}
                  <strong className="text-amber-400">
                    pending verification
                  </strong>{" "}
                  until admin approves your profile (1-3 business days).
                </p>
              </div>
            </div>
            <div>
              <Label
                htmlFor="years_of_experience"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Years of Experience
              </Label>
              <Input
                id="years_of_experience"
                type="number"
                value={formData.years_of_experience}
                onChange={(e) =>
                  updateFormData({ years_of_experience: e.target.value })
                }
                min="0"
                max="50"
                placeholder="e.g., 5"
                className="glass bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
              />
            </div>
            <div className="p-4 glass bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white/80 mb-1">
                    Manual Verification Required
                  </p>
                  <p className="text-xs text-white/50">
                    Our admin team will review your application and contact you
                    directly for any required documents.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-12 glass bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-5">
            <div>
              <Label
                htmlFor="preferred_language"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Preferred Language
              </Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(v) => updateFormData({ preferred_language: v })}
              >
                <SelectTrigger className="glass bg-white/5 border-white/10 text-white h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="theme_preference"
                className="text-xs font-black uppercase tracking-widest text-amber-500/80"
              >
                Theme Preference
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "system",
                    label: "System",
                    icon: <Zap className="h-5 w-5" />,
                  },
                  {
                    value: "light",
                    label: "Light",
                    icon: <Sun className="h-5 w-5" />,
                  },
                  {
                    value: "dark",
                    label: "Dark",
                    icon: <Moon className="h-5 w-5" />,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      updateFormData({ theme_preference: option.value })
                    }
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      formData.theme_preference === option.value
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        : "glass bg-white/5 border-white/10 text-white/60 hover:bg-white/10",
                    )}
                  >
                    {option.icon}
                    <span className="text-xs font-black uppercase tracking-wider">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-12 glass bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Complete Signup"}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute -inset-3 bg-amber-500/20 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/40">
                <Handshake className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-3">
            Become a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Middleman
            </span>
          </h1>
          <p className="text-base text-white/60 max-w-lg mx-auto">
            Connect factories with sellers and earn commissions on every deal
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="glass bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-amber-500/80">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-white/40 capitalize">
              {currentStep}
            </span>
          </div>
          <Progress
            value={((currentStepIndex + 1) / steps.length) * 100}
            className="h-2 bg-white/10"
          />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    index <= currentStepIndex
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
                      : "bg-white/5 text-white/30 border border-white/10",
                  )}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    getStepIcon(step)
                  )}
                </div>
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider hidden sm:block",
                    index <= currentStepIndex
                      ? "text-amber-400"
                      : "text-white/30",
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-3 glass bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all duration-500 hover:scale-110 border border-white/10"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5 text-amber-400" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 glass bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="glass bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                {getStepIcon(currentStep)}
              </div>
              <h2 className="text-2xl font-black italic tracking-tight text-white capitalize">
                {currentStep} Information
              </h2>
            </div>
            <p className="text-sm text-white/50">
              {currentStep === "account" && "Set up your login credentials"}
              {currentStep === "personal" && "Tell us about yourself"}
              {currentStep === "business" && "Share your business details"}
              {currentStep === "verification" &&
                "Upload verification documents"}
              {currentStep === "preferences" && "Customize your experience"}
            </p>
          </div>
          {renderStep()}
        </div>

        {/* Info Box */}
        <div className="mt-8 glass bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="font-black text-base uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            What happens next?
          </h3>
          <ul className="text-sm text-white/70 space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Your account will be created instantly</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Profile will be pending verification (1-3 business days)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>You can start browsing deals while waiting</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Once verified, you can create and manage deals</span>
            </li>
          </ul>
        </div>

        {/* Login Link */}
        <p className="text-center mt-8 text-white/50">
          Already have an account?{" "}
          <Link
            to="/middleman/login"
            className="text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
          >
            Sign in
          </Link>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            to="/middleman"
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            ← Back to Middleman Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MiddlemanSignup;
