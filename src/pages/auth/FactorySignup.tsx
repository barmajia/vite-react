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
  Factory as FactoryIcon,
  ShieldCheck,
  Zap,
  ArrowRight,
  Chrome,
  Phone,
  MapPin,
  Settings,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { factorySignup } from "@/hooks/useRoleSignup";

export function FactorySignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUpWithGoogle } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    specialization: "",
    productionCapacity: "",
  });
  const [errors, setErrors] = useState<{
    companyName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    location?: string;
  }>({});

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const result = await signUpWithGoogle("factory");
      if (result.error) {
        toast.error(result.error.message ?? "Google signup failed");
      } else {
        toast.success("Factory account created! Please complete your profile.");
      }
    } catch {
      toast.error("Google signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = "Company name must be at least 2 characters";
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
      const result = await factorySignup(
        formData.email,
        formData.password,
        formData.companyName,
        formData.phone,
        formData.location,
        "USD",
        formData.specialization || undefined,
        formData.productionCapacity
          ? parseInt(formData.productionCapacity)
          : undefined,
      );

      if (result.success) {
        toast.success("Factory account created successfully!");
        navigate("/factory/dashboard?signup=success");
      } else {
        toast.error(result.error ?? "Failed to create factory account");
      }
    } catch {
      toast.error("Failed to create factory account");
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
    "bg-blue-500 shadow-blue-500/50",
  ];
  const strengthLabels = ["", "Very weak", "Weak", "Fair", "Strong"];

  useEffect(() => {
    const firstInput = document.querySelector<HTMLInputElement>(
      step === 1 ? "#companyName" : "#phone",
    );
    firstInput?.focus();
  }, [step]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Immersive Background - Blue Theme */}
      <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[140px] pulse pointer-events-none" />
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

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
            <Moon className="h-4 w-4 text-blue-500" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <span className="ml-2 font-medium hidden sm:inline capitalize">
            {theme === "light" ? t("common.darkMode") : t("common.lightMode")}
          </span>
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="inline-flex items-center justify-center p-3 glass rounded-2xl mb-6 shadow-inner scale-110">
          <Factory className="h-8 w-8 text-blue-500 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
          Register Factory
        </h1>
        <p className="mt-3 text-muted-foreground font-medium">
          Connect with global buyers & scale production
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card p-0 rounded-[2.5rem] shadow-2xl border-white/20 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Progress Indicator */}
          <div className="flex gap-1 p-1 bg-white/5 border-b border-white/10">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? "bg-blue-500" : "bg-white/10"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"}`}
            />
          </div>

          <div className="p-8 sm:p-10">
            {/* Google Signup */}
            <div className="mb-8">
              <Button
                type="button"
                variant="ghost"
                className="w-full glass bg-white/5 border-white/10 hover:bg-white/10 text-foreground h-14 text-lg font-bold rounded-2xl transition-all active:scale-[0.98]"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <Chrome className="mr-3 h-6 w-6 text-blue-500" />
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <Label
                      htmlFor="factoryName"
                      className="text-sm font-bold ml-1"
                    >
                      Company Name
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                        <Building2 className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="companyName"
                        type="text"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.companyName ? "border-destructive/50" : ""}`}
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyName: e.target.value,
                          })
                        }
                        placeholder="Your Factory or Business Name"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.companyName && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold ml-1">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
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
                        placeholder="factory@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-bold ml-1"
                    >
                      Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
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
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-blue-500 transition-colors"
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
                          className={`text-[10px] font-black uppercase tracking-widest ${strengthLevel <= 1 ? "text-destructive" : strengthLevel <= 2 ? "text-orange-500" : "text-blue-500"}`}
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-bold ml-1"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
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
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-blue-500 transition-colors"
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
                    className="w-full glass bg-blue-500 hover:bg-blue-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-bold ml-1">
                      Phone Number
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="location"
                      className="text-sm font-bold ml-1"
                    >
                      Factory Location
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                        <MapPin className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="location"
                        type="text"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.location ? "border-destructive/50" : ""}`}
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="City, Country"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Specialization */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="specialization"
                      className="text-sm font-bold ml-1"
                    >
                      Specialization (Optional)
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                        <Settings className="h-5 w-5 text-muted-foreground/30" />
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
                        placeholder="e.g., Textiles, Electronics, Auto Parts"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Production Capacity */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="productionCapacity"
                      className="text-sm font-bold ml-1"
                    >
                      Monthly Capacity (Units) (Optional)
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                        <FactoryIcon className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="productionCapacity"
                        type="number"
                        className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
                        value={formData.productionCapacity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            productionCapacity: e.target.value,
                          })
                        }
                        placeholder="e.g., 50000"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

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
                      className="flex-[2] glass bg-blue-500 hover:bg-blue-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Register Factory"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground font-medium mt-6">
                Already have a factory account?{" "}
                <Link
                  to="/factory/login"
                  className="text-blue-500 hover:underline font-bold transition-all underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>
            </form>
          </div>

          {/* Factory Trust Badges */}
          <div className="bg-white/5 backdrop-blur-3xl px-8 py-5 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500/70" />
                <span>Verified Manufacturers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500/70" />
                <span>B2B Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500/70" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
