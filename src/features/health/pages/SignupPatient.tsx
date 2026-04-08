// src/features/health/pages/SignupPatient.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  Stethoscope,
  Building,
  Pill,
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
import { cn } from "@/lib/utils";

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

const SignupPatient: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Critical fields required for bio-authentication.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Cipher mismatch. Please re-verify passwords.");
      return false;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      setError("Protocol authorization required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: "patient",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabaseHealth
          .from("health_patient_profiles")
          .insert({
            user_id: authData.user.id,
            date_of_birth: formData.dateOfBirth || null,
            blood_type: formData.bloodType || null,
            medical_history: formData.medicalHistory
              ? { details: formData.medicalHistory }
              : {},
          });

        if (profileError) throw profileError;

        toast.success("Bio-Profile Initialized Successfully");
        navigate("/health/patient/dashboard");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

        {/* Animated DNA/Health elements (CSS only) */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.07)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      </div>

      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-12 relative z-10">
        {/* Left Side: Brand & Benefits */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl shadow-2xl shadow-rose-500/20">
              <Activity className="h-8 w-8 text-rose-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter leading-none">
                AURORA <span className="text-rose-500">HEALTH</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">
                Next-Gen Patient Portal
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-black leading-[1.1] tracking-tight">
              Initialize Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-300">
                Bio-Identity
              </span>
              .
            </h2>
            <p className="text-white/40 text-lg leading-relaxed">
              Connect with top-tier medical experts, pharmacies, and world-class
              hospital facilities through our decentralized health nexus.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Stethoscope,
                label: "Expert Consults",
                desc: "Top 1% Specialists",
              },
              { icon: Pill, label: "Digital Pharma", desc: "Express Medicine" },
              {
                icon: Building,
                label: "Facility Access",
                desc: "Global Hospital Network",
              },
              {
                icon: Shield,
                label: "Encrypted Data",
                desc: "Zero-Knowledge Storage",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 glass-card bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 group"
              >
                <item.icon className="h-5 w-5 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white/80">
                  {item.label}
                </h3>
                <p className="text-[9px] text-white/30 uppercase font-bold mt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/20">
            <span>Verified Bio-System</span>
            <div className="h-px flex-1 bg-white/10" />
            <span>Encrypted Node</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full opacity-20" />
          <Card className="bg-black/40 backdrop-blur-3xl border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />

            <CardHeader className="p-10 pb-0">
              <div className="flex justify-between items-end mb-4">
                <CardTitle className="text-3xl font-black italic tracking-tighter uppercase">
                  Register <span className="text-rose-500">Citizen</span>
                </CardTitle>
                <div className="flex gap-1.5">
                  <div
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-all duration-500",
                      step === 1
                        ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        : "bg-white/10",
                    )}
                  />
                  <div
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-all duration-500",
                      step === 2
                        ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        : "bg-white/10",
                    )}
                  />
                </div>
              </div>
              <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                Phase {step}:{" "}
                {step === 1 ? "Account Identification" : "Medical Profile Data"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10 space-y-8">
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                        Full Legal Name
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-rose-500 transition-colors" />
                        <Input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="CITIZEN NAME"
                          className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-xs font-black uppercase tracking-widest placeholder:text-white/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                        Communication Node (Email)
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-rose-500 transition-colors" />
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="BIO-LINK@AURORA.COM"
                          className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-xs font-black uppercase tracking-widest placeholder:text-white/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                          Access Phrase
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-rose-500 transition-colors" />
                          <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-xs font-black uppercase tracking-widest placeholder:text-white/10 focus:border-rose-500/50"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-white/20" />
                            ) : (
                              <Eye className="h-4 w-4 text-white/20" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                          Re-Verify Phrase
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-rose-500 transition-colors" />
                          <Input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-xs font-black uppercase tracking-widest placeholder:text-white/10 focus:border-rose-500/50"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-white/20" />
                            ) : (
                              <Eye className="h-4 w-4 text-white/20" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            acceptTerms: !p.acceptTerms,
                          }))
                        }
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            formData.acceptTerms
                              ? "bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/20"
                              : "border-white/10 bg-white/5",
                          )}
                        >
                          {formData.acceptTerms && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                          I accept Aurora Bio-Governance Protocols
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                          Birth Manifestation
                        </Label>
                        <Input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-xs font-black uppercase tracking-widest focus:border-rose-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                          Essence Type (Blood)
                        </Label>
                        <Select
                          value={formData.bloodType}
                          onValueChange={(v) =>
                            handleSelectChange("bloodType", v)
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-xs font-black uppercase tracking-widest focus:border-rose-500/50">
                            <SelectValue placeholder="SELECT TYPE" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl shadow-2xl">
                            {bloodTypes.map((b) => (
                              <SelectItem
                                key={b}
                                value={b}
                                className="text-[10px] font-black uppercase tracking-widest focus:bg-rose-500/10 focus:text-rose-500"
                              >
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 ml-1">
                        Bio-History / Conditions
                      </Label>
                      <Textarea
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        onChange={handleInputChange}
                        placeholder="IDENTIFY PRE-EXISTING ANOMALIES..."
                        className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] p-6 text-xs font-black uppercase tracking-widest placeholder:text-white/10 focus:border-rose-500/50 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className={cn(
                      "flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 shadow-2xl active:scale-95",
                      step === 1
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30",
                    )}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Bio-Data...
                      </>
                    ) : (
                      <>
                        {step === 1 ? "Initialize Profile" : "Complete Synergy"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="text-center pt-8 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                  Already linked?{" "}
                  <Link
                    to="/login"
                    className="text-rose-500 hover:text-rose-400 hover:underline transition-all"
                  >
                    Reconnect Node
                  </Link>
                </p>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 mt-4">
                  Decentralized Health Cloud Protocol v4.2.0
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignupPatient;
