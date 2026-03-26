// src/features/profile/components/AdminProductNew.tsx
// Admin Product Create Page - Create new product

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export function AdminProductNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

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

    if (!user) {
      toast.error("Authentication required");
      return;
    }

    setSaving(true);

    try {
      const insertData = {
        seller_id: user.id,
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
      };

      console.log("📤 Inserting product:", insertData);

      const { data, error } = await supabase
        .from("products")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase insert error:", error);

        if (error.code === "42501") {
          toast.error("Permission denied");
        } else if (error.code === "23505") {
          toast.error("ASIN already exists");
        } else if (error.code === "23503") {
          toast.error("Invalid reference: Check seller_id");
        } else {
          toast.error("Failed to create product: " + error.message);
        }
        return;
      }

      if (!data) {
        toast.error("Product creation failed");
        return;
      }

      console.log("✅ Product created:", data);
      toast.success("Product created successfully!");

      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (err) {
      console.error("💥 Error:", err);
      toast.error("Unexpected error: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

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
              Add New Product
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fill in the product details below
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
            {saving ? "Creating..." : "Create Product"}
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
              <Label htmlFor="status">Status</Label>
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
            {saving ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
