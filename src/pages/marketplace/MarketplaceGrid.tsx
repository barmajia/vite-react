import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, Button, Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Star,
  TrendingUp,
  Search,
  Grid3X3,
  List,
  X,
  ChevronDown,
  Eye,
} from "lucide-react";

interface MarketplaceTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_role: string | null;
  price: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  rating: number | null;
  review_count?: number | null;
  download_count?: number | null;
  total_sales?: number | null;
  is_published: boolean;
  is_featured?: boolean;
  version?: string;
  created_at: string;
  [key: string]: any;
}

type SortOption = "newest" | "popular" | "price-low" | "price-high" | "rating";
type ViewMode = "grid" | "list";

export default function MarketplaceGrid() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    MarketplaceTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ?? "all",
  );
  const [selectedRole, setSelectedRole] = useState(
    searchParams.get("role") ?? "all",
  );
  const [priceRange, setPriceRange] = useState<"all" | "free" | "paid">(
    (searchParams.get("price") as "all" | "free" | "paid") ?? "all",
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Unique categories & roles for filters
  const categories = useMemo(
    () => [
      ...new Set(
        templates.map((t) => t.category).filter((c): c is string => Boolean(c)),
      ),
    ],
    [templates],
  );

  const roles = useMemo(
    () => [
      ...new Set(
        templates
          .map((t) => t.target_role)
          .filter((r): r is string => Boolean(r)),
      ),
    ],
    [templates],
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedRole !== "all") params.set("role", selectedRole);
    if (priceRange !== "all") params.set("price", priceRange);
    if (sortBy !== "newest") params.set("sort", sortBy);
    setSearchParams(params);
  }, [
    searchQuery,
    selectedCategory,
    selectedRole,
    priceRange,
    sortBy,
    setSearchParams,
  ]);

  // Apply filters & sorting
  useEffect(() => {
    let result = [...templates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Role filter
    if (selectedRole !== "all") {
      result = result.filter((t) => t.target_role === selectedRole);
    }

    // Price filter
    if (priceRange === "free") {
      result = result.filter((t) => t.price === 0);
    } else if (priceRange === "paid") {
      result = result.filter((t) => t.price > 0);
    }

    // Sorting
    switch (sortBy) {
      case "popular":
        result.sort(
          (a, b) =>
            (b.download_count || b.total_sales || 0) -
            (a.download_count || a.total_sales || 0),
        );
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }

    setFilteredTemplates(result);
  }, [
    templates,
    searchQuery,
    selectedCategory,
    selectedRole,
    priceRange,
    sortBy,
  ]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("website_marketplace")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error("Error loading templates:", err);
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedRole("all");
    setPriceRange("all");
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "all" ||
    selectedRole !== "all" ||
    priceRange !== "all";

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden pt-32 pb-20">
        <div
          className="absolute top-[2%] left-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-[2%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
          style={{ animationDuration: "10s" }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Header Skeleton */}
          <div className="mb-12 animate-pulse glass-card p-12 rounded-[3rem] border-white/10">
            <div className="h-14 w-80 glass bg-white/10 rounded-2xl mb-6"></div>
            <div className="h-8 w-full max-w-2xl glass bg-white/5 rounded-xl"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="mb-10 flex gap-4">
            <div className="h-14 w-64 glass bg-white/10 rounded-2xl animate-pulse"></div>
            <div className="h-14 w-40 glass bg-white/10 rounded-2xl animate-pulse"></div>
            <div className="h-14 w-32 glass bg-white/10 rounded-2xl animate-pulse"></div>
          </div>

          {/* Grid Skeleton */}
          <div
            className={`grid gap-8 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-[3rem] overflow-hidden border-white/10"
              >
                <div className="h-56 glass bg-white/10 animate-pulse m-4 rounded-[2.5rem]"></div>
                <div className="p-8 space-y-4">
                  <div className="h-6 glass bg-white/10 rounded-xl w-3/4 animate-pulse"></div>
                  <div className="h-4 glass bg-white/5 rounded-lg w-full animate-pulse"></div>
                  <div className="h-4 glass bg-white/5 rounded-lg w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-card p-12 text-center max-w-md border-rose-500/20 bg-rose-500/5 rounded-[3rem]">
          <div className="h-24 w-24 glass bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border-rose-500/20 animate-bounce">
            <X className="h-12 w-12 text-rose-500" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 text-rose-500 leading-none">
            Retrieval Failed
          </h2>
          <p className="text-muted-foreground font-bold mb-10 max-w-sm mx-auto uppercase text-xs tracking-widest leading-relaxed opacity-60">
            {error}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={loadTemplates}
              className="glass bg-rose-500 text-white font-black px-8 h-14 rounded-2xl shadow-xl shadow-rose-500/30"
            >
              Retry Connection
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="glass bg-white/5 border-white/10 px-8 h-14 rounded-2xl"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-32 pb-20">
      <div
        className="absolute top-[2%] left-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="absolute bottom-[2%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Extreme High-Fidelity Hero Section */}
        <div className="glass-card mb-12 sticky top-[0px] z-40 overflow-hidden group backdrop-blur-[40px] rounded-[3rem] border-t-white/30 border-l-white/20 border-b-white/5 border-r-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent opacity-60 transition-opacity duration-700" />
          <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-primary/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000" />

          <div className="px-8 sm:px-12 py-10 sm:py-14 relative z-10 text-center sm:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="space-y-4 sm:space-y-6 flex-1">
                <div className="flex items-center gap-4 justify-center sm:justify-start">
                  <div className="p-3 glass bg-white/10 border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)] backdrop-blur-xl">
                    <ShoppingBag className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-primary italic drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                    Ecosystem expansion
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter italic leading-[0.9] bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 drop-shadow-2xl">
                  Marketplace Hub
                </h1>
                <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] text-xs max-w-2xl">
                  Deploy pre-configured environments natively optimized for your
                  business matrix.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex-1 w-full max-w-lg">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors group-focus-within:text-primary z-20">
                    <Search className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Locate template sequence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 pr-6 h-16 w-full glass bg-white/5 border-white/10 rounded-[2rem] focus:ring-primary/50 transition-all text-sm font-black uppercase tracking-widest placeholder:text-muted-foreground/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
                  />
                  <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Controls Bar */}
        <div className="glass-card p-6 mb-10 border-white/10 rounded-[2rem] flex flex-wrap items-center gap-4 z-30 relative backdrop-blur-3xl shadow-xl">
          {/* Desktop Filters */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-[200px] h-12 glass bg-white/5 border-white/10 font-bold text-[10px] uppercase tracking-widest hover:border-white/20">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 shadow-2xl">
                <SelectItem value="all" className="font-bold text-xs">
                  All Categories
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="font-bold text-xs"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-[200px] h-12 glass bg-white/5 border-white/10 font-bold text-[10px] uppercase tracking-widest hover:border-white/20">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 shadow-2xl">
                <SelectItem value="all" className="font-bold text-xs">
                  All Roles
                </SelectItem>
                {roles.map((role) => (
                  <SelectItem
                    key={role}
                    value={role}
                    className="font-bold text-xs capitalize"
                  >
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priceRange}
              onValueChange={(val: any) => setPriceRange(val)}
            >
              <SelectTrigger className="w-full md:w-[160px] h-12 glass bg-white/5 border-white/10 font-bold text-[10px] uppercase tracking-widest hover:border-white/20">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 shadow-2xl">
                <SelectItem value="all" className="font-bold text-xs">
                  All Prices
                </SelectItem>
                <SelectItem value="free" className="font-bold text-xs">
                  Free Only
                </SelectItem>
                <SelectItem value="paid" className="font-bold text-xs">
                  Paid Only
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="glass bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                <X className="h-3 w-3 mr-2" />
                Reset Matrix
              </Button>
            )}
          </div>

          <div className="flex-1"></div>

          {/* Sort & View */}
          <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-full md:w-[200px] h-12 glass bg-white/5 border-white/10 font-bold text-[10px] uppercase tracking-widest hover:border-white/20">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 shadow-2xl">
                <SelectItem value="newest" className="font-bold text-xs">
                  Newest First
                </SelectItem>
                <SelectItem value="popular" className="font-bold text-xs">
                  Most Popular
                </SelectItem>
                <SelectItem value="rating" className="font-bold text-xs">
                  Highest Rated
                </SelectItem>
                <SelectItem value="price-low" className="font-bold text-xs">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price-high" className="font-bold text-xs">
                  Price: High to Low
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex glass bg-white/5 border-white/10 rounded-xl overflow-hidden p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-10 w-10 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-10 w-10 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black text-muted-foreground/60 tracking-[0.2em] uppercase">
            Showing{" "}
            <span className="text-foreground">{filteredTemplates.length}</span>{" "}
            of {templates.length} Active Nodes
          </p>
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 ? (
          <div className="glass-card p-24 text-center border-white/5 group rounded-[3rem]">
            <div className="h-28 w-28 glass bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border-white/5 group-hover:rotate-12 transition-all duration-700">
              <ShoppingBag className="h-14 w-14 text-primary opacity-20 group-hover:opacity-60 transition-all duration-500" />
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">
              No Blueprints Found
            </h2>
            <p className="text-muted-foreground font-bold mb-12 max-w-sm mx-auto uppercase text-xs tracking-[0.15em] leading-relaxed opacity-40">
              Adjust your matrix filters or query to locate operational
              environments.
            </p>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                className="glass bg-primary text-white font-black px-14 h-18 rounded-[2rem] shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-110 active:scale-95 transition-all text-[10px] tracking-[0.4em] uppercase"
              >
                Clear Matrix
              </Button>
            )}
          </div>
        ) : (
          /* Template Grid/List */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "flex flex-col gap-6"
            }
          >
            {filteredTemplates.map((template) => (
              <Link
                key={template.id}
                to={`/webmarketplace/${template.id}`}
                className="group block h-full z-10"
              >
                <Card
                  className={`glass-card border-t-white/30 border-l-white/20 border-b-white/5 border-r-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:bg-white/10 transition-all duration-1000 hover:-translate-y-4 rounded-[3rem] overflow-hidden flex flex-col h-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_40px_80px_-10px_rgba(0,0,0,0.6),0_0_40px_-10px_rgba(var(--primary),0.3),inset_0_1px_1px_rgba(255,255,255,0.6)] ${
                    viewMode === "list" ? "md:flex-row" : ""
                  }`}
                >
                  {/* Dynamic Background Glow inner effect */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[90px] -mr-20 -mt-20 pointer-events-none group-hover:bg-primary/40 group-hover:scale-150 transition-all duration-1000 z-0" />

                  {/* Thumbnail */}
                  <div
                    className={`relative p-4 z-20 ${
                      viewMode === "list" ? "md:w-72" : "w-full"
                    }`}
                  >
                    <div
                      className={`relative overflow-hidden rounded-[2.5rem] ring-1 ring-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-black/20 ${
                        viewMode === "list"
                          ? "h-full min-h-[200px]"
                          : "aspect-[16/10]"
                      }`}
                    >
                      {template.thumbnail_url ? (
                        <img
                          src={template.thumbnail_url}
                          alt={template.title}
                          className="w-full h-full object-cover group-hover:scale-125 group-hover:rotate-3 transition-all duration-1000"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/20">
                          <ShoppingBag className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700" />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
                        {template.is_featured && (
                          <div className="glass bg-amber-500/80 text-white border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest italic shadow-lg flex items-center gap-1 rounded-full">
                            <Star className="h-3 w-3 fill-white" /> Featured
                          </div>
                        )}
                        {new Date(template.created_at) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                          <div className="glass bg-emerald-500/80 text-white border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest italic shadow-lg rounded-full">
                            New Node
                          </div>
                        )}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 z-30">
                        <div
                          className={`glass px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic shadow-lg ${
                            template.price === 0
                              ? "bg-emerald-500 text-white border-emerald-500/20"
                              : "bg-primary text-white border-primary/20"
                          }`}
                        >
                          {template.price === 0
                            ? "FREE UPLINK"
                            : `$${template.price.toFixed(2)}`}
                        </div>
                      </div>

                      {/* Quick Preview Overlay */}
                      {template.preview_url && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center object-cover">
                          <Button
                            className="glass bg-white/20 hover:bg-primary text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(
                                template.preview_url as string,
                                "_blank",
                              );
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Live Init
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`p-8 pt-4 flex-1 flex flex-col z-20 ${
                      viewMode === "list" ? "justify-center" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {template.category && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic">
                          {template.category}
                        </span>
                      )}
                      {template.version && (
                        <>
                          <span className="text-white/20 text-xs font-black">
                            •
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                            v{template.version}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-4 group-hover:text-primary transition-colors line-clamp-1 uppercase">
                      {template.title}
                    </h2>

                    {template.description && (
                      <p
                        className={`text-xs font-bold text-muted-foreground/60 leading-relaxed mb-6 ${
                          viewMode === "list" ? "line-clamp-2" : "line-clamp-3"
                        }`}
                      >
                        {template.description}
                      </p>
                    )}

                    {/* Stats Footer */}
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                          Metrics
                        </span>
                        <div className="flex items-center gap-4">
                          {/* Rating */}
                          <div className="flex items-center gap-1.5 glass bg-white/5 px-2 py-1 rounded-full border-white/5">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black">
                              {template.rating?.toFixed(1) || "0.0"}
                            </span>
                          </div>

                          {/* Downloads/Sales */}
                          <div className="flex items-center gap-1.5 text-muted-foreground/60">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black">
                              {template.download_count ||
                                template.total_sales ||
                                0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <span className="text-xs font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-500">
                        Deploy /{" "}
                        <span className="opacity-40">
                          {template.target_role}
                        </span>
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredTemplates.length >= 12 && (
          <div className="mt-16 text-center">
            <Button className="glass bg-white/5 border-white/10 hover:bg-white/10 w-full max-w-sm h-14 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] text-foreground transition-all">
              Load More Parameters
              <ChevronDown className="h-4 w-4 ml-3 opacity-50" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
