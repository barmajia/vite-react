import { useState } from "react";
import { Filter, SlidersHorizontal, X, Star, Trash2 } from "lucide-react";
import { 
  Button, 
  Input, 
  Label, 
  Badge 
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        className="lg:hidden glass border-white/20 text-foreground h-12 px-6 rounded-2xl shadow-xl transition-all active:scale-95"
        onClick={() => setIsOpen(true)}
      >
        <Filter className="h-4 w-4 mr-2 text-primary" />
        <span className="font-black uppercase tracking-widest text-[10px]">{t("filter.title")}</span>
        {hasActiveFilters && (
          <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-white text-[10px] font-black italic">
            {Object.values(filters).filter((v) => v !== "").length}
          </Badge>
        )}
      </Button>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden ${isOpen ? "block" : "hidden"}`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
          onClick={() => setIsOpen(false)}
          onTouchStart={onTouchStart}
        />
        <div
          className="absolute right-0 top-0 h-full w-[320px] glass p-8 overflow-y-auto animate-slide-in-right border-l border-white/10"
          onTouchStart={onTouchStart}
        >
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">Precision Controls</span>
              <h2 className="text-3xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40">
                {t("filter.title")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-2xl hover:bg-white/10 transition-all h-12 w-12 glass border-white/10"
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

          <div className="mt-12 sticky bottom-0 bg-transparent pt-4">
             <Button
                className="w-full h-14 glass bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-primary/30"
                onClick={() => setIsOpen(false)}
              >
                APPLY PARAMETERS
              </Button>
          </div>
        </div>
      </div>

      {/* Extreme High-Fidelity Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="glass-card p-8 border-t-white/30 border-l-white/20 border-b-white/5 border-r-white/5 relative bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-[3rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] overflow-hidden group backdrop-blur-[40px]">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 group-hover:scale-150 transition-all duration-1000 pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 glass bg-primary/10 rounded-xl">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 leading-none mb-1 italic">Optimization</span>
              <h2 className="font-black text-xl italic tracking-tighter leading-none">{t("filter.title")}</h2>
            </div>
          </div>

          <div className="relative z-10">
            <FilterContent
              filters={filters}
              updateFilters={updateFilters}
              clearFilters={clearFilters}
              categories={categories}
              brands={brands}
            />
          </div>
        </div>
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
    <div className="space-y-8">
      {/* Category */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Classification</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => updateFilters({ category: value })}
        >
          <SelectTrigger className="h-12 glass bg-white/5 border-white/10 rounded-xl px-4 font-bold text-xs group hover:border-white/20 transition-all">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="glass border-white/10 rounded-xl p-1 shadow-2xl">
            <SelectItem value="null" className="rounded-lg font-bold text-xs focus:bg-primary focus:text-white">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="rounded-lg font-bold text-xs focus:bg-primary focus:text-white">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Manufacturer</Label>
        <Select
          value={filters.brand}
          onValueChange={(value) => updateFilters({ brand: value })}
        >
          <SelectTrigger className="h-12 glass bg-white/5 border-white/10 rounded-xl px-4 font-bold text-xs group hover:border-white/20 transition-all">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent className="glass border-white/10 rounded-xl p-1 shadow-2xl">
            <SelectItem value="null" className="rounded-lg font-bold text-xs focus:bg-primary focus:text-white">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id} className="rounded-lg font-bold text-xs focus:bg-primary focus:text-white">
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Price Vector (USD)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <Input
              type="number"
              placeholder="MIN"
              value={filters.minPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilters({ minPrice: e.target.value })}
              className="h-12 glass bg-white/5 border-white/10 rounded-xl px-4 font-black text-center text-xs focus:border-primary/50 transition-all placeholder:opacity-30"
            />
          </div>
          <div className="relative group">
            <Input
              type="number"
              placeholder="MAX"
              value={filters.maxPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilters({ maxPrice: e.target.value })}
              className="h-12 glass bg-white/5 border-white/10 rounded-xl px-4 font-black text-center text-xs focus:border-primary/50 transition-all placeholder:opacity-30"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Satisfaction Index</Label>
        <div className="grid grid-cols-4 gap-2">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => updateFilters({ rating: String(r) })}
              className={`h-10 rounded-xl glass border transition-all flex items-center justify-center gap-1 group/rate ${
                filters.rating === String(r) 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-[10px] font-black italic">{r}</span>
              <Star className={`h-2.5 w-2.5 ${filters.rating === String(r) ? 'fill-white' : 'text-amber-500 fill-amber-500/20 group-hover/rate:scale-110 transition-transform'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {Object.values(filters).some((v) => v !== "") && (
        <div className="pt-4">
          <Button 
            variant="ghost" 
            onClick={clearFilters} 
            className="w-full h-12 glass bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Reset Matrix
          </Button>
        </div>
      )}
    </div>
  );
}
