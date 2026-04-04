// src/pages/admin/AdminSettings.tsx
// Admin Settings - Profile, Security, Notifications, Addresses
// Simplified version without react-hook-form and zod

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Store,
  Bell,
  Shield,
  CreditCard,
  Key,
  Globe,
  Phone,
  MapPin,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  Trash2,
  Plus,
  Check,
} from "lucide-react";

// Types
interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  account_type: string;
  created_at: string;
  updated_at: string;
}

interface SellerProfile {
  user_id: string;
  full_name: string;
  phone?: string;
  location?: string;
  currency: string;
  is_verified: boolean;
}

interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  is_verified: boolean;
}

interface NotificationPreference {
  type: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  label: string;
  description: string;
}

export function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null,
  );
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);

  // Form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });

  const [sellerForm, setSellerForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    currency: "USD",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [addressForm, setAddressForm] = useState({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "EG",
    phone: "",
    is_default: false,
  });

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState<
    NotificationPreference[]
  >([
    {
      type: "order",
      label: "Order Notifications",
      email: true,
      push: true,
      sms: false,
      description: "Order confirmations, shipping updates",
    },
    {
      type: "product",
      label: "Product Notifications",
      email: true,
      push: false,
      sms: false,
      description: "Price drops, restock alerts",
    },
    {
      type: "system",
      label: "System Notifications",
      email: true,
      push: true,
      sms: true,
      description: "Account updates, security alerts",
    },
    {
      type: "promotion",
      label: "Promotion Notifications",
      email: false,
      push: true,
      sms: false,
      description: "Special offers, discounts",
    },
    {
      type: "message",
      label: "Message Notifications",
      email: true,
      push: true,
      sms: false,
      description: "New messages, conversation updates",
    },
  ]);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch public.users profile
      const { data: userProfileData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!userError && userProfileData) {
        setUserProfile(userProfileData);
        setProfileForm({
          full_name: userProfileData.full_name || "",
          phone: userProfileData.phone || "",
          avatar_url: userProfileData.avatar_url || "",
        });
      }

      // Fetch seller profile if account_type is seller
      if (userProfileData?.account_type === "seller") {
        const { data: sellerData, error: sellerError } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!sellerError && sellerData) {
          setSellerProfile(sellerData);
          setSellerForm({
            full_name: sellerData.full_name || "",
            phone: sellerData.phone || "",
            location: sellerData.location || "",
            currency: sellerData.currency || "USD",
          });
        }
      }

      // Fetch shipping addresses
      const { data: addressesData } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (addressesData) {
        setAddresses(addressesData);
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async () => {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (!profileForm.full_name || profileForm.full_name.length < 2) {
        toast.error("Name must be at least 2 characters");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          avatar_url: profileForm.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: profileForm.full_name, phone: profileForm.phone },
      });

      toast.success("Profile updated successfully");
      fetchUserData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Update seller profile
  const updateSellerProfile = async () => {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("sellers")
        .update({
          full_name: sellerForm.full_name,
          phone: sellerForm.phone,
          location: sellerForm.location,
          currency: sellerForm.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Store settings updated");
      fetchUserData();
    } catch (error: any) {
      console.error("Error updating seller profile:", error);
      toast.error("Failed to update: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Update password
  const updatePassword = async () => {
    try {
      setSaving(true);

      if (passwordForm.new_password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        toast.error("Passwords do not match");
        return;
      }

      // Update via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Update notification preferences
  const updateNotificationPrefs = async (
    type: string,
    channel: "email" | "push" | "sms",
    value: boolean,
  ) => {
    setNotificationPrefs((prev) =>
      prev.map((pref) =>
        pref.type === type ? { ...pref, [channel]: value } : pref,
      ),
    );

    // Note: Preferences stored in component state only
    // To persist, create a user_preferences table or add metadata column
    toast.success("Preferences updated");
  };

  // Add shipping address
  const addAddress = async () => {
    try {
      if (
        !addressForm.full_name ||
        !addressForm.address_line1 ||
        !addressForm.city
      ) {
        toast.error("Please fill in required fields");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // If setting as default, unset other defaults first
      if (addressForm.is_default) {
        await supabase
          .from("shipping_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase.from("shipping_addresses").insert({
        user_id: user.id,
        ...addressForm,
        is_verified: false,
      });

      if (error) throw error;

      toast.success("Address added successfully");
      setAddressForm({
        full_name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "EG",
        phone: "",
        is_default: false,
      });
      setAddressDialogOpen(false);
      fetchUserData();
    } catch (error: any) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address: " + error.message);
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all defaults
      await supabase
        .from("shipping_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("shipping_addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Default address updated");
      fetchUserData();
    } catch (error: any) {
      console.error("Error setting default address:", error);
      toast.error("Failed to update: " + error.message);
    }
  };

  // Delete address
  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("shipping_addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;

      toast.success("Address deleted");
      fetchUserData();
    } catch (error: any) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete: " + error.message);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error("Failed to sign out: " + error.message);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchUserData();
    toast.info("Refreshing data...");
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          {userProfile?.account_type === "seller" && (
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        full_name: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={profileForm.avatar_url}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      avatar_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={updateProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Badge variant="secondary">
                  Account Type: {userProfile?.account_type}
                </Badge>
                {sellerProfile?.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    Verified Seller
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {userProfile?.user_id?.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Tab (Sellers Only) */}
        {userProfile?.account_type === "seller" && (
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>
                  Manage your seller profile and store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller_name">Business Name</Label>
                    <Input
                      id="seller_name"
                      value={sellerForm.full_name}
                      onChange={(e) =>
                        setSellerForm({
                          ...sellerForm,
                          full_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller_phone">Business Phone</Label>
                    <Input
                      id="seller_phone"
                      value={sellerForm.phone}
                      onChange={(e) =>
                        setSellerForm({ ...sellerForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={sellerForm.location}
                      onChange={(e) =>
                        setSellerForm({
                          ...sellerForm,
                          location: e.target.value,
                        })
                      }
                      placeholder="Cairo, Egypt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={sellerForm.currency}
                      onValueChange={(value) =>
                        setSellerForm({ ...sellerForm, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EGP">
                          EGP - Egyptian Pound
                        </SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={updateSellerProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Store Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        current_password: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm_password: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={updatePassword} disabled={saving}>
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Security Options */}
          <Card>
            <CardHeader>
              <CardTitle>Security Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your logged-in devices
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationPrefs.map((pref) => (
                  <div
                    key={pref.type}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{pref.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {pref.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.email}
                          onCheckedChange={(checked) =>
                            updateNotificationPrefs(pref.type, "email", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.push}
                          onCheckedChange={(checked) =>
                            updateNotificationPrefs(pref.type, "push", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.sms}
                          onCheckedChange={(checked) =>
                            updateNotificationPrefs(pref.type, "sms", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses" className="space-y-4">
          {/* Add Address Dialog */}
          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Shipping Address</DialogTitle>
                <DialogDescription>
                  Enter your shipping address details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addr_name">Full Name</Label>
                  <Input
                    id="addr_name"
                    value={addressForm.full_name}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        full_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr_line1">Address Line 1</Label>
                  <Input
                    id="addr_line1"
                    value={addressForm.address_line1}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        address_line1: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr_line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addr_line2"
                    value={addressForm.address_line2}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        address_line2: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={addressForm.postal_code}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          postal_code: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={addressForm.country}
                      onValueChange={(value) =>
                        setAddressForm({ ...addressForm, country: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EG">Egypt</SelectItem>
                        <SelectItem value="SA">Saudi Arabia</SelectItem>
                        <SelectItem value="AE">UAE</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr_phone">Phone</Label>
                  <Input
                    id="addr_phone"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_default"
                    checked={addressForm.is_default}
                    onCheckedChange={(checked) =>
                      setAddressForm({ ...addressForm, is_default: checked })
                    }
                  />
                  <Label htmlFor="is_default">Set as default address</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddressDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addAddress}>Add Address</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Addresses List */}
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No shipping addresses added yet
                </CardContent>
              </Card>
            ) : (
              addresses.map((address) => (
                <Card key={address.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{address.full_name}</p>
                          {address.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {address.is_verified && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{address.address_line1}</p>
                        {address.address_line2 && (
                          <p className="text-sm">{address.address_line2}</p>
                        )}
                        <p className="text-sm">
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-sm">{address.country}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!address.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultAddress(address.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteAddress(address.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods for purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payment methods added yet</p>
                <Button variant="outline" className="mt-4" disabled>
                  Add Payment Method (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
