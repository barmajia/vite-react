// src/features/health/pages/DoctorSignup.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  X,
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
import { Badge } from "@/components/ui/badge";
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
import type { HealthDoctorProfile } from "../types";

interface DoctorSignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  location: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: string;
  emergencyFee: string;
  bio: string;
  yearsOfExperience: string;
  education: string;
  certifications: string[];
  licenseDocument: File | null;
  licenseDocumentUrl: string;
  acceptTerms: boolean;
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

const DoctorSignup: React.FC = () => {
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
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<DoctorSignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    location: "",
    specialization: "",
    licenseNumber: "",
    consultationFee: "",
    emergencyFee: "",
    bio: "",
    yearsOfExperience: "",
    education: "",
    certifications: [],
    licenseDocument: null,
    licenseDocumentUrl: "",
    acceptTerms: false,
  });

  const specializations = [
    "General Practitioner",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedic Surgeon",
    "Neurologist",
    "Psychiatrist",
    "Gynecologist",
    "Ophthalmologist",
    "Dentist",
    "Physiotherapist",
    "Nutritionist",
    "Other",
  ];

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only PDF, JPG, or PNG files are allowed");
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `licenses/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("health-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("health-documents").getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        licenseDocument: file,
        licenseDocumentUrl: publicUrl,
      }));
      toast.success("License document uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
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
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (
      !formData.specialization ||
      !formData.licenseNumber ||
      !formData.consultationFee
    ) {
      setError("Please fill all required fields");
      return false;
    }
    if (
      parseFloat(formData.consultationFee) < 0 ||
      parseFloat(formData.emergencyFee) < 0
    ) {
      setError("Fees cannot be negative");
      return false;
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

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      setError(null);
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licenseDocumentUrl) {
      setError("Please upload your license document");
      return;
    }

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
            account_type: "doctor",
            role: "healthcare_provider",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // 2. Create doctor profile
      const doctorProfile: Partial<HealthDoctorProfile> = {
        user_id: authData.user.id,
        specialization: formData.specialization,
        license_number: formData.licenseNumber,
        license_document_url: formData.licenseDocumentUrl,
        consultation_fee: parseFloat(formData.consultationFee),
        emergency_fee:
          parseFloat(formData.emergencyFee) ||
          parseFloat(formData.consultationFee) * 1.5,
        bio: formData.bio || null,
        years_of_experience: formData.yearsOfExperience
          ? parseInt(formData.yearsOfExperience)
          : null,
        education: formData.education ? [formData.education] : null,
        certifications: formData.certifications,
        location: formData.location || null,
        phone: formData.phone || null,
        is_verified: false,
        verification_status: "pending",
        availability_schedule: [],
        consultation_types: ["in_clinic", "online"],
      };

      const { error: doctorError } = await supabaseHealth
        .from("health_doctor_profiles")
        .insert(doctorProfile);

      if (doctorError) throw doctorError;

      // 3. Send verification email (if configured)
      // await supabase.auth.resend({ type: 'signup', email: formData.email });

      toast.success(
        "Registration submitted! Please check your email for verification.",
      );

      navigate("/services/health/doctor/pending-approval", {
        state: { email: formData.email, fullName: formData.fullName },
      });
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Account", icon: User },
    { number: 2, title: "Professional", icon: Stethoscope },
    { number: 3, title: "Verification", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 mb-4 shadow-lg shadow-rose-500/20">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Doctor Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Join Aurora Health as a verified medical professional
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
                          ? "bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/20"
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
                          ? "bg-gradient-to-r from-rose-500 to-indigo-600"
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
              {step === 2 && "Professional Details"}
              {step === 3 && "License Verification"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Create your secure account to get started"}
              {step === 2 && "Tell us about your medical expertise"}
              {step === 3 && "Upload your license for verification"}
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
                <div className="grid md:grid-cols-2 gap-4">
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
                        placeholder="Dr. Jane Smith"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
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
                      placeholder="doctor@example.com"
                      className="pl-10"
                      required
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

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      className="text-rose-600 hover:underline"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="text-rose-600 hover:underline"
                    >
                      Privacy Policy
                    </button>{" "}
                    for healthcare providers
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700"
                  disabled={loading}
                >
                  Next: Professional Info
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            )}

            {/* Step 2: Professional */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={(value) =>
                        setFormData({ ...formData, specialization: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">
                      Years of Experience
                    </Label>
                    <Input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      placeholder="e.g., 10"
                      min="0"
                      max="60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">
                    Medical License Number *
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., MD-123456789"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">
                      Consultation Fee ($) *
                    </Label>
                    <Input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      value={formData.consultationFee}
                      onChange={handleInputChange}
                      placeholder="50.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyFee">Emergency Fee ($)</Label>
                    <Input
                      id="emergencyFee"
                      name="emergencyFee"
                      type="number"
                      value={formData.emergencyFee}
                      onChange={handleInputChange}
                      placeholder="75.00"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">
                      Leave empty to auto-calculate (1.5x consultation fee)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Practice Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, Country"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell patients about your experience, approach to care, and specialties..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 text-right">
                    {formData.bio.length}/500
                  </p>
                </div>

                <div className="flex gap-4">
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
                    className="flex-1 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700"
                    disabled={loading}
                  >
                    Next: Verification
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Verification */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        Verification Required
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Your account will be{" "}
                        <strong>pending verification</strong> until our admin
                        team reviews your license. You won't appear in doctor
                        listings or receive appointments until approved. This
                        typically takes 1-3 business days.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload License Document *</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      formData.licenseDocumentUrl
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-300 dark:border-slate-600 hover:border-rose-400"
                    }`}
                  >
                    {formData.licenseDocumentUrl ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          Document uploaded successfully
                        </p>
                        <p className="text-xs text-slate-500 break-all">
                          {formData.licenseDocumentUrl}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              licenseDocumentUrl: "",
                              licenseDocument: null,
                            })
                          }
                          className="mt-2"
                        >
                          Change Document
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Drop your license file here or click to browse
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            PDF, JPG, or PNG • Max 10MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="license-upload"
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("license-upload")?.click()
                          }
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Choose File"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Consultation Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {["In-Clinic", "Online Video", "Phone Consultation"].map(
                      (type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/30"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {type}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="confirmInfo"
                    checked={true}
                    readOnly
                    className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <Label
                    htmlFor="confirmInfo"
                    className="text-sm text-slate-600 dark:text-slate-400"
                  >
                    I confirm that all information provided is accurate and that
                    I hold a valid medical license
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.licenseDocumentUrl}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit for Verification
                        <CheckCircle2 className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-rose-600 dark:text-rose-400 hover:underline font-medium"
            >
              Sign in instead
            </button>
          </p>
          <p className="mt-2">
            Looking for products?{" "}
            <button
              onClick={() => navigate("/products")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Browse Aurora Products
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;
