import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  Star,
  Filter,
  RefreshCw,
  ExternalLink,
  Share2,
  Link as LinkIcon,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Twitter,
  Facebook,
  Mail,
  Copy,
  Check,
  ChevronRight,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sanitizeXSS } from "@/lib/security-utils";

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
  custom_css: string;
  custom_html: string;
}

interface StoreProduct {
  id: string;
  product_asin: string;
  custom_price: number;
  custom_title: string;
  custom_description: string;
  custom_image_url: string;
  is_featured: boolean;
  display_order: number;
  product_data?: {
    title: string;
    description: string;
    images: string[];
    price: number;
  };
}

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: StoreProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStoreContext must be used within StoreProvider");
  return context;
};

function StoreProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  store: StoreData;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${store.store_slug}`);
    const savedWishlist = localStorage.getItem(`wishlist-${store.store_slug}`);
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, [store.store_slug]);

  useEffect(() => {
    localStorage.setItem(`cart-${store.store_slug}`, JSON.stringify(cart));
  }, [cart, store.store_slug]);

  useEffect(() => {
    localStorage.setItem(`wishlist-${store.store_slug}`, JSON.stringify(wishlist));
  }, [wishlist, store.store_slug]);

  const addToCart = (product: StoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success("Added to cart");
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + (item.product.custom_price || item.product.product_data?.price || 0) * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function PublicStorePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "shipping" | "payment" | "complete">("cart");

  const loadStore = useCallback(async () => {
    if (!storeSlug) return;
    try {
      const { data: storeData, error: storeError } = await supabase
        .from("middleman_stores")
        .select("*")
        .eq("store_slug", storeSlug)
        .eq("is_published", true)
        .eq("is_active", true)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData) {
        setError("Store not found");
        return;
      }

      setStore(storeData);
      document.title = `${storeData.store_name} | Shop`;

      await supabase.rpc("track_store_view", { p_store_id: storeData.id });

      const { data: productsData, error: productsError } = await supabase
        .from("middleman_store_products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });

      if (productsError) throw productsError;

      const productsWithData = await Promise.all(
        (productsData || []).map(async (product: StoreProduct) => {
          const { data: productData } = await supabase
            .from("products")
            .select("title, description, images, price")
            .eq("asin", product.product_asin)
            .maybeSingle();

          return {
            ...product,
            product_data: productData,
          };
        })
      );

      setProducts(productsWithData);
    } catch (error: any) {
      console.error("Error loading store:", error);
      setError("Store not found or unavailable");
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const filteredProducts = products
    .filter((p) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.custom_title?.toLowerCase().includes(query) ||
        p.product_data?.title?.toLowerCase().includes(query) ||
        p.product_asin.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      if (sortBy === "price-low") {
        return (a.custom_price || a.product_data?.price || 0) - (b.custom_price || b.product_data?.price || 0);
      }
      if (sortBy === "price-high") {
        return (b.custom_price || b.product_data?.price || 0) - (a.custom_price || a.product_data?.price || 0);
      }
      return 0;
    });

  const featuredProducts = filteredProducts.filter((p) => p.is_featured);
  const regularProducts = filteredProducts.filter((p) => !p.is_featured);

  const shareStore = async () => {
    const url = window.location.href;
    const shareData = {
      title: store?.store_name,
      text: store?.store_description,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">
            This store doesn't exist or is unavailable
          </p>
        </div>
      </div>
    );
  }

  const bannerStyle = store.store_banner_url
    ? {
        backgroundImage: `url(${store.store_banner_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: store.primary_color };

  return (
    <StoreProvider store={store}>
      <div
        className="min-h-screen"
        style={{
          "--primary": store.primary_color,
          "--secondary": store.secondary_color,
          "--accent": store.accent_color,
          fontFamily: store.font_family,
        } as React.CSSProperties}
      >
        <style>{`
          :root {
            --primary: ${store.primary_color};
            --secondary: ${store.secondary_color};
            --accent: ${store.accent_color};
          }
          ${store.custom_css || ""}
        `}</style>

        {/* SEO Meta Tags */}
        <Head store={store} />

        {store.custom_html && (
          <div dangerouslySetInnerHTML={{ __html: sanitizeXSS(store.custom_html, { allowBasicHTML: true }) }} />
        )}

        {/* Header */}
        <header
          className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
          style={{ borderColor: store.primary_color + "20" }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                {store.store_logo_url ? (
                  <img
                    src={store.store_logo_url}
                    alt={store.store_name}
                    className="h-8 object-contain"
                  />
                ) : (
                  <span className="font-bold text-lg">{store.store_name}</span>
                )}
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={shareStore}
                  className="p-2 rounded-full"
                  style={{ backgroundColor: store.primary_color + "15" }}
                >
                  <Share2 className="h-5 w-5" style={{ color: store.primary_color }} />
                </button>
                <button
                  onClick={() => setShowCart(true)}
                  className="p-2 rounded-full relative"
                  style={{ backgroundColor: store.primary_color + "15" }}
                >
                  <ShoppingCart className="h-5 w-5" style={{ color: store.primary_color }} />
                  <CartBadge />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Banner */}
        <div
          className="py-12 text-center relative overflow-hidden"
          style={{
            backgroundColor: store.primary_color,
            color: store.secondary_color,
            ...bannerStyle,
          }}
        >
          {store.store_banner_url && (
            <img
              src={store.store_banner_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20"
            />
          )}
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl font-bold mb-2">{store.store_name}</h1>
            {store.store_description && (
              <p className="text-lg opacity-90 max-w-2xl mx-auto">{store.store_description}</p>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">{products.length} products</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
              <p className="text-muted-foreground">
                This store is being prepared. Check back soon!
              </p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featuredProducts.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="h-5 w-5" style={{ color: store.accent_color }} />
                    Featured
                  </h2>
                  <ProductGrid products={featuredProducts} store={store} />
                </section>
              )}

              {/* All Products */}
              <section>
                <h2 className="text-2xl font-bold mb-6">All Products</h2>
                <ProductGrid products={regularProducts} store={store} />
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <footer
          className="border-t py-8 mt-12"
          style={{
            backgroundColor: store.primary_color + "10",
            borderColor: store.primary_color + "30",
          }}
        >
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Powered by Aurora</p>
          </div>
        </footer>

        {/* Cart Drawer */}
        <CartDrawer store={store} onClose={() => setShowCart(false)} isOpen={showCart} />
      </div>
    </StoreProvider>
  );
}

function Head({ store }: { store: StoreData }) {
  useEffect(() => {
    const metaTags = [
      { property: "og:title", content: `${store.store_name} | Shop` },
      { property: "og:description", content: store.store_description || "" },
      { property: "og:image", content: store.store_banner_url || store.store_logo_url || "" },
      { name: "twitter:card", content: "summary_large_image" },
    ];

    metaTags.forEach((tag) => {
      const existing = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
      if (existing) existing.remove();
      const meta = document.createElement("meta");
      if (tag.property) meta.setAttribute("property", tag.property);
      else meta.setAttribute("name", tag.name);
      meta.setAttribute("content", tag.content);
      document.head.appendChild(meta);
    });

    return () => {
      metaTags.forEach((tag) => {
        const el = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
        if (el) el.remove();
      });
    };
  }, [store]);

  return null;
}

function ProductGrid({
  products,
  store,
}: {
  products: StoreProduct[];
  store: StoreData;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} store={store} />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  store,
}: {
  product: StoreProduct;
  store: StoreData;
}) {
  const { addToCart, toggleWishlist, isInWishlist } = useStoreContext();
  const price = product.custom_price || product.product_data?.price || 0;
  const title = product.custom_title || product.product_data?.title || product.product_asin;
  const imageUrl = product.custom_image_url || product.product_data?.images?.[0];
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="border rounded-lg overflow-hidden group">
      <div className="aspect-square bg-muted relative">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-2 right-2 p-2 bg-background/80 rounded-full transition-opacity"
        >
          <Heart
            className={`h-4 w-4 ${inWishlist ? "fill-current text-red-500" : ""}`}
          />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-medium mb-1 line-clamp-2">{title}</h3>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">${price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            className="p-2 rounded-full"
            style={{ backgroundColor: store.accent_color }}
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CartBadge() {
  const { cartCount } = useStoreContext();
  if (cartCount === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {cartCount}
    </span>
  );
}

function CartDrawer({
  store,
  onClose,
  isOpen,
}: {
  store: StoreData;
  onClose: () => void;
  isOpen: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useStoreContext();
  const [shippingInfo, setShippingInfo] = useState({ name: "", email: "", address: "", phone: "" });
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price-low" | "price-high">("featured");

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      navigate(`/login?redirect=/store/${store.store_slug}`);
      return;
    }
    setCheckoutStep("shipping");
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const items = cart.map((item) => ({
        product_asin: item.product.product_asin,
        title: item.product.custom_title || item.product.product_data?.title,
        price: item.product.custom_price || item.product.product_data?.price,
        quantity: item.quantity,
      }));

      const { data: orderId, error } = await supabase.rpc("create_store_order", {
        p_store_id: store.id,
        p_customer_email: shippingInfo.email,
        p_customer_name: shippingInfo.name,
        p_items: items,
        p_shipping_address: JSON.stringify({
          address: shippingInfo.address,
          phone: shippingInfo.phone,
        }),
      });

      if (error) throw error;

      setOrderComplete(true);
      clearCart();
      setCheckoutStep("complete");
    } catch (error: any) {
      toast.error("Failed to place order");
    } finally {
      setProcessing(false);
    }
  };

  if (checkoutStep === "complete") {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => { setCheckoutStep("cart"); onClose(); }} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-4">Thank you for your order.</p>
            <button
              onClick={() => { setCheckoutStep("cart"); onClose(); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutStep === "shipping") {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => setCheckoutStep("cart")} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Shipping Information</h2>
              <p className="text-sm text-muted-foreground">Step 2 of 3</p>
            </div>
            <button onClick={() => setCheckoutStep("cart")}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Shipping Address</label>
              <textarea
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                placeholder="123 Main St, City, Country"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-4">
              <span>Total</span>
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={processing || !shippingInfo.name || !shippingInfo.email || !shippingInfo.address}
              className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: store.accent_color }}
            >
              {processing ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  const price =
                    item.product.custom_price ||
                    item.product.product_data?.price ||
                    0;
if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      navigate(`/login?redirect=/store/${store.store_slug}`);
      return;
    }
    setCheckoutStep("shipping");
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const items = cart.map((item) => ({
        product_asin: item.product.product_asin,
        title: item.product.custom_title || item.product.product_data?.title,
        price: item.product.custom_price || item.product.product_data?.price,
        quantity: item.quantity,
      }));

      const { data: orderId, error } = await supabase.rpc("create_store_order", {
        p_store_id: store.id,
        p_customer_email: shippingInfo.email,
        p_customer_name: shippingInfo.name,
        p_items: items,
        p_shipping_address: JSON.stringify({
          address: shippingInfo.address,
          phone: shippingInfo.phone,
        }),
      });

      if (error) throw error;

      setOrderComplete(true);
      clearCart();
      setCheckoutStep("complete");
    } catch (error: any) {
      toast.error("Failed to place order");
    } finally {
      setProcessing(false);
    }
  };

  if (checkoutStep === "complete") {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => { setCheckoutStep("cart"); onClose(); }} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-4">Thank you for your order.</p>
            <button
              onClick={() => { setCheckoutStep("cart"); onClose(); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutStep === "shipping") {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => setCheckoutStep("cart")} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Shipping Information</h2>
              <p className="text-sm text-muted-foreground">Step 2 of 3</p>
            </div>
            <button onClick={() => setCheckoutStep("cart")}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Shipping Address</label>
              <textarea
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                placeholder="123 Main St, City, Country"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-4">
              <span>Total</span>
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={processing || !shippingInfo.name || !shippingInfo.email || !shippingInfo.address}
              className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: store.accent_color }}
            >
              {processing ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
                    <div key={item.product.id} className="flex gap-4 border rounded-lg p-3">
                      <div className="w-20 h-20 bg-muted rounded">
                        {item.product.product_data?.images?.[0] && (
                          <img
                            src={item.product.product_data.images[0]}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">
                          {item.product.custom_title ||
                            item.product.product_data?.title}
                        </h4>
                        <p className="text-muted-foreground">${price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1 border rounded"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-1 border rounded"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-auto text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: store.accent_color }}
              >
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="w-full py-2 text-sm text-muted-foreground"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
