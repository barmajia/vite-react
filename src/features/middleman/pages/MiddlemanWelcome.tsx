import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Handshake,
  Shield,
  Users,
  DollarSign,
  BarChart3,
  Zap,
  Sparkles,
  CheckCircle2,
  Globe,
  Clock,
  ArrowUp,
  ChevronRight,
  Play,
  Target,
  Award,
  PieChart,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
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
  const particles = Array.from({ length: 20 }, (_, i) => ({
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
          className="absolute rounded-full bg-amber-400/10 animate-float"
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

export function MiddlemanWelcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      icon: <DollarSign className="h-7 w-7" />,
      title:
        t("middleman.welcome.benefits.earnCommission.title") ||
        "Earn Commission on Every Deal",
      description:
        t("middleman.welcome.benefits.earnCommission.desc") ||
        "Get paid for successfully connecting buyers with sellers. Our transparent commission system ensures you're rewarded for every connection.",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: <Users className="h-7 w-7" />,
      title:
        t("middleman.welcome.benefits.connect.title") ||
        "Connect Buyers & Sellers",
      description:
        t("middleman.welcome.benefits.connect.desc") ||
        "Build your network by bringing together businesses that complement each other. Create lasting partnerships and grow your influence.",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      gradient: "from-orange-500 to-amber-600",
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title:
        t("middleman.welcome.benefits.track.title") || "Track Your Earnings",
      description:
        t("middleman.welcome.benefits.track.desc") ||
        "Real-time analytics dashboard shows your commissions, pending deals, and growth metrics. Never wonder where your money is.",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      gradient: "from-amber-600 to-yellow-500",
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title:
        t("middleman.welcome.benefits.secure.title") || "Secure & Transparent",
      description:
        t("middleman.welcome.benefits.secure.desc") ||
        "All transactions are protected and tracked. Get paid automatically when deals close with our escrow-based system.",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      gradient: "from-orange-600 to-amber-500",
    },
    {
      icon: <Globe className="h-7 w-7" />,
      title:
        t("middleman.welcome.benefits.global.title") || "Global Marketplace",
      description:
        t("middleman.welcome.benefits.global.desc") ||
        "Access buyers and sellers from around the world. No geographical limits - connect businesses across borders.",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: t("middleman.welcome.benefits.fast.title") || "Fast Deal Closure",
      description:
        t("middleman.welcome.benefits.fast.desc") ||
        "Our streamlined process helps deals close faster. Average deal closure time is just 48 hours.",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      gradient: "from-orange-500 to-yellow-500",
    },
  ];

  const stats = [
    {
      value: 2500,
      suffix: "+",
      label: t("middleman.welcome.stats.activeMiddlemen") || "Active Middlemen",
      icon: <Handshake className="h-5 w-5" />,
    },
    {
      value: 15000,
      suffix: "+",
      label: t("middleman.welcome.stats.dealsClosed") || "Deals Closed",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      value: 5,
      suffix: "M+",
      label:
        t("middleman.welcome.stats.commissionsPaid") || "Commissions Paid ($)",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      value: 98,
      suffix: "%",
      label:
        t("middleman.welcome.stats.satisfactionRate") || "Satisfaction Rate",
      icon: <Star className="h-5 w-5" />,
    },
  ];

  const howItWorks = [
    {
      step: 1,
      icon: <Users className="h-8 w-8" />,
      title:
        t("middleman.welcome.howItWorks.1.title") || "Sign Up & Get Verified",
      description:
        t("middleman.welcome.howItWorks.1.desc") ||
        "Create your middleman account and complete the verification process. It only takes a few minutes.",
    },
    {
      step: 2,
      icon: <Target className="h-8 w-8" />,
      title: t("middleman.welcome.howItWorks.2.title") || "Find Opportunities",
      description:
        t("middleman.welcome.howItWorks.2.desc") ||
        "Browse buyer requests and seller offerings. Identify matching opportunities where you can add value.",
    },
    {
      step: 3,
      icon: <Handshake className="h-8 w-8" />,
      title: t("middleman.welcome.howItWorks.3.title") || "Connect & Negotiate",
      description:
        t("middleman.welcome.howItWorks.3.desc") ||
        "Introduce buyers to sellers, facilitate negotiations, and help both parties reach an agreement.",
    },
    {
      step: 4,
      icon: <DollarSign className="h-8 w-8" />,
      title: t("middleman.welcome.howItWorks.4.title") || "Earn Commission",
      description:
        t("middleman.welcome.howItWorks.4.desc") ||
        "Once the deal closes, your commission is automatically calculated and paid out. Simple and transparent.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 transition-all duration-300 hover:scale-110 ${
          isScrolled
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-amber-900 to-orange-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          <FloatingParticles />
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mx-auto transition-all duration-300 hover:bg-white/20 hover:scale-105">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              <span>
                {t("middleman.welcome.hero.badge") ||
                  "Become a Trusted Connector"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 bg-clip-text text-transparent">
                {t("middleman.welcome.hero.title") || "Bridge Deals,"}
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-200 via-white to-amber-200 bg-clip-text text-transparent">
                {t("middleman.welcome.hero.title2") || "Earn Rewards"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              {t("middleman.welcome.hero.subtitle") ||
                "Connect buyers with sellers, facilitate transactions, and earn commissions on every successful deal. Join Aurora's growing network of professional middlemen."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40"
                onClick={() => navigate("/middleman/signup")}
              >
                {t("middleman.welcome.hero.signupCta") ||
                  "Sign Up as Middleman"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/login")}
              >
                <Play className="mr-2 h-5 w-5" />
                {t("middleman.welcome.hero.loginCta") || "Login as Middleman"}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>
                  {t("middleman.welcome.hero.trust.global") || "Global Network"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  {t("middleman.welcome.hero.trust.secure") ||
                    "Secure Payments"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {t("middleman.welcome.hero.trust.support") || "24/7 Support"}
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

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-amber-500/20">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-4">
              <Award className="h-4 w-4" />
              <span>
                {t("middleman.welcome.benefits.title") ||
                  "Why Become a Middleman?"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("middleman.welcome.benefits.heading") ||
                "Everything You Need to Succeed"}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("middleman.welcome.benefits.subheading") ||
                "Our platform provides all the tools and support you need to build a thriving middleman business."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border bg-white dark:bg-slate-800 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2"
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

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-amber-900/80 to-orange-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-4">
              <PieChart className="h-4 w-4" />
              <span>
                {t("middleman.welcome.howItWorks.title") || "How It Works"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("middleman.welcome.howItWorks.heading") ||
                "Start Earning in 4 Simple Steps"}
            </h2>
            <p className="text-lg text-white/70">
              {t("middleman.welcome.howItWorks.subheading") ||
                "Our streamlined process makes it easy to get started and start earning commissions."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center group relative">
                {/* Connector Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent" />
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-hover:shadow-lg group-hover:shadow-amber-500/20">
                    {step.icon}
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 md:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 fill-yellow-300 text-yellow-300"
                    />
                  ))}
                </div>

                <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                  "
                  {t("middleman.welcome.testimonial.content") ||
                    "The commission system is transparent and fair. I've built a sustainable income connecting buyers and sellers across multiple industries. Aurora gave me the tools to turn my network into a real business."}
                  "
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold">
                    {t("middleman.welcome.testimonial.avatar") || "MG"}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {t("middleman.welcome.testimonial.name") ||
                        "Maria Garcia"}
                    </div>
                    <div className="text-white/70">
                      {t("middleman.welcome.testimonial.role") ||
                        "Professional Middleman"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>{t("middleman.welcome.cta.badge") || "Start Today"}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {t("middleman.welcome.cta.heading") ||
                "Ready to Start Connecting?"}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
              {t("middleman.welcome.cta.subheading") ||
                "Join thousands of middlemen already earning commissions on Aurora. Create your account today and start building your network."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-10 py-6 rounded-xl shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40"
                onClick={() => navigate("/signup/middleman")}
              >
                {t("middleman.welcome.cta.signupBtn") || "Sign Up as Middleman"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-lg px-10 py-6 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  {t("middleman.welcome.cta.loginBtn") || "Login as Middleman"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-20" />
    </div>
  );
}
