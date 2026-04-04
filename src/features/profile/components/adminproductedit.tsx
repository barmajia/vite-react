// src/features/profile/components/AdminProductEdit.tsx
// Admin Product Edit Page - Edit existing product

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProductFormData {
  title: string;
  description: string;
  brand: string;
  price: number;
  quantity: number;
  status: "draft" | "active" | "inactive";
  category: string;
  subcategory: string;
  currency: string;
  asin: string;
  sku: string;
  attributes: Record<string, unknown>;
  images: string[] | { url: string; alt: string }[];
  color_hex: string;
  is_local_brand: boolean;
}

export function AdminProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    brand: "",
    price: 0,
    quantity: 0,
    status: "draft",
    category: "",
    subcategory: "",
    currency: "USD",
    asin: "",
    sku: "",
    attributes: {},
    images: [],
    color_hex: "",
    is_local_brand: false,
  });

  // 1️⃣ Get authenticated user first and check if admin
  useEffect(() => {
    const getUser = async () => {
      if (!user) {
        console.warn("⚠️ User not authenticated, waiting...");
        return;
      }
      console.log("✅ Authenticated user:", user.id);
      setCurrentUser(user.id);

      // Check if user is admin by checking admin_users table
      const { data: adminData } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const isUserAdmin = !!adminData;
      setIsAdmin(isUserAdmin);
      console.log(
        "👑 Is admin:",
        isUserAdmin,
        adminData ? "(found in admin_users)" : "(not in admin_users table)",
      );

      fetchProduct();
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // 2️⃣ Fetch product - Admin can view any product
  const fetchProduct = async () => {
    try {
      console.log("🔍 Fetching product:", id);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false) // Don't show deleted products
        .single();

      if (error) {
        console.error("❌ Supabase fetch error:", error);
        if (error.code === "PGRST116") {
          toast.error("Product not found or has been deleted");
        } else {
          toast.error("Failed to load product: " + error.message);
        }
        navigate("/admin/products");
        return;
      }

      if (!data) {
        toast.error("Product not found");
        navigate("/admin/products");
        return;
      }

      console.log("✅ Product loaded:", data);
      console.log("👤 Product seller_id:", data.seller_id);
      console.log("👤 Current user:", currentUser);
      console.log("🖼️ Raw images from DB:", data.images);
      console.log(
        "🖼️ Images type:",
        typeof data.images,
        Array.isArray(data.images),
      );

      // Normalize images to handle both string[] and object[] formats
      const normalizeImages = (raw: any) => {
        if (!raw) return [];
        if (!Array.isArray(raw)) {
          console.warn("⚠️ Images is not an array:", raw);
          return [];
        }
        return raw
          .map((img: any) => {
            if (typeof img === "string") {
              // Convert storage path to public URL if needed
              const url = img.startsWith("http")
                ? img
                : supabase.storage.from("product-images").getPublicUrl(img).data
                    ?.publicUrl || img;
              return { url, alt: "Product image" };
            }
            if (img?.url) {
              const url = img.url.startsWith("http")
                ? img.url
                : supabase.storage.from("product-images").getPublicUrl(img.url)
                    .data?.publicUrl || img.url;
              return { ...img, url };
            }
            return { url: "", alt: "" };
          })
          .filter((img: any) => img.url);
      };

      setFormData({
        title: data.title || "",
        description: data.description || "",
        brand: data.brand || "",
        price: Number(data.price) || 0,
        quantity: Number(data.quantity) || 0,
        status: (data.status as "draft" | "active" | "inactive") || "draft",
        category: data.category || "",
        subcategory: data.subcategory || "",
        currency: data.currency || "USD",
        asin: data.asin || "",
        sku: data.sku || "",
        attributes: data.attributes || {},
        images: normalizeImages(data.images),
        color_hex: data.color_hex || "",
        is_local_brand: data.is_local_brand || false,
      });
    } catch (err) {
      console.error("💥 Unexpected error fetching product:", err);
      toast.error("Failed to load product");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSelectChange = (name: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ProductFormData,
  ) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleJsonChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: keyof ProductFormData,
  ) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setFormData((prev) => ({
        ...prev,
        [field]: parsed,
      }));
    } catch {
      // Invalid JSON, ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Authentication required");
      console.error("❌ Cannot save: User not authenticated");
      return;
    }

    setSaving(true);
    console.log("💾 Saving product:", id, "isAdmin:", isAdmin);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        price: parseFloat(String(formData.price)) || 0,
        quantity: parseInt(String(formData.quantity)) || 0,
        status: formData.status,
        category: formData.category,
        subcategory: formData.subcategory,
        currency: formData.currency,
        asin: formData.asin,
        sku: formData.sku,
        attributes: formData.attributes,
        images: formData.images,
        color_hex: formData.color_hex,
        is_local_brand: formData.is_local_brand,
        updated_at: new Date().toISOString(),
      };

      console.log("📤 Update data:", updateData);

      // Build update query
      let updateQuery = supabase
        .from("products")
        .update(updateData)
        .eq("id", id);

      // Only apply seller_id filter for non-admins
      if (!isAdmin) {
        updateQuery = updateQuery.eq("seller_id", currentUser);
        console.log("🔒 Non-admin: filtering by seller_id");
      } else {
        console.log("👑 Admin: bypassing seller_id filter");
      }

      // ✅ Execute with minimal select to avoid 406 + confirm success
      const { data, error } = await updateQuery.select("id").maybeSingle();

      if (error) {
        console.error("❌ Supabase update error:", error);

        if (error.code === "42501" || error.message?.includes("policy")) {
          toast.error("Permission denied: Check RLS policies");
        } else if (error.code === "PGRST116") {
          toast.error("Product not found or already deleted");
        } else {
          toast.error("Update failed: " + error.message);
        }
        return;
      }

      if (!data) {
        console.warn(
          "⚠️ Update returned no data - check RLS or product existence",
        );
        toast.error("Product not found or permission denied");
        return;
      }

      console.log("✅ Update successful:", data);
      toast.success("Product updated successfully!");

      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (err) {
      console.error("💥 JavaScript error:", err);
      toast.error("Unexpected error: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
          <p className="text-xs text-gray-400 mt-2">Product ID: {id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Product
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {formData.asin && (
                <Badge variant="outline">ASIN: {formData.asin}</Badge>
              )}
              {formData.sku && (
                <Badge variant="outline">SKU: {formData.sku}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                ID: {id}
              </Badge>
              {isAdmin && (
                <Badge variant="default" className="bg-purple-600">
                  👑 Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              User: {currentUser?.substring(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/products")}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Product title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder="Brand name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asin">ASIN</Label>
              <Input
                id="asin"
                name="asin"
                value={formData.asin}
                onChange={handleChange}
                placeholder="ASIN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="SKU"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Product description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleNumberChange(e, "price")}
                required
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                  <SelectItem value="AED">AED (د.إ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleNumberChange(e, "quantity")}
                required
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Category & Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Electronics"
                list="categories"
              />
              <datalist id="categories">
                <option value="Electronics" />
                <option value="Fashion & Apparel" />
                <option value="Home & Garden" />
                <option value="Sports & Outdoors" />
                <option value="Books" />
                <option value="Toys & Games" />
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g., Smartphones"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleSelectChange(
                    "status",
                    value as "draft" | "active" | "inactive",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Attributes (JSON) */}
        <Card>
          <CardHeader>
            <CardTitle>Attributes (JSON)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={JSON.stringify(formData.attributes, null, 2)}
              onChange={(e) => handleJsonChange(e, "attributes")}
              rows={6}
              className="font-mono text-sm"
              placeholder='{"color": "Black", "size": "Medium"}'
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Example:{" "}
              {`{"color": "Black", "size": "Medium", "material": "Cotton"}`}
            </p>
          </CardContent>
        </Card>

        {/* Images (JSON Array) */}
        <Card>
          <CardHeader>
            <CardTitle>Images (JSON Array)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={JSON.stringify(formData.images, null, 2)}
              onChange={(e) => handleJsonChange(e, "images")}
              rows={6}
              className="font-mono text-sm"
              placeholder='[{"url": "https://...", "alt": "Product image"}]'
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Example:{" "}
              {`[{"url": "https://example.com/image.jpg", "alt": "Front view"}]`}
            </p>
            {formData.images && formData.images.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {formData.images.map((img, idx) => {
                  const imageUrl = typeof img === "string" ? img : img.url;
                  const imageAlt =
                    typeof img === "string" ? "Product" : img.alt || "Product";

                  return (
                    <div
                      key={idx}
                      className="relative w-24 h-24 border rounded overflow-hidden group"
                    >
                      <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("❌ Failed to load image:", imageUrl);
                          // Show placeholder on error
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white text-center px-1">
                          {imageAlt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color_hex">Color Hex</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color_hex"
                  type="color"
                  value={formData.color_hex || "#000000"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      color_hex: e.target.value,
                    }))
                  }
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={formData.color_hex || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      color_hex: e.target.value,
                    }))
                  }
                  placeholder="#RRGGBB"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_local_brand"
                name="is_local_brand"
                checked={formData.is_local_brand}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_local_brand: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_local_brand" className="cursor-pointer">
                Is Local Brand
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/products")}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
