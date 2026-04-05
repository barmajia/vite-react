import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, Button, Input } from "@/components/ui";
import {
  ShoppingBag,
  Star,
  TrendingUp,
  Search,
  Filter,
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

  // UI State
  const [showFilters, setShowFilters] = useState(false);

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
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-10 w-64 bg-gray-200 rounded mb-3"></div>
            <div className="h-5 w-96 bg-gray-200 rounded"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="mb-6 flex gap-3">
            <div className="h-10 w-64 bg-gray-200 rounded"></div>
            <div className="h-10 w-40 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>

          {/* Grid Skeleton */}
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadTemplates}>Try Again</Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingBag className="h-10 w-10" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Website Marketplace
            </h1>
          </div>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Launch your professional store in minutes. Choose from curated
            templates for sellers, doctors, pharmacies, and more.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search templates by name, category, or feature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 w-full rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters & Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
          {/* Filter Toggle (Mobile) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
            )}
          </Button>

          {/* Desktop Filters */}
          <div
            className={`${
              showFilters ? "flex" : "hidden"
            } md:flex flex-wrap items-center gap-3 w-full md:w-auto`}
          >
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-[140px] px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Role */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="min-w-[140px] px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {/* Price */}
            <select
              value={priceRange}
              onChange={(e) =>
                setPriceRange(e.target.value as "all" | "free" | "paid")
              }
              className="min-w-[120px] px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Sort & View */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="min-w-[140px] px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* View Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 border-l ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold">{filteredTemplates.length}</span> of{" "}
          <span className="font-semibold">{templates.length}</span> templates
          {hasActiveFilters && " • Filters applied"}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No Templates Found</h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : "Check back later for new templates!"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          /* Template Grid/List */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredTemplates.map((template) => (
              <Link
                key={template.id}
                to={`/webmarketplace/${template.id}`}
                className="group block"
              >
                <Card
                  className={`overflow-hidden border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 ${
                    viewMode === "list" ? "flex flex-col md:flex-row" : "h-full"
                  }`}
                >
                  {/* Thumbnail */}
                  <div
                    className={`relative ${
                      viewMode === "list" ? "md:w-56" : ""
                    }`}
                  >
                    <div
                      className={`bg-gradient-to-br from-blue-100 to-purple-100 ${
                        viewMode === "list" ? "h-32 md:h-full" : "h-48"
                      } overflow-hidden`}
                    >
                      {template.thumbnail_url ? (
                        <img
                          src={template.thumbnail_url}
                          alt={template.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <ShoppingBag className="h-12 w-12" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {template.is_featured && (
                          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                            ⭐ Featured
                          </span>
                        )}
                        {new Date(template.created_at) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <span className="text-xs">🕒</span> New
                          </span>
                        )}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                            template.price === 0
                              ? "bg-green-500 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {template.price === 0
                            ? "FREE"
                            : `$${template.price.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Quick Preview Overlay */}
                      {template.preview_url && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-white/90 hover:bg-white"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`p-5 ${viewMode === "list" ? "md:flex-1" : ""}`}
                  >
                    <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {template.title}
                    </h2>

                    {template.description && (
                      <p
                        className={`text-sm text-gray-600 mb-3 ${
                          viewMode === "list" ? "line-clamp-2" : "line-clamp-3"
                        }`}
                      >
                        {template.description}
                      </p>
                    )}

                    {/* Meta Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {template.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          {template.category}
                        </span>
                      )}
                      {template.target_role && (
                        <span className="px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded-md capitalize">
                          {template.target_role}
                        </span>
                      )}
                      {template.version && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          v{template.version}
                        </span>
                      )}
                    </div>

                    {/* Stats Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-3">
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">
                            {template.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>

                        {/* Downloads/Sales */}
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <TrendingUp className="h-4 w-4" />
                          <span>
                            {template.download_count ||
                              template.total_sales ||
                              0}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <span className="text-sm text-blue-600 group-hover:underline">
                        View Details →
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
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Load More Templates
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
