import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid, List, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductGrid } from "@/components/products/ProductGrid";
import { FilterSidebar } from "@/components/products/FilterSidebar.tsx";
import { useTranslation } from "react-i18next";
import { Pagination } from "@/components/shared/Pagination";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ProductList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "created_at",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as "asc" | "desc") || "desc",
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("min_price") || undefined;
  const maxPrice = searchParams.get("max_price") || undefined;

  const { data, isLoading, error } = useProducts({
    page: currentPage,
    limit: 20,
    search: searchQuery,
    category,
    brand,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy: sortBy as "created_at" | "price" | "title",
    sortOrder,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [currentPage, searchParams, setSearchParams]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-");
    setSortBy(field);
    setSortOrder(order as "asc" | "desc");
    setCurrentPage(1);

    const params = new URLSearchParams(searchParams);
    params.set("sort", field);
    params.set("order", order as "asc" | "desc");
    params.set("page", "1");
    setSearchParams(params, { replace: true });
  };

  const activeFiltersCount = [category, brand, minPrice, maxPrice].filter(
    Boolean,
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] pt-20 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] to-[#1e293b] dark:from-blue-900 dark:to-blue-800 text-white py-12 px-6 mb-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {searchQuery
                    ? t("productList.searchResults", { query: searchQuery })
                    : t("productList.allProducts")}
                </h1>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-blue-500 text-white">
                    {activeFiltersCount} filter
                    {activeFiltersCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {data && (
                <p className="text-blue-100 text-lg">
                  {t("productList.productsFound", { count: data.totalCount })}
                </p>
              )}
            </div>

            {/* Sort & View Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <X className="h-4 w-4 mr-2" />
                ) : (
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                )}
                {t("common.filters")}
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* Sort Dropdown */}
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[160px] sm:w-[180px] border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <SelectValue placeholder={t("productList.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">
                    {t("productList.newestFirst")}
                  </SelectItem>
                  <SelectItem value="created_at-asc">
                    {t("productList.oldestFirst")}
                  </SelectItem>
                  <SelectItem value="price-asc">
                    {t("productList.priceLowHigh")}
                  </SelectItem>
                  <SelectItem value="price-desc">
                    {t("productList.priceHighLow")}
                  </SelectItem>
                  <SelectItem value="title-asc">
                    {t("productList.nameAZ")}
                  </SelectItem>
                  <SelectItem value="title-desc">
                    {t("productList.nameZA")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border border-white/20 rounded-lg overflow-hidden bg-white/10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-r-none text-white hover:bg-white/20",
                    viewMode === "grid" && "bg-white/20",
                  )}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-l-none text-white hover:bg-white/20",
                    viewMode === "list" && "bg-white/20",
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile Sidebar Drawer */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
              <aside className="fixed left-0 top-0 bottom-0 w-80 bg-background z-50 overflow-y-auto lg:hidden pt-20">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      {t("common.filters")}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <FilterSidebar />
                </div>
              </aside>
            </>
          )}

          {/* Products */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-16 bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg border border-gray-200 dark:border-[#0f172a]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                  <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-destructive text-lg font-semibold">
                  {t("productList.errorLoading")}
                </p>
              </div>
            ) : isLoading ? (
              <ProductGrid isLoading={true} />
            ) : data && data.products.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg border border-gray-200 dark:border-[#0f172a]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                  <Grid className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {t("productList.noProductsFound")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("productList.tryAdjusting")}
                </p>
                <Button
                  onClick={() => {
                    setSearchParams(new URLSearchParams());
                    setCurrentPage(1);
                  }}
                  className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-700 text-white"
                >
                  {t("productList.clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <ProductGrid products={data?.products || []} />

                {data && data.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={data.totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={data.totalCount}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
