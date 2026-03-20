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

export function CreateServiceListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price_min: "",
    listing_type: "service_package",
    currency: "EGP",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("svc_categories")
        .select("id, name, slug")
        .order("name");

      setCategories(data || []);
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a listing");
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
          provider_id: user.id,
          title: formData.title,
          slug,
          category_id: formData.category_id || null,
          price_min: formData.price_min ? parseFloat(formData.price_min) : null,
          description: formData.description,
          listing_type: formData.listing_type,
          currency: formData.currency,
          status: "active",
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

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
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
              <Label htmlFor="listing_type">Listing Type</Label>
              <select
                id="listing_type"
                value={formData.listing_type}
                onChange={(e) =>
                  setFormData({ ...formData, listing_type: e.target.value })
                }
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="service_package">Service Package</option>
                <option value="appointment">Appointment</option>
                <option value="quote_request">Quote Request</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Minimum Price (Optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price_min}
                onChange={(e) =>
                  setFormData({ ...formData, price_min: e.target.value })
                }
                placeholder="0.00"
              />
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
