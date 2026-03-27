// src/features/health/pages/HealthLanding.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  FileText,
  Pill,
  Ambulance,
  CalendarDays,
  Video,
  Shield,
  Users,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const HealthLanding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");

  const quickActions = [
    {
      title: "Find a Doctor",
      icon: Stethoscope,
      path: "/services/health/doctors",
      color: "indigo",
      description: "Browse verified doctors by specialization",
    },
    {
      title: "My Health Records",
      icon: FileText,
      path: "/services/health/patient/dashboard",
      color: "emerald",
      description: "Access your medical history",
      requiresAuth: true,
    },
    {
      title: "Pharmacies",
      icon: Pill,
      path: "/services/health/pharmacies",
      color: "amber",
      description: "Find nearby pharmacies",
    },
    {
      title: "Emergency",
      icon: Ambulance,
      path: "/services/health/doctors?emergency=true",
      color: "red",
      description: "Quick emergency assistance",
      urgent: true,
    },
  ];

  const features = [
    {
      icon: CalendarDays,
      title: "Easy Booking",
      description: "Schedule appointments in seconds",
    },
    {
      icon: Video,
      title: "Telemedicine",
      description: "Video consultations from home",
    },
    {
      icon: Shield,
      title: "Verified Doctors",
      description: "All doctors are license-verified",
    },
    {
      icon: Users,
      title: "Patient Support",
      description: "24/7 customer support",
    },
    {
      icon: Clock,
      title: "Quick Access",
      description: "Same-day appointments available",
    },
    {
      icon: FileText,
      title: "Digital Records",
      description: "Secure health data storage",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/services/health/doctors?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    if (action.requiresAuth && !user) {
      toast.error("Please login to access this feature");
      navigate("/login");
      return;
    }
    navigate(action.path);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      indigo:
        "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
      emerald:
        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      amber:
        "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[100px]" />
          <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 text-sm px-4 py-1.5 rounded-full mb-6">
              <HeartPulseIcon className="w-4 h-4 mr-2 inline" />
              Aurora Healthcare
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Your Health, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-indigo-600 dark:from-rose-400 dark:to-indigo-400">
                Our Priority
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto font-medium">
              Connect with verified doctors, book appointments, and manage your
              health records all in one secure platform.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search doctors, specialties, or clinics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-rose-500 focus:ring-rose-500/20"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 px-8 rounded-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-semibold"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span>Verified Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <span>10,000+ Patients</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Access healthcare services instantly
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              const colorClasses = getColorClasses(action.color);

              return (
                <button
                  key={action.title}
                  onClick={() => handleQuickAction(action)}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${colorClasses} ${
                    action.urgent
                      ? "animate-pulse hover:animate-none"
                      : "hover:shadow-rose-500/10"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                    <p className="text-sm opacity-80">{action.description}</p>
                    {action.requiresAuth && !user && (
                      <Badge className="mt-3 text-xs">Login Required</Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Why Choose Aurora Health?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Comprehensive healthcare solutions designed for your convenience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-indigo-100 dark:from-rose-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Doctor CTA */}
      <div className="py-24 px-4 bg-gradient-to-br from-rose-600 to-indigo-700 dark:from-rose-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Are You a Healthcare Professional?
          </h2>
          <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
            Join our network of verified doctors and grow your practice with
            Aurora Health's powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/services/health/doctor/signup")}
              className="bg-white text-rose-600 hover:bg-rose-50 font-bold h-14 px-8 rounded-full"
            >
              Register as a Doctor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/services/health")}
              className="bg-transparent border-white text-white hover:bg-white/10 h-14 px-8 rounded-full"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Spacer */}
      <div className="h-24 bg-slate-50 dark:bg-slate-950" />
    </div>
  );
};

// Helper icon component
function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export default HealthLanding;
