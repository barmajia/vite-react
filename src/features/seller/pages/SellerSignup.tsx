import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Loader2,
  Sun,
  Moon,
  ArrowLeft,
  Store,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";

export function SellerSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    location?: string;
  }>({});

  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Business name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Business name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must include uppercase, lowercase, and numbers";
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
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    } else if (formData.location.trim().length < 2) {
      newErrors.location = "Please enter a valid location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        "seller",
        {
          phone: formData.phone,
          location: formData.location,
        },
      );

      if (error) {
        toast.error(error.message || "Failed to create seller account");
      } else {
        toast.success("Seller account created successfully! Please check your email to verify.");
        navigate("/seller/dashboard?signup=success");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    const firstInput = document.querySelector<HTMLInputElement>(
      step === 1 ? "#fullName" : "#phone",
    );
    firstInput?.focus();
  }, [step]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[25%] h-[25%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
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
            <Moon className="h-4 w-4 text-primary" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <span className="ml-2 font-medium hidden sm:inline capitalize">
            {theme === "light" ? "Dark" : "Light"}
          </span>
        </Button>
      </div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 animate-in fade-in slide-in-from-top-8 duration-700">
        <div className="flex justify-center mb-6">
          <div className="p-4 glass rounded-3xl shadow-inner border-white/40 dark:border-white/10 scale-110">
            <Store className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Create Seller Account
        </h2>
        <p className="mt-3 text-muted-foreground font-medium">
          Start selling your products today
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card p-0 rounded-[2.5rem] shadow-2xl border-white/20 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Progress Indicator */}
          <div className="flex gap-1 p-1 bg-white/5 border-b border-white/10">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? "bg-emerald-500" : "bg-white/10"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-white/10"}`}
            />
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  {/* Full Name / Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-bold ml-1">
                      Business Name
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                        <Store className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="fullName"
                        type="text"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.fullName ? "border-destructive/50" : ""}`}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Your Business Name"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.fullName && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold ml-1">
                      {t("auth.email")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                        <Mail className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.email ? "border-destructive/50" : ""}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="business@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold ml-1">
                      Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                        <Lock className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className={`pl-12 pr-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.password ? "border-destructive/50" : ""}`}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-emerald-500 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="mt-3 px-1 space-y-2">
                        <div className="flex gap-1.5 h-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full transition-all duration-500 ${
                                level <= strengthLevel ? strengthColors[strengthLevel] : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${strengthLevel <= 1 ? "text-destructive" : strengthLevel <= 2 ? "text-orange-500" : "text-emerald-500"}`}>
                          {strengthLabels[strengthLevel]}
                        </p>
                      </div>
                    )}
                    {errors.password && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-bold ml-1">
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                        <Lock className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={`pl-12 pr-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.confirmPassword ? "border-destructive/50" : ""}`}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-emerald-500 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.confirmPassword}</p>}
                  </div>

                  {/* Next Button */}
                  <Button
                    type="button"
                    className="w-full glass bg-emerald-500 hover:bg-emerald-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    Next
                    <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-bold ml-1">
                      Phone Number
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                        <Phone className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.phone ? "border-destructive/50" : ""}`}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.phone}</p>}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-bold ml-1">
                      Business Location
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                        <MapPin className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="location"
                        type="text"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.location ? "border-destructive/50" : ""}`}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.location && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.location}</p>}
                  </div>

                  {/* Back and Submit Buttons */}
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
                      className="flex-[2] glass bg-emerald-500 hover:bg-emerald-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Create Seller Account
                          <CheckCircle2 className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground font-medium mt-6">
                Already have a seller account?{" "}
                <Link
                  to="/seller/login"
                  className="text-emerald-500 hover:underline font-bold transition-all underline-offset-4"
                >
                  Sign In
                </Link>
              </p>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="bg-white/5 backdrop-blur-3xl px-8 py-5 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500/70" />
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500/70" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-amber-500/70" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
