import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Heart,
  Star,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface StoreData {
  id: string;
  store_name: string;
  store_slug: string;
  store_description: string;
  store_logo_url: string;
  store_banner_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  is_published: boolean;
  total_views: number;
}

interface StoreProduct {
  id: string;
  product_asin: string;
  custom_title: string;
  custom_description: string;
  custom_price: number;
  custom_image_url: string;
  display_order: number;
  is_featured: boolean;
}

const defaultColors = {
  primary: "#0f172a",
  secondary: "#ffffff",
  accent: "#f59e0b",
};

export function PublicStorePage() {
  const { storename } = useParams<{ storename: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  const { data: store, isLoading } = useQuery({
    queryKey: ["public-store", storename],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_store_by_slug", {
        p_store_slug: storename,
      });
      if (error || !data || data.length === 0) {
        throw new Error("Store not found");
      }
      return data[0] as StoreData;
    },
    enabled: !!storename,
  });

  const { data: products } = useQuery({
    queryKey: ["store-products", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_store_products", {
        p_store_id: store?.id,
      });
      if (error) throw error;
      return (data as StoreProduct[]) || [];
    },
    enabled: !!store?.id,
  });

  useEffect(() => {
    if (store?.id) {
      supabase.rpc("track_store_view", { p_store_id: store.id }).catch(() => {});
    }
  }, [store?.id]);

  const colors = {
    primary: store?.primary_color || defaultColors.primary,
    secondary: store?.secondary_color || defaultColors.secondary,
    accent: store?.accent_color || defaultColors.accent,
  };

  const toggleWishlist = (asin: string) => {
    setWishlist((prev) =>
      prev.includes(asin)
        ? prev.filter((a) => a !== asin)
        : [...prev, asin]
    );
  };

  const addToCart = (asin: string) => {
    if (!cart.includes(asin)) {
      setCart((prev) => [...prev, asin]);
      toast.success("Added to cart!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
            Store Not Found
          </h1>
          <p style={{ color: colors.primary, opacity: 0.7 }}>
            This store doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const filteredProducts = products?.filter(
    (p) =>
      p.custom_title?.toLowerCase().includes(search.toLowerCase()) ||
      !search
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.secondary, fontFamily: store.font_family }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: colors.secondary, borderColor: colors.primary + "20" }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {store.store_logo_url ? (
                <img
                  src={store.store_logo_url}
                  alt={store.store_name}
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: colors.accent, color: colors.primary }}
                >
                  {store.store_name?.charAt(0)}
                </div>
              )}
              <span className="font-bold text-lg hidden sm:inline" style={{ color: colors.primary }}>
                {store.store_name}
              </span>
            </div>

            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.primary + "60" }} />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  style={{ backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg relative"
                style={{ backgroundColor: colors.primary + "10" }}
                onClick={() => toast.success("Wishlist feature coming soon!")}
              >
                <Heart className="h-5 w-5" style={{ color: colors.primary }} />
                {wishlist.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                className="p-2 rounded-lg relative"
                style={{ backgroundColor: colors.primary + "10" }}
                onClick={() => toast.success("Cart feature coming soon!")}
              >
                <ShoppingCart className="h-5 w-5" style={{ color: colors.primary }} />
                {cart.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                className="p-2 rounded-lg md:hidden"
                style={{ backgroundColor: colors.primary + "10" }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" style={{ color: colors.primary }} />
                ) : (
                  <Menu className="h-5 w-5" style={{ color: colors.primary }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-b" style={{ backgroundColor: colors.secondary, borderColor: colors.primary + "20" }}>
          <div className="container mx-auto px-4 py-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.primary + "60" }} />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      {store.store_banner_url && (
        <div className="w-full h-48 md:h-64 relative">
          <img
            src={store.store_banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: colors.primary + "40" }}
          />
        </div>
      )}

      {/* Hero (if no banner) */}
      {!store.store_banner_url && (
        <div className="py-16 text-center" style={{ backgroundColor: colors.primary }}>
          <div className="container mx-auto px-4">
            {store.store_logo_url ? (
              <img
                src={store.store_logo_url}
                alt={store.store_name}
                className="h-20 w-20 object-contain mx-auto mb-4 bg-white rounded-xl p-2"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center text-4xl font-bold mx-auto mb-4"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {store.store_name?.charAt(0)}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: colors.secondary }}>
              {store.store_name}
            </h1>
            {store.store_description && (
              <p className="mt-2 text-lg" style={{ color: colors.secondary, opacity: 0.8 }}>
                {store.store_description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            style={{ borderColor: colors.accent, color: colors.primary }}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            style={{ color: colors.primary }}
          >
            Featured
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            style={{ color: colors.primary }}
          >
            New
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            style={{ color: colors.primary }}
          >
            Best Sellers
          </Button>
        </div>

        {/* Products Grid */}
        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{ backgroundColor: colors.secondary, borderColor: colors.primary + "20" }}
              >
                <div className="aspect-square relative bg-muted">
                  {product.custom_image_url ? (
                    <img
                      src={product.custom_image_url}
                      alt={product.custom_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ color: colors.primary + "40" }}>No Image</span>
                    </div>
                  )}
                  {product.is_featured && (
                    <Badge
                      className="absolute top-2 left-2"
                      style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                      Featured
                    </Badge>
                  )}
                  <button
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    onClick={() => toggleWishlist(product.product_asin)}
                  >
                    <Heart
                      className="h-4 w-4"
                      style={{
                        color: wishlist.includes(product.product_asin)
                          ? colors.accent
                          : colors.primary,
                        fill: wishlist.includes(product.product_asin)
                          ? colors.accent
                          : "none",
                      }}
                    />
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-2" style={{ color: colors.primary }}>
                    {product.custom_title || "Product"}
                  </h3>
                  {product.custom_description && (
                    <p
                      className="text-sm line-clamp-2 mb-2"
                      style={{ color: colors.primary, opacity: 0.7 }}
                    >
                      {product.custom_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-lg font-bold"
                      style={{ color: colors.accent }}
                    >
                      ${product.custom_price?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <Button
                    className="w-full mt-3"
                    style={{ backgroundColor: colors.accent, color: colors.primary }}
                    onClick={() => addToCart(product.product_asin)}
                    disabled={cart.includes(product.product_asin)}
                  >
                    {cart.includes(product.product_asin) ? (
                      "Added"
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: colors.primary + "10" }}
            >
              <Search className="h-10 w-10" style={{ color: colors.primary + "40" }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.primary }}>
              No Products Yet
            </h2>
            <p style={{ color: colors.primary, opacity: 0.7 }}>
              This store doesn't have any products for sale yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: colors.primary + "20", backgroundColor: colors.primary, color: colors.secondary }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {store.store_logo_url ? (
                <img
                  src={store.store_logo_url}
                  alt={store.store_name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: colors.accent, color: colors.primary }}
                >
                  {store.store_name?.charAt(0)}
                </div>
              )}
              <span>{store.store_name}</span>
            </div>
            <p className="text-sm" style={{ opacity: 0.7 }}>
              Powered by Aurora
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}