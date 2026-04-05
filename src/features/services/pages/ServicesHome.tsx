import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Briefcase,
  Code,
  Palette,
  Stethoscope,
  Building2,
  Wrench,
  GraduationCap,
  Scale,
  ArrowRight,
  Search,
  Star,
  Users,
  Zap,
  Shield,
  Sparkles,
  TrendingUp,
  Globe,
  Wallet,
  CheckCircle2,
  Heart,
  Filter,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";
import { useServiceCategories } from "../hooks/useServiceCategories";

// ============ Types ============
interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon?: string;
  listing_count?: number;
  subcategories?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
}

interface ServiceListing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: string | null;
  currency: string | null;
  image_url: string | null;
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
  delivery_time?: string;
  provider: {
    id: string;
    provider_name: string;
    is_verified?: boolean;
    logo_url?: string;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface FilterState {
  category: string;
  priceRange: string;
  sortBy: string;
  verifiedOnly: boolean;
}

// ============ Component ============
export function ServicesHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Use the new hook for categories with subcategories
  const { data: categoriesData, isLoading: categoriesLoading } =
    useServiceCategories();

  // State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredListings, setFeaturedListings] = useState<ServiceListing[]>(
    [],
  );
  const [trendingListings, setTrendingListings] = useState<ServiceListing[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    priceRange: "all",
    sortBy: "featured",
    verifiedOnly: false,
  });
  const [selectedListing, setSelectedListing] = useState<ServiceListing | null>(
    null,
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync categories from hook
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

  // ============ Data Fetching ============
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories with listing counts
      const { data: categoriesData, error: catError } = await supabase
        .from("svc_categories")
        .select(
          `
          *,
          listing_count:svc_listings(count).filter(is_active.eq.true)
        `,
        )
        .order("name");

      if (catError) throw catError;
      if (categoriesData) {
        setCategories(
          categoriesData.map((cat) => ({
            ...cat,
            listing_count: Array.isArray(cat.listing_count)
              ? cat.listing_count[0]?.count
              : 0,
          })),
        );
      }

      // Fetch featured listings
      await fetchListings("featured");
      await fetchListings("trending");
    } catch (error) {
      console.error("Error fetching services data:", error);
      toast.error("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchListings = async (type: "featured" | "trending") => {
    let query = supabase
      .from("svc_listings")
      .select(
        `
        *,
        provider:svc_providers (
          id,
          provider_name,
          is_verified,
          logo_url
        ),
        category:svc_categories (
          id,
          name,
          slug
        )
      `,
      )
      .eq("is_active", true);

    if (type === "featured") {
      query = query.order("created_at", { ascending: false }).limit(6);
    } else {
      // Order by created_at instead of rating (rating column doesn't exist)
      query = query.order("created_at", { ascending: false }).limit(4);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching listings:", error);
      return;
    }

    if (data) {
      if (type === "featured") {
        setFeaturedListings(data);
      } else {
        setTrendingListings(data);
      }
    }
  };

  // ============ Real-time Subscriptions ============
  useEffect(() => {
    fetchData();

    // Real-time: New featured listings
    const channel = supabase
      .channel("services_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "svc_listings",
          filter: "is_active=eq.true AND is_featured=eq.true",
        },
        (payload) => {
          toast.info("🎉 New featured service available!", {
            action: {
              label: "View",
              onClick: () => navigate(`/services/listing/${payload.new.slug}`),
            },
          });
          fetchListings("featured");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, navigate]);

  // ============ Handlers ============
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/services?search=${encodeURIComponent(query)}`);
    }
  };

  const handleFavorite = useCallback(
    (listingId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(listingId)) {
          newFavorites.delete(listingId);
          toast.success("Removed from favorites");
        } else {
          newFavorites.add(listingId);
          toast.success("Added to favorites");
        }
        return newFavorites;
      });
    },
    [],
  );

  const handleQuickView = useCallback(
    (listing: ServiceListing, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedListing(listing);
    },
    [],
  );

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.priceRange !== "all") params.set("price", filters.priceRange);
    if (filters.sortBy !== "featured") params.set("sort", filters.sortBy);
    if (filters.verifiedOnly) params.set("verified", "true");

    navigate(`/services?${params.toString()}`);
    setIsFilterOpen(false);
  }, [filters, navigate]);

  // ============ Helpers ============
  const getCategoryIcon = (slug: string) => {
    const iconMap: Record<string, any> = {
      programming: Code,
      design: Palette,
      healthcare: Stethoscope,
      business: Building2,
      home: Wrench,
      education: GraduationCap,
      legal: Scale,
      writing: Code,
      marketing: Sparkles,
    };
    return iconMap[slug] || Briefcase;
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "Contact for quote";
    return `${currency || "$"}${price.toLocaleString()}`;
  };

  // ============ Memoized Sections ============
  const CategoryCard = useMemo(() => {
    return ({ category }: { category: ServiceCategory }) => {
      const IconComponent = getCategoryIcon(category.slug);
      const hasSubcategories =
        category.subcategories && category.subcategories.length > 0;

      return (
        <div className="group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-2xl">
          <Card
            className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60
            hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-300
            hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5"
          >
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                  bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900
                  mb-4 group-hover:from-indigo-50 dark:group-hover:from-indigo-950/30
                  group-hover:to-violet-50 dark:group-hover:to-violet-950/30
                  group-hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <IconComponent
                    className="h-8 w-8 text-slate-600 dark:text-slate-400
                    group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                    aria-hidden="true"
                  />
                </div>
                {category.listing_count && category.listing_count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 px-2 py-0.5 text-xs font-semibold
                    bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300
                    rounded-full border border-indigo-200 dark:border-indigo-800"
                  >
                    {category.listing_count}
                  </span>
                )}
              </div>
              <Link to={`/services/${category.slug}`}>
                <h3
                  className="text-lg font-bold text-slate-900 dark:text-white mb-1.5
                  group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                >
                  {category.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                {category.description || t("services.exploreCategory")}
              </p>

              {/* Subcategories */}
              {hasSubcategories && (
                <div className="flex flex-wrap gap-1.5 justify-center w-full">
                  {category.subcategories!.slice(0, 4).map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/services/${category.slug}/${sub.slug}`}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs
                        text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                        hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                  {category.subcategories!.length > 4 && (
                    <Link
                      to={`/services/${category.slug}`}
                      className="px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      +{category.subcategories!.length - 4} more
                    </Link>
                  )}
                </div>
              )}

              {!hasSubcategories && (
                <Link
                  to={`/services/${category.slug}`}
                  className="mt-2 inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      );
    };
  }, [t]);

  // ============ Render ============
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans"
    >
      <ServicesHeader />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 overflow-hidden">
        {/* Animated Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute -top-32 -right-32 w-[700px] h-[700px] 
            bg-gradient-to-br from-indigo-400/10 via-violet-400/10 to-transparent 
            dark:from-indigo-500/20 dark:via-violet-500/20 rounded-full blur-[120px] 
            animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute top-20 -left-20 w-[600px] h-[600px] 
            bg-gradient-to-tr from-violet-400/10 via-fuchsia-400/10 to-transparent 
            dark:from-violet-500/20 dark:via-fuchsia-500/20 rounded-full blur-[100px] 
            animate-pulse"
            style={{ animationDuration: "10s", animationDelay: "1s" }}
          />
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] 
            bg-[size:24px_24px]"
          />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 
              bg-gradient-to-r from-indigo-500/10 to-violet-500/10 
              dark:from-indigo-500/20 dark:to-violet-500/20 
              border border-indigo-200/50 dark:border-indigo-800/50 
              rounded-full mb-8 shadow-sm backdrop-blur-sm"
            >
              <Sparkles className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {t("services.heroBadge")}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold 
              text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
            >
              Connect with Top <br className="hidden md:block" />
              <span
                className="text-transparent bg-clip-text 
                bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 
                dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400 
                animate-gradient-x"
                style={{ backgroundSize: "200% 200%" }}
              >
                Industry Experts
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 
              mb-10 max-w-3xl mx-auto font-medium leading-relaxed"
            >
              Whether you're looking to hire top talent or offering your own
              professional services, Aurora is your growth engine.
            </p>

            {/* Search & CTA */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 
              mb-12 max-w-4xl mx-auto"
            >
              <form
                onSubmit={handleSearch}
                className="w-full sm:flex-1 relative group"
              >
                <Search
                  className="absolute left-5 top-1/2 -translate-y-1/2 
                  h-5.5 w-5.5 text-slate-400 group-focus-within:text-indigo-500 
                  transition-colors"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder={t("services.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-32 h-14 w-full text-base rounded-full 
                    border-slate-200/80 dark:border-slate-800/80 
                    bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm
                    dark:text-white focus:border-indigo-500 focus:ring-4 
                    focus:ring-indigo-500/15 shadow-lg shadow-slate-200/40 
                    dark:shadow-none transition-all"
                  aria-label="Search services"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2 
                    h-10 px-5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 
                    hover:from-indigo-700 hover:to-violet-700 text-white font-semibold 
                    shadow-md hover:shadow-lg transition-all"
                >
                  {t("common.search")}
                </Button>
              </form>

              <Button
                onClick={() =>
                  navigate(
                    user ? "/services/onboarding" : "/services/onboarding",
                  )
                }
                size="lg"
                className="w-full sm:w-auto h-14 px-7 rounded-full 
                  bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white 
                  border border-slate-200/60 dark:border-slate-700/60 
                  hover:border-indigo-400 dark:hover:border-indigo-500/50 
                  hover:text-indigo-600 dark:hover:text-indigo-400 
                  shadow-lg shadow-slate-200/40 dark:shadow-none 
                  transition-all font-bold group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {user ? "Start Selling" : "Become a Provider"}
                </span>
                <ArrowRight className="ml-2 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div
            className="flex flex-wrap items-center justify-center gap-5 md:gap-10 
            text-sm font-medium text-slate-500 dark:text-slate-400 mt-6"
            role="list"
            aria-label="Platform benefits"
          >
            {[
              {
                icon: Shield,
                label: "Secure Payments",
                color: "text-emerald-500",
              },
              { icon: Users, label: "Verified Pros", color: "text-blue-500" },
              { icon: Zap, label: "Fast Delivery", color: "text-amber-500" },
              {
                icon: CheckCircle2,
                label: "Quality Guaranteed",
                color: "text-violet-500",
              },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2.5"
                role="listitem"
              >
                <Icon className={`h-5.5 w-5.5 ${color}`} aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROVIDERS SECTION ===== */}
      <section
        className="py-20 md:py-28 px-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 
        relative overflow-hidden"
        aria-labelledby="providers-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute top-0 right-0 w-[800px] h-[800px] 
            bg-gradient-to-br from-indigo-600/10 via-violet-600/10 to-transparent 
            rounded-full blur-[150px]"
          />
          <div
            className="absolute bottom-0 left-0 w-[600px] h-[600px] 
            bg-gradient-to-tr from-fuchsia-600/10 via-pink-600/10 to-transparent 
            rounded-full blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Content */}
            <div className="text-white space-y-8 text-center lg:text-left">
              <Badge
                className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 
                border-indigo-500/30 text-sm px-4 py-1.5 rounded-full mb-2"
              >
                For Freelancers & Agencies
              </Badge>
              <h2
                id="providers-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
              >
                Turn your expertise into a{" "}
                <span
                  className="text-transparent bg-clip-text 
                  bg-gradient-to-r from-indigo-400 to-violet-400"
                >
                  thriving business
                </span>
                .
              </h2>
              <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Join our elite community of service providers. Get instant
                access to thousands of buyers worldwide, secure your payments,
                and grow your freelance career on Aurora.
              </p>

              <ul
                className="space-y-4 max-w-lg text-left mx-auto lg:mx-0"
                role="list"
              >
                {[
                  "Global reach to millions of active buyers",
                  "Guaranteed payments and escrow protection",
                  "Advanced analytics and growth tools",
                  "Dedicated support for top-rated sellers",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3.5 text-slate-300"
                    role="listitem"
                  >
                    <CheckCircle2
                      className="h-6.5 w-6.5 text-emerald-400 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() =>
                    navigate(user ? "/services/onboarding" : "/signup")
                  }
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 
                    hover:from-indigo-500 hover:to-violet-500 text-white font-bold 
                    h-14 px-8 rounded-full shadow-lg shadow-indigo-600/30 
                    hover:shadow-xl hover:shadow-indigo-500/40 transition-all group"
                >
                  Start Selling Now
                  <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/services/providers/stories")}
                  className="h-14 px-8 rounded-full border-slate-600 text-slate-200 
                    hover:bg-slate-800/50 hover:border-slate-500 transition-all"
                >
                  Success Stories
                </Button>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative">
              <div
                className="absolute -inset-6 bg-gradient-to-tr from-indigo-500/15 to-violet-500/15 
                blur-3xl rounded-full"
                aria-hidden="true"
              />

              {[
                {
                  icon: Globe,
                  title: "Global Audience",
                  desc: "Present your portfolio to clients from over 150 countries.",
                  color: "blue",
                  delay: 0,
                },
                {
                  icon: Wallet,
                  title: "Secure Earnings",
                  desc: "Get paid on time, every time with our protected escrow system.",
                  color: "emerald",
                  delay: 100,
                },
                {
                  icon: TrendingUp,
                  title: "Scale Up",
                  desc: "Build your agency and brand with premium seller features.",
                  color: "violet",
                  delay: 200,
                },
                {
                  icon: Briefcase,
                  title: "Work Your Way",
                  desc: "Offer custom packages and set your own terms and pricing.",
                  color: "rose",
                  delay: 300,
                },
              ].map((feature, i) => {
                const IconComponent = feature.icon;
                const colorClasses: Record<string, string> = {
                  blue: "bg-blue-500/20 text-blue-400",
                  emerald: "bg-emerald-500/20 text-emerald-400",
                  violet: "bg-violet-500/20 text-violet-400",
                  rose: "bg-rose-500/20 text-rose-400",
                };

                return (
                  <Card
                    key={feature.title}
                    className="bg-slate-800/60 border-slate-700/60 backdrop-blur-xl 
                      relative z-10 hover:-translate-y-2 hover:shadow-xl 
                      hover:shadow-indigo-500/10 transition-all duration-300"
                    style={{ animationDelay: `${feature.delay}ms` }}
                  >
                    <CardContent className="p-7">
                      <div
                        className={`w-14 h-14 rounded-2xl ${colorClasses[feature.color]} 
                        flex items-center justify-center mb-5 shadow-lg`}
                      >
                        <IconComponent className="h-7 w-7" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2.5">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      <section
        className="py-20 md:py-28 px-4"
        aria-labelledby="categories-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2
              id="categories-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 
                dark:text-white mb-4 tracking-tight"
            >
              Explore Capabilities
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Find precisely the skills you need across our diverse network of
              professionals.
            </p>
          </div>

          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Button
              variant={filters.category === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((f) => ({ ...f, category: "all" }))}
              className="rounded-full h-9 px-4 text-sm"
            >
              All
            </Button>
            {categories.slice(0, 6).map((cat) => (
              <Button
                key={cat.id}
                variant={filters.category === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setFilters((f) => ({ ...f, category: cat.slug }))
                }
                className="rounded-full h-9 px-4 text-sm"
              >
                {cat.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
              className="rounded-full h-9 px-3 text-sm text-slate-600 dark:text-slate-400"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              More Filters
            </Button>
          </div>

          {/* Categories Grid */}
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <Card
                  key={i}
                  className="border-slate-200 dark:border-slate-800"
                >
                  <CardContent className="p-6 flex flex-col items-center">
                    <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURED LISTINGS ===== */}
      <section
        className="py-20 md:py-28 px-4 bg-slate-50/50 dark:bg-slate-900/30"
        aria-labelledby="featured-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="text-center md:text-left">
              <h2
                id="featured-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 
                  dark:text-white mb-3 tracking-tight"
              >
                Featured Services
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                Outstanding work from our top-rated providers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={filters.sortBy}
                onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}
              >
                <SelectTrigger
                  className="w-44 h-11 rounded-full border-slate-200 
                  dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => navigate("/services")}
                className="rounded-full h-11 px-5 border-slate-300 dark:border-slate-700 
                  hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 
                  dark:text-slate-200 font-semibold transition-all"
              >
                Browse All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {[...Array(6)].map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className="border-slate-200 dark:border-slate-800
                  bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-5 space-y-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full mt-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {featuredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favorites.has(listing.id)}
                  onFavorite={(e) => handleFavorite(listing.id, e)}
                  onQuickView={(e) => handleQuickView(listing, e)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              onCTAClick={() =>
                navigate(user ? "/services/onboarding" : "/signup")
              }
            />
          )}
        </div>
      </section>

      {/* ===== TRENDING SECTION ===== */}
      {trendingListings.length > 0 && (
        <section
          className="py-20 md:py-28 px-4"
          aria-labelledby="trending-heading"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 
                bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 
                rounded-full mb-6"
              >
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Trending This Week
                </span>
              </div>
              <h2
                id="trending-heading"
                className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4"
              >
                What's Hot Right Now
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingListings.map((listing) => (
                <CompactListingCard
                  key={listing.id}
                  listing={listing}
                  onFavorite={(e) => handleFavorite(listing.id, e)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FILTER DIALOG ===== */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Price Range
              </label>
              <Select
                value={filters.priceRange}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, priceRange: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-50">Under $50</SelectItem>
                  <SelectItem value="50-200">$50 - $200</SelectItem>
                  <SelectItem value="200+">$200+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verified Only */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Verified Providers Only
              </label>
              <Button
                variant={filters.verifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setFilters((f) => ({ ...f, verifiedOnly: !f.verifiedOnly }))
                }
                className="rounded-full"
              >
                {filters.verifiedOnly ? "On" : "Off"}
              </Button>
            </div>

            <Button
              onClick={applyFilters}
              className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 
                hover:from-indigo-700 hover:to-violet-700"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== QUICK VIEW MODAL ===== */}
      {selectedListing && (
        <Dialog
          open={!!selectedListing}
          onOpenChange={() => setSelectedListing(null)}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl">
                {selectedListing.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {selectedListing.image_url && (
                <img
                  src={selectedListing.image_url}
                  alt={selectedListing.title}
                  className="w-full h-56 object-cover rounded-xl"
                />
              )}
              <p className="text-slate-600 dark:text-slate-400">
                {selectedListing.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-slate-500">Starting at</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(
                      selectedListing.price,
                      selectedListing.currency,
                    )}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    setSelectedListing(null);
                    navigate(`/services/listing/${selectedListing.slug}`);
                  }}
                  className="rounded-full h-12 px-8 bg-gradient-to-r from-indigo-600 to-violet-600"
                >
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Spacer */}
      <div className="h-16 bg-gradient-to-t from-slate-50 dark:from-slate-950" />
    </div>
  );
}

// ============ Sub-Components ============

function ListingCard({
  listing,
  isFavorite,
  onFavorite,
  onQuickView,
}: {
  listing: ServiceListing;
  isFavorite: boolean;
  onFavorite: (e: React.MouseEvent) => void;
  onQuickView: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();

  return (
    <Link
      to={`/services/listing/${listing.slug}`}
      className="group block h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
      aria-label={`View ${listing.title} service`}
    >
      <Card
        className="h-full border-slate-200/60 dark:border-slate-800/60 
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm 
        hover:border-indigo-400 dark:hover:border-indigo-500/50 
        transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 
        hover:-translate-y-1.5 overflow-hidden flex flex-col"
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 
                  transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div
                className="h-full bg-gradient-to-br from-slate-100 to-slate-50 
                dark:from-slate-800 dark:to-slate-900 flex items-center justify-center"
              >
                <Briefcase className="h-14 w-14 text-slate-300 dark:text-slate-600" />
              </div>
            )}

            {/* Overlay Actions */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent 
              to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onQuickView}
                  className="h-9 px-4 rounded-full bg-white/90 dark:bg-slate-800/90 
                    backdrop-blur-sm text-slate-900 dark:text-white text-sm font-medium 
                    hover:bg-white dark:hover:bg-slate-800"
                >
                  Quick View
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onFavorite}
                  className={`h-9 w-9 rounded-full bg-white/90 dark:bg-slate-800/90 
                    backdrop-blur-sm ${isFavorite ? "text-rose-500" : "text-slate-600 dark:text-slate-400"}
                    hover:bg-white dark:hover:bg-slate-800`}
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`h-4.5 w-4.5 ${isFavorite ? "fill-current" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              {listing.is_featured && (
                <Badge className="bg-indigo-500/90 text-white border-0 backdrop-blur-md text-xs px-2.5 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {listing.provider?.is_verified && (
                <Badge className="bg-emerald-500/90 text-white border-0 backdrop-blur-md text-xs px-2.5 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-grow">
            <div className="flex items-center justify-between gap-3 mb-3">
              <Badge
                variant="secondary"
                className="bg-slate-100/80 dark:bg-slate-800/80 
                hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 
                border-0 text-xs px-2.5 py-1"
              >
                {listing.category?.name || "Service"}
              </Badge>
              {listing.rating && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span className="font-bold text-sm">{listing.rating}</span>
                  {listing.reviews_count && (
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      ({listing.reviews_count})
                    </span>
                  )}
                </div>
              )}
            </div>

            <h3
              className="text-lg font-bold text-slate-900 dark:text-white mb-2 
              line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 
              transition-colors"
            >
              {listing.title}
            </h3>

            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">
              {listing.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {listing.provider && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500
                    flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
                  >
                    {listing.provider.logo_url ? (
                      <img
                        src={listing.provider.logo_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      listing.provider.provider_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="font-semibold text-slate-700 dark:text-slate-300
                      text-sm truncate block max-w-[130px]"
                    >
                      {listing.provider.provider_name}
                    </span>
                  </div>
                </div>
              )}
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  From
                </span>
                {listing.price ? (
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {listing.currency || "$"}
                    {listing.price.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-indigo-600">
                    Contact
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CompactListingCard({
  listing,
  onFavorite,
}: {
  listing: ServiceListing;
  onFavorite: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      to={`/services/listing/${listing.slug}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
    >
      <Card
        className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 
        dark:bg-slate-900/80 backdrop-blur-sm hover:border-indigo-400 
        transition-all duration-300 hover:shadow-lg"
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 
                flex items-center justify-center flex-shrink-0"
              >
                <Briefcase className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4
                  className="font-semibold text-slate-900 dark:text-white text-sm 
                  line-clamp-2 group-hover:text-indigo-600 transition-colors"
                >
                  {listing.title}
                </h4>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onFavorite}
                  className="h-7 w-7 -mt-0.5 text-slate-400 hover:text-rose-500"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {listing.provider?.is_verified && (
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                )}
                {listing.rating && (
                  <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{listing.rating}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 truncate max-w-[120px]">
                  {listing.provider?.provider_name}
                </span>
                {listing.price && (
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {listing.currency || "$"}
                    {listing.price}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <div
      className="text-center py-20 bg-white/50 dark:bg-slate-900/30 
      rounded-3xl border border-slate-200/60 dark:border-slate-800/60 
      backdrop-blur-sm"
    >
      <div
        className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 
        flex items-center justify-center mx-auto mb-6"
      >
        <Briefcase className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        No Services Available Yet
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto px-4">
        Be the first professional to list your services and start earning
        immediately.
      </p>
      <Button
        size="lg"
        onClick={onCTAClick}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 
          hover:from-indigo-700 hover:to-violet-700 rounded-full h-12 px-8 font-semibold"
      >
        List Your Service
        <ArrowRight className="ml-2 h-4.5 w-4.5" />
      </Button>
    </div>
  );
}
