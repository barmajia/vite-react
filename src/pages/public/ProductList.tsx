import {
  List,
  SlidersHorizontal,
  X,
  LayoutGrid,
  ListFilter,
  Sparkles,
  FilterX,
} from "lucide-react";
import { Button } from "@/components/ui";
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
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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
    <div className="min-h-screen bg-background relative overflow-hidden pt-32 pb-20">
      {/* Immersive Background Elements */}
      <div
        className="absolute top left-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="absolute bottom-[2%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
      />

      {/* High-Fidelity Header */}
      <div className="glass-card mx-4 lg:mx-auto max-w-7xl mb-6 sticky top-[80px] z-40 overflow-hidden group backdrop-blur-[40px] rounded-[3rem] shadow-xl transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/3 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="px-8 sm:px-12 py-10 sm:py-14 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 glass rounded-2xl shadow-lg backdrop-blur-xl">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-primary italic">
                  Advanced Discovery Matrix
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter italic leading-[0.9] text-foreground">
                  {searchQuery
                    ? t("productList.searchResults", { query: searchQuery })
                    : t("productList.allProducts")}
                </h1>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-primary text-white font-black italic px-5 py-2.5 rounded-full text-xs shadow-lg animate-in fade-in zoom-in-50 duration-500 tracking-widest uppercase mb-2 sm:mb-4">
                    {activeFiltersCount} ACTIVE NODES
                  </Badge>
                )}
              </div>

              {data && (
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-md" />
                  <p className="text-xs font-black text-muted-foreground/60 tracking-[0.2em] uppercase italic">
                    {t("productList.productsFound", { count: data.totalCount })}{" "}
                    segments synchronized with global grid
                  </p>
                </div>
              )}
            </div>

            {/* Controls Interface */}
            <div className="flex items-center gap-4 flex-wrap lg:justify-end">
              <Button
                variant="ghost"
                className="lg:hidden glass h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-3 text-primary animate-pulse" />
                {t("common.filters")}
              </Button>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[240px] h-14 glass rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] group hover:border-primary/40 transition-all shadow-xl">
                  <div className="flex items-center gap-3">
                    <ListFilter className="h-4 w-4 text-primary/60 group-hover:rotate-180 transition-transform duration-500" />
                    <SelectValue placeholder={t("productList.sortBy")} />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass rounded-3xl p-2 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                  <SelectItem
                    value="created_at-desc"
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
                  >
                    {t("productList.newestFirst")}
                  </SelectItem>
                  <SelectItem
                    value="created_at-asc"
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
                  >
                    {t("productList.oldestFirst")}
                  </SelectItem>
                  <SelectItem
                    value="price-asc"
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
                  >
                    {t("productList.priceLowHigh")}
                  </SelectItem>
                  <SelectItem
                    value="price-desc"
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
                  >
                    {t("productList.priceHighLow")}
                  </SelectItem>
                  <SelectItem
                    value="title-asc"
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
                  >
                    {t("productList.nameAZ")}
                  </SelectItem>
                  <SelectItem
                    value="title-desc"
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3"
                  >
                    {t("productList.nameZA")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex glass rounded-2xl overflow-hidden p-1.5 shadow-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-11 w-11 rounded-xl transition-all duration-500",
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-lg shadow-primary/40"
                      : "text-muted-foreground/40 hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-11 w-11 rounded-xl transition-all duration-500",
                    viewMode === "list"
                      ? "bg-primary text-white shadow-lg shadow-primary/40"
                      : "text-muted-foreground/40 hover:text-foreground",
                  )}
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex gap-12">
          {/* Enhanced Desktop Sidebar - Now Sticky */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-[280px] self-start animate-in fade-in slide-in-from-left-10 duration-1000">
            <FilterSidebar />
          </aside>

          {/* Core Products Interface */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="glass-card p-24 text-center rounded-[3rem]">
                <div className="h-24 w-24 glass rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <X className="h-12 w-12 text-rose-500" />
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 text-rose-500 leading-none">
                  Retrieval Critical Failure
                </h2>
                <p className="text-muted-foreground font-bold mb-10 max-w-sm mx-auto uppercase text-xs tracking-widest leading-relaxed">
                  Our connection to the product mainframe was interrupted.
                  Please check your connection.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="glass bg-rose-500 text-white font-black px-12 h-16 rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.3em] text-[10px]"
                >
                  Retry Connection
                </Button>
              </div>
            ) : isLoading ? (
              <ProductGrid isLoading={true} />
            ) : data && data.products.length === 0 ? (
              <div className="glass-card p-24 text-center rounded-[3rem] group">
                <div className="h-28 w-28 glass rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl group-hover:rotate-12 transition-all duration-700">
                  <FilterX className="h-14 w-14 text-primary opacity-30 group-hover:opacity-60 transition-all duration-500" />
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">
                  No Matches Identified
                </h2>
                <p className="text-muted-foreground font-bold mb-12 max-w-sm mx-auto uppercase text-xs tracking-[0.15em] leading-relaxed">
                  Your current search did not return any results.
                </p>
                <Button
                  onClick={() => {
                    setSearchParams(new URLSearchParams());
                    setCurrentPage(1);
                  }}
                  className="glass bg-primary text-white font-black px-14 h-18 rounded-[2rem] shadow-xl hover:scale-110 active:scale-95 transition-all text-[10px] tracking-[0.4em] uppercase"
                >
                  {t("productList.clearFilters")}
                </Button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 space-y-12">
                <ProductGrid products={data?.products || []} />
                {data && data.totalPages > 1 && (
                  <div className="glass-card p-6 rounded-[2rem] shadow-xl">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={data.totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={data.totalCount}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[90%] max-w-md glass border-l p-10 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                  {t("common.filters")}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
                  Parameter Controls
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="h-14 w-14 glass rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <FilterSidebar />
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 sticky bottom-0 bg-background/5 backdrop-blur-md">
              <Button
                className="w-full h-18 glass bg-primary text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all"
                onClick={() => setShowFilters(false)}
              >
                Execute Matrix
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
