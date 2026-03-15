import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function CreateServiceListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    price_type: "fixed",
    price: "",
    currency: "USD",
    delivery_days: "7",
    is_featured: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Get user's provider profile
      const { data: providerData } = await supabase
        .from("svc_providers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!providerData) {
        toast.error("Please create a provider profile first");
        navigate("/services/dashboard/create-profile");
        return;
      }

      setProvider(providerData);

      // Get categories and subcategories
      const { data: cats } = await supabase
        .from("svc_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      const { data: subcats } = await supabase
        .from("svc_subcategories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      setCategories(cats || []);
      setSubcategories(subcats || []);
    };

    fetchData();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) {
      toast.error("No provider profile found");
      return;
    }

    setLoading(true);
    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data, error } = await supabase
        .from("svc_listings")
        .insert({
          provider_id: provider.id,
          subcategory_id: formData.subcategory_id || null,
          title: formData.title,
          slug,
          description: formData.description,
          price_type: formData.price_type,
          price: formData.price ? parseFloat(formData.price) : null,
          currency: formData.currency,
          delivery_days: parseInt(formData.delivery_days),
          is_featured: formData.is_featured,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Service listing created successfully!");
      navigate(`/services/listing/${data.slug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Service Listing</CardTitle>
          <CardDescription>
            Add a new service to offer to your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Professional Website Development"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Service Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what you're offering, deliverables, process..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category_id: e.target.value,
                      subcategory_id: "",
                    });
                  }}
                  className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <select
                  id="subcategory"
                  value={formData.subcategory_id}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory_id: e.target.value })
                  }
                  disabled={!formData.category_id}
                  className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">Select a subcategory</option>
                  {subcategories
                    .filter((sub) => sub.category_id === formData.category_id)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_type">Pricing Type *</Label>
                <select
                  id="price_type"
                  value={formData.price_type}
                  onChange={(e) =>
                    setFormData({ ...formData, price_type: e.target.value })
                  }
                  className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="EGP">EGP ج.م</option>
                  <option value="GBP">GBP £</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_days">Delivery Time (Days) *</Label>
              <Input
                id="delivery_days"
                type="number"
                value={formData.delivery_days}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_days: e.target.value })
                }
                min="1"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked })
                }
              />
              <Label htmlFor="is_featured">Mark as Featured</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating Listing..." : "Create Service Listing"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/services/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
