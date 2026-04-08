import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FactoryHeader } from "@/features/factory/components/FactoryHeader";
import {
  ArrowRight,
  Factory,
  Globe,
  Shield,
  TrendingUp,
  Users,
  Package,
  Zap,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Clock,
  Award,
  BarChart3,
  Settings,
  ArrowUp,
} from "lucide-react";

// Intersection Observer Hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated Counter Component
function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Floating Particles Component
function FloatingParticles() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function FactoryWelcome() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const benefits = [
    {
      icon: <Globe className="h-7 w-7" />,
      title:
        t("factoryWelcome.benefits.globalReach.title") ||
        "Connect with Global Buyers",
      description:
        t("factoryWelcome.benefits.globalReach.description") ||
        "Reach manufacturers, wholesalers, and buyers from over 50+ countries worldwide.",
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title:
        t("factoryWelcome.benefits.analytics.title") || "Advanced Analytics",
      description:
        t("factoryWelcome.benefits.analytics.description") ||
        "Track production performance, sales trends, and market demand with real-time dashboards.",
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title:
        t("factoryWelcome.benefits.qualityControl.title") || "Quality Control",
      description:
        t("factoryWelcome.benefits.qualityControl.description") ||
        "Built-in QC workflows ensure every batch meets standards before shipment.",
    },
    {
      icon: <Package className="h-7 w-7" />,
      title:
        t("factoryWelcome.benefits.production.title") ||
        "Production Management",
      description:
        t("factoryWelcome.benefits.production.description") ||
        "Manage orders, timelines, and capacity all in one centralized platform.",
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title:
        t("factoryWelcome.benefits.efficiency.title") ||
        "Streamlined Operations",
      description:
        t("factoryWelcome.benefits.efficiency.description") ||
        "Automate workflows, reduce manual overhead, and scale production effortlessly.",
    },
    {
      icon: <Users className="h-7 w-7" />,
      title:
        t("factoryWelcome.benefits.partnerships.title") || "Build Partnerships",
      description:
        t("factoryWelcome.benefits.partnerships.description") ||
        "Connect with trusted suppliers, middlemen, and delivery partners for seamless logistics.",
    },
  ];

  const stats = [
    {
      value: 500,
      suffix: "+",
      label: t("factoryWelcome.stats.factories") || "Active Factories",
      icon: <Factory className="h-5 w-5" />,
    },
    {
      value: 50,
      suffix: "+",
      label: t("factoryWelcome.stats.countries") || "Countries Reached",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      value: 98,
      suffix: "%",
      label: t("factoryWelcome.stats.satisfaction") || "Satisfaction Rate",
      icon: <Award className="h-5 w-5" />,
    },
    {
      value: 10,
      suffix: "M+",
      label: t("factoryWelcome.stats.unitsProduced") || "Units Produced",
      icon: <Package className="h-5 w-5" />,
    },
  ];

  const steps = [
    {
      step: 1,
      icon: <Settings className="h-6 w-6" />,
      title:
        t("factoryWelcome.steps.register.title") || "Register Your Factory",
      description:
        t("factoryWelcome.steps.register.description") ||
        "Create your account and set up your factory profile with capabilities and certifications.",
    },
    {
      step: 2,
      icon: <Package className="h-6 w-6" />,
      title: t("factoryWelcome.steps.list.title") || "List Your Products",
      description:
        t("factoryWelcome.steps.list.description") ||
        "Add your product catalog with pricing, MOQs, and production lead times.",
    },
    {
      step: 3,
      icon: <TrendingUp className="h-6 w-6" />,
      title: t("factoryWelcome.steps.grow.title") || "Grow & Scale",
      description:
        t("factoryWelcome.steps.grow.description") ||
        "Receive orders, manage production, and expand your business globarlly.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Factory Header */}
      <FactoryHeader />
      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-110 hover:bg-indigo-500 ${
          isScrolled
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          <FloatingParticles />
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "3s" }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mx-auto transition-all duration-300 hover:bg-white/15 hover:scale-105">
              <Factory className="h-4 w-4 text-blue-400" />
              <span>
                {t("factoryWelcome.badge") || "For Manufacturers & Producers"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                {t("factoryWelcome.heroTitle") || "Power Your Factory"}
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                {t("factoryWelcome.heroTitleAccent") || "Reach the World"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              {t("factoryWelcome.heroSubtitle") ||
                "Join Aurora's manufacturing network. Manage production, connect with global buyers, and scale your operations with enterprise-grade tools."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/factory/signup">
                <button className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40 font-semibold">
                  {t("factoryWelcome.cta.signup") || "Sign Up as Factory"}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link to="/factory/login">
                <button className="flex items-center gap-2 border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 font-semibold">
                  {t("factoryWelcome.cta.login") || "Login as Factory"}
                </button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  {t("factoryWelcome.badges.verified") || "Verified Factories"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>
                  {t("factoryWelcome.badges.global") || "Global Network"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {t("factoryWelcome.badges.support") || "24/7 Support"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      <section className="py-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BENEFITS SECTION ==================== */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>
                {t("factoryWelcome.benefits.title") ||
                  "Why Choose Aurora for Your Factory"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("factoryWelcome.benefits.heading") ||
                "Everything You Need to Scale Production"}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("factoryWelcome.benefits.description") ||
                "From order management to quality control, Aurora provides the complete toolkit for modern manufacturers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-blue-500/25">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>
                {t("factoryWelcome.steps.title") || "Getting Started"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("factoryWelcome.steps.heading") || "Three Steps to Go Live"}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("factoryWelcome.steps.description") ||
                "Set up your factory presence on Aurora in minutes, not weeks."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((item, index) => (
              <div key={index} className="relative text-center group">
                {/* Step Number Badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold mb-6 shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {item.step}
                </div>

                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-2/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-600 to-transparent" />
                )}

                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4 transition-all duration-300 group-hover:scale-110">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURE HIGHLIGHTS ==================== */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-10 text-white group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                    <BarChart3 className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {t("factoryWelcome.features.analytics.title") ||
                      "Real-Time Production Analytics"}
                  </h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    {t("factoryWelcome.features.analytics.description") ||
                      "Monitor production metrics, track order fulfillment, and optimize capacity utilization with live dashboards and automated reports."}
                  </p>
                  <ul className="space-y-3">
                    {[
                      t("factoryWelcome.features.analytics.f1") ||
                        "Production pipeline tracking",
                      t("factoryWelcome.features.analytics.f2") ||
                        "Revenue and order analytics",
                      t("factoryWelcome.features.analytics.f3") ||
                        "Performance benchmarks",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-cyan-300 flex-shrink-0" />
                        <span className="text-white/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-8 md:p-10 text-white group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                    <Globe className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {t("factoryWelcome.features.marketplace.title") ||
                      "Global Marketplace Access"}
                  </h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    {t("factoryWelcome.features.marketplace.description") ||
                      "Showcase your capabilities to thousands of buyers worldwide. Get discovered through smart matching and verified supplier profiles."}
                  </p>
                  <ul className="space-y-3">
                    {[
                      t("factoryWelcome.features.marketplace.f1") ||
                        "Verified supplier badge",
                      t("factoryWelcome.features.marketplace.f2") ||
                        "Smart buyer-factory matching",
                      t("factoryWelcome.features.marketplace.f3") ||
                        "Multi-currency support",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-cyan-300 flex-shrink-0" />
                        <span className="text-white/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mx-auto">
              <Sparkles className="h-4 w-4" />
              <span>
                {t("factoryWelcome.finalCta.badge") ||
                  "Ready to Transform Your Business?"}
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                {t("factoryWelcome.finalCta.title") ||
                  "Start Manufacturing Smarter Today"}
              </span>
            </h2>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              {t("factoryWelcome.finalCta.description") ||
                "Join hundreds of factories already using Aurora to streamline operations, reach new markets, and grow their business globally."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/factory/signup">
                <button className="group flex items-center gap-2 bg-white text-slate-900 hover:bg-white/90 text-lg px-10 py-4 rounded-xl shadow-2xl shadow-white/20 transition-all duration-300 hover:scale-105 hover:shadow-white/30 font-semibold">
                  {t("factoryWelcome.finalCta.signupButton") ||
                    "Create Factory Account"}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link to="/factory/login">
                <button className="flex items-center gap-2 border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg px-10 py-4 rounded-xl transition-all duration-300 hover:scale-105 font-semibold">
                  {t("factoryWelcome.finalCta.loginButton") ||
                    "Existing Factory? Sign In"}
                </button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-6 pt-6 text-white/50 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>
                  {t("factoryWelcome.finalCta.free") || "Free to get started"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>
                  {t("factoryWelcome.finalCta.nocard") ||
                    "No credit card required"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>
                  {t("factoryWelcome.finalCta.setup") ||
                    "Setup in under 5 minutes"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
