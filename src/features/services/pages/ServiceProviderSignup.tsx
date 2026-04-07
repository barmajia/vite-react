// src/features/services/pages/ServiceProviderSignup.tsx
import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  Code,
  Globe,
  Palette,
  Wrench,
  MapPin,
  Briefcase,
  Github,
  Award,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Monitor,
  Languages,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ServicesVerticalHeader } from "../components/ServicesVerticalHeader";

type Vertical = "programmer" | "translator" | "designer" | "home";

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

const ServiceProviderSignup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const vertical = (searchParams.get("vertical") as Vertical) || "programmer";

  const verticalConfig: Record<
    Vertical,
    {
      color: string;
      gradient: string;
      bgGlow: string;
      icon: React.ElementType;
      label: string;
      tag: string;
      title: string;
      subtitle: string;
    }
  > = {
    programmer: {
      color: "cyan",
      gradient: "from-cyan-500 to-blue-600",
      bgGlow: "bg-cyan-500/20",
      icon: Code,
      label: "DEV_MODE",
      tag: "Nexus Architecture",
      title: "Build the Future",
      subtitle:
        "Join our elite network of developers. Ship code, solve problems, get paid.",
    },
    translator: {
      color: "amber",
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/20",
      icon: Languages,
      label: "LINGUA_LINK",
      tag: "Global Translation Hub",
      title: "Break Language Barriers",
      subtitle:
        "Connect the world through words. Professional translation services at scale.",
    },
    designer: {
      color: "violet",
      gradient: "from-violet-500 to-purple-600",
      bgGlow: "bg-violet-500/20",
      icon: Palette,
      label: "CREATIVE_CORE",
      tag: "Visual Identity System",
      title: "Design Without Limits",
      subtitle:
        "Showcase your creative vision. Build a portfolio that speaks for itself.",
    },
    home: {
      color: "emerald",
      gradient: "from-emerald-500 to-green-600",
      bgGlow: "bg-emerald-500/20",
      icon: Home,
      label: "HOME_FIX",
      tag: "Facility Maintenance",
      title: "Fix Everything",
      subtitle:
        "From plumbing to electrical. Become the go-to expert in your area.",
    },
  };

  const config = verticalConfig[vertical];
  const Icon = config.icon;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    company: "",
    bio: "",
    // Vertical specific
    github: "",
    portfolio: "",
    languages: "",
    tools: "",
    serviceLocation: "",
    experience: "",
    specialization: "",
  });

  // Password strength calculation
  const passwordStrength: PasswordStrength = useMemo(() => {
    const pwd = formData.password;
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
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

    return {
      score,
      label: labels[Math.max(0, score - 1)] || "Very Weak",
      color: colors[Math.max(0, score - 1)] || "bg-red-500",
      requirements,
    };
  }, [formData.password]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const validateStep1 = (): boolean => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            account_type: "provider",
            vertical: vertical,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account creation failed");

      // 2. Create Profile in specific table
      const tableMap: Record<Vertical, string> = {
        programmer: "svc_programmer_profiles",
        translator: "svc_translator_profiles",
        designer: "svc_designer_profiles",
        home: "svc_home_service_profiles",
      };

      const profileData: Record<string, any> = {
        user_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Vertical-specific data
      if (vertical === "programmer") {
        profileData.github_url = formData.github || null;
        profileData.portfolio_url = formData.portfolio || null;
        profileData.years_of_experience = parseInt(formData.experience) || 0;
        profileData.specializations = formData.specialization
          ? formData.specialization.split(",").map((s) => s.trim())
          : [];
      } else if (vertical === "translator") {
        profileData.languages = formData.languages
          ? formData.languages.split(",").map((l) => l.trim())
          : [];
        profileData.years_of_experience = parseInt(formData.experience) || 0;
      } else if (vertical === "designer") {
        profileData.portfolio_url = formData.portfolio || null;
        profileData.design_tools = formData.tools
          ? formData.tools.split(",").map((t) => t.trim())
          : [];
        profileData.years_of_experience = parseInt(formData.experience) || 0;
      } else if (vertical === "home") {
        profileData.coverage_area = formData.serviceLocation || null;
        profileData.years_in_business = parseInt(formData.experience) || 0;
        profileData.specializations = formData.specialization
          ? formData.specialization.split(",").map((s) => s.trim())
          : [];
      }

      const { error: profileError } = await supabase
        .from(tableMap[vertical])
        .insert(profileData);

      if (profileError) {
        console.warn("Profile creation warning:", profileError);
        // Don't throw - user was created, they can complete profile later
      }

      toast.success(`Welcome to the ${config.label} Matrix!`, {
        description: "Please check your email to verify your account.",
      });
      navigate("/services/dashboard/onboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      const message =
        err.message || "An unexpected error occurred. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white relative overflow-hidden font-sans">
      <ServicesVerticalHeader />
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div
          className={cn(
            "absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-[180px] animate-pulse",
            config.bgGlow,
          )}
        />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[180px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row pt-24">
        {/* Left Panel - Brand & Benefits */}
        <div className="lg:w-[50%] flex flex-col justify-center p-8 lg:p-16 space-y-10">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-3 rounded-2xl border shadow-lg transition-transform hover:scale-105",
                `bg-gradient-to-br ${config.gradient} bg-opacity-10 border-white/10`,
              )}
            >
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Aurora{" "}
                <span
                  className={cn(
                    "bg-clip-text text-transparent bg-gradient-to-r",
                    config.gradient,
                  )}
                >
                  {config.label}
                </span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                {config.tag}
              </p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              {config.title}
            </h2>
            <p className="text-lg text-white/50 leading-relaxed max-w-md">
              {config.subtitle}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: "Verified Profile", desc: "Build trust" },
              {
                icon: Activity,
                label: "Real-time Jobs",
                desc: "Instant alerts",
              },
              { icon: Briefcase, label: "Global Reach", desc: "140+ regions" },
              { icon: Award, label: "Elite Network", desc: "Top providers" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
              >
                <item.icon
                  className={cn("h-5 w-5 mt-0.5", `text-${config.color}-400`)}
                />
                <div>
                  <h3 className="text-sm font-semibold text-white/80">
                    {item.label}
                  </h3>
                  <p className="text-xs text-white/30">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Vertical Selector */}
          <div className="space-y-3 pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-white/30">
              Switch Vertical
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    key: "programmer",
                    icon: Code,
                    label: "Developer",
                    color: "cyan",
                  },
                  {
                    key: "translator",
                    icon: Languages,
                    label: "Translator",
                    color: "amber",
                  },
                  {
                    key: "designer",
                    icon: Palette,
                    label: "Designer",
                    color: "violet",
                  },
                  {
                    key: "home",
                    icon: Wrench,
                    label: "Home Services",
                    color: "emerald",
                  },
                ] as const
              ).map((v) => (
                <Link
                  key={v.key}
                  to={`/services/provider/signup?vertical=${v.key}`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                    vertical === v.key
                      ? `bg-${v.color}-500/20 text-${v.color}-400 border border-${v.color}-500/30`
                      : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60",
                  )}
                >
                  <v.icon className="h-3.5 w-3.5" />
                  {v.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:w-[50%] flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-white/5">
                <div
                  className={cn(
                    "h-full transition-all duration-700 bg-gradient-to-r",
                    config.gradient,
                  )}
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
              </div>

              {/* Header */}
              <div className="p-8 pb-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">
                      {step === 1 ? "Create Account" : "Complete Profile"}
                    </h3>
                    <p className="text-xs text-white/40 mt-1">
                      Step {step} of 2
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <div
                      className={cn(
                        "h-2 w-8 rounded-full transition-all",
                        step >= 1
                          ? `bg-gradient-to-r ${config.gradient}`
                          : "bg-white/10",
                      )}
                    />
                    <div
                      className={cn(
                        "h-2 w-8 rounded-full transition-all",
                        step >= 2
                          ? `bg-gradient-to-r ${config.gradient}`
                          : "bg-white/10",
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mx-8 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 1 ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-white/20"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="you@example.com"
                            className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-white/20"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 123-4567"
                            className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-white/20"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Min. 8 characters"
                            className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 pr-12 text-sm placeholder:text-white/20 focus:border-white/20"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {/* Password Strength */}
                        {formData.password && (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/40">Strength:</span>
                              <span
                                className={cn(
                                  "font-medium",
                                  passwordStrength.score >= 4
                                    ? "text-emerald-400"
                                    : passwordStrength.score >= 3
                                      ? "text-blue-400"
                                      : passwordStrength.score >= 2
                                        ? "text-yellow-400"
                                        : "text-red-400",
                                )}
                              >
                                {passwordStrength.label}
                              </span>
                            </div>
                            <Progress
                              value={(passwordStrength.score / 5) * 100}
                              className={cn("h-1.5", passwordStrength.color)}
                            />
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              {[
                                { key: "length", label: "8+ chars" },
                                { key: "uppercase", label: "A-Z" },
                                { key: "lowercase", label: "a-z" },
                                { key: "number", label: "0-9" },
                                { key: "special", label: "!@#$" },
                              ].map((req) => (
                                <div
                                  key={req.key}
                                  className="flex items-center gap-1.5"
                                >
                                  {passwordStrength.requirements[
                                    req.key as keyof typeof passwordStrength.requirements
                                  ] ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <X className="h-3 w-3 text-white/20" />
                                  )}
                                  <span
                                    className={
                                      passwordStrength.requirements[
                                        req.key as keyof typeof passwordStrength.requirements
                                      ]
                                        ? "text-white/60"
                                        : "text-white/20"
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

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Re-enter password"
                            className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 pr-12 text-sm placeholder:text-white/20 focus:border-white/20"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {formData.confirmPassword &&
                          formData.password !== formData.confirmPassword && (
                            <p className="text-xs text-red-400 flex items-center gap-1.5">
                              <X className="h-3 w-3" />
                              Passwords do not match
                            </p>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                      {/* Vertical-specific fields */}
                      {vertical === "programmer" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              GitHub URL
                            </Label>
                            <div className="relative">
                              <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                              <Input
                                name="github"
                                value={formData.github}
                                onChange={handleInputChange}
                                placeholder="https://github.com/username"
                                className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-cyan-500/50"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Portfolio URL
                            </Label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                              <Input
                                name="portfolio"
                                value={formData.portfolio}
                                onChange={handleInputChange}
                                placeholder="https://yourportfolio.dev"
                                className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-cyan-500/50"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Specializations (comma separated)
                            </Label>
                            <Input
                              name="specialization"
                              value={formData.specialization}
                              onChange={handleInputChange}
                              placeholder="React, Node.js, TypeScript..."
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-cyan-500/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Years of Experience
                            </Label>
                            <Input
                              name="experience"
                              type="number"
                              min="0"
                              max="50"
                              value={formData.experience}
                              onChange={handleInputChange}
                              placeholder="5"
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-cyan-500/50"
                            />
                          </div>
                        </>
                      )}

                      {vertical === "translator" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Language Pairs (comma separated)
                            </Label>
                            <Textarea
                              name="languages"
                              value={formData.languages}
                              onChange={handleInputChange}
                              placeholder="English > Arabic, French > English..."
                              className="bg-white/5 border-white/10 rounded-xl min-h-[120px] p-4 text-sm placeholder:text-white/20 focus:border-amber-500/50 resize-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Years of Experience
                            </Label>
                            <Input
                              name="experience"
                              type="number"
                              min="0"
                              max="50"
                              value={formData.experience}
                              onChange={handleInputChange}
                              placeholder="3"
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-amber-500/50"
                            />
                          </div>
                        </>
                      )}

                      {vertical === "designer" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Portfolio URL
                            </Label>
                            <div className="relative">
                              <Palette className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                              <Input
                                name="portfolio"
                                value={formData.portfolio}
                                onChange={handleInputChange}
                                placeholder="https://behance.net/username"
                                className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-violet-500/50"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Design Tools (comma separated)
                            </Label>
                            <Input
                              name="tools"
                              value={formData.tools}
                              onChange={handleInputChange}
                              placeholder="Figma, Blender, After Effects..."
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-violet-500/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Years of Experience
                            </Label>
                            <Input
                              name="experience"
                              type="number"
                              min="0"
                              max="50"
                              value={formData.experience}
                              onChange={handleInputChange}
                              placeholder="4"
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-violet-500/50"
                            />
                          </div>
                        </>
                      )}

                      {vertical === "home" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Coverage Area (City/Region)
                            </Label>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                              <Input
                                name="serviceLocation"
                                value={formData.serviceLocation}
                                onChange={handleInputChange}
                                placeholder="Cairo, Egypt"
                                className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 text-sm placeholder:text-white/20 focus:border-emerald-500/50"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Services Offered (comma separated)
                            </Label>
                            <Input
                              name="specialization"
                              value={formData.specialization}
                              onChange={handleInputChange}
                              placeholder="Plumbing, Electrical, Painting..."
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-emerald-500/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                              Years in Business
                            </Label>
                            <Input
                              name="experience"
                              type="number"
                              min="0"
                              max="50"
                              value={formData.experience}
                              onChange={handleInputChange}
                              placeholder="10"
                              className="bg-white/5 border-white/10 rounded-xl h-14 px-4 text-sm placeholder:text-white/20 focus:border-emerald-500/50"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    {step === 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 h-14 rounded-xl text-sm font-medium border-white/10 hover:bg-white/5"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        "flex-1 h-14 rounded-xl text-sm font-medium transition-all",
                        step === 1
                          ? "bg-white text-black hover:bg-white/90"
                          : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`,
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          {step === 1 ? "Continue" : "Create Account"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <p className="text-xs text-white/30">
                    Already a provider?{" "}
                    <Link
                      to="/services/provider/login"
                      className={cn(
                        "font-medium transition-colors hover:underline",
                        `text-${config.color}-400 hover:text-${config.color}-300`,
                      )}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderSignup;
