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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export function Signup() {
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
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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

  // Password strength calculation (0-4)
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
    "bg-white-200 dark:bg-black-700",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];
  const strengthLabels = ["", "Very weak", "Weak", "Fair", "Strong"];

  // Auto‑focus first field on step change
  useEffect(() => {
    const firstInput = document.querySelector<HTMLInputElement>(
      step === 1 ? "#fullName" : "#password",
    );
    firstInput?.focus();
  }, [step]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black dark:bg-white">
      {/* Theme Toggle & Back Button */}
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-full bg-white/80 dark:bg-black backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-yellow-400 hover:bg-white dark:hover:bg-gray-800"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-indigo-600" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
        </Button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 backdrop-blur-xl">
          {/* Header with brand */}
          <div className="px-6 pt-8 pb-2 text-center">
            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create an account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Join our community today
            </p>
          </div>

          {/* Step Indicator */}
          <div className="px-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= 1
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step > 1 ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    step >= 1
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  Account
                </span>
              </div>
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  step >= 2 ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= 2
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step === 2 ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">2</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    step >= 2
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  Security
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="fullName"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Full name
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fullName: e.target.value,
                          })
                        }
                        className={`pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 ${
                          errors.fullName ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Email address
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={`pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 ${
                          errors.email ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 ${
                          errors.password ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                level <= strengthLevel
                                  ? strengthColors[strengthLevel]
                                  : "bg-gray-200 dark:bg-gray-800"
                              }`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-xs font-medium ${
                            strengthLevel <= 1
                              ? "text-red-500"
                              : strengthLevel <= 2
                                ? "text-orange-500"
                                : "text-green-500"
                          }`}
                        >
                          {strengthLabels[strengthLevel]}
                        </p>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                          <li
                            className={`flex items-center gap-1 ${
                              formData.password.length >= 8
                                ? "text-green-600 dark:text-green-400"
                                : ""
                            }`}
                          >
                            {formData.password.length >= 8 ? "✓" : "○"} At least
                            8 characters
                          </li>
                          <li
                            className={`flex items-center gap-1 ${
                              /[a-z]/.test(formData.password) &&
                              /[A-Z]/.test(formData.password)
                                ? "text-green-600 dark:text-green-400"
                                : ""
                            }`}
                          >
                            {/[a-zA-Z]/.test(formData.password) ? "✓" : "○"}{" "}
                            Upper & lowercase
                          </li>
                          <li
                            className={`flex items-center gap-1 ${
                              /\d/.test(formData.password)
                                ? "text-green-600 dark:text-green-400"
                                : ""
                            }`}
                          >
                            {/\d/.test(formData.password) ? "✓" : "○"} At least
                            one number
                          </li>
                        </ul>
                      </div>
                    )}

                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Confirm password
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 ${
                          errors.confirmPassword ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword &&
                      formData.confirmPassword === formData.password && (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </p>
                      )}
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create account
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                Already have an account?{" "}
                <Link
                  to={ROUTES.LOGIN}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="bg-gray-50/50 dark:bg-gray-800/30 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-around text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
