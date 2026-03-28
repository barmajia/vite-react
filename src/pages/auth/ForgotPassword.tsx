import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Loader2, ArrowLeft, Sun, Moon, Sparkles, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { ROUTES } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";

export function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!email) {
      setError(t("auth.emailRequired"));
      return false;
    }
    if (!isValidEmail(email)) {
      setError(t("auth.validEmail"));
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(t("auth.unexpectedError"));
      } else {
        setIsSubmitted(true);
        toast.success(t("forgotPassword.resetEmailSent"));
      }
    } catch (_err) {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-400/20 dark:bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Theme Toggle & Back Button */}
      <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
          title={theme === "light" ? "Switch to Dark Mode 🌙" : "Switch to Light Mode ☀️"}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-violet-600" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </Button>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo/Icon Area */}
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
        </div>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-3 pb-6 text-center">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("forgotPassword.title", "Reset Password")}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-base">
              {t("forgotPassword.subtitle", "Enter your email address and we'll send you a link to reset your password.")}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {isSubmitted ? (
                <div className="text-center space-y-6 py-4 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                      {t("forgotPassword.checkEmail", "Check your email")}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {t("forgotPassword.sentResetLink", "We've sent a password reset link to")} <br />
                      <strong className="text-slate-900 dark:text-white font-semibold">{email}</strong>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                    className="w-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 py-6 rounded-xl transition-all text-slate-600 dark:text-slate-300 font-medium"
                  >
                    {t("forgotPassword.tryAnotherEmail", "Try another email")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t("auth.email", "Email address")}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder", "name@example.com")}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        className={`pl-11 py-6 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:ring-violet-500 focus:border-violet-500 rounded-xl transition-all ${
                          error ? "border-rose-500 focus:ring-rose-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {error && (
                      <p className="text-sm font-medium text-rose-500 animate-in slide-in-from-top-1">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            {!isSubmitted && (
              <CardFooter className="flex flex-col space-y-6 pt-2 pb-8">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all border-0" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    t("forgotPassword.sendResetLink", "Send Reset Link")
                  )}
                </Button>
                <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("forgotPassword.rememberPassword", "Remember your password?")}{" "}
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-sm"
                  >
                    {t("auth.signIn", "Sign in")}
                  </Link>
                </p>
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
