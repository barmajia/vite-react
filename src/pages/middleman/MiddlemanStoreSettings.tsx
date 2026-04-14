import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Palette,
  Layout,
  Image,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Store,
  ExternalLink,
  Trash2,
  Plus,
  GripVertical,
  Star,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StoreSettings {
  id?: string;
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
  domain: string;
  is_published: boolean;
}

interface StoreProduct {
  id: string;
  product_asin: string;
  product_title?: string;
  product_image?: string;
  custom_price: number;
  custom_title_custom?: string;
  custom_description?: string;
  custom_image_url?: string;
  is_featured: boolean;
  display_order: number;
}

const FONT_OPTIONS = [
  { value: "inherit", label: "Default" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Open Sans, sans-serif", label: "Open Sans" },
  { value: "Lato, sans-serif", label: "Lato" },
  { value: "Montserrat, sans-serif", label: "Montserrat" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Playfair Display, serif", label: "Playfair Display" },
  { value: "Merriweather, serif", label: "Merriweather" },
];

const DEFAULT_PRODUCTS_PER_PAGE = 12;

export function MiddlemanStoreSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "design" | "products" | "settings">("basic");
  const [copied, setCopied] = useState(false);

  const [store, setStore] = useState<StoreSettings>({
    store_name: "",
    store_slug: "",
    store_description: "",
    store_logo_url: "",
    store_banner_url: "",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    accent_color: "#3b82f6",
    font_family: "inherit",
    custom_css: "",
    custom_html: "",
    domain: "",
    is_published: false,
  });

  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);

  const loadStore = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("middleman_stores")
        .select("*")
        .eq("middle_man_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setStore({
          id: data.id,
          store_name: data.store_name,
          store_slug: data.store_slug,
          store_description: data.store_description || "",
          store_logo_url: data.store_logo_url || "",
          store_banner_url: data.store_banner_url || "",
          primary_color: data.primary_color || "#000000",
          secondary_color: data.secondary_color || "#ffffff",
          accent_color: data.accent_color || "#3b82f6",
          font_family: data.font_family || "inherit",
          custom_css: data.custom_css || "",
          custom_html: data.custom_html || "",
          domain: data.domain || "",
          is_published: data.is_published || false,
        });

        loadStoreProducts(data.id);
      }
    } catch (error: any) {
      console.error("Error loading store:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadStoreProducts = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from("middleman_store_products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setStoreProducts(data || []);
    } catch (error: any) {
      console.error("Error loading store products:", error);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("middle_man_deals")
        .select(`
          id,
          product_asin,
          middle_man_deals!inner(
            product:products(title, images, price)
          )
        `)
        .eq("middle_man_id", user?.id)
        .eq("is_active", true)
        .limit(50);

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error: any) {
      console.error("Error loading products:", error);
    }
  };

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const handleSave = async () => {
    if (!user) return;
    if (!store.store_name.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (!store.store_slug.trim()) {
      toast.error("Store URL is required");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(store.store_slug)) {
      toast.error("Store URL can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setSaving(true);
    try {
      const storeData = {
        middle_man_id: user.id,
        store_name: store.store_name,
        store_slug: store.store_slug.toLowerCase(),
        store_description: store.store_description,
        store_logo_url: store.store_logo_url,
        store_banner_url: store.store_banner_url,
        primary_color: store.primary_color,
        secondary_color: store.secondary_color,
        accent_color: store.accent_color,
        font_family: store.font_family,
        custom_css: store.custom_css,
        custom_html: store.custom_html,
        domain: store.domain,
        is_published: store.is_published,
      };

      let result;
      if (store.id) {
        result = await supabase
          .from("middleman_stores")
          .update(storeData)
          .eq("id", store.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("middleman_stores")
          .insert(storeData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success("Store saved successfully!");
      if (!store.id && result.data) {
        setStore({ ...store, id: result.data.id });
        loadStore();
      }
    } catch (error: any) {
      if (error.message?.includes("store_slug")) {
        toast.error("This store URL is already taken");
      } else {
        toast.error("Failed to save store");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async (productAsin: string) => {
    if (!store.id) {
      toast.error("Please save your store first");
      return;
    }

    try {
      const { error } = await supabase
        .from("middleman_store_products")
        .insert({
          store_id: store.id,
          product_asin: productAsin,
          display_order: storeProducts.length,
        });

      if (error) throw error;
      toast.success("Product added!");
      loadStoreProducts(store.id);
      setShowProductPicker(false);
    } catch (error: any) {
      toast.error("Failed to add product");
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("middleman_store_products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      setStoreProducts(storeProducts.filter(p => p.id !== productId));
      toast.success("Product removed");
    } catch (error: any) {
      toast.error("Failed to remove product");
    }
  };

  const handleToggleFeatured = async (productId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("middleman_store_products")
        .update({ is_featured: isFeatured })
        .eq("id", productId);

      if (error) throw error;
      setStoreProducts(storeProducts.map(p => 
        p.id === productId ? { ...p, is_featured: isFeatured } : p
      ));
    } catch (error: any) {
      toast.error("Failed to update product");
    }
  };

  const copyStoreUrl = () => {
    const url = `${window.location.origin}/store/${store.store_slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const previewUrl = `/store/${store.store_slug}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            My Store
          </h1>
          <p className="text-muted-foreground">
            Customize your online store
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(previewUrl, "_blank")}
            disabled={!store.id}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-accent disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("basic")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "basic" ? "bg-background shadow" : ""
          }`}
        >
          Basic Info
        </button>
        <button
          onClick={() => setActiveTab("design")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "design" ? "bg-background shadow" : ""
          }`}
        >
          Design
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "products" ? "bg-background shadow" : ""
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "settings" ? "bg-background shadow" : ""
          }`}
        >
          Settings
        </button>
      </div>

      {activeTab === "basic" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Name</label>
              <input
                type="text"
                value={store.store_name}
                onChange={(e) => setStore({ ...store, store_name: e.target.value })}
                placeholder="My Awesome Store"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Store URL</label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">store.aurora.com/</span>
                <input
                  type="text"
                  value={store.store_slug}
                  onChange={(e) => setStore({ ...store, store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="my-store"
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={store.store_description}
              onChange={(e) => setStore({ ...store, store_description: e.target.value })}
              placeholder="Tell customers about your store..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={store.store_logo_url}
                  onChange={(e) => setStore({ ...store, store_logo_url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                {store.store_logo_url && (
                  <img src={store.store_logo_url} alt="Logo" className="w-10 h-10 object-contain border rounded" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Banner URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={store.store_banner_url}
                  onChange={(e) => setStore({ ...store, store_banner_url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                {store.store_banner_url && (
                  <img src={store.store_banner_url} alt="Banner" className="w-20 h-10 object-cover border rounded" />
                )}
              </div>
            </div>
          </div>

          {store.id && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Store URL</p>
                <p className="font-mono">{window.location.origin}/store/{store.store_slug}</p>
              </div>
              <button
                onClick={copyStoreUrl}
                className="p-2 hover:bg-accent rounded-lg"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "design" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={store.primary_color}
                  onChange={(e) => setStore({ ...store, primary_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={store.primary_color}
                  onChange={(e) => setStore({ ...store, primary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={store.secondary_color}
                  onChange={(e) => setStore({ ...store, secondary_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={store.secondary_color}
                  onChange={(e) => setStore({ ...store, secondary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={store.accent_color}
                  onChange={(e) => setStore({ ...store, accent_color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={store.accent_color}
                  onChange={(e) => setStore({ ...store, accent_color: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Font Family</label>
            <select
              value={store.font_family}
              onChange={(e) => setStore({ ...store, font_family: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom CSS</label>
            <textarea
              value={store.custom_css}
              onChange={(e) => setStore({ ...store, custom_css: e.target.value })}
              placeholder=".my-class { ... }"
              rows={6}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom HTML</label>
            <textarea
              value={store.custom_html}
              onChange={(e) => setStore({ ...store, custom_html: e.target.value })}
              placeholder="<div>Custom HTML</div>"
              rows={6}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              You can also browse templates in the{" "}
              <a href="/webmarketplace" target="_blank" className="text-blue-500 hover:underline">
                Website Marketplace
              </a>{" "}
              and copy-paste HTML here
            </p>
          </div>

          <div className="p-4 border rounded-lg" style={{ background: store.primary_color, color: store.secondary_color, padding: "1rem" }}>
            <p style={{ fontFamily: store.font_family }}>Preview Text</p>
            <button style={{ background: store.accent_color, color: store.secondary_color, padding: "0.5rem 1rem", border: "none", borderRadius: "0.25rem" }}>
              Example Button
            </button>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Store Products ({storeProducts.length})</h2>
            <button
              onClick={() => setShowProductPicker(true)}
              disabled={!store.id}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-accent disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {storeProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products yet</p>
              <p className="text-sm">Add products from your deals to display on your store</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {storeProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="font-medium">{product.product_asin}</span>
                    </div>
                    <button
                      onClick={() => handleToggleFeatured(product.id, !product.is_featured)}
                      className={`p-1 ${product.is_featured ? "text-yellow-500" : "text-muted-foreground"}`}
                    >
                      <Star className={`h-4 w-4 ${product.is_featured ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="text-red-500 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {showProductPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add Product</h3>
                  <button onClick={() => setShowProductPicker(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border rounded-lg mb-4"
                />
                <div className="space-y-2">
                  {availableProducts
                    .filter((p) => !storeProducts.some((sp) => sp.product_asin === p.product_asin))
                    .map((product) => (
                      <div
                        key={product.product_asin}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span>{product.product_asin}</span>
                        <button
                          onClick={() => handleAddProduct(product.product_asin)}
                          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Domain</label>
            <input
              type="text"
              value={store.domain}
              onChange={(e) => setStore({ ...store, domain: e.target.value })}
              placeholder="mystore.com"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-sm text-muted-foreground">
              Point your domain CNAME to our servers to use a custom domain
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Published</p>
              <p className="text-sm text-muted-foreground">
                {store.is_published ? "Your store is visible to customers" : "Your store is hidden"}
              </p>
            </div>
            <button
              onClick={() => setStore({ ...store, is_published: !store.is_published })}
              className={`p-2 rounded-lg ${store.is_published ? "bg-green-500 text-white" : "bg-muted"}`}
            >
              {store.is_published ? <CheckCircle2 className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>

          {store.id && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold">{store.total_views || 0}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold">{store.total_orders || 0}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold">${store.total_revenue || 0}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}