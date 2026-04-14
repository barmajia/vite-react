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
  Chrome,
  Handshake,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";

export function MiddlemanLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error.message ?? "Google sign-in failed");
        toast.error(result.error.message ?? "Google sign-in failed");
      }
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.email) {
      setError(t("auth.emailRequired"));
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setError(t("auth.validEmail"));
      return false;
    }
    if (!formData.password) {
      setError(t("auth.passwordRequired"));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signIn(formData.email, formData.password);
      const { error } = result;
      const data = (result as any).data;

      if (error) {
        setError(error.message ?? "Login failed");
        toast.error(error.message ?? "Login failed");
      } else {
        // Verify middleman role
        if (data?.user) {
          const { data: middleman } = await supabase
            .from("middle_men")
            .select("id")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (!middleman) {
            toast.error("Access denied: Middleman account not found");
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          toast.success("Welcome back, Middleman!");
          navigate("/middleman");
        }
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const firstInput = document.querySelector<HTMLInputElement>("#email");
    firstInput?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] pulse pointer-events-none" />

      {/* Top Navigation */}
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
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 animate-in fade-in slide-in-from-top-8 duration-700">
        <div className="flex justify-center mb-6">
          <div className="p-4 glass rounded-3xl shadow-inner border-white/40 dark:border-white/10 scale-110">
            <Handshake className="h-10 w-10 text-amber-500" />
          </div>
        </div>
        <h2 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Middleman Login
        </h2>
        <p className="mt-3 text-muted-foreground font-medium">
          Access your deals & connections dashboard
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border-white/20 dark:border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl text-sm font-medium mb-6 animate-in shake duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold ml-1">
                {t("auth.email")}
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-amber-500">
                  <Mail className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/50 transition-all text-lg placeholder:text-muted-foreground/30"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-sm font-bold">
                  {t("auth.password")}
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary/70 hover:text-primary transition-colors"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-amber-500">
                  <Lock className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-12 pr-12 h-14 glass bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/50 transition-all text-lg placeholder:text-muted-foreground/30"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={t("auth.passwordPlaceholder")}
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
            </div>

            <Button
              type="submit"
              className="w-full glass bg-amber-500 hover:bg-amber-600 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In as Middleman"
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="px-4 glass py-1 rounded-full text-muted-foreground/60 border-white/10">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full glass bg-white/5 border-white/10 hover:bg-white/10 text-foreground h-14 text-lg font-bold rounded-2xl transition-all active:scale-[0.98]"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Chrome className="mr-3 h-6 w-6 text-primary" />
            {t("auth.signInWithGoogle")}
          </Button>

          <p className="text-center text-sm text-muted-foreground font-medium mt-8">
            Don't have a middleman account?{" "}
            <Link
              to="/signup/middleman"
              className="text-amber-500 hover:underline font-bold transition-all underline-offset-4"
            >
              Register as Middleman
            </Link>
          </p>
        </div>

        {/* Status Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/40 font-bold text-[10px] uppercase tracking-[0.2em] animate-in fade-in duration-1000">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            <span>Secure SSL</span>
          </div>
          <div className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
          <span>Verified Enterprise</span>
        </div>
      </div>
    </div>
  );
}
