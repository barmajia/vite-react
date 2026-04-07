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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";
import { useServiceCategories } from "../hooks/useServiceCategories";
import { cn } from "@/lib/utils";

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

// ============ Helpers ============
const formatPrice = (price: number | null, currency: string | null) => {
  if (!price) return "Contact for quote";
  return `${currency || "$"}${price.toLocaleString()}`;
};

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
      const { data: catData, error: catError } = await supabase
        .from("svc_categories")
        .select(
          `
          *,
          svc_listings(count)
        `,
        )
        .eq("svc_listings.is_active", true)
        .order("name");

      if (catError) throw catError;
      if (catData) {
        setCategories(
          catData.map((cat: any) => ({
            ...cat,
            listing_count: cat.svc_listings?.[0]?.count || 0,
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

  // ============ Memoized Category Card ============
  const CategoryCardView = useCallback(
    ({ category }: { category: ServiceCategory }) => {
      const IconComponent = getCategoryIcon(category.slug);
      const hasSubcategories =
        category.subcategories && category.subcategories.length > 0;

      return (
        <div className="group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.03]">
          <div
            className="h-full glass-card overflow-hidden backdrop-blur-[30px] rounded-[2.5rem] 
          border-t-white/20 border-l-white/10 border-b-black/20 border-r-black/20
          hover:border-primary/40 transition-all duration-500 group relative shadow-[0_15px_35px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(var(--primary),0.2)]"
          >
            <CardContent className="p-10 text-center flex flex-col items-center justify-center h-full relative z-10">
              <div className="relative mb-8">
                <div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-3xl
                glass bg-white/10 border border-white/20 dark:border-white/10 shadow-[inner_0_1px_1px_rgba(255,255,255,0.3)]
                group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all duration-500"
                >
                  <IconComponent
                    className="h-10 w-10 text-foreground/70
                  group-hover:text-primary transition-colors duration-500"
                    aria-hidden="true"
                  />
                </div>
                {category.listing_count && category.listing_count > 0 && (
                  <div
                    className="absolute -top-3 -right-3 px-3 py-1 text-[10px] font-black
                  bg-primary text-white rounded-full border border-white/20 shadow-lg shadow-primary/20
                  animate-bounce"
                  >
                    {category.listing_count}
                  </div>
                )}
              </div>

              <Link to={`/services/${category.slug}`} className="block group">
                <h3
                  className="text-2xl font-black italic tracking-tighter text-foreground mb-3
                group-hover:text-primary transition-colors duration-300"
                >
                  {category.name}
                </h3>
              </Link>

              <p className="text-sm text-foreground/50 font-medium line-clamp-2 mb-8 px-2 leading-relaxed">
                {category.description || t("services.exploreCategory")}
              </p>

              {hasSubcategories && (
                <div className="flex flex-wrap gap-2 justify-center w-full">
                  {category.subcategories!.slice(0, 3).map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/services/${category.slug}/${sub.slug}`}
                      className="px-4 py-2 glass bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest
                      text-foreground/40 hover:text-primary hover:border-primary/30 transition-all duration-300"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </div>
      );
    },
    [t],
  );

  // ============ Main Render ============
  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-32 pb-20">
      <ServicesHeader />

      {/* Immersive Background Elements */}
      <div
        className="absolute top-[2%] left-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="absolute bottom-[2%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
      />

      {/* ===== HERO SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 mb-20">
        <div className="glass-card sticky top-[80px] z-40 overflow-hidden group backdrop-blur-[40px] rounded-[3rem] border-t-white/30 border-l-white/20 border-b-white/5 border-r-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-700">
          <div className="px-8 sm:px-12 py-14 sm:py-20 relative z-10 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16">
              <div className="space-y-8 flex-1">
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <div className="p-3 glass bg-white/10 border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
                    Elite Provider Network
                  </span>
                </div>

                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter italic leading-[0.85] bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40">
                  Connect with <br />
                  <span className="text-primary drop-shadow-[0_0_30px_rgba(var(--primary),0.4)]">
                    Top Experts
                  </span>
                </h1>

                <div className="relative max-w-3xl group/search">
                  <form onSubmit={handleSearch} className="relative z-10">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-primary/50" />
                    </div>
                    <Input
                      type="search"
                      placeholder={t("services.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-20 pl-16 pr-44 rounded-3xl bg-black/40 backdrop-blur-3xl border-white/10 text-xl font-bold placeholder:text-white/20"
                    />
                    <Button
                      type="submit"
                      className="absolute right-3 top-3 h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs"
                    >
                      {t("common.search")}
                    </Button>
                  </form>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                  <Button
                    onClick={() =>
                      navigate(
                        user ? "/services/onboarding" : "/services/onboarding",
                      )
                    }
                    size="lg"
                    className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 group"
                  >
                    <span>{user ? "Start Selling" : "Become a Provider"}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4 w-[400px]">
                {[
                  { label: "Providers", val: "12K+", textColor: "text-primary" },
                  { label: "Jobs Done", val: "95K", textColor: "text-blue-500" },
                  { label: "Top Rated", val: "4.9", textColor: "text-amber-500" },
                  { label: "Escrow", val: "$2.4M", textColor: "text-emerald-500" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-card p-8 rounded-[2rem] border-white/5"
                  >
                    <p
                      className={cn(
                        "text-4xl font-black italic tracking-tighter",
                        stat.textColor,
                      )}
                    >
                      {stat.val}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ELITE DIVISIONS SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative">
        <div className="absolute top-[50%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8 px-4">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Precision Verticals</span>
             </div>
             <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-tight">
               Elite <span className="text-foreground/40">Divisions</span>
             </h2>
          </div>
          <p className="max-w-md text-foreground/40 text-sm font-medium italic leading-relaxed md:text-right">
            Navigate through our specialized mission-critical sectors, each powered by top-tier verified professionals and optimized for enterprise-grade deployments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              name: "Programming", 
              path: "/services/programmer", 
              icon: Code, 
              color: "cyan", 
              tagline: "Software Engineering", 
              desc: "Full-stack architectures & DevOps." 
            },
            { 
              name: "Translation", 
              path: "/services/translator", 
              icon: Globe, 
              color: "amber", 
              tagline: "Linguistic Hub", 
              desc: "Global localization & native precision." 
            },
            { 
              name: "Design", 
              path: "/services/designer", 
              icon: Palette, 
              color: "violet", 
              tagline: "Creative Identity", 
              desc: "High-fidelity UI/UX & branding systems." 
            },
            { 
              name: "Home Fix", 
              path: "/services/home", 
              icon: Wrench, 
              color: "emerald", 
              tagline: "Facility Maintenance", 
              desc: "Smart home ops & emergency repair." 
            },
          ].map((division) => (
            <Link 
              key={division.path} 
              to={division.path} 
              className="group focus:outline-none focus:ring-2 focus:ring-primary rounded-[2.5rem] transition-all duration-700 hover:scale-[1.05]"
            >
              <div className="h-full glass-card overflow-hidden backdrop-blur-[30px] rounded-[2.5rem] border border-white/10 hover:border-white/30 transition-all duration-500 group relative shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] bg-white/5">
                <div className={cn(
                  "absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity duration-700",
                  division.color === "cyan" ? "text-cyan-500" : 
                  division.color === "amber" ? "text-amber-500" : 
                  division.color === "violet" ? "text-violet-500" : "text-emerald-500",
                  "text-6xl"
                )}>
                   <division.icon className="w-16 h-16" />
                </div>
                
                <CardContent className="p-10 flex flex-col items-start justify-end h-full relative z-10 pt-24">
                   <div className={cn(
                     "w-14 h-14 rounded-2xl flex items-center justify-center glass border mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700",
                     division.color === "cyan" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" : 
                     division.color === "amber" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : 
                     division.color === "violet" ? "bg-violet-500/10 border-violet-500/20 text-violet-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                   )}>
                      <division.icon className="w-6 h-6" />
                   </div>
                   
                   <div className="space-y-4">
                      <div>
                         <p className={cn("text-[9px] font-black uppercase tracking-widest italic mb-1", 
                            division.color === "cyan" ? "text-cyan-500" : 
                            division.color === "amber" ? "text-amber-500" : 
                            division.color === "violet" ? "text-violet-500" : "text-emerald-500"
                         )}>
                            {division.tagline}
                         </p>
                         <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{division.name}</h3>
                      </div>
                      <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-widest leading-relaxed">
                         {division.desc}
                      </p>
                      <div className="flex items-center gap-3 pt-4 group/btn">
                         <div className={cn("h-px w-8 transition-all duration-500 group-hover:w-12", 
                            division.color === "cyan" ? "bg-cyan-500/30" : 
                            division.color === "amber" ? "bg-amber-500/30" : 
                            division.color === "violet" ? "bg-violet-500/30" : "bg-emerald-500/30"
                         )} />
                         <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20 group-hover:text-foreground">Initialize</span>
                      </div>
                   </div>
                </CardContent>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16 px-4">
          <Button
            variant={filters.category === "all" ? "primary" : "ghost"}
            onClick={() => setFilters((f) => ({ ...f, category: "all" }))}
            className="rounded-2xl h-12 px-8 text-xs font-black uppercase tracking-widest"
          >
            All Matrix
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={filters.category === cat.slug ? "primary" : "ghost"}
              onClick={() => setFilters((f) => ({ ...f, category: cat.slug }))}
              className="rounded-2xl h-12 px-8 text-xs font-black uppercase tracking-widest"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories
            .filter(
              (c) => filters.category === "all" || c.slug === filters.category,
            )
            .map((category) => (
              <CategoryCardView key={category.id} category={category} />
            ))}
        </div>
      </section>

      {/* ===== TRENDING SECTION ===== */}
      {trendingListings.length > 0 && (
        <section
          className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative"
          aria-labelledby="trending-heading"
        >
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 italic">
                Velocity Core
              </span>
            </div>
            <h2
              id="trending-heading"
              className="text-4xl md:text-6xl font-black italic tracking-tighter leading-tight"
            >
              Hot <span className="text-foreground/40">Deployments</span>
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
        </section>
      )}

      {/* ===== FEATURED LISTINGS ===== */}
      <section
        className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative"
        aria-labelledby="featured-heading"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 px-4">
          <div className="space-y-4">
            <h2
              id="featured-heading"
              className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-none"
            >
              Featured <br />
              <span className="text-foreground/40">Deployments</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={filters.sortBy}
              onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}
            >
              <SelectTrigger className="w-44 h-12 rounded-xl border-white/5 glass text-xs font-black uppercase tracking-widest">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-card rounded-2xl border-white/10">
                <SelectItem value="featured">Featured Matrix</SelectItem>
                <SelectItem value="rating">High Trust</SelectItem>
                <SelectItem value="newest">Recent Entry</SelectItem>
                <SelectItem value="price-low">Low Budget</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(true)}
              className="rounded-xl h-12 px-6 border-white/5 glass text-xs font-black uppercase tracking-widest"
            >
              <Filter className="h-4 w-4 mr-2" />
              Parameters
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[500px] glass-card rounded-[3rem] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
        )}
      </section>

      {/* ===== FILTER DIALOG ===== */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md glass-card rounded-[3rem] border-white/20 p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black italic tracking-tighter">
              Adjust Parameters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                Economy Bracket
              </label>
              <Select
                value={filters.priceRange}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, priceRange: v }))
                }
              >
                <SelectTrigger className="h-14 rounded-2xl glass bg-white/5 border-white/10 text-sm font-bold">
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent className="glass-card rounded-[2rem] border-white/20">
                  <SelectItem value="all">Any Bracket</SelectItem>
                  <SelectItem value="0-50">Economy (Under $50)</SelectItem>
                  <SelectItem value="50-200">Standard ($50 - $200)</SelectItem>
                  <SelectItem value="200+">Enterprise ($200+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={applyFilters}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 transition-all"
            >
              Recompute Matrix
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
          <DialogContent className="sm:max-w-2xl glass-card rounded-[3rem] border-white/20 p-0 overflow-hidden shadow-2xl">
            <div className="relative">
              {selectedListing.image_url ? (
                <div className="h-72 overflow-hidden relative">
                  <img
                    src={selectedListing.image_url}
                    alt={selectedListing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                  <Briefcase className="h-16 w-16 text-primary/30" />
                </div>
              )}

              <div className="p-10 space-y-6 relative -mt-20 z-10">
                <div className="glass-card p-8 rounded-[2.5rem] backdrop-blur-[50px] border-white/10">
                  <div className="flex justify-between items-start gap-6 mb-6">
                    <h3 className="text-3xl font-black italic tracking-tighter leading-none">
                      {selectedListing.title}
                    </h3>
                    <p className="text-3xl font-black text-primary italic">
                      {formatPrice(
                        selectedListing.price,
                        selectedListing.currency,
                      )}
                    </p>
                  </div>

                  <p className="text-foreground/60 text-sm font-medium leading-relaxed italic mb-8">
                    {selectedListing.description}
                  </p>

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      onClick={() => {
                        setSelectedListing(null);
                        navigate(`/services/listing/${selectedListing.slug}`);
                      }}
                      className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 transition-all"
                    >
                      Connect with Expert
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Spacer */}
      <div className="h-32" />
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
  const vertical = listing.category?.slug;
  const vColor = vertical === 'programming' ? 'cyan' : 
                 vertical === 'translator' ? 'amber' : 
                 vertical === 'design' ? 'violet' : 
                 vertical === 'home' ? 'emerald' : 'primary';

  return (
    <div className="group focus:outline-none focus:ring-2 focus:ring-primary rounded-[3rem] transition-all duration-700 hover:scale-[1.02]">
      <div
        className="h-full glass-card overflow-hidden backdrop-blur-[35px] rounded-[3rem] 
        border border-white/5 hover:border-white/20
        transition-all duration-500 group relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col bg-white/[0.03]"
      >
        <div className="relative h-72 overflow-hidden">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-700 group-hover:opacity-40", 
            vColor === 'cyan' ? 'from-cyan-500/40 to-transparent' : 
            vColor === 'amber' ? 'from-amber-500/40 to-transparent' : 
            vColor === 'violet' ? 'from-violet-500/40 to-transparent' : 
            vColor === 'emerald' ? 'from-emerald-500/40 to-transparent' : 'from-primary/40 to-transparent'
          )} />
          
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 mix-blend-luminosity group-hover:mix-blend-normal"
            />
          ) : (
            <div className="h-full bg-black/40 flex items-center justify-center">
              <Briefcase className="h-20 w-20 text-white/5" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-700">
            <div className="flex gap-4">
              <Button
                onClick={onQuickView}
                className="flex-1 h-14 rounded-2xl glass bg-white/10 hover:bg-white text-black font-black uppercase tracking-widest text-[10px] backdrop-blur-xl border-white/20 transition-all active:scale-95"
              >
                Inspect Nexus
              </Button>
              <Button
                onClick={onFavorite}
                className={cn(
                  "w-14 h-14 rounded-2xl glass bg-white/10 hover:bg-white border-white/20 backdrop-blur-xl transition-all active:scale-95",
                  isFavorite ? "text-rose-500" : "text-white/40 hover:text-black",
                )}
              >
                <Heart
                  className={cn("h-6 w-6", isFavorite && "fill-current")}
                />
              </Button>
            </div>
          </div>

          <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
            <div className="flex flex-col gap-3">
              {listing.is_featured && (
                <Badge className="bg-primary/20 backdrop-blur-md text-primary border border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl">
                  PRIORITY_NODE
                </Badge>
              )}
              {listing.provider?.is_verified && (
                <Badge className="bg-emerald-500/20 backdrop-blur-md text-emerald-500 border border-emerald-500/30 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl">
                  AUTHENTICATED
                </Badge>
              )}
            </div>
            {listing.rating && (
              <div className="glass bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-black italic">
                  {listing.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-10 flex-1 flex flex-col relative z-20">
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3">
               <div className={cn("h-px w-6", vColor === 'cyan' ? 'bg-cyan-500/40' : vColor === 'amber' ? 'bg-amber-500/40' : vColor === 'violet' ? 'bg-violet-500/40' : vColor === 'emerald' ? 'bg-emerald-500/40' : 'bg-primary/40')} />
               <span className={cn("text-[9px] font-black uppercase tracking-[0.4em] italic", 
                  vColor === 'cyan' ? 'text-cyan-500' : 
                  vColor === 'amber' ? 'text-amber-500' : 
                  vColor === 'violet' ? 'text-violet-500' : 
                  vColor === 'emerald' ? 'text-emerald-500' : 'text-primary'
               )}>
                 {listing.category?.name || "Standard Node"}
               </span>
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-none uppercase">
              {listing.title}
            </h3>
          </div>

          <p className="text-sm font-medium text-foreground/40 italic line-clamp-2 mb-10 leading-relaxed">
            "{listing.description}"
          </p>

          <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
            {listing.provider && (
              <Link to={`/services/provider/${listing.provider.id}`} className="flex items-center gap-4 group/prov">
                <div className="w-12 h-12 rounded-2xl glass bg-white/5 flex items-center justify-center border border-white/10 group-hover/prov:border-primary/40 transition-all overflow-hidden">
                  {listing.provider.logo_url ? (
                    <img src={listing.provider.logo_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-black text-primary">
                      {listing.provider.provider_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60 group-hover/prov:text-white transition-colors">
                    {listing.provider.provider_name}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-foreground/20 italic">Global Registry Verified</span>
                </div>
              </Link>
            )}

            <div className="text-right">
              <p className="text-[9px] font-black italic text-foreground/20 uppercase tracking-[0.2em] mb-1">
                Value Scale
              </p>
              <p className="text-3xl font-black italic tracking-tighter text-foreground leading-none">
                {formatPrice(listing.price, listing.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
      className="group block rounded-[2.5rem] transition-all duration-700 hover:scale-[1.05]"
    >
      <div className="glass-card p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 group-hover:border-white/20 shadow-2xl transition-all">
        <div className="flex gap-6 items-center">
          <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden shadow-2xl border border-white/10 relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 opacity-20 group-hover:opacity-0 transition-opacity duration-700" />
            <img
              src={listing.image_url || "/placeholder-service.jpg"}
              alt=""
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
          </div>
          <div className="flex-1 py-1 pr-2">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic">
                {listing.category?.name}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onFavorite(e);
                }}
                className="h-8 w-8 rounded-xl bg-white/5 border border-white/5 text-foreground/20 hover:text-rose-500 hover:bg-white transition-all flex items-center justify-center active:scale-90"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>
            <h4 className="text-lg font-black italic tracking-tighter line-clamp-1 mb-3 leading-none uppercase">
              {listing.title}
            </h4>
            <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[8px] font-black text-foreground/30 uppercase tracking-widest italic">
                  Live Sync
                </span>
              </div>
              <p className="text-2xl font-black italic tracking-tighter text-primary">
                {listing.price ? `$${listing.price}` : "CALL"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
