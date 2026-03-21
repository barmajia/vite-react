import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, Sun, Moon, ArrowLeft } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isValidLink, setIsValidLink] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      setIsValidLink(false);
    }
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.passwordMinLength");
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("signup.passwordsNoMatch");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      if (error) {
        toast.error(t("auth.unexpectedError"));
      } else {
        toast.success(t("resetPassword.passwordUpdated"));
        navigate(ROUTES.LOGIN);
      }
    } catch (_err) {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 via-white to-brand-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12 relative">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm"
            title={
              theme === "light"
                ? "Switch to Dark Mode 🌙"
                : "Switch to Light Mode ☀️"
            }
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-indigo-600" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            <span className="ml-2 text-xs font-medium hidden sm:inline">
              {theme === "light" ? "Dark" : "Light"}
            </span>
          </Button>
        </div>

        <Card className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              {t("resetPassword.invalidLink")}
            </CardTitle>
            <CardDescription className="text-center dark:text-gray-400">
              {t("resetPassword.invalidLinkDesc")}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            >
              {t("resetPassword.requestNewLink")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 via-white to-brand-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12 relative">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm"
          title={
            theme === "light"
              ? "Switch to Dark Mode 🌙"
              : "Switch to Light Mode ☀️"
          }
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-indigo-600" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <span className="ml-2 text-xs font-medium hidden sm:inline">
            {theme === "light" ? "Dark" : "Light"}
          </span>
        </Button>
      </div>

      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {t("resetPassword.title")}
          </CardTitle>
          <CardDescription className="text-center dark:text-gray-400">
            {t("resetPassword.subtitle")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-700 dark:text-gray-200"
              >
                {t("resetPassword.newPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-700 dark:text-gray-200"
              >
                {t("resetPassword.confirmNewPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white ${errors.confirmPassword ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("resetPassword.resetBtn")}
            </Button>
            <p className="text-center text-sm text-muted-foreground dark:text-gray-400">
              {t("resetPassword.rememberPassword")}{" "}
              <Link
                to={ROUTES.LOGIN}
                className="text-primary hover:underline font-medium dark:text-brand-blue-400 dark:hover:text-brand-blue-300"
              >
                {t("auth.signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
