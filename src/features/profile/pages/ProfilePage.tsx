import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TypeScript Interfaces aligned with Supabase schema
// ─────────────────────────────────────────────────────────────

export type AccountType =
  | "user"
  | "customer"
  | "seller"
  | "factory"
  | "middleman"
  | "delivery_driver"
  | "freelancer"
  | "doctor"
  | "pharmacy"
  | "admin"
  | "support";

export interface CoreUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  preferred_language: string;
  preferred_currency: string;
  theme_preference: "light" | "dark" | "system";
  sidebar_state: { collapsed: boolean };
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  user_id: string;
  email: string;
  full_name: string;
  firstname: string | null;
  second_name: string | null;
  thirdname: string | null;
  fourth_name: string | null;
  phone: string | null;
  location: string | null;
  currency: string;
  account_type: AccountType;
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  is_factory: boolean;
  factory_license_url: string | null;
  min_order_quantity: number;
  wholesale_discount: number;
  accepts_returns: boolean;
  production_capacity: string | null;
  verified_at: string | null;
  allow_product_chats: boolean;
  allow_custom_requests: boolean;
  avatar_url: string | null;
  bio: string | null;
  response_rate: number;
  created_at: string;
  updated_at: string;
}

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_earned: number;
  total_spent: number;
  currency: string;
  is_active: boolean;
  is_locked: boolean;
  lock_reason: string | null;
  locked_at: string | null;
  last_transaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  total_revenue: number;
  total_sales: number;
  total_items_sold: number;
  total_customers: number;
  unique_customers_in_period: number;
  average_order_value: number;
  conversion_rate: number;
  average_rating?: number;
  total_reviews?: number;
}

export interface ProfileStats {
  orders: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
  notifications: {
    unread: number;
    total: number;
  };
  wishlist: {
    count: number;
  };
  conversations: {
    activeChats: number;
    unreadMessages: number;
  };
  analytics?: AnalyticsData;
}

export interface FullProfileData {
  core: CoreUser | null;
  seller: SellerProfile | null;
  customer: any | null;
  delivery: any | null;
  addresses: Address[];
  stats: ProfileStats | null;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

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

  // Load wallet data when profile is ready
  useEffect(() => {
    if (fullProfile?.core?.user_id) {
      loadWalletData(fullProfile.core.user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullProfile?.core?.user_id]);

  const loadWalletData = useCallback(async (userId: string) => {
    try {
      setWalletLoading(true);
      setWalletError(null);

      const { data: wallet, error } = await supabase
        .from("user_wallets")
        .select(
          "id, user_id, balance, pending_balance, total_deposited, total_withdrawn, total_earned, total_spent, currency, is_active, is_locked, lock_reason, locked_at, last_transaction_at, created_at, updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // PGRST116 = row not found (wallet doesn't exist yet)
        if (error.code === "PGRST116") {
          // Wallet will be auto-created on first transaction via trigger
          setWalletData(null);
        } else {
          console.warn("Wallet fetch error:", error);
          setWalletError("Unable to load wallet data");
        }
      } else {
        setWalletData(wallet);
      }
    } catch (err) {
      console.error("Unexpected wallet error:", err);
      setWalletError("Failed to load wallet");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const handleEdit = () => {
    setActiveTab("settings");
    setIsEditing(true);
  };

  const handlePayoutRequest = () => {
    navigate("/wallet/payouts");
  };

  const handleViewTransactions = () => {
    navigate("/wallet/transactions");
  };

  // Loading states
  if (authLoading || profileLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!fullProfile?.core) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-4">
          Unable to load your profile data. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  const { core, seller, customer, delivery, addresses, stats } = fullProfile;
  const isOwnProfile = true;
  const currency = core.preferred_currency || "EGP";

  // ─────────────────────────────────────────────────────────────
  // Role-specific detail renderer
  // ─────────────────────────────────────────────────────────────
  const renderRoleDetails = () => {
    switch (core.account_type) {
      case "seller":
      case "factory":
        return seller ? (
          <SellerProfileDetails data={seller} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Seller profile details loading...
              </p>
            </CardContent>
          </Card>
        );

      case "user":
      case "customer":
        return customer ? (
          <CustomerProfileDetails data={customer} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Customer profile details coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case "delivery_driver":
        return delivery ? (
          <DeliveryProfileDetails data={delivery} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Delivery profile details coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case "middleman":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Middleman Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Active Deals</p>
                  <p className="text-2xl font-bold text-blue-700">0</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-700">
                    {walletData?.total_earned.toFixed(2) || "0.00"} {currency}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/middleman/deals")}
                className="w-full"
              >
                Manage Deals
              </Button>
            </CardContent>
          </Card>
        );

      case "freelancer":
      case "doctor":
      case "pharmacy":
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                {core.account_type.charAt(0).toUpperCase() +
                  core.account_type.slice(1)}{" "}
                profile management
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(`/${core.account_type}/dashboard`)}
              >
                Go to Dashboard
              </Button>
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

  // ─────────────────────────────────────────────────────────────
  // Wallet Card Component
  // ─────────────────────────────────────────────────────────────
  const WalletCard = () => {
    if (walletLoading) {
      return (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading wallet...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (walletError) {
      return (
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{walletError}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!walletData) {
      return (
        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gray-400" />
                <span className="text-muted-foreground">No wallet yet</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/wallet/setup")}
              >
                Set Up Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
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
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {walletData.balance.toFixed(2)} {walletData.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {walletData.pending_balance.toFixed(2)} {walletData.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold text-blue-600">
                {walletData.total_earned.toFixed(2)} {walletData.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-gray-600">
                {walletData.total_spent.toFixed(2)} {walletData.currency}
              </p>
            </div>
          </div>
          {walletData.is_locked && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Wallet is locked:{" "}
                {walletData.lock_reason || "Contact support"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Analytics Tab Content
  // ─────────────────────────────────────────────────────────────
  const AnalyticsTab = () => {
    const isSellerOrFactory =
      core.account_type === "seller" || core.account_type === "factory";
    const analytics = stats?.analytics;

    if (!isSellerOrFactory) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Analytics dashboard is available for Seller and Factory accounts
            </p>
            {(core.account_type === "user" ||
              core.account_type === "customer") && (
              <Button
                variant="outline"
                onClick={() => navigate("/become-seller")}
              >
                Become a Seller
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Analytics Dashboard</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("overview")}
            >
              Last 30 days
            </Button>
            <Button size="sm" onClick={() => navigate("/seller/analytics")}>
              Full Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {analytics ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">
                    Revenue (30d)
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {analytics.total_revenue?.toFixed(2) || "0.00"} {currency}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-green-600 font-medium">
                    Sales (30d)
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {analytics.total_sales || 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium">
                    Customers
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {analytics.total_customers || 0}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-sm text-yellow-600 font-medium">
                    Avg Order
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {analytics.average_order_value?.toFixed(2) || "0.00"}{" "}
                    {currency}
                  </p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Items Sold</p>
                  <p className="font-semibold">
                    {analytics.total_items_sold || 0}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Unique Customers
                  </p>
                  <p className="font-semibold">
                    {analytics.unique_customers_in_period || 0}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Conversion Rate
                  </p>
                  <p className="font-semibold">
                    {analytics.conversion_rate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>

              {/* Rating (if available) */}
              {analytics.average_rating !== undefined && (
                <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (analytics.average_rating || 0)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium">
                    {analytics.average_rating.toFixed(1)} (
                    {analytics.total_reviews || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Wallet Tab Content
  // ─────────────────────────────────────────────────────────────
  const WalletTab = () => {
    if (walletLoading) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading wallet data...</p>
          </CardContent>
        </Card>
      );
    }

    if (!walletData) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Wallet not initialized. Complete your first transaction to
              activate.
            </p>
            <Button onClick={() => navigate("/marketplace")}>
              Start Selling
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Wallet & Payouts</CardTitle>
          <Button
            onClick={handlePayoutRequest}
            disabled={!walletData.is_active || walletData.is_locked}
          >
            Request Payout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">
                  Available Balance
                </p>
                <p className="text-3xl font-bold text-green-700">
                  {walletData.balance.toFixed(2)} {walletData.currency}
                </p>
                {!walletData.is_active && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Wallet pending activation
                  </p>
                )}
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-600 font-medium">
                  Pending Balance
                </p>
                <p className="text-3xl font-bold text-yellow-700">
                  {walletData.pending_balance.toFixed(2)} {walletData.currency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Released after order completion
                </p>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Total Deposited</p>
                <p className="font-semibold">
                  {walletData.total_deposited.toFixed(2)} {walletData.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <p className="font-semibold">
                  {walletData.total_withdrawn.toFixed(2)} {walletData.currency}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleViewTransactions}>
                View Transactions
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/wallet/payout-history")}
              >
                Payout History
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/wallet/settings")}
              >
                Wallet Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          user={core}
          isOwnProfile={isOwnProfile}
          onEdit={handleEdit}
        />

        {/* Wallet Summary Card */}
        <WalletCard />

        {/* Stats Cards */}
        {stats && (
          <StatsCards
            stats={{
              orders: stats.orders,
              notifications: stats.notifications,
              wishlist: {
                count:
                  (stats.wishlist as any)?.totalItems ||
                  (stats.wishlist as any)?.count ||
                  0,
              },
              conversations: {
                activeChats:
                  (stats.conversations as any)?.activeChats ||
                  (stats.conversations as any)?.total ||
                  0,
                unreadMessages:
                  (stats.conversations as any)?.unreadMessages ||
                  (stats.conversations as any)?.unread ||
                  0,
              },
              analytics: stats.analytics,
            }}
            accountType={core.account_type}
          />
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            to="/orders"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <Package className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Orders</p>
              <p className="text-xs text-muted-foreground">
                {stats?.orders?.totalOrders || 0} total
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
            onClick={() => setActiveTab("addresses")}
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
                {stats?.notifications?.unread || 0} unread
              </p>
            </div>
          </Link>
        </div>

        {/* Tabs Navigation */}
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Account Details Card */}
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
                      {core.account_type.replace("_", " ")}
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
                    <p className="font-medium break-all">{core.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <p className="font-medium">
                      {core.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Language
                    </span>
                    <p className="font-medium capitalize">
                      {core.preferred_language}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Currency
                    </span>
                    <p className="font-medium uppercase">
                      {core.preferred_currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-Specific Details */}
            {renderRoleDetails()}

            {/* Addresses Preview */}
            {addresses && addresses.length > 0 && (
              <AddressesSection
                addresses={addresses.slice(0, 2)}
                showViewAll
                editable={false}
              />
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <WalletTab />
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            {addresses ? (
              <AddressesSection addresses={addresses} editable={isOwnProfile} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No saved addresses
                  </p>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Add Address
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-yellow-500">
                      {(stats?.analytics?.average_rating || 0).toFixed(1)}
                    </p>
                    <div className="flex gap-1 justify-center my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (stats?.analytics?.average_rating || 0)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stats?.analytics?.total_reviews || 0} reviews
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/reviews")}
                    >
                      View All Reviews
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    user={user}
                    formData={{
                      fullName: formData.full_name,
                      email: core.email,
                      phone: formData.phone,
                      avatarUrl: formData.avatar_url,
                    }}
                    updateFormData={(updates) => {
                      const mapped: Partial<typeof formData> = {};
                      if (updates.fullName !== undefined)
                        mapped.full_name = updates.fullName;
                      if (updates.phone !== undefined)
                        mapped.phone = updates.phone;
                      if (updates.avatarUrl !== undefined)
                        mapped.avatar_url = updates.avatarUrl;
                      updateFormData(mapped);
                    }}
                    onSave={saveProfile}
                    isSaving={isSaving}
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onCancel={() => setIsEditing(false)}
                  />
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ChangePassword
                    onChangePassword={changePassword}
                    isChanging={isChangingPassword}
                  />
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Settings */}
            <div className="mt-6">
              <ProfileSettings userId={core.user_id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
