import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Package, DollarSign, Link, Loader2, ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";

export function MiddlemanDealNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [marginType, setMarginType] = useState<"percentage" | "fixed">("percentage");
  const [marginValue, setMarginValue] = useState(5);

  const { data: products, isLoading: searching } = useQuery({
    queryKey: ["search-products", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, sellers(full_name, is_verified)")
        .eq("status", "active")
        .eq("is_deleted", false)
        .ilike("title", `%${searchTerm}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2,
  });

  const createDealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !user?.id) throw new Error("Missing required data");
      
      const uniqueSlug = `mm-${user.id.slice(0, 8)}-${selectedProduct.asin}`;
      
      const { data, error } = await supabase.rpc("create_middle_man_deal", {
        p_middle_man_id: user.id,
        p_product_asin: selectedProduct.asin,
        p_commission_rate: marginType === "percentage" ? marginValue : 0,
        p_margin_amount: marginType === "fixed" ? marginValue : 0,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["middleman-kpis"] });
      toast.success("Deal created successfully!");
      navigate("/middleman/deals");
    },
    onError: (error: any) => toast.error(error.message || "Failed to create deal"),
  });

  const estimatedEarnings = selectedProduct?.price 
    ? (marginType === "percentage" 
        ? selectedProduct.price * (marginValue / 100)
        : marginValue)
    : 0;

  const dealUrl = user?.id && selectedProduct?.asin 
    ? `${window.location.origin}/deal/mm-${user.id.slice(0, 8)}-${selectedProduct.asin}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create New Deal
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Search for a product and set your margin
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Products</CardTitle>
          <CardDescription>Find products to add to your deal catalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searching && <p className="text-sm text-slate-500">Searching...</p>}
          
          <div className="space-y-2 max-h-60 overflow-auto">
            {products?.map((product: any) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selectedProduct?.id === product.id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.title} className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{product.title}</p>
                  <p className="text-sm text-slate-500">
                    {product.sellers?.full_name} {product.sellers?.is_verified && <Badge className="ml-1">✓</Badge>}
                  </p>
                </div>
                <p className="font-semibold">${product.price?.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-500" />
              {selectedProduct.title}
            </CardTitle>
            <CardDescription>
              Configure your margin for this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              {selectedProduct.images?.[0] && (
                <img src={selectedProduct.images[0]} alt={selectedProduct.title} className="w-20 h-20 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-semibold">{selectedProduct.title}</p>
                <p className="text-sm text-slate-500">{selectedProduct.brand}</p>
                <Badge variant="outline" className="mt-1">${selectedProduct.price?.toFixed(2)}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Margin Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={marginType === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMarginType("percentage")}
                >
                  Percentage
                </Button>
                <Button
                  variant={marginType === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMarginType("fixed")}
                >
                  Fixed Amount
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  {marginType === "percentage" ? "Commission Rate" : "Fixed Margin"}
                </Label>
                <span className="font-semibold text-violet-600">
                  {marginType === "percentage" ? `${marginValue}%` : `$${marginValue}`}
                </span>
              </div>
              <input
                type="range"
                min={marginType === "percentage" ? 1 : 1}
                max={marginType === "percentage" ? 50 : 100}
                step={1}
                value={marginValue}
                onChange={(e) => setMarginValue(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{marginType === "percentage" ? "1%" : "$1"}</span>
                <span>{marginType === "percentage" ? "50%" : "$100"}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Estimated Earnings Per Sale
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  ${estimatedEarnings.toFixed(2)}
                </span>
              </div>
            </div>

            {dealUrl && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Your Deal URL
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={dealUrl}
                    className="bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(dealUrl);
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => createDealMutation.mutate()}
                disabled={createDealMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {createDealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Create Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
