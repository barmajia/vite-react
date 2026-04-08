import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SellerHeader } from "@/features/seller/components/SellerHeader";
import {
  ArrowRight,
  Store,
  TrendingUp,
  Globe,
  Shield,
  Zap,
  Users,
  DollarSign,
  BarChart3,
  Headphones,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Package,
  Clock,
  Star,
  ArrowUp,
  Play,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";

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
          className="absolute rounded-full bg-emerald-400/10 animate-float"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SellerWelcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: t("sellerWelcome.testimonials.0.name") || "Layla Ahmed",
      role: t("sellerWelcome.testimonials.0.role") || "Fashion Seller",
      content:
        t("sellerWelcome.testimonials.0.content") ||
        "Aurora helped me reach customers I never could have on my own. My revenue tripled in just 6 months.",
      avatar: "LA",
      rating: 5,
    },
    {
      name: t("sellerWelcome.testimonials.1.name") || "Chen Wei",
      role: t("sellerWelcome.testimonials.1.role") || "Electronics Seller",
      content:
        t("sellerWelcome.testimonials.1.content") ||
        "The seller dashboard and analytics tools give me complete visibility into my business performance.",
      avatar: "CW",
      rating: 5,
    },
    {
      name: t("sellerWelcome.testimonials.2.name") || "Sofia Martinez",
      role: t("sellerWelcome.testimonials.2.role") || "Handmade Crafts Seller",
      content:
        t("sellerWelcome.testimonials.2.content") ||
        "Setup was incredibly easy. I was live and selling within an hour. The support team is amazing.",
      avatar: "SM",
      rating: 5,
    },
  ];

  const benefits = [
    {
      icon: <Globe className="h-7 w-7" />,
      title: t("sellerWelcome.benefits.globalReach") || "Global Reach",
      description:
        t("sellerWelcome.benefits.globalReachDesc") ||
        "Sell to thousands of customers across the world. Expand your market beyond borders.",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      borderColor: "hover:border-emerald-500",
      shadowColor: "group-hover:shadow-emerald-500/20",
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: t("sellerWelcome.benefits.easySetup") || "Easy Setup",
      description:
        t("sellerWelcome.benefits.easySetupDesc") ||
        "Get your store running in minutes. No technical skills required - just add products and start selling.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "hover:border-blue-500",
      shadowColor: "group-hover:shadow-blue-500/20",
    },
    {
      icon: <DollarSign className="h-7 w-7" />,
      title: t("sellerWelcome.benefits.lowFees") || "Low Commission Fees",
      description:
        t("sellerWelcome.benefits.lowFeesDesc") ||
        "Keep more of what you earn. Our competitive commission rates mean more profit in your pocket.",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      borderColor: "hover:border-amber-500",
      shadowColor: "group-hover:shadow-amber-500/20",
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title: t("sellerWelcome.benefits.analytics") || "Powerful Analytics",
      description:
        t("sellerWelcome.benefits.analyticsDesc") ||
        "Track sales, revenue, and customer behavior with detailed analytics and insights.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      borderColor: "hover:border-purple-500",
      shadowColor: "group-hover:shadow-purple-500/20",
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title: t("sellerWelcome.benefits.secure") || "Secure Payments",
      description:
        t("sellerWelcome.benefits.secureDesc") ||
        "Get paid safely and on time. Our escrow system protects both sellers and buyers.",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      borderColor: "hover:border-emerald-500",
      shadowColor: "group-hover:shadow-emerald-500/20",
    },
    {
      icon: <Headphones className="h-7 w-7" />,
      title: t("sellerWelcome.benefits.support") || "24/7 Support",
      description:
        t("sellerWelcome.benefits.supportDesc") ||
        "Our dedicated team is always here to help you succeed, day or night.",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100 dark:bg-rose-900/30",
      borderColor: "hover:border-rose-500",
      shadowColor: "group-hover:shadow-rose-500/20",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: <Store className="h-8 w-8" />,
      title: t("sellerWelcome.steps.create") || "Create Your Account",
      description:
        t("sellerWelcome.steps.createDesc") ||
        "Sign up in minutes with your business details and get instant access to your seller dashboard.",
    },
    {
      number: "02",
      icon: <Package className="h-8 w-8" />,
      title: t("sellerWelcome.steps.list") || "List Your Products",
      description:
        t("sellerWelcome.steps.listDesc") ||
        "Add your products with photos, descriptions, and pricing. Our tools make it easy.",
    },
    {
      number: "03",
      icon: <TrendingUp className="h-8 w-8" />,
      title: t("sellerWelcome.steps.sell") || "Start Selling",
      description:
        t("sellerWelcome.steps.sellDesc") ||
        "Reach thousands of customers, manage orders, and grow your business with Aurora.",
    },
  ];

  const stats = [
    {
      value: 10000,
      suffix: "+",
      label: t("sellerWelcome.stats.activeSellers") || "Active Sellers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      value: 500000,
      suffix: "+",
      label: t("sellerWelcome.stats.ordersProcessed") || "Orders Processed",
      icon: <Package className="h-5 w-5" />,
    },
    {
      value: 50,
      suffix: "+",
      label: t("sellerWelcome.stats.countries") || "Countries Reached",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      value: 98,
      suffix: "%",
      label: t("sellerWelcome.stats.satisfaction") || "Seller Satisfaction",
      icon: <Star className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Seller Header */}
      <SellerHeader />

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-110 hover:bg-emerald-700 ${
          isScrolled
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          <FloatingParticles />
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-300 text-sm font-medium mx-auto transition-all duration-300 hover:bg-emerald-500/20 hover:scale-105">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              <span>
                {t("sellerWelcome.hero.badge") || "Become a Seller on Aurora"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-white to-teal-300 bg-clip-text text-transparent">
                {t("sellerWelcome.hero.title") || "Sell to the World"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              {t("sellerWelcome.hero.subtitle") ||
                "Join thousands of successful sellers growing their business on Aurora. Reach global customers, manage your store, and scale with powerful tools."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-10 py-7 rounded-xl shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40"
                onClick={() => navigate("/seller/signup")}
              >
                {t("sellerWelcome.hero.signupCta") || "Sign Up as Seller"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md text-emerald-200 hover:bg-emerald-500/20 text-lg px-10 py-7 rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/seller/login")}
              >
                <Play className="mr-2 h-5 w-5" />
                {t("sellerWelcome.hero.loginCta") || "Login as Seller"}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>
                  {t("sellerWelcome.hero.instantSetup") || "Instant Setup"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  {t("sellerWelcome.hero.securePayments") || "Secure Payments"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {t("sellerWelcome.hero.support247") || "24/7 Support"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-emerald-500/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-emerald-400/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>
                {t("sellerWelcome.benefits.title") || "Why Sell on Aurora"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("sellerWelcome.benefits.heading") ||
                "Everything You Need to Succeed"}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("sellerWelcome.benefits.subheading") ||
                "Powerful tools, global reach, and dedicated support to grow your business."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`group p-8 rounded-2xl border-2 bg-white dark:bg-slate-800 ${benefit.borderColor} ${benefit.shadowColor} hover:-translate-y-2 hover:shadow-2xl transition-all duration-500`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${benefit.bgColor} flex items-center justify-center ${benefit.color} mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
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

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-4">
              <TrendingUp className="h-4 w-4" />
              <span>{t("sellerWelcome.steps.title") || "How It Works"}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("sellerWelcome.steps.heading") ||
                "Start Selling in 3 Easy Steps"}
            </h2>
            <p className="text-lg text-white/60">
              {t("sellerWelcome.steps.subheading") ||
                "Getting started is simple. Be up and running in minutes."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 text-7xl font-black text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors duration-300">
                  {step.number}
                </div>

                <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/30">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-emerald-500/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              <span>
                {t("sellerWelcome.testimonials.title") || "Success Stories"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t("sellerWelcome.testimonials.heading") ||
                "Loved by Sellers Worldwide"}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("sellerWelcome.testimonials.subheading") ||
                "Hear from sellers who transformed their business with Aurora."}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 md:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex gap-1 mb-6">
                  {Array.from({
                    length: testimonials[activeTestimonial].rating,
                  }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                  &ldquo;{testimonials[activeTestimonial].content}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-white/70">
                      {testimonials[activeTestimonial].role}
                    </div>
                  </div>
                </div>

                {/* Testimonial Navigation */}
                <div className="flex gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === activeTestimonial
                          ? "w-8 bg-white"
                          : "w-2 bg-white/40 hover:bg-white/60"
                      }`}
                      aria-label={`View testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Aurora Section */}
      <section className="py-24 bg-gradient-to-r from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {t("sellerWelcome.why.title") ||
                "Why Choose Aurora for Your Business?"}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {t("sellerWelcome.why.subtitle") ||
                "A platform built for sellers, by people who understand e-commerce."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-3">
                {t("sellerWelcome.why.verified") || "Verified & Trusted"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("sellerWelcome.why.verifiedDesc") ||
                  "Build trust with verified seller badges and customer reviews."}
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-10 w-10" />
              </div>
              <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-3">
                {t("sellerWelcome.why.grow") || "Scale Your Business"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("sellerWelcome.why.growDesc") ||
                  "From your first sale to thousands of orders, Aurora grows with you."}
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-10 w-10" />
              </div>
              <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-3">
                {t("sellerWelcome.why.global") || "Sell Everywhere"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t("sellerWelcome.why.globalDesc") ||
                  "Multi-currency, multi-language support to reach customers worldwide."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>
                {t("sellerWelcome.cta.badge") || "Ready to Get Started?"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("sellerWelcome.cta.title") ||
                "Start Your Selling Journey Today"}
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              {t("sellerWelcome.cta.subtitle") ||
                "Join thousands of sellers already growing their business on Aurora. Create your free account in minutes."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-white/90 text-lg px-10 py-7 rounded-xl shadow-2xl shadow-black/20 transition-all duration-300 hover:scale-105 font-semibold"
                onClick={() => navigate("/seller/signup")}
              >
                {t("sellerWelcome.cta.signupCta") || "Create Seller Account"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/40 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg px-10 py-7 rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/seller/login")}
              >
                {t("sellerWelcome.cta.loginCta") || "Sign In to Dashboard"}
              </Button>
            </div>

            {/* Additional trust signals */}
            <div className="flex flex-wrap justify-center gap-6 pt-10 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("sellerWelcome.cta.free") || "Free to sign up"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {t("sellerWelcome.cta.noCommitment") || "No commitment"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {t("sellerWelcome.cta.cancelAnytime") || "Cancel anytime"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer navigation links */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Store className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {t("sellerWelcome.footer.brand") || "Aurora Seller Hub"}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                to="/seller/signup"
                className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                {t("sellerWelcome.footer.signup") || "Sign Up"}
              </Link>
              <Link
                to="/seller/login"
                className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                {t("sellerWelcome.footer.login") || "Login"}
              </Link>
              <Link
                to="/"
                className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                {t("sellerWelcome.footer.marketplace") || "Browse Marketplace"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
