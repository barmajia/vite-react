import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useFullProfile } from "@/hooks/useFullProfile";
import { supabase } from "@/lib/supabase";
import { ProfileForm } from "../components/ProfileForm";
import { ChangePassword } from "../components/ChangePassword";
import { ProfileHeader } from "../components/ProfileHeader";
import { StatsCards } from "../components/StatsCards";
import { AddressesSection } from "../components/AddressesSection";
import { ProfileSettings } from "../components/ProfileSettings";
import { SellerProfileDetails } from "../components/SellerProfileDetails";
import { CustomerProfileDetails } from "../components/CustomerProfileDetails";
import { DeliveryProfileDetails } from "../components/DeliveryProfileDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Package,
  Heart,
  MapPin,
  MessageSquare,
  Bell,
  Wallet,
  Star,
} from "lucide-react";

interface WalletData {
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const {
    formData,
    updateFormData,
    saveProfile,
    isSaving,
    isEditing,
    setIsEditing,
    changePassword,
    isChangingPassword,
  } = useProfile();

  const { data: fullProfile, isLoading: profileLoading } = useFullProfile();

  useEffect(() => {
    if (fullProfile?.core) {
      loadWalletAndVerification(fullProfile.core.user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullProfile]);

  const loadWalletAndVerification = async (userId: string) => {
    try {
      // Try to load wallet data (table might not exist yet)
      const { data: wallet, error: walletError } = await supabase
        .from("user_wallets")
        .select("balance, pending_balance, total_earned, total_withdrawn")
        .eq("user_id", userId)
        .maybeSingle();

      if (walletError && walletError.code !== "PGRST116") {
        // PGRST116 = not found, ignore this error
        console.warn("Wallet table not available:", walletError.message);
      }
      setWalletData(wallet);

      // Load verification status (for future use)
      const accountType = fullProfile?.core?.account_type;

      if (accountType === "seller" || accountType === "factory") {
        await supabase
          .from("sellers")
          .select("is_verified")
          .eq("user_id", userId)
          .maybeSingle();
      } else if (accountType === "middleman") {
        const { error } = await supabase
          .from("middleman_profiles")
          .select("is_verified")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) {
          console.warn("Middleman profile table not available:", error.message);
        }
      } else if (accountType === "delivery_driver") {
        const { error } = await supabase
          .from("delivery_profiles")
          .select("is_verified")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) {
          console.warn("Delivery profile table not available:", error.message);
        }
      }

      // Verification status loaded but not used in UI yet
    } catch (error) {
      console.warn("Error loading wallet/verification:", error);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleEdit = () => {
    setActiveTab("settings");
    setIsEditing(true);
  };

  if (loading || profileLoading || !fullProfile) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!fullProfile.core) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <p className="text-muted-foreground">Unable to load your profile.</p>
      </div>
    );
  }

  const { core, seller, customer, delivery, addresses, stats } = fullProfile;
  const isOwnProfile = true;

  const renderRoleDetails = () => {
    switch (core.account_type) {
      case "seller":
      case "factory":
        return seller && <SellerProfileDetails data={seller} />;
      case "user":
        return customer && <CustomerProfileDetails data={customer} />;
      case "delivery_driver":
        return delivery && <DeliveryProfileDetails data={delivery} />;
      case "middleman":
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Middleman profile details coming soon...
              </p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Profile details for this account type coming soon...
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <ProfileHeader
          user={core}
          isOwnProfile={isOwnProfile}
          onEdit={handleEdit}
        />

        {walletData && !walletLoading && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-500" />
                <CardTitle>Wallet Balance</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/wallet")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {walletData.balance.toFixed(2)} {core.currency || "EGP"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {walletData.pending_balance.toFixed(2)}{" "}
                    {core.currency || "EGP"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {walletData.total_earned.toFixed(2)}{" "}
                    {core.currency || "EGP"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {walletData.total_withdrawn.toFixed(2)}{" "}
                    {core.currency || "EGP"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats && (
          <StatsCards
            stats={{
              orders: stats.orders,
              notifications: stats.notifications,
              wishlist: {
                count:
                  (stats.wishlist as any).totalItems ||
                  (stats.wishlist as any).count ||
                  0,
              },
              conversations: {
                activeChats:
                  (stats.conversations as any).activeChats ||
                  (stats.conversations as any).total ||
                  0,
                unreadMessages:
                  (stats.conversations as any).unreadMessages ||
                  (stats.conversations as any).unread ||
                  0,
              },
              analytics: stats.analytics,
            }}
            accountType={core.account_type}
          />
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            to="/orders"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <Package className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Orders</p>
              <p className="text-xs text-muted-foreground">
                {stats?.orders.totalOrders || 0} total
              </p>
            </div>
          </Link>
          <Link
            to="/wishlist"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <Heart className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Wishlist</p>
              <p className="text-xs text-muted-foreground">
                {(stats?.wishlist as any)?.totalItems ||
                  (stats?.wishlist as any)?.count ||
                  0}{" "}
                items
              </p>
            </div>
          </Link>
          <Link
            to="/addresses"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Addresses</p>
              <p className="text-xs text-muted-foreground">
                {addresses?.length || 0} saved
              </p>
            </div>
          </Link>
          <Link
            to="/messages"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Messages</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </Link>
          <Link
            to="/notifications"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {stats?.notifications.unread || 0} unread
              </p>
            </div>
          </Link>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Account Type
                    </span>
                    <p className="font-medium capitalize">
                      {core.account_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Member Since
                    </span>
                    <p className="font-medium">
                      {new Date(core.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p className="font-medium">{core.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <p className="font-medium">
                      {core.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {renderRoleDetails()}

            {addresses && addresses.length > 0 && (
              <AddressesSection
                addresses={addresses.slice(0, 2)}
                showViewAll
                editable={false}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                {(core.account_type === "seller" ||
                  core.account_type === "factory") &&
                stats?.analytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Revenue (30d)</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {stats.analytics.totalRevenue?.toFixed(2) || "0.00"}{" "}
                          {core.currency || "EGP"}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Sales (30d)</p>
                        <p className="text-2xl font-bold text-green-700">
                          {stats.analytics.totalSales || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Customers</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {stats.analytics.totalCustomers || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-600">Avg Order</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {stats.analytics.averageOrderValue?.toFixed(2) ||
                            "0.00"}{" "}
                          {core.currency || "EGP"}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => navigate("/seller/analytics")}>
                      View Full Analytics
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Analytics are available for Seller and Factory accounts
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Wallet & Payouts</CardTitle>
                <Button onClick={() => navigate("/wallet/payouts")}>
                  Request Payout
                </Button>
              </CardHeader>
              <CardContent>
                {walletData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">
                          Available Balance
                        </p>
                        <p className="text-3xl font-bold text-green-700">
                          {walletData.balance.toFixed(2)}{" "}
                          {core.currency || "EGP"}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-600">
                          Pending Balance
                        </p>
                        <p className="text-3xl font-bold text-yellow-700">
                          {walletData.pending_balance.toFixed(2)}{" "}
                          {core.currency || "EGP"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/wallet")}
                      >
                        View Transactions
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/wallet/payouts/history")}
                      >
                        Payout History
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Loading wallet data...
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            {addresses && (
              <AddressesSection addresses={addresses} editable={isOwnProfile} />
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-yellow-500">
                      {(stats?.analytics?.averageRating || 0).toFixed(1)}
                    </p>
                    <div className="flex gap-1 justify-center my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (stats?.analytics?.averageRating || 0)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats?.analytics?.totalReviews || 0} reviews
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/reviews")}
                  >
                    View All Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    user={user}
                    formData={formData}
                    updateFormData={updateFormData}
                    onSave={saveProfile}
                    isSaving={isSaving}
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onCancel={() => setIsEditing(false)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChangePassword
                    onChangePassword={changePassword}
                    isChanging={isChangingPassword}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <ProfileSettings userId={core.user_id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
