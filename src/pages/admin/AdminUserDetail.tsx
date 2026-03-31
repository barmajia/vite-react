// src/pages/admin/AdminUserDetail.tsx
// Admin User Detail Page - View detailed user information

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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  Shield,
  Loader2,
  User,
  Briefcase,
} from "lucide-react";

interface UserDetail {
  user: any;
  seller?: any;
  factory?: any;
  middleman?: any;
  delivery?: any;
  stats: {
    product_count: number;
    total_orders: number;
    total_revenue: number;
    average_rating: number;
    review_count: number;
  };
}

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!adminLoading && isAdmin && userId) {
      loadUserDetail();
    }
  }, [isAdmin, adminLoading, userId]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);

      // Load core user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (userError || !userData) {
        toast.error("User not found");
        navigate("/admin/users");
        return;
      }

      // Load account-type specific data
      let sellerData = null;
      let middlemanData = null;
      let deliveryData = null;

      if (
        userData.account_type === "seller" ||
        userData.account_type === "factory"
      ) {
        const { data } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        sellerData = data;
      } else if (userData.account_type === "middleman") {
        const { data } = await supabase
          .from("middleman_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        middlemanData = data;
      } else if (userData.account_type === "delivery_driver") {
        const { data } = await supabase
          .from("delivery_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        deliveryData = data;
      }

      // Load stats
      const stats = await loadUserStats(
        userId,
        userData.account_type,
        sellerData,
      );

      setUser({
        user: userData,
        seller: sellerData || undefined,
        middleman: middlemanData || undefined,
        delivery: deliveryData || undefined,
        stats,
      });
    } catch (error: any) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (
    userId: string,
    accountType: string,
    sellerData: any,
  ) => {
    try {
      if (accountType === "seller" || accountType === "factory") {
        const [productsRes, ordersRes] = await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("seller_id", userId)
            .eq("is_deleted", false),
          supabase
            .from("orders")
            .select("total", { count: "exact", head: true })
            .eq("seller_id", userId)
            .eq("payment_status", "completed"),
        ]);

        const totalRevenue = sellerData?.currency
          ? new Intl.NumberFormat("en-EG", {
              style: "currency",
              currency: sellerData.currency,
            }).format(0)
          : "0 EGP";

        return {
          product_count: productsRes.count || 0,
          total_orders: ordersRes.count || 0,
          total_revenue: 0,
          total_revenue_formatted: totalRevenue,
          average_rating: 0,
          review_count: 0,
        };
      }
      return {
        product_count: 0,
        total_orders: 0,
        total_revenue: 0,
        total_revenue_formatted: "0 EGP",
        average_rating: 0,
        review_count: 0,
      };
    } catch {
      return {
        product_count: 0,
        total_orders: 0,
        total_revenue: 0,
        total_revenue_formatted: "0 EGP",
        average_rating: 0,
        review_count: 0,
      };
    }
  };

  const handleVerify = async () => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("User verified successfully");
      loadUserDetail();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify user");
    }
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Admin Access Required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">User not found</p>
          <Button onClick={() => navigate("/admin/users")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const isVerified =
    user.seller?.is_verified ||
    user.middleman?.is_verified ||
    user.delivery?.is_verified;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">User Details</h1>
          <p className="text-muted-foreground">
            Manage user account and settings
          </p>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar
              name={user.user.full_name}
              src={user.user.avatar_url}
              size="xl"
              className="h-24 w-24"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {user.user.full_name || "Unnamed User"}
                </h2>
                <Badge
                  className={
                    user.user.account_type === "seller"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-muted"
                  }
                >
                  {user.user.account_type.replace("_", " ")}
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
                    <span className="text-xs">⏳ Pending</span>
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.user.email}
                </div>
                {user.user.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {user.user.phone}
                  </div>
                )}
                {(user.seller?.location || user.middleman?.location) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.seller?.location || user.middleman?.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/users/${userId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {user.seller && !user.seller.is_verified && (
                <Button
                  onClick={handleVerify}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              )}
              <Button variant="outline" className="text-yellow-700">
                <Ban className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{user.stats.product_count}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{user.stats.total_orders}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">
              {user.stats.total_revenue_formatted || "0 EGP"}
            </p>
            <p className="text-sm text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">
              {user.stats.average_rating.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Basic user account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {user.user.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-medium capitalize">
                    {user.user.account_type.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">
                    {user.seller?.currency ||
                      user.user.preferred_currency ||
                      "EGP"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification</p>
                  <p className="font-medium">
                    {isVerified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-yellow-600">⏳ Pending</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {user.seller?.location ||
                      user.middleman?.location ||
                      "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Language</p>
                  <p className="font-medium">
                    {user.user.preferred_language || "English"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Theme</p>
                  <p className="font-medium capitalize">
                    {user.user.theme_preference || "system"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          {user.seller && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">
                      {user.seller.currency || "EGP"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Wholesale Discount
                    </p>
                    <p className="font-medium">
                      {user.seller.wholesale_discount || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Min Order Quantity
                    </p>
                    <p className="font-medium">
                      {user.seller.min_order_quantity || 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Factory Status
                    </p>
                    <p className="font-medium">
                      {user.seller.is_factory
                        ? "✓ Verified Factory"
                        : "Regular Seller"}
                    </p>
                  </div>
                  {user.seller.verified_at && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Verified At
                      </p>
                      <p className="font-medium">
                        {new Date(user.seller.verified_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {user.middleman && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Middleman Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Company Name
                    </p>
                    <p className="font-medium">
                      {user.middleman.company_name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Commission Rate
                    </p>
                    <p className="font-medium">
                      {user.middleman.commission_rate || 5}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {user.middleman.location || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Verification
                    </p>
                    <p className="font-medium">
                      {user.middleman.is_verified ? "✓ Verified" : "⏳ Pending"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!user.seller && !user.middleman && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No business information available for this account type</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Manage user account settings and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Verify Account</p>
                  <p className="text-sm text-muted-foreground">
                    Mark this user as verified
                  </p>
                </div>
                {!isVerified && user.seller && (
                  <Button onClick={handleVerify} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Reset Password</p>
                  <p className="text-sm text-muted-foreground">
                    Send password reset email to user
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Send Reset
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Suspend Account</p>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable user access
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-yellow-700">
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
