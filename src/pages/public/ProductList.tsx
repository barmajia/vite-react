import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductGrid } from "@/components/products/ProductGrid";
import { FilterSidebar } from "@/components/products/FilterSidebar.tsx";
import { useTranslation } from "react-i18next";
import { Pagination } from "@/components/shared/Pagination";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? t('productList.searchResults', { query: searchQuery })
              : t('productList.allProducts')}
          </h1>
          {data && (
            <p className="text-muted-foreground mt-1">
              {t('productList.productsFound', { count: data.totalCount })}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Sort */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[160px] sm:w-[180px]">
              <SelectValue placeholder={t('productList.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">{t('productList.newestFirst')}</SelectItem>
              <SelectItem value="created_at-asc">{t('productList.oldestFirst')}</SelectItem>
              <SelectItem value="price-asc">{t('productList.priceLowHigh')}</SelectItem>
              <SelectItem value="price-desc">{t('productList.priceHighLow')}</SelectItem>
              <SelectItem value="title-asc">{t('productList.nameAZ')}</SelectItem>
              <SelectItem value="title-desc">{t('productList.nameZA')}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-r-none",
                viewMode === "grid" && "bg-accent",
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-l-none",
                viewMode === "list" && "bg-accent",
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <FilterSidebar />

        {/* Products */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{t('productList.errorLoading')}</p>
            </div>
          ) : isLoading ? (
            <ProductGrid isLoading={true} />
          ) : data && data.products.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">{t('productList.noProductsFound')}</h2>
              <p className="text-muted-foreground">
                {t('productList.tryAdjusting')}
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={data?.products || []} />

              {data && data.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={data.totalCount}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
