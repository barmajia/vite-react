import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package, Store, Shield, ArrowRight, Star, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export function PublicDealPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const { data: deal, isLoading } = useQuery({
    queryKey: ["public-deal", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("middle_man_deals_public")
        .select("*")
        .eq("unique_slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (slug && deal?.unique_slug) {
      supabase.rpc("track_deal_click", { p_unique_slug: slug });
      queryClient.invalidateQueries({ queryKey: ["middleman-kpis"] });
    }
  }, [slug, deal, queryClient]);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user || !deal) throw new Error("Authentication required");
      
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("asin", deal.product_asin)
        .single();
      
      if (!product) throw new Error("Product not found");
      
      const { error } = await supabase
        .from("cart")
        .insert({
          user_id: user.id,
          asin: product.asin,
          quantity,
          middle_man_slug: slug,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to cart!");
      navigate("/cart");
    },
    onError: (error: any) => {
      if (error.message === "Authentication required") {
        toast.info("Please login to add items to cart");
        navigate("/login", { state: { from: `/deal/${slug}` } });
      } else {
        toast.error(error.message || "Failed to add to cart");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Deal Not Found</h2>
          <p className="text-slate-600 mb-4">This deal may have expired or been removed.</p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const dealPrice = deal.original_price * (1 + (deal.margin_amount || 0) / 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-900 dark:to-violet-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Package className="h-6 w-6 text-violet-600" />
            <span>Aurora Deals</span>
          </div>
          {user ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative">
              {deal.images?.[0] ? (
                <img 
                  src={deal.images[0]} 
                  alt={deal.title}
                  className="w-full rounded-2xl shadow-2xl object-cover aspect-square"
                />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <Package className="h-16 w-16 text-slate-400" />
                </div>
              )}
              {deal.seller_verified && (
                <Badge className="absolute top-4 right-4 bg-emerald-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Seller
                </Badge>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-2">
                  <Store className="h-3 w-3 mr-1" />
                  {deal.seller_name}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {deal.title}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">{deal.description}</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold">${dealPrice.toFixed(2)}</span>
                  {deal.margin_amount > 0 && (
                    <Badge className="bg-white/20 text-white">
                      +{deal.margin_amount}% margin
                    </Badge>
                  )}
                </div>
                {deal.original_price !== dealPrice && (
                  <p className="text-sm text-white/80 mt-1">
                    <span className="line-through mr-2">${deal.original_price.toFixed(2)}</span>
                    Original price
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Quantity</Label>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-lg"
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-5 w-5 mr-2" />
                  )}
                  Add to Cart • ${(dealPrice * quantity).toFixed(2)}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  Secure checkout • Fast shipping • Quality guaranteed
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs font-medium">Secure Payment</p>
                </div>
                <div className="text-center">
                  <Package className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs font-medium">Fast Shipping</p>
                </div>
                <div className="text-center">
                  <Star className="h-6 w-6 mx-auto text-amber-500 mb-1" />
                  <p className="text-xs font-medium">Quality Assured</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
