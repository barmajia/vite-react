import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  CheckCircle2,
  Sun,
  Moon,
  ArrowLeft,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Chrome,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
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
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error.message ?? t("auth.googleAuthFailed"));
      }
    } catch (_err) {
      toast.error(t("auth.googleAuthFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("signup.fullNameRequired");
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t("signup.fullNameMinLength");
    }

    if (!formData.email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t("auth.validEmail");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: typeof errors = {};

    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("auth.passwordMinLength8");
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t("signup.passwordStrength");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("signup.passwordsNoMatch");
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
      );

      if (error) {
        toast.error(t("auth.unexpectedError"));
      } else {
        toast.success(t("signup.accountCreated"));
        navigate(ROUTES.LOGIN);
      }
    } catch (_err) {
      toast.error(t("auth.unexpectedError"));
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
    "bg-green-500 shadow-green-500/50",
  ];
  const strengthLabels = ["", "Very weak", "Weak", "Fair", "Strong"];

  useEffect(() => {
    const firstInput = document.querySelector<HTMLInputElement>(
      step === 1 ? "#fullName" : "#password",
    );
    firstInput?.focus();
  }, [step]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Immersive Background */}
      <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[140px] pulse pointer-events-none" />
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

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
            {theme === "light" ? t("common.darkMode") : t("common.lightMode")}
          </span>
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="inline-flex items-center justify-center p-3 glass rounded-2xl mb-6 shadow-inner scale-110">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("signup.title")}
        </h1>
        <p className="mt-3 text-muted-foreground font-medium">
          {t("signup.subtitle")}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card p-0 rounded-[2.5rem] shadow-2xl border-white/20 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Progress Indicator */}
          <div className="flex gap-1 p-1 bg-white/5 border-b border-white/10">
            <div 
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? "bg-primary" : "bg-white/10"}`} 
            />
            <div 
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-white/10"}`} 
            />
          </div>

          <div className="p-8 sm:p-10">
            {/* Google Link */}
            <div className="mb-8">
              <Button
                type="button"
                variant="ghost"
                className="w-full glass bg-white/5 border-white/10 hover:bg-white/10 text-foreground h-14 text-lg font-bold rounded-2xl transition-all active:scale-[0.98]"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <Chrome className="mr-3 h-6 w-6 text-primary" />
                {t("auth.signUpWithGoogle")}
              </Button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
                <span className="px-4 glass py-1 rounded-full text-muted-foreground/60 border-white/10 italic">
                  {t("auth.orUseEmail")}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-bold ml-1">
                      {t("signup.fullName")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <User className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="fullName"
                        type="text"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.fullName ? "border-destructive/50" : ""}`}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={t("signup.fullNamePlaceholder")}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.fullName && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold ml-1">
                      {t("signup.email")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <Mail className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        className={`pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20 ${errors.email ? "border-destructive/50" : ""}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t("signup.emailPlaceholder")}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.email}</p>}
                  </div>

                  <Button
                    type="button"
                    className="w-full glass bg-primary hover:bg-primary/90 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    {t("common.next")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold ml-1">
                      {t("signup.password")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
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
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-primary transition-colors"
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
                        <p className={`text-[10px] font-black uppercase tracking-widest ${strengthLevel <= 1 ? "text-destructive" : strengthLevel <= 2 ? "text-orange-500" : "text-green-500"}`}>
                          {strengthLabels[strengthLevel]}
                        </p>
                      </div>
                    )}
                    {errors.password && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-bold ml-1">
                      {t("signup.confirmPassword")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
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
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-primary transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] font-bold text-destructive ml-2 tracking-wide uppercase">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 glass bg-white/5 border-white/10 h-14 text-lg font-bold rounded-2xl active:scale-[0.98]"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      {t("common.back")}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-[2] glass bg-primary hover:bg-primary/90 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("signup.createAccount")}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground font-medium mt-6">
                {t("signup.alreadyHaveAccount")}{" "}
                <Link
                  to={ROUTES.LOGIN}
                  className="text-primary hover:underline font-bold transition-all underline-offset-4"
                >
                  {t("signup.signIn")}
                </Link>
              </p>
            </form>
          </div>

          {/* Luxury Trust Badges */}
          <div className="bg-white/5 backdrop-blur-3xl px-8 py-5 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500/70" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-500/70" />
                <span>Instant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500/70" />
                <span>Global</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
