import { useState } from "react";
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

export function CreateProviderProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: "",
    provider_type: "individual",
    tagline: "",
    description: "",
    location_city: "",
    location_country: "",
    phone: "",
    email: user?.email || "",
    website: "",
    specialties: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const specialtiesArray = formData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { data, error } = await supabase
        .from("svc_providers")
        .insert({
          user_id: user.id,
          provider_name: formData.provider_name,
          provider_type: formData.provider_type as
            | "individual"
            | "company"
            | "hospital",
          tagline: formData.tagline,
          description: formData.description,
          location_city: formData.location_city,
          location_country: formData.location_country,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          specialties: specialtiesArray,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Provider profile created successfully!");
      navigate(`/services/provider/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Provider Profile</CardTitle>
          <CardDescription>
            Set up your professional profile to start offering services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider_name">Business/Provider Name *</Label>
              <Input
                id="provider_name"
                value={formData.provider_name}
                onChange={(e) =>
                  setFormData({ ...formData, provider_name: e.target.value })
                }
                placeholder="e.g., John Doe Consulting, Tech Solutions Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_type">Provider Type *</Label>
              <select
                id="provider_type"
                value={formData.provider_type}
                onChange={(e) =>
                  setFormData({ ...formData, provider_type: e.target.value })
                }
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="individual">Individual/Freelancer</option>
                <option value="company">Company/Agency</option>
                <option value="hospital">Hospital/Clinic</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) =>
                  setFormData({ ...formData, tagline: e.target.value })
                }
                placeholder="A short, catchy description of your services"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your services, expertise, and what makes you unique..."
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_city">City</Label>
                <Input
                  id="location_city"
                  value={formData.location_city}
                  onChange={(e) =>
                    setFormData({ ...formData, location_city: e.target.value })
                  }
                  placeholder="e.g., Cairo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_country">Country</Label>
                <Input
                  id="location_country"
                  value={formData.location_country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_country: e.target.value,
                    })
                  }
                  placeholder="e.g., Egypt"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+20 1XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Skills/Specialties</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) =>
                  setFormData({ ...formData, specialties: e.target.value })
                }
                placeholder="e.g., Web Development, React, Node.js (comma separated)"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple skills with commas
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating Profile..." : "Create Profile & Continue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/services")}
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
