// src/pages/profile/EditProfile.tsx
// Edit Profile Page - Users can edit their own public profile

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Camera,
  User,
  Briefcase,
  MapPin,
  Settings,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ProfileData {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: string;
  preferred_language: string;
  preferred_currency: string;
  theme_preference: string;
  // Seller/Factory specific
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  currency?: string;
  is_factory?: boolean;
  wholesale_discount?: number | null;
  min_order_quantity?: number | null;
  store_name?: string | null;
  // Middleman specific
  company_name?: string | null;
  commission_rate?: number | null;
  // Delivery specific
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  // Freelancer specific
  display_name?: string | null;
  tagline?: string | null;
  biography?: string | null;
  hourly_rate?: number | null;
  skills?: string[];
  // Doctor specific
  specialization?: string | null;
  license_number?: string | null;
  consultation_fee?: number | null;
  // Pharmacy specific
  pharmacy_name?: string | null;
  license_document_url?: string | null;
}

export function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load core user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (userError) throw userError;

      // Load account-type specific data
      let accountData: any = {};

      if (
        userData.account_type === "seller" ||
        userData.account_type === "factory"
      ) {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        accountData = sellerData || {};
      } else if (userData.account_type === "middleman") {
        const { data: middlemanData } = await supabase
          .from("middleman_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        accountData = middlemanData || {};
      } else if (userData.account_type === "delivery_driver") {
        const { data: deliveryData } = await supabase
          .from("delivery_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        accountData = deliveryData || {};
      }

      setProfile({
        ...userData,
        ...accountData,
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-avatars").getPublicUrl(fileName);

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      toast.success("Avatar uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          preferred_language: profile.preferred_language,
          preferred_currency: profile.preferred_currency,
          theme_preference: profile.theme_preference,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (userError) throw userError;

      // Update account-type specific table
      if (
        profile.account_type === "seller" ||
        profile.account_type === "factory"
      ) {
        const { error: sellerError } = await supabase
          .from("sellers")
          .update({
            location: profile.location,
            latitude: profile.latitude,
            longitude: profile.longitude,
            currency: profile.currency,
            wholesale_discount: profile.wholesale_discount,
            min_order_quantity: profile.min_order_quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (sellerError) throw sellerError;
      } else if (profile.account_type === "middleman") {
        const { error: middlemanError } = await supabase
          .from("middleman_profiles")
          .update({
            company_name: profile.company_name,
            location: profile.location,
            latitude: profile.latitude,
            longitude: profile.longitude,
            currency: profile.currency,
            commission_rate: profile.commission_rate,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (middlemanError) throw middlemanError;
      } else if (profile.account_type === "delivery_driver") {
        const { error: deliveryError } = await supabase
          .from("delivery_profiles")
          .update({
            vehicle_type: profile.vehicle_type,
            vehicle_number: profile.vehicle_number,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (deliveryError) throw deliveryError;
      }

      toast.success("Profile updated successfully!");
      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: string, value: any) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile not found
          </h2>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const canAccessBusinessTab = ["seller", "factory", "middleman"].includes(
    profile.account_type,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pt-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/profile/${user?.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update your public profile information
            </p>
          </div>
        </div>

        {/* Avatar Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  name={profile.full_name}
                  src={profile.avatar_url}
                  size="xl"
                  className="h-24 w-24"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Profile Picture
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
                {uploading && (
                  <p className="text-sm text-blue-600">Uploading...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="basic">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="business" disabled={!canAccessBusinessTab}>
              <Briefcase className="h-4 w-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="location">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update your personal information that will be visible publicly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ""}
                      onChange={(e) =>
                        updateProfile("full_name", e.target.value)
                      }
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ""}
                      onChange={(e) => updateProfile("phone", e.target.value)}
                      placeholder="+20 123 456 7890"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Info Tab */}
          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Details about your business or professional services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(profile.account_type === "seller" ||
                  profile.account_type === "factory") && (
                  <>
                    <div>
                      <Label htmlFor="store_name">Store/Company Name</Label>
                      <Input
                        id="store_name"
                        value={profile.store_name || ""}
                        onChange={(e) =>
                          updateProfile("store_name", e.target.value)
                        }
                        placeholder="Your store name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="wholesale_discount">
                          Wholesale Discount (%)
                        </Label>
                        <Input
                          id="wholesale_discount"
                          type="number"
                          value={profile.wholesale_discount || 0}
                          onChange={(e) =>
                            updateProfile(
                              "wholesale_discount",
                              parseFloat(e.target.value),
                            )
                          }
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="min_order_quantity">
                          Min Order Quantity
                        </Label>
                        <Input
                          id="min_order_quantity"
                          type="number"
                          value={profile.min_order_quantity || 1}
                          onChange={(e) =>
                            updateProfile(
                              "min_order_quantity",
                              parseInt(e.target.value),
                            )
                          }
                          min="1"
                        />
                      </div>
                    </div>

                    {profile.account_type === "factory" && (
                      <div>
                        <Label>Factory Status</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={profile.is_factory ? "default" : "outline"}
                          >
                            {profile.is_factory
                              ? "✓ Verified Factory"
                              : "Regular Seller"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {profile.account_type === "middleman" && (
                  <>
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={profile.company_name || ""}
                        onChange={(e) =>
                          updateProfile("company_name", e.target.value)
                        }
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="commission_rate">
                        Commission Rate (%)
                      </Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        value={profile.commission_rate || 5}
                        onChange={(e) =>
                          updateProfile(
                            "commission_rate",
                            parseFloat(e.target.value),
                          )
                        }
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Settings</CardTitle>
                <CardDescription>
                  Where your business is located (visible on public profile)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Location/City</Label>
                  <Input
                    id="location"
                    value={profile.location || ""}
                    onChange={(e) => updateProfile("location", e.target.value)}
                    placeholder="Cairo, Egypt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      value={profile.latitude || ""}
                      onChange={(e) =>
                        updateProfile("latitude", parseFloat(e.target.value))
                      }
                      placeholder="30.0444"
                      step="0.000001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      value={profile.longitude || ""}
                      onChange={(e) =>
                        updateProfile("longitude", parseFloat(e.target.value))
                      }
                      placeholder="31.2357"
                      step="0.000001"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Add coordinates to appear in
                    location-based searches. You can get coordinates from Google
                    Maps.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Language, currency, and theme settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Select
                    value={profile.preferred_language || "en"}
                    onValueChange={(value) =>
                      updateProfile("preferred_language", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic (العربية)</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferred_currency">Preferred Currency</Label>
                  <Select
                    value={profile.preferred_currency || "EGP"}
                    onValueChange={(value) =>
                      updateProfile("preferred_currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="theme_preference">Theme Preference</Label>
                  <Select
                    value={profile.theme_preference || "system"}
                    onValueChange={(value) =>
                      updateProfile("theme_preference", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/profile/${user?.id}`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
