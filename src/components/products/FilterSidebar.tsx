import { useState } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

interface FilterSidebarProps {
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
}

export function FilterSidebar({
  categories = [],
  brands = [],
}: FilterSidebarProps) {
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
        Filters
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
        />
        <div className="absolute right-0 top-0 h-full w-[280px] bg-background p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
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
  return (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => updateFilters({ category: value })}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label>Brand</Label>
        <Select
          value={filters.brand}
          onValueChange={(value) => updateFilters({ brand: value })}
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value })}
            className="h-9"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value })}
            className="h-9"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>Minimum Rating</Label>
        <Select
          value={filters.rating}
          onValueChange={(value) => updateFilters({ rating: value })}
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="2">2+ Stars</option>
          <option value="1">1+ Stars</option>
        </Select>
      </div>

      {/* Clear Filters */}
      {Object.values(filters).some((v) => v !== "") && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      )}
    </div>
  );
}
