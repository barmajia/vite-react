import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  Package,
  PlusCircle,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Star,
} from "lucide-react";
import type { Database } from "@/lib/database.types";
import type { MarginType } from "@/types/deals";
import { toast } from "sonner";

type MarketplaceProduct =
  Database["public"]["Functions"]["get_marketplace_products_for_middlemen"]["Returns"][number];

export function ProductDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedProduct, setSelectedProduct] =
    useState<MarketplaceProduct | null>(null);
  const [marginType, setMarginType] = useState<MarginType>("percentage");
  const [marginValue, setMarginValue] = useState(5);

  const { data: products, isLoading } = useQuery({
    queryKey: ["marketplace-products", search, priceRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_marketplace_products_for_middlemen",
        {
          p_category: search || null,
          p_min_price: priceRange[0],
          p_max_price: priceRange[1],
          p_min_stock: 5,
          p_limit: 20,
          p_offset: 0,
        },
      );
      if (error) throw error;
      return (data as MarketplaceProduct[]) || [];
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("No product selected");
      const { data, error } = await supabase.rpc(
        "claim_and_create_promo_deal",
        {
          p_product_asin: selectedProduct.asin,
          p_margin_type: marginType,
          p_margin_value: marginValue,
          p_expires_days: 30,
          p_promo_tags: ["new", "featured"],
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (res) => {
      const response = res as Record<string, unknown>;
      toast.success("✅ Deal created! Link copied to clipboard.");
      const shareUrl =
        (response.share_url as string) ||
        `${window.location.origin}/deal/${response.promo_slug}`;
      navigator.clipboard.writeText(shareUrl);
      queryClient.invalidateQueries({ queryKey: ["middleman-kpis"] });
      setSelectedProduct(null);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to claim product"),
  });

  const estimatedEarnings = selectedProduct?.price
    ? marginType === "percentage"
      ? selectedProduct.price * (marginValue / 100)
      : marginValue
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Discover Products
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Browse products, set your margin, and create promotional deals
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search categories (e.g., Fashion, Electronics)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                ${priceRange[0]}
              </span>
              <Slider
                value={priceRange}
                max={1000}
                step={10}
                onValueChange={setPriceRange}
                className="w-32"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                ${priceRange[1]}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((p: any) => (
            <Card
              key={p.asin}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedProduct?.asin === p.asin
                  ? "ring-2 ring-violet-500 bg-violet-50/50 dark:bg-violet-900/20"
                  : ""
              }`}
              onClick={() => setSelectedProduct(p)}
            >
              <CardContent className="p-4">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold truncate text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    ${p.price}
                  </span>
                  <Badge variant="outline">Stock: {p.stock_quantity}</Badge>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                  <span>{p.seller_name}</span>
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span>{p.seller_rating?.toFixed(1) || "0.0"}</span>
                </div>
                {selectedProduct?.asin === p.asin && (
                  <div className="mt-2 flex items-center gap-1 text-emerald-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Selected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {products?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-slate-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-slate-400" />
          <p>No products found</p>
          <p className="text-sm">Try adjusting your search or price range</p>
        </div>
      )}

      {/* Deal Creation Panel */}
      {selectedProduct && (
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-500" />
              Announce Deal: {selectedProduct.title}
            </CardTitle>
            <CardDescription>
              Set your margin and create a promotional deal link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={marginType === "percentage" ? "default" : "outline"}
                size="sm"
                onClick={() => setMarginType("percentage")}
              >
                Percentage (%)
              </Button>
              <Button
                variant={marginType === "fixed" ? "default" : "outline"}
                size="sm"
                onClick={() => setMarginType("fixed")}
              >
                Fixed Amount ($)
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {marginType === "percentage"
                    ? "Commission Rate"
                    : "Fixed Margin"}
                </span>
                <span className="font-semibold text-violet-600">
                  {marginType === "percentage"
                    ? `${marginValue}%`
                    : `$${marginValue}`}
                </span>
              </div>
              <Slider
                value={[marginValue]}
                max={marginType === "percentage" ? 30 : 100}
                step={1}
                onValueChange={([v]) => setMarginValue(v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Your Earnings Per Unit
                </span>
              </div>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                ${estimatedEarnings.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Original Price:</span>
              <span className="font-semibold">${selectedProduct.price}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Deal Price:</span>
              <span className="font-semibold text-violet-600">
                $
                {(
                  selectedProduct.price *
                  (1 +
                    (marginType === "percentage"
                      ? marginValue / 100
                      : marginValue / selectedProduct.price))
                ).toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Create & Copy Announcement Link
            </Button>

            <p className="text-xs text-center text-slate-500">
              Link will be copied to clipboard for easy sharing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
