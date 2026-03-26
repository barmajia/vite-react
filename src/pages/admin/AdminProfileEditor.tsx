// src/pages/admin/AdminProfileEditor.tsx
// Professional Admin Profile Editor - Manage all user account types

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Edit,
  RefreshCw,
  Ban,
  Trash2,
  Activity,
  ArrowLeft,
  Package,
  ShoppingBag,
  DollarSign,
  Star,
  Building2,
  Handshake,
  Truck,
} from "lucide-react";
import { format } from "date-fns";

interface AdminProfileData {
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    account_type: string;
    created_at: string;
    updated_at: string;
    preferred_language: string;
    preferred_currency: string;
    theme_preference: string;
  };
  seller?: {
    user_id: string;
    location: string | null;
    currency: string;
    is_verified: boolean;
    latitude: number | null;
    longitude: number | null;
    is_factory: boolean;
    wholesale_discount: number | null;
    min_order_quantity: number | null;
    verified_at: string | null;
  };
  factory?: {
    user_id: string;
    company_name: string | null;
    location: string | null;
    is_verified: boolean;
    production_capacity: string | null;
    specialization: string | null;
  };
  middleman?: {
    user_id: string;
    company_name: string | null;
    location: string | null;
    commission_rate: number | null;
    is_verified: boolean;
  };
  delivery?: {
    user_id: string;
    vehicle_type: string | null;
    is_verified: boolean;
    is_active: boolean;
    rating: number;
  };
  stats: {
    total_orders: number;
    total_revenue: number;
    product_count: number;
    review_count: number;
    average_rating: number;
  };
}

export function AdminProfileEditor() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, adminData } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState<Partial<AdminProfileData["user"]>>(
    {},
  );
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!adminLoading && isAdmin && userId) {
      loadProfileData(userId);
    }
  }, [userId, isAdmin, adminLoading]);

  const loadProfileData = async (targetUserId: string) => {
    try {
      setLoading(true);

      // Load core user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", targetUserId)
        .single();

      if (userError || !userData) {
        toast.error("User not found");
        navigate("/admin/users");
        return;
      }

      // Load account-type specific data in parallel
      const [sellerRes, factoryRes, middlemanRes, deliveryRes] =
        await Promise.all([
          userData.account_type === "seller" ||
          userData.account_type === "factory"
            ? supabase
                .from("sellers")
                .select("*")
                .eq("user_id", targetUserId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          userData.account_type === "factory"
            ? supabase
                .from("factories")
                .select("*")
                .eq("user_id", targetUserId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          userData.account_type === "middleman"
            ? supabase
                .from("middleman_profiles")
                .select("*")
                .eq("user_id", targetUserId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          userData.account_type === "delivery_driver"
            ? supabase
                .from("delivery_profiles")
                .select("*")
                .eq("user_id", targetUserId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

      // Load stats
      const stats = await loadUserStats(targetUserId, userData.account_type);

      setProfile({
        user: userData,
        seller: sellerRes.data || undefined,
        factory: factoryRes.data || undefined,
        middleman: middlemanRes.data || undefined,
        delivery: deliveryRes.data || undefined,
        stats,
      });
      setFormData(userData);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userId: string, accountType: string) => {
    try {
      if (accountType === "seller" || accountType === "factory") {
        const { data: kpis } = await supabase.rpc("get_seller_kpis", {
          p_seller_id: userId,
          p_period: "all",
        });

        const productCount = await getProductCount(userId);

        return {
          total_orders: kpis?.kpis?.total_sales || 0,
          total_revenue: kpis?.kpis?.total_revenue || 0,
          product_count: productCount,
          review_count: 0,
          average_rating: 0,
        };
      }
      return {
        total_orders: 0,
        total_revenue: 0,
        product_count: 0,
        review_count: 0,
        average_rating: 0,
      };
    } catch {
      return {
        total_orders: 0,
        total_revenue: 0,
        product_count: 0,
        review_count: 0,
        average_rating: 0,
      };
    }
  };

  const getProductCount = async (sellerId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .eq("is_deleted", false);
      return count || 0;
    } catch {
      return 0;
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          preferred_language: formData.preferred_language,
          preferred_currency: formData.preferred_currency,
          theme_preference: formData.theme_preference,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user.user_id);

      if (userError) throw userError;

      // Update account-type specific table
      if (
        profile.seller &&
        (profile.user.account_type === "seller" ||
          profile.user.account_type === "factory")
      ) {
        const { error: sellerError } = await supabase
          .from("sellers")
          .update({
            location: profile.seller.location,
            currency: profile.seller.currency,
            latitude: profile.seller.latitude,
            longitude: profile.seller.longitude,
            wholesale_discount: profile.seller.wholesale_discount,
            min_order_quantity: profile.seller.min_order_quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.user.user_id);

        if (sellerError) throw sellerError;
      }

      toast.success("Profile updated successfully");
      setEditMode(false);
      loadProfileData(profile.user.user_id);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationToggle = async (newStatus: boolean) => {
    if (!profile) return;

    try {
      const tableName =
        profile.user.account_type === "seller" ||
        profile.user.account_type === "factory"
          ? "sellers"
          : profile.user.account_type === "middleman"
            ? "middleman_profiles"
            : profile.user.account_type === "delivery_driver"
              ? "delivery_profiles"
              : null;

      if (!tableName) {
        toast.error("Cannot verify this account type");
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .update({
          is_verified: newStatus,
          verified_at: newStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user.user_id);

      if (error) throw error;

      toast.success(newStatus ? "Account verified!" : "Verification removed");
      loadProfileData(profile.user.user_id);
    } catch (error: any) {
      toast.error(error.message || "Failed to update verification");
    }
  };

  const handleSuspendAccount = async () => {
    if (!profile) return;

    try {
      // Log suspension in admin_logs if table exists
      await supabase
        .from("admin_logs")
        .insert({
          action: "suspend_user",
          target_user_id: profile.user.user_id,
          admin_user_id: adminData?.user_id,
          details: { reason: suspendReason },
        })
        .catch(() => {}); // Ignore if table doesn't exist

      toast.success("Account suspended");
      setShowSuspendDialog(false);
      setSuspendReason("");
      loadProfileData(profile.user.user_id);
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend account");
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    try {
      // Soft delete - mark as deleted
      const { error } = await supabase
        .from("users")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user.user_id);

      if (error) throw error;

      toast.success("Account deleted");
      setShowDeleteDialog(false);
      navigate("/admin/users");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      seller: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      factory:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      middleman:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      delivery_driver:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      customer: "bg-gray-100 text-gray-800",
      user: "bg-gray-100 text-gray-800",
      admin: "bg-red-100 text-red-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getAccountTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      seller: ShoppingBag,
      factory: Building2,
      middleman: Handshake,
      delivery_driver: Truck,
      customer: User,
      user: User,
      admin: Shield,
    };
    return icons[type] || User;
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !profile) {
    return null;
  }

  const isVerified =
    profile.seller?.is_verified ||
    profile.factory?.is_verified ||
    profile.middleman?.is_verified ||
    profile.delivery?.is_verified;
  const AccountIcon = getAccountTypeIcon(profile.user.account_type);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/users")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Admin Profile Editor
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage user account and settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {adminData?.role || "Admin"}
              </Badge>
              {editMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    name={profile.user.full_name}
                    src={profile.user.avatar_url}
                    size="xl"
                    className="h-24 w-24 mb-4"
                  />

                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile.user.full_name || "Unnamed User"}
                  </h2>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      className={getAccountTypeColor(profile.user.account_type)}
                    >
                      <AccountIcon className="h-3 w-3 mr-1" />
                      {profile.user.account_type.replace("_", " ")}
                    </Badge>
                    {isVerified ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Member since{" "}
                    {format(new Date(profile.user.created_at), "MMM d, yyyy")}
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 w-full mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Orders
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {profile.stats.total_orders}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Revenue
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {profile.stats.total_revenue.toFixed(0)} EGP
                      </p>
                    </div>
                  </div>

                  {/* Verification Toggle */}
                  {editMode &&
                    (profile.seller ||
                      profile.factory ||
                      profile.middleman ||
                      profile.delivery) && (
                      <div className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Account Verification
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              Approve or revoke verification
                            </p>
                          </div>
                          <Switch
                            checked={isVerified}
                            onCheckedChange={handleVerificationToggle}
                          />
                        </div>
                      </div>
                    )}

                  {/* Admin Actions */}
                  <div className="w-full space-y-2">
                    <Dialog
                      open={showSuspendDialog}
                      onOpenChange={setShowSuspendDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-yellow-700 dark:text-yellow-500"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Suspend Account</DialogTitle>
                          <DialogDescription>
                            This will prevent the user from accessing their
                            account. Provide a reason:
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Reason for suspension..."
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          className="mt-2"
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowSuspendDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleSuspendAccount}
                            disabled={!suspendReason.trim()}
                          >
                            Suspend Account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={showDeleteDialog}
                      onOpenChange={setShowDeleteDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-red-700 dark:text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-red-600">
                            Delete Account
                          </DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. All user data will be
                            permanently removed. Type "DELETE" to confirm:
                          </DialogDescription>
                        </DialogHeader>
                        <Input
                          placeholder="Type DELETE to confirm"
                          className="mt-2"
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                          >
                            Delete Permanently
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    {editMode ? (
                      <Input
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {profile.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    {editMode ? (
                      <Input
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {profile.user.phone || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {(profile.seller?.location || profile.factory?.location) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      {editMode ? (
                        <Input
                          value={
                            profile.seller?.location ||
                            profile.factory?.location ||
                            ""
                          }
                          onChange={(e) => {
                            if (profile.seller) {
                              setProfile({
                                ...profile,
                                seller: {
                                  ...profile.seller,
                                  location: e.target.value,
                                },
                              });
                            }
                            if (profile.factory) {
                              setProfile({
                                ...profile,
                                factory: {
                                  ...profile.factory,
                                  location: e.target.value,
                                },
                              });
                            }
                          }}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {profile.seller?.location ||
                            profile.factory?.location}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Account Details</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Overview</CardTitle>
                    <CardDescription>
                      Key metrics and account status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={ShoppingBag}
                        label="Total Orders"
                        value={profile.stats.total_orders.toString()}
                      />
                      <StatCard
                        icon={DollarSign}
                        label="Total Revenue"
                        value={`${profile.stats.total_revenue.toFixed(0)} EGP`}
                      />
                      <StatCard
                        icon={Package}
                        label="Products"
                        value={profile.stats.product_count.toString()}
                      />
                      <StatCard
                        icon={Star}
                        label="Avg. Rating"
                        value={profile.stats.average_rating.toFixed(1)}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Account Status</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <StatusItem
                          label="Email Verified"
                          value="Yes"
                          status="success"
                        />
                        <StatusItem
                          label="Phone Verified"
                          value={profile.user.phone ? "Yes" : "No"}
                          status={profile.user.phone ? "success" : "warning"}
                        />
                        <StatusItem
                          label="Account Verified"
                          value={isVerified ? "Yes" : "No"}
                          status={isVerified ? "success" : "warning"}
                        />
                        <StatusItem
                          label="Account Active"
                          value="Yes"
                          status="success"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>
                      {editMode
                        ? "Click on fields to edit"
                        : "View account information"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditableField
                          label="Full Name"
                          value={formData.full_name || ""}
                          editMode={editMode}
                          onChange={(value) =>
                            setFormData({ ...formData, full_name: value })
                          }
                        />
                        <EditableField
                          label="Display Name"
                          value={formData.full_name || ""}
                          editMode={editMode}
                          onChange={(value) =>
                            setFormData({ ...formData, full_name: value })
                          }
                        />
                      </div>
                    </div>

                    {/* Seller/Factory Fields */}
                    {(profile.seller || profile.factory) && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Business Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <EditableField
                            label="Currency"
                            value={profile.seller?.currency || "EGP"}
                            editMode={editMode}
                            type="select"
                            options={["EGP", "USD", "EUR", "SAR"]}
                            onChange={(value) => {
                              if (profile.seller) {
                                setProfile({
                                  ...profile,
                                  seller: {
                                    ...profile.seller,
                                    currency: value,
                                  },
                                });
                              }
                            }}
                          />
                          <EditableField
                            label="Wholesale Discount (%)"
                            value={
                              profile.seller?.wholesale_discount?.toString() ||
                              "0"
                            }
                            editMode={editMode}
                            type="number"
                            onChange={(value) => {
                              if (profile.seller) {
                                setProfile({
                                  ...profile,
                                  seller: {
                                    ...profile.seller,
                                    wholesale_discount: parseFloat(value),
                                  },
                                });
                              }
                            }}
                          />
                          <EditableField
                            label="Min Order Quantity"
                            value={
                              profile.seller?.min_order_quantity?.toString() ||
                              "1"
                            }
                            editMode={editMode}
                            type="number"
                            onChange={(value) => {
                              if (profile.seller) {
                                setProfile({
                                  ...profile,
                                  seller: {
                                    ...profile.seller,
                                    min_order_quantity: parseInt(value),
                                  },
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Middleman Fields */}
                    {profile.middleman && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Middleman Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <EditableField
                            label="Company Name"
                            value={profile.middleman.company_name || ""}
                            editMode={editMode}
                            onChange={(value) => {
                              setProfile({
                                ...profile,
                                middleman: {
                                  ...profile.middleman!,
                                  company_name: value,
                                },
                              });
                            }}
                          />
                          <EditableField
                            label="Commission Rate (%)"
                            value={
                              profile.middleman.commission_rate?.toString() ||
                              "5"
                            }
                            editMode={editMode}
                            type="number"
                            onChange={(value) => {
                              setProfile({
                                ...profile,
                                middleman: {
                                  ...profile.middleman!,
                                  commission_rate: parseFloat(value),
                                },
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Preferences</CardTitle>
                    <CardDescription>
                      Manage user settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Preferred Language</Label>
                        <Select
                          value={formData.preferred_language || "en"}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              preferred_language: value,
                            })
                          }
                          disabled={!editMode}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Preferred Currency</Label>
                        <Select
                          value={formData.preferred_currency || "EGP"}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              preferred_currency: value,
                            })
                          }
                          disabled={!editMode}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Theme Preference</Label>
                        <Select
                          value={formData.theme_preference || "system"}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              theme_preference: value,
                            })
                          }
                          disabled={!editMode}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">
                              System Default
                            </SelectItem>
                            <SelectItem value="light">Light Mode</SelectItem>
                            <SelectItem value="dark">Dark Mode</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Admin Controls */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-red-600 dark:text-red-500">
                        Admin Controls
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Reset Password</span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!editMode}
                            >
                              Send Reset Email
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Send password reset to user's email
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Activity</CardTitle>
                    <CardDescription>
                      Recent actions and login history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              User logged in
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(
                                new Date(Date.now() - i * 3600000),
                                "MMM d, yyyy h:mm a",
                              )}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              IP: 192.168.1.{i} • Chrome on Windows
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function StatusItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "success" | "warning" | "error";
}) {
  const colors = {
    success:
      "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    warning:
      "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
    error: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={`text-sm font-medium px-2 py-1 rounded ${colors[status]}`}
      >
        {value}
      </span>
    </div>
  );
}

function EditableField({
  label,
  value,
  editMode,
  onChange,
  type = "text",
  options = [],
}: {
  label: string;
  value: string;
  editMode: boolean;
  onChange: (value: string) => void;
  type?: "text" | "number" | "select";
  options?: string[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      {editMode ? (
        type === "select" ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
          />
        )
      ) : (
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
