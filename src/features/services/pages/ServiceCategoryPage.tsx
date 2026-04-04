/**
 * Service Category Page - Enhanced
 * Route: /services/:categorySlug
 * Features: Real-time updates, Advanced filters, Quick view, Favorites, FAB integration
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  CheckCircle2,
  Heart,
  Loader2,
  Grid3X3,
  List,
  ChevronDown,
  Clock,
  ArrowRight,
  Sparkles,
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";
import { Avatar } from "@/components/ui/avatar";
import { useServiceCategoryBySlug } from "../hooks/useServiceCategories";
import { useServiceListings } from "../hooks/useServiceListings";

// ============ Types ============
interface ServiceListing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: "fixed" | "hourly" | "project" | null;
  currency: string | null;
  image_url: string | null;
  rating?: number;
  reviews_count?: number;
  delivery_time?: string;
  is_featured?: boolean;
  created_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  provider: {
    id: string;
    provider_name: string;
    logo_url?: string;
    is_verified?: boolean;
    location?: string;
    response_rate?: number;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon?: string;
  listing_count?: number;
}

interface FilterState {
  priceRange: [number, number];
  verifiedOnly: boolean;
  minRating: number;
  deliveryTime: string;
  location: string;
}

// ============ Component ============
export function ServiceCategoryPage() {
  const { t } = useTranslation();
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug: string;
    subcategorySlug?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Use the new hooks
  const { data: categoryData, isLoading: categoryLoading } =
    useServiceCategoryBySlug(categorySlug);
  const { data: listingsData, isLoading: listingsLoading } = useServiceListings(
    {
      categoryId: categoryData?.id,
      subcategoryId: categoryData?.subcategories.find(
        (s) => s.slug === subcategorySlug,
      )?.id,
      searchQuery: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sort") as any) || "featured",
    },
  );

  // State
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    verifiedOnly: false,
    minRating: 0,
    deliveryTime: "any",
    location: "",
  });
  const [selectedListing, setSelectedListing] = useState<ServiceListing | null>(
    null,
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;

  // Sync data from hooks
  useEffect(() => {
    if (categoryData) {
      setCategory({
        id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        icon: categoryData.icon_url || undefined,
        listing_count: categoryData.listing_count,
      });
    }
    if (listingsData?.listings) {
      setListings(listingsData.listings);
    }
    setLoading(categoryLoading || listingsLoading);
  }, [categoryData, listingsData, categoryLoading, listingsLoading]);

  // ============ Data Fetching ============
  const fetchCategory = useCallback(async (slug: string) => {
    if (!slug) return null;

    const { data, error } = await supabase
      .from("svc_categories")
      .select("id, name, slug, description")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Category fetch error:", error);
      return null;
    }
    return data;
  }, []);

  const fetchListings = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let query = supabase
          .from("svc_listings")
          .select(
            `
          *,
          provider:svc_providers (
            id,
            provider_name,
            logo_url,
            is_verified
          ),
          category:svc_categories (
            id,
            name,
            slug
          )
        `,
            { count: "exact" },
          )
          .eq("is_active", true);

        // Category filter
        if (category?.id) {
          query = query.eq("category_id", category.id);
        }

        // Search filter
        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`,
          );
        }

        // Price filter
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
          query = query
            .gte("price", filters.priceRange[0])
            .lte("price", filters.priceRange[1]);
        }

        // Verified only
        if (filters.verifiedOnly) {
          query = query.eq("provider.is_verified", true);
        }

        // Rating filter
        if (filters.minRating > 0) {
          query = query.gte("rating", filters.minRating);
        }

        // Sorting - use created_at since rating/reviews_count don't exist
        switch (sortBy) {
          case "rating":
          case "reviews":
          case "newest":
          default:
            query = query.order("created_at", { ascending: false });
            break;
          case "price_low":
            query = query.order("price", { ascending: true });
            break;
          case "price_high":
            query = query.order("price", { ascending: false });
            break;
        }

        // Pagination
        const from = (pageNum - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count: _count } = await query.range(from, to);

        if (error) throw error;

        if (append) {
          setListings((prev) => [...prev, ...(data || [])]);
        } else {
          setListings(data || []);
        }
        setHasMore(data ? data.length === ITEMS_PER_PAGE : false);
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to load services");
      }
    },
    [category, searchQuery, filters, sortBy],
  );

  // ============ Effects ============
  // Initial category load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (categorySlug) {
        const cat = await fetchCategory(categorySlug);
        setCategory(cat);
        if (!cat) {
          toast.error("Category not found");
          navigate("/services");
          return;
        }
      }
      setLoading(false);
    };
    loadData();
  }, [categorySlug, navigate]);

  // Fetch listings when category changes (after initial load)
  useEffect(() => {
    if (!loading && category?.id) {
      fetchListings(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]);

  // Real-time subscription for new listings in category
  useEffect(() => {
    if (!category?.id) return;

    const channel = supabase
      .channel(`category_${category.id}_listings`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "svc_listings",
          filter: `category_id=eq.${category.id} AND is_active=eq.true`,
        },
        (payload) => {
          toast.info("🎉 New service available!", {
            action: {
              label: "View",
              onClick: () => navigate(`/services/listing/${payload.new.slug}`),
            },
          });
          // Prepend new listing
          setListings((prev) => [payload.new as ServiceListing, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, navigate]);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`favorites_${user?.id || "guest"}`);
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)));
    }
  }, [user]);

  // ============ Handlers ============
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      fetchListings(1);
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
        localStorage.setItem(
          `favorites_${user?.id || "guest"}`,
          JSON.stringify(Array.from(newFavorites)),
        );
        return newFavorites;
      });
    },
    [user],
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
    fetchListings(1);
    setIsFilterOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchListings(page + 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, page]);

  // ============ Helpers ============
  const formatPrice = (
    price: number | null,
    currency: string | null,
    priceType: string | null,
  ) => {
    if (!price) return "Contact for quote";
    const symbol = currency || "$";
    const formatted = price.toLocaleString();
    if (priceType === "hourly") return `${symbol}${formatted}/hr`;
    if (priceType === "project") return `From ${symbol}${formatted}`;
    return `${symbol}${formatted}`;
  };

  const getCategoryIcon = (iconName?: string) => {
    // Map icon names to Lucide components or use emoji fallback
    const icons: Record<string, string> = {
      code: "💻",
      palette: "🎨",
      stethoscope: "🩺",
      building: "🏢",
      wrench: "🔧",
      graduation: "🎓",
      scale: "⚖️",
    };
    return icons[iconName || ""] || "✨";
  };

  // ============ Memoized Components ============
  const ListingCard = useMemo(() => {
    return ({
      listing,
      viewMode,
    }: {
      listing: ServiceListing;
      viewMode: "grid" | "list";
    }) => {
      const isFavorite = favorites.has(listing.id);

      if (viewMode === "list") {
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
                  {/* Image */}
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 
                      dark:from-slate-800 dark:to-slate-900 flex items-center justify-center flex-shrink-0"
                    >
                      <span className="text-3xl">
                        {getCategoryIcon(category?.icon)}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className="font-semibold text-slate-900 dark:text-white text-sm 
                          line-clamp-1 group-hover:text-indigo-600 transition-colors"
                        >
                          {listing.title}
                        </h4>
                        {listing.is_featured && (
                          <Badge
                            className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 
                            dark:text-indigo-300 text-xs px-2 py-0.5"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleFavorite(listing.id, e)}
                        className={`h-8 w-8 -mt-0.5 ${isFavorite ? "text-rose-500" : "text-slate-400"} 
                          hover:text-rose-500`}
                        aria-label={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                        />
                      </Button>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mb-2">
                      {listing.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      {listing.provider?.is_verified && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                      {listing.rating && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {listing.rating} ({listing.reviews_count})
                        </span>
                      )}
                      {listing.delivery_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {listing.delivery_time}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          name={listing.provider?.provider_name || ""}
                          src={listing.provider?.logo_url}
                          className="h-6 w-6"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                          {listing.provider?.provider_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatPrice(
                            listing.price,
                            listing.currency,
                            listing.price_type,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      }

      // Grid view
      return (
        <Link
          to={`/services/listing/${listing.slug}`}
          className="group block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
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
              <div className="relative h-44 overflow-hidden">
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
                    <span className="text-5xl">
                      {getCategoryIcon(category?.icon)}
                    </span>
                  </div>
                )}

                {/* Overlay Actions */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent 
                  to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => handleQuickView(listing, e)}
                      className="h-8 px-3 rounded-full bg-white/90 dark:bg-slate-800/90 
                        backdrop-blur-sm text-slate-900 dark:text-white text-xs font-medium"
                    >
                      Quick View
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleFavorite(listing.id, e)}
                      className={`h-8 w-8 rounded-full bg-white/90 dark:bg-slate-800/90 
                        backdrop-blur-sm ${isFavorite ? "text-rose-500" : "text-slate-600"}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                  {listing.is_featured && (
                    <Badge className="bg-indigo-500/90 text-white border-0 backdrop-blur-md text-xs px-2 py-0.5">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {listing.provider?.is_verified && (
                    <Badge className="bg-emerald-500/90 text-white border-0 backdrop-blur-md text-xs px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-100/80 dark:bg-slate-800/80 
                    text-slate-700 dark:text-slate-300 border-0 text-xs px-2 py-0.5"
                  >
                    {listing.category?.name || "Service"}
                  </Badge>
                  {listing.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-bold text-xs">
                        {listing.rating}
                      </span>
                      {listing.reviews_count && (
                        <span className="text-slate-500 text-xs">
                          ({listing.reviews_count})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <h3
                  className="text-base font-bold text-slate-900 dark:text-white mb-1.5 
                  line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 
                  transition-colors"
                >
                  {listing.title}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 line-clamp-2 flex-grow">
                  {listing.description}
                </p>

                {/* Provider */}
                {listing.provider && (
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar
                      name={listing.provider.provider_name}
                      src={listing.provider.logo_url}
                      className="h-7 w-7"
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className="font-medium text-slate-700 dark:text-slate-300 
                        text-xs truncate block"
                      >
                        {listing.provider.provider_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Starting at
                    </span>
                    {listing.price ? (
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatPrice(
                          listing.price,
                          listing.currency,
                          listing.price_type,
                        )}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-600">
                        Contact
                      </span>
                    )}
                  </div>
                  {listing.delivery_time && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {listing.delivery_time}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    };
  }, [favorites, handleFavorite, handleQuickView, category]);

  // ============ Render ============
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      <ServicesHeader />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute -top-20 -right-20 w-[500px] h-[500px] 
            bg-gradient-to-br from-indigo-400/10 via-violet-400/10 to-transparent 
            dark:from-indigo-500/20 dark:via-violet-500/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link
              to="/services"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Services
            </Link>
            {category && (
              <>
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                <Link
                  to={`/services/${categorySlug}`}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium capitalize"
                >
                  {category.name}
                </Link>
                {subcategorySlug && categoryData?.subcategories && (
                  <>
                    <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                    <span className="text-slate-900 dark:text-white font-medium capitalize">
                      {
                        categoryData.subcategories.find(
                          (s) => s.slug === subcategorySlug,
                        )?.name
                      }
                    </span>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 
                bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 
                rounded-full mb-4"
              >
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {category?.listing_count || listings.length} services
                </span>
              </div>

              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold 
                text-slate-900 dark:text-white mb-3 tracking-tight"
              >
                {category ? (
                  <span className="capitalize">{category.name} Services</span>
                ) : (
                  t("services.allServices")
                )}
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                {category?.description || t("services.categoryDescription")}
              </p>

              {/* Subcategory Navigation */}
              {categoryData?.subcategories &&
                categoryData.subcategories.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      to={`/services/${categorySlug}`}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        !subcategorySlug
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      }`}
                    >
                      All {category.name}
                    </Link>
                    {categoryData.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/services/${categorySlug}/${sub.slug}`}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          subcategorySlug === sub.slug
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="w-full lg:w-auto">
              <div className="flex gap-2">
                <div className="relative flex-1 lg:w-80">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 
                    h-5 w-5 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder={t("services.searchInCategory")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 rounded-full bg-white dark:bg-slate-900 
                      border-slate-200 dark:border-slate-700 focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 
                    text-white font-semibold"
                >
                  {t("common.search")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ===== FILTERS & CONTROLS ===== */}
      <section
        className="sticky top-16 z-30 bg-white/80 dark:bg-slate-900/80 
        backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Results count & Filters */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white">
                  {listings.length}
                </strong>{" "}
                services found
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="h-9 rounded-full border-slate-200 dark:border-slate-700"
              >
                <Filter className="h-4 w-4 mr-1.5" />
                Filters
                {(filters.verifiedOnly ||
                  filters.minRating > 0 ||
                  filters.priceRange[0] > 0) && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {(filters.verifiedOnly ? 1 : 0) +
                      (filters.minRating > 0 ? 1 : 0) +
                      (filters.priceRange[0] > 0 ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Sort & View Toggle */}
            <div className="flex items-center gap-3">
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v);
                  fetchListings(1);
                }}
              >
                <SelectTrigger className="w-40 h-9 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 rounded-full"
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 rounded-full"
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LISTINGS ===== */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading && page === 1 ? (
          // Initial loading skeleton
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
          >
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-0">
                  {viewMode === "grid" ? (
                    <>
                      <Skeleton className="h-44 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full mt-4" />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 flex gap-4">
                      <Skeleton className="h-24 w-24 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div
              className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            >
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="rounded-full h-12 px-8 border-slate-300 dark:border-slate-700"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : null}
                  Load More Services
                </Button>
              </div>
            )}
          </>
        ) : (
          // Empty State
          <div
            className="text-center py-20 bg-white/50 dark:bg-slate-900/30 
            rounded-3xl border border-slate-200/60 dark:border-slate-800/60"
          >
            <div
              className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 
              flex items-center justify-center mx-auto mb-6"
            >
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No services found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Try adjusting your filters or search terms to find what you're
              looking for.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    priceRange: [0, 1000],
                    verifiedOnly: false,
                    minRating: 0,
                    deliveryTime: "any",
                    location: "",
                  });
                  setSearchQuery("");
                  fetchListings(1);
                }}
                className="rounded-full"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => navigate("/services")}
                className="rounded-full bg-indigo-600 hover:bg-indigo-700"
              >
                Browse All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ===== FILTER DIALOG ===== */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Services</DialogTitle>
            <DialogDescription>
              Narrow down your search with these filters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Price Range */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Price Range
              </label>
              <Slider
                defaultValue={filters.priceRange}
                value={filters.priceRange}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    priceRange: v as [number, number],
                  }))
                }
                max={1000}
                step={10}
                className="py-4"
              />
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}+</span>
              </div>
            </div>

            <Separator />

            {/* Verified Only */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Verified Providers Only
              </label>
              <Checkbox
                checked={filters.verifiedOnly}
                onCheckedChange={(c) =>
                  setFilters((f) => ({ ...f, verifiedOnly: c as boolean }))
                }
              />
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Minimum Rating
              </label>
              <Select
                value={filters.minRating.toString()}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, minRating: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Delivery Time */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Delivery Time
              </label>
              <Select
                value={filters.deliveryTime}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, deliveryTime: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Time</SelectItem>
                  <SelectItem value="24h">Within 24 Hours</SelectItem>
                  <SelectItem value="3d">Within 3 Days</SelectItem>
                  <SelectItem value="7d">Within 7 Days</SelectItem>
                </SelectContent>
              </Select>
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

              {selectedListing.provider && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <Avatar
                    name={selectedListing.provider.provider_name}
                    src={selectedListing.provider.logo_url}
                    className="h-12 w-12"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedListing.provider.provider_name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {selectedListing.provider.is_verified && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-slate-500">Starting at</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(
                      selectedListing.price,
                      selectedListing.currency,
                      selectedListing.price_type,
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
                  View Full Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </div>
  );
}
