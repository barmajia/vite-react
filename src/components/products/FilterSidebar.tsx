import { useState } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSwipeToOpen } from "@/hooks/useSwipeToOpen";
import { ROUTES } from "@/lib/constants";

interface FilterSidebarProps {
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
}

export function FilterSidebar({
  categories = [],
  brands = [],
}: FilterSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [filters, setFilters] = useState({
    category: params.get("category") || "",
    brand: params.get("brand") || "",
    minPrice: params.get("min_price") || "",
    maxPrice: params.get("max_price") || "",
    rating: params.get("rating") || "",
  });

  const [isOpen, setIsOpen] = useState(false);

  const { onTouchStart } = useSwipeToOpen({
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    threshold: 100,
    direction: "right",
    edgeWidth: 20,
  });

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value) {
        params.set(key.replace(/([A-Z])/g, "_$1").toLowerCase(), value);
      }
    });

    navigate(
      `${ROUTES.PRODUCTS}${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
    });
    navigate(ROUTES.PRODUCTS);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <>
      {/* Mobile Filter Button */}
      <Button
        variant="outline"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Filter className="h-4 w-4 mr-2" />
        {t("filter.title")}
        {hasActiveFilters && (
          <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0">
            {Object.values(filters).filter((v) => v !== "").length}
          </Badge>
        )}
      </Button>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isOpen ? "block" : "hidden"}`}
      >
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setIsOpen(false)}
          onTouchStart={onTouchStart}
        />
        <div
          className="absolute right-0 top-0 h-full w-[280px] bg-background p-4 overflow-y-auto"
          onTouchStart={onTouchStart}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("filter.title")}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <FilterContent
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            categories={categories}
            brands={brands}
          />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 space-y-6">
        <FilterContent
          filters={filters}
          updateFilters={updateFilters}
          clearFilters={clearFilters}
          categories={categories}
          brands={brands}
        />
      </div>
    </>
  );
}

function FilterContent({
  filters,
  updateFilters,
  clearFilters,
  categories,
  brands,
}: {
  filters: Record<string, string>;
  updateFilters: (f: Partial<Record<string, string>>) => void;
  clearFilters: () => void;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>{t("filter.category")}</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => updateFilters({ category: value })}
        >
          <option value="">{t("filter.allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label>{t("filter.brand")}</Label>
        <Select
          value={filters.brand}
          onValueChange={(value) => updateFilters({ brand: value })}
        >
          <option value="">{t("filter.allBrands")}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>{t("filter.priceRange")}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t("filter.min")}
            value={filters.minPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value })}
            className="h-9"
          />
          <Input
            type="number"
            placeholder={t("filter.max")}
            value={filters.maxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value })}
            className="h-9"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>{t("filter.minRating")}</Label>
        <Select
          value={filters.rating}
          onValueChange={(value) => updateFilters({ rating: value })}
        >
          <option value="">{t("filter.anyRating")}</option>
          <option value="4">{t("filter.fourPlusStars")}</option>
          <option value="3">{t("filter.threePlusStars")}</option>
          <option value="2">{t("filter.twoPlusStars")}</option>
          <option value="1">{t("filter.onePlusStar")}</option>
        </Select>
      </div>

      {/* Clear Filters */}
      {Object.values(filters).some((v) => v !== "") && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {t("filter.clearAll")}
        </Button>
      )}
    </div>
  );
}
