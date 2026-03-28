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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 pb-16">
      {/* Simplified Modern Header */}
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-16 z-30 shadow-sm shadow-slate-200/20 dark:shadow-none transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {searchQuery
                    ? t("productList.searchResults", { query: searchQuery })
                    : t("productList.allProducts")}
                </h1>
                {data && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("productList.productsFound", { count: data.totalCount })}
                  </p>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden border-gray-200 dark:border-[#1e293b]"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {t("common.filters")}
              </Button>

              {/* Sort Dropdown */}
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[160px] border-gray-200 dark:border-[#1e293b]">
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
              <div className="flex border border-gray-200 dark:border-[#1e293b] rounded-lg overflow-hidden bg-white dark:bg-[#0f172a]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-r-none h-9 w-9",
                    viewMode === "grid" && "bg-gray-100 dark:bg-[#1e293b]",
                  )}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-l-none h-9 w-9",
                    viewMode === "list" && "bg-gray-100 dark:bg-[#1e293b]",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {t("common.filters")}
                </h2>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => setSearchParams(new URLSearchParams())}
                  >
                    {t("common.clearAll")}
                  </Button>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile Sidebar Drawer */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
              <aside className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-[#0f172a] z-50 overflow-y-auto lg:hidden shadow-2xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                  <div className="mt-6 sticky bottom-0 bg-white dark:bg-[#0f172a] pt-4 border-t dark:border-[#1e293b]">
                    <Button
                      className="w-full"
                      onClick={() => setShowFilters(false)}
                    >
                      {t("common.showResults")}
                    </Button>
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-[#0f172a]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
                  <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-destructive text-lg font-semibold">
                  {t("productList.errorLoading")}
                </p>
              </div>
            ) : isLoading ? (
              <ProductGrid isLoading={true} />
            ) : data && data.products.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-[#0f172a]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
                  <Grid className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
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
                  className="bg-[#0f172a] dark:bg-blue-600 text-white hover:bg-[#0f172a]/90"
                >
                  {t("productList.clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <ProductGrid products={data?.products || []} />
                {data && data.totalPages > 1 && (
                  <div className="mt-12">
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
