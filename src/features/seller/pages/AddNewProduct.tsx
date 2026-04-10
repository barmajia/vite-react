import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Upload, Loader2, DollarSign, Hash, Tag, Image } from "lucide-react";
import { toast } from "sonner";

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Fashion & Apparel",
  "Home & Garden",
  "Sports & Outdoors",
  "Health & Beauty",
  "Toys & Games",
  "Automotive",
  "Books & Media",
  "Food & Beverages",
  "Office Supplies",
  "Industrial",
  "Other",
];

export function AddNewProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    sku: "",
    brand: "",
    images: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Product name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.quantity || parseInt(formData.quantity) < 0) newErrors.quantity = "Valid quantity is required";
    if (!formData.category) newErrors.category = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addProductMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("products")
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          category: formData.category,
          sku: formData.sku.trim() || null,
          brand: formData.brand.trim() || null,
          seller_id: user.id,
          status: "active",
          is_deleted: false,
          is_local_brand: false,
          images: formData.images.length > 0 ? formData.images : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Product created successfully!");
      navigate("/seller/products");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addProductMutation.mutate();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/seller/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Product</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            List a new product in your store
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-500" />
              Basic Information
            </CardTitle>
            <CardDescription>Enter the essential details about your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Name *</Label>
              <Input
                id="title"
                placeholder="e.g., Premium Wireless Headphones"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product features, specifications, and benefits..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="brand"
                    className="pl-10"
                    placeholder="e.g., Sony, Nike"
                    value={formData.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Pricing & Inventory
            </CardTitle>
            <CardDescription>Set your price and available stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                  />
                </div>
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity in Stock *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    className={`pl-10 ${errors.quantity ? "border-red-500" : ""}`}
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", e.target.value)}
                  />
                </div>
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="sku"
                  className="pl-10"
                  placeholder="e.g., WH-1000XM4-BLK"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">Optional: Internal inventory tracking code</p>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-500" />
              Product Images
            </CardTitle>
            <CardDescription>Upload product photos (coming soon - image upload integration)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Drag & drop images or click to upload</p>
              <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WebP (Max 5MB each)</p>
              <Badge variant="outline" className="mt-4">Image upload coming soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/seller/products")}
            disabled={addProductMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={addProductMutation.isPending}
          >
            {addProductMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Product...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
