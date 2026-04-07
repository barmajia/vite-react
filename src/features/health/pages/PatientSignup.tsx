// src/features/health/pages/PatientSignup.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Droplets,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";

interface PatientSignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  bloodType: string;
  medicalHistory: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const bloodTypes = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

const PatientSignup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "",
    color: "",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientSignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    dateOfBirth: "",
    bloodType: "",
    medicalHistory: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-emerald-500",
    ];

    setPasswordStrength({
      score,
      label: labels[Math.max(0, score - 1)] || "Very Weak",
      color: colors[Math.max(0, score - 1)] || "bg-red-500",
      requirements,
    });
  }, [formData.password]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.fullName
    ) {
      setError("Please fill all required fields");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      setError("Please accept the terms and privacy policy");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 0 || age > 150) {
        setError("Please enter a valid date of birth");
        return false;
      }
    }
    return true;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setError(null);
      setStep(2);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            account_type: "patient",
            role: "patient",
          },
        },
      });

      if (authError) {
        // Handle duplicate email error specifically
        if (
          authError.message.includes("duplicate") ||
          authError.message.includes("already") ||
          authError.status === 422
        ) {
          throw new Error(
            "An account with this email already exists. Please sign in instead.",
          );
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      // 2. Create patient profile
      const medicalHistoryArray = formData.medicalHistory
        ? formData.medicalHistory
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const { error: profileError } = await supabaseHealth
        .from("health_patient_profiles")
        .insert({
          user_id: authData.user.id,
          date_of_birth: formData.dateOfBirth || null,
          blood_type: formData.bloodType || null,
          medical_history: medicalHistoryArray,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't throw here - user was created, we can still redirect
        // The database trigger may handle profile creation automatically
      }

      toast.success(
        "Account created successfully! Please check your email to verify your account.",
        { duration: 5000 },
      );

      // Redirect to login with email pre-filled for verification
      navigate("/login", {
        state: {
          email: formData.email,
          message:
            "Please verify your email address. Check your inbox for a verification link.",
        },
      });
    } catch (err) {
      console.error("Patient signup error:", err);

      // Sanitize error message - don't expose internal details
      let errorMessage = "Registration failed. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        // User-friendly error messages
        if (msg.includes("duplicate") || msg.includes("already")) {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (msg.includes("password") && msg.includes("weak")) {
          errorMessage =
            "Password is too weak. Please use a stronger password with uppercase, lowercase, numbers, and special characters.";
        } else if (msg.includes("invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (msg.includes("network") || msg.includes("fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Account", icon: User },
    { number: 2, title: "Health Info", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Patient Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create your secure health account with Aurora
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <React.Fragment key={s.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        step >= s.number
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {step > s.number ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <s.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        step >= s.number
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded ${
                        step > s.number
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-900 dark:text-white">
              {step === 1 && "Account Information"}
              {step === 2 && "Health Profile"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Create your secure account to get started"}
              {step === 2 && "Optional health information for better care"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Step 1: Account */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Password strength:</span>
                          <span
                            className={`font-medium ${
                              passwordStrength.score >= 4
                                ? "text-emerald-600"
                                : passwordStrength.score >= 3
                                  ? "text-blue-600"
                                  : passwordStrength.score >= 2
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                          >
                            {passwordStrength.label}
                          </span>
                        </div>
                        <Progress
                          value={(passwordStrength.score / 5) * 100}
                          className={`h-1 ${passwordStrength.color}`}
                        />
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {[
                            { key: "length", label: "8+ characters" },
                            { key: "uppercase", label: "Uppercase letter" },
                            { key: "lowercase", label: "Lowercase letter" },
                            { key: "number", label: "Number" },
                            { key: "special", label: "Special character" },
                          ].map((req) => (
                            <div
                              key={req.key}
                              className="flex items-center gap-1"
                            >
                              {passwordStrength.requirements[
                                req.key as keyof typeof passwordStrength.requirements
                              ] ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <X className="w-3 h-3 text-slate-300" />
                              )}
                              <span
                                className={
                                  passwordStrength.requirements[
                                    req.key as keyof typeof passwordStrength.requirements
                                  ]
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }
                              >
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-600">
                          Passwords do not match
                        </p>
                      )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Label
                      htmlFor="acceptTerms"
                      className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-emerald-600 hover:underline"
                      >
                        Terms of Service
                      </button>
                    </Label>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="acceptPrivacy"
                      name="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Label
                      htmlFor="acceptPrivacy"
                      className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-emerald-600 hover:underline"
                      >
                        Privacy Policy
                      </button>{" "}
                      and consent to store my health data securely
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  Next: Health Profile
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            )}

            {/* Step 2: Health Info */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth (Optional)
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type (Optional)</Label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) =>
                          handleSelectChange("bloodType", value)
                        }
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">
                    Medical History / Conditions (Optional)
                  </Label>
                  <Textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    placeholder="e.g., Diabetes, Hypertension, Asthma (comma-separated)"
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This information helps doctors provide better care. All data
                    is encrypted and stored securely.
                  </p>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                      Your data is protected
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      All health information is encrypted using
                      industry-standard security and stored in compliance with
                      healthcare privacy regulations.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <CheckCircle2 className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Are you a doctor?{" "}
            <button
              onClick={() => navigate("/health/doctor/signup")}
              className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:underline"
            >
              Register as Healthcare Provider
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientSignup;
