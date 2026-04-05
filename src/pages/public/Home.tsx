import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  Star,
  Zap,
  Users,
  TrendingUp,
  Handshake,
  Package,
  Sparkles,
  ChevronRight,
  Globe,
  Clock,
  Award,
  CheckCircle2,
  Play,
  ArrowUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, CardDescription } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ROUTES } from "@/lib/constants";
import { ProductCardSkeleton } from "@/components/ui";

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
          className="absolute rounded-full bg-white/10 animate-float"
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

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useFeaturedProducts(8);
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

  // Get testimonials from translations
  const testimonials = [
    {
      name: t("home.testimonials.0.name") || "Sarah Johnson",
      role: t("home.testimonials.0.role") || "Seller",
      content:
        t("home.testimonials.0.content") ||
        "Aurora transformed my small business into a thriving online store.",
      avatar: "SJ",
      rating: 5,
    },
    {
      name: t("home.testimonials.1.name") || "Ahmed Hassan",
      role: t("home.testimonials.1.role") || "Factory Owner",
      content:
        t("home.testimonials.1.content") ||
        "We've doubled our production capacity thanks to Aurora.",
      avatar: "AH",
      rating: 5,
    },
    {
      name: t("home.testimonials.2.name") || "Maria Garcia",
      role: t("home.testimonials.2.role") || "Middleman",
      content:
        t("home.testimonials.2.content") ||
        "The commission system is transparent and fair.",
      avatar: "MG",
      rating: 5,
    },
  ];

  const roles = [
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: t("home.roles.customer") || "Customer",
      description:
        t("home.roles.customerDesc") || "Browse and buy products from sellers",
      link: "/signup",
      color: "hover:border-blue-500 group-hover:shadow-blue-500/20",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: t("home.roles.seller") || "Seller",
      description:
        t("home.roles.sellerDesc") ||
        "Sell products to customers and factories",
      link: "/signup",
      color: "hover:border-green-500 group-hover:shadow-green-500/20",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      textColor: "text-green-600 dark:text-green-400",
      gradient: "from-green-500 to-green-600",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: t("home.roles.factory") || "Factory",
      description:
        t("home.roles.factoryDesc") || "Manufacture products for wholesale",
      link: "/signup",
      color: "hover:border-orange-500 group-hover:shadow-orange-500/20",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      textColor: "text-orange-600 dark:text-orange-400",
      gradient: "from-orange-500 to-orange-600",
    },
    {
      icon: <Handshake className="h-8 w-8" />,
      title: t("home.roles.middleman") || "Middleman",
      description:
        t("home.roles.middlemanDesc") ||
        "Connect buyers and sellers, earn commissions",
      link: "/signup/middleman",
      color: "hover:border-purple-500 group-hover:shadow-purple-500/20",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      textColor: "text-purple-600 dark:text-purple-400",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: t("home.roles.delivery") || "Delivery",
      description:
        t("home.roles.deliveryDesc") || "Deliver orders and earn per delivery",
      link: "/signup",
      color: "hover:border-red-500 group-hover:shadow-red-500/20",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      textColor: "text-red-600 dark:text-red-400",
      gradient: "from-red-500 to-red-600",
    },
  ];

  const features = [
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: t("home.features.wideSelection"),
      description: t("home.features.wideSelectionDesc"),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: t("home.features.fastShipping"),
      description: t("home.features.fastShippingDesc"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: t("home.features.securePayment"),
      description: t("home.features.securePaymentDesc"),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: t("home.features.qualityGuaranteed"),
      description: t("home.features.qualityGuaranteedDesc"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  const categories = [
    {
      id: "1",
      name: t("home.categories.electronics"),
      icon: "📱",
      color: "from-blue-600 to-indigo-600",
      hoverColor: "hover:shadow-blue-500/30",
    },
    {
      id: "2",
      name: t("home.categories.fashion"),
      icon: "👕",
      color: "from-pink-600 to-rose-600",
      hoverColor: "hover:shadow-pink-500/30",
    },
    {
      id: "3",
      name: t("home.categories.homeGarden"),
      icon: "🏠",
      color: "from-emerald-600 to-teal-600",
      hoverColor: "hover:shadow-emerald-500/30",
    },
    {
      id: "4",
      name: t("home.categories.sports"),
      icon: "⚽",
      color: "from-orange-600 to-amber-600",
      hoverColor: "hover:shadow-orange-500/30",
    },
  ];

  const stats = [
    {
      value: 50000,
      suffix: "+",
      label: t("home.activeUsers") || "Active Users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      value: 10000,
      suffix: "+",
      label: t("home.productsListed") || "Products Listed",
      icon: <Package className="h-5 w-5" />,
    },
    {
      value: 500,
      suffix: "+",
      label: t("home.verifiedSellers") || "Verified Sellers",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      value: 99,
      suffix: "%",
      label: t("home.satisfactionRate") || "Satisfaction Rate",
      icon: <Star className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 ${
          isScrolled
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          <FloatingParticles />
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mx-auto transition-all duration-300 hover:bg-white/20 hover:scale-105">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              <span>{t("home.multiRolePlatform")}</span>
              <ChevronRight className="h-4 w-4" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                {t("home.heroTitle")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              {t("home.heroSubtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-white !text-black hover:bg-white/90 text-lg px-8 py-6 rounded-xl shadow-2xl shadow-white/20 transition-all duration-300 hover:scale-105 hover:shadow-white/30"
                onClick={() => navigate("/signup")}
              >
                {t("home.getStartedFree")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/products")}
              >
                <Play className="mr-2 h-5 w-5" />
                {t("home.browseCategories")}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{t("home.globalReach")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>{t("home.securePlatform")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{t("home.support247")}</span>
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
      <section className="py-20 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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

      {/* Choose Your Role */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              <span>{t("home.multipleRoles")}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("home.chooseYourRole")}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("home.chooseYourRoleDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <Link key={role.title} to={role.link} className="group">
                <Card
                  className={`h-full transition-all duration-500 border-2 ${role.color} hover:-translate-y-2 hover:shadow-2xl bg-white dark:bg-slate-800`}
                >
                  <CardHeader className="pb-4">
                    <div
                      className={`w-16 h-16 rounded-2xl ${role.bgColor} flex items-center justify-center ${role.textColor} mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      {role.icon}
                    </div>
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      {role.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className={`w-full bg-gradient-to-r ${role.gradient} text-white border-0 hover:opacity-90 transition-all duration-300`}
                    >
                      {t("home.joinAs")} {role.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-gradient-to-b from-background to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                <span>{t("home.handpicked")}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                {t("home.featuredProducts")}
              </h2>
            </div>
            <Link
              to={ROUTES.PRODUCTS}
              className="text-primary hover:underline text-sm font-medium flex items-center gap-1 transition-all duration-300 hover:gap-2"
            >
              {t("home.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ProductGrid products={featuredProducts || []} />
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <ShoppingBag className="h-4 w-4" />
                <span>{t("home.browse")}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                {t("home.shopByCategory")}
              </h2>
            </div>
            <Link
              to={ROUTES.CATEGORIES}
              className="text-primary hover:underline text-sm font-medium flex items-center gap-1 transition-all duration-300 hover:gap-2"
            >
              {t("home.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`${ROUTES.CATEGORY_PRODUCTS.replace(":id", category.id)}`}
                className="group"
              >
                <div
                  className={`aspect-square rounded-3xl bg-gradient-to-br ${category.color} p-8 flex flex-col items-center justify-center gap-4 transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-2xl ${category.hoverColor}`}
                >
                  <span className="text-5xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                    {category.icon}
                  </span>
                  <span className="font-semibold text-center text-white text-lg">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Award className="h-4 w-4" />
              <span>{t("home.whyChooseUs")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t("home.builtForSuccess")}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("home.builtForSuccessDesc")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl border bg-white dark:bg-slate-800 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center ${feature.color} mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              <span>{t("home.testimonials")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t("home.lovedByThousands")}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("home.seeWhatUsersSay")}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 md:p-12 text-white">
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
                  "{testimonials[activeTestimonial].content}"
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
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Aurora */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("home.whyChooseAurora")}
            </h2>
            <p className="text-xl text-white/70">{t("home.ecosystemDesc")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="font-semibold text-xl mb-3">
                {t("home.multiRolePlatform")}
              </h3>
              <p className="text-white/60">{t("home.multiRolePlatformDesc")}</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                <Shield className="h-10 w-10" />
              </div>
              <h3 className="font-semibold text-xl mb-3">
                {t("home.secureTrusted")}
              </h3>
              <p className="text-white/60">{t("home.secureTrustedDesc")}</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                <TrendingUp className="h-10 w-10" />
              </div>
              <h3 className="font-semibold text-xl mb-3">
                {t("home.growBusiness")}
              </h3>
              <p className="text-white/60">{t("home.growBusinessDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>{t("home.startToday")}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {t("home.readyToGetStarted")}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
              {t("home.joinThousands")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-10 py-6 rounded-xl shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/signup")}
              >
                {t("home.createFreeAccount")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-lg px-10 py-6 rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/login")}
              >
                {t("home.signIn")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-20" />
    </div>
  );
}
