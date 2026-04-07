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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Package,
  Heart,
  MapPin,
  MessageSquare,
  Bell,
  Star,
  ChevronRight,
  TrendingUp,
  Settings,
  CreditCard,
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
  }, [fullProfile]);

  const loadWalletAndVerification = async (userId: string) => {
    try {
      const { data: wallet, error: walletError } = await supabase
        .from("user_wallets")
        .select("balance, pending_balance, total_earned, total_withdrawn")
        .eq("user_id", userId)
        .maybeSingle();

      if (walletError && walletError.code !== "PGRST116") {
        console.warn("Wallet table not available:", walletError.message);
      }
      setWalletData(wallet);
    } catch (error) {
      console.warn("Error loading wallet/verification:", error);
    } finally {
      // Wallet loading complete
    }
  };

  const handleEdit = () => {
    setActiveTab("settings");
    setIsEditing(true);
  };

  if (loading || profileLoading || !fullProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-r-2 border-l-2 border-primary/30 animate-spin-slow" />
          </div>
        </div>
      </div>
    );
  }

  if (!fullProfile.core) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-card p-12 text-center max-w-md border-white/10">
          <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-4">Profile not found</h2>
          <p className="text-muted-foreground font-medium mb-8">Unable to load your profile details. Please try again later.</p>
          <Button onClick={() => navigate("/")} className="glass bg-primary text-white font-bold px-8 h-12">
            Return Home
          </Button>
        </div>
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
      default:
        return (
          <div className="glass-card p-10 text-center border-white/10">
            <p className="text-muted-foreground font-medium italic">
              Leveling up your profile details soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      {/* Immersive Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full space-y-8 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <ProfileHeader
          user={core}
          isOwnProfile={isOwnProfile}
          onEdit={handleEdit}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {stats && (
              <StatsCards
                stats={{
                  orders: stats.orders,
                  notifications: stats.notifications,
                  wishlist: {
                    count: (stats.wishlist as any).totalItems || (stats.wishlist as any).count || 0,
                  },
                  conversations: {
                    activeChats: (stats.conversations as any).activeChats || (stats.conversations as any).total || 0,
                    unreadMessages: (stats.conversations as any).unreadMessages || (stats.conversations as any).unread || 0,
                  },
                  analytics: stats.analytics,
                }}
                accountType={core.account_type}
              />
            )}

            <div className="glass-card p-1 overflow-hidden border-white/10">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full justify-start h-14 bg-transparent border-b border-white/10 rounded-none px-4 gap-6">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold uppercase tracking-widest text-[10px]">Overview</TabsTrigger>
                  <TabsTrigger value="wallet" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold uppercase tracking-widest text-[10px]">Wallet</TabsTrigger>
                  <TabsTrigger value="addresses" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold uppercase tracking-widest text-[10px]">Addresses</TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold uppercase tracking-widest text-[10px]">Reviews</TabsTrigger>
                  {isOwnProfile && (
                    <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold uppercase tracking-widest text-[10px]">Security</TabsTrigger>
                  )}
                </TabsList>

                <div className="p-6">
                  <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in duration-500">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="glass-card p-6 border-white/5 bg-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Account Metadata</p>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-muted-foreground/60">Type</span>
                            <span className="text-sm font-black uppercase tracking-tighter text-primary">{core.account_type}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-muted-foreground/60">Member Since</span>
                            <span className="text-sm font-black tracking-tighter uppercase">{new Date(core.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="glass-card p-6 border-white/5 bg-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Identity</p>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center overflow-hidden">
                            <span className="text-sm font-bold text-muted-foreground/60 mr-4">Email</span>
                            <span className="text-sm font-black tracking-tighter truncate max-w-[150px]">{core.email}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-muted-foreground/60">Phone</span>
                            <span className="text-sm font-black tracking-tighter">{core.phone || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {renderRoleDetails()}
                  </TabsContent>

                  <TabsContent value="wallet" className="mt-0 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      {walletData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="glass-card p-8 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group">
                            <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Available Credits</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-5xl font-black tracking-tighter italic">
                                {walletData.balance.toFixed(2)}
                              </p>
                              <span className="text-xs font-black uppercase tracking-widest opacity-40">{core.currency || "EGP"}</span>
                            </div>
                            <Button variant="ghost" onClick={() => navigate("/wallet/topup")} className="mt-6 glass bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-full border-emerald-500/20">
                              Top Up <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>

                          <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5 relative overflow-hidden group">
                            <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Pending Escrow</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-5xl font-black tracking-tighter italic">
                                {walletData.pending_balance.toFixed(2)}
                              </p>
                              <span className="text-xs font-black uppercase tracking-widest opacity-40">{core.currency || "EGP"}</span>
                            </div>
                            <Button variant="ghost" onClick={() => navigate("/wallet/payouts")} className="mt-6 glass bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-full border-amber-500/20">
                              Request Payout <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-card p-12 text-center border-white/5 italic text-muted-foreground font-medium">
                          Synching wallet with blockchain...
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="addresses" className="mt-0 animate-in fade-in duration-500">
                    {addresses && (
                      <AddressesSection addresses={addresses} editable={isOwnProfile} />
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0 animate-in fade-in duration-500">
                    <div className="glass-card p-10 border-white/5 flex flex-col items-center">
                      <div className="relative group">
                        <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl group-hover:bg-yellow-500/40 transition duration-700" />
                        <div className="relative h-28 w-28 glass rounded-full flex flex-col items-center justify-center border-white/20 shadow-2xl">
                          <p className="text-4xl font-black tracking-tighter italic text-yellow-500">
                            {(stats?.analytics?.averageRating || 0).toFixed(1)}
                          </p>
                          <div className="flex gap-0.5 my-1 scale-75">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= (stats?.analytics?.averageRating || 0)
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-white/10"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Community Pulse</p>
                      <p className="text-lg font-bold mt-1">{stats?.analytics?.totalReviews || 0} REVIEWS</p>
                      <Button
                        variant="ghost"
                        className="mt-6 glass bg-white/5 border-white/10 hover:bg-white/10 font-black text-[10px] uppercase tracking-widest h-10 px-8 rounded-full"
                        onClick={() => navigate("/reviews")}
                      >
                        Explore Feed
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0 space-y-8 animate-in fade-in duration-500">
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary ml-1">Personal</h3>
                        <div className="glass-card p-6 border-white/5">
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
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-destructive ml-1">Security</h3>
                        <div className="glass-card p-6 border-white/5">
                          <ChangePassword
                            onChangePassword={changePassword}
                            isChanging={isChangingPassword}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-white/5 pt-8">
                      <ProfileSettings userId={core.user_id} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Sidebar / Quick Links */}
          <div className="space-y-6">
            <div className="glass-card p-6 border-white/10 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Command Center</h3>
              <div className="grid gap-3">
                <QuickLink to="/orders" icon={Package} label="Orders" value={stats?.orders.totalOrders || 0} />
                <QuickLink to="/wishlist" icon={Heart} label="Wishlist" value={(stats?.wishlist as any)?.totalItems || 0} />
                <QuickLink to="/addresses" icon={MapPin} label="Shipping" value={addresses?.length || 0} />
                <QuickLink to="/notifications" icon={Bell} label="Alerts" value={stats?.notifications.unread || 0} />
                <QuickLink to="/chat" icon={MessageSquare} label="Direct" badge="HOT" />
                <QuickLink to="/wallet" icon={CreditCard} label="Pricing" />
                <QuickLink to="/settings" icon={Settings} label="Engine" />
              </div>
            </div>

            {/* Quick Analytics for Sellers */}
            {(core.account_type === "seller" || core.account_type === "factory") && stats?.analytics && (
              <div className="glass-card p-6 border-primary/20 bg-primary/5 relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-primary/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Performance Index</p>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center font-black italic tracking-tighter">
                    <span className="text-xs text-muted-foreground uppercase not-italic font-bold">Revenue</span>
                    <span className="text-lg">{stats.analytics.totalRevenue?.toFixed(0)} <span className="text-[10px] font-bold not-italic font-sans">EGP</span></span>
                  </div>
                  <div className="flex justify-between items-center font-black italic tracking-tighter">
                    <span className="text-xs text-muted-foreground uppercase not-italic font-bold">Customers</span>
                    <span className="text-lg">+{stats.analytics.totalCustomers || 0}</span>
                  </div>
                  <Button 
                    onClick={() => navigate("/seller/analytics")}
                    className="w-full glass bg-white/5 border-white/10 hover:bg-white/10 text-foreground h-11 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl"
                  >
                    Deep Analytics <TrendingUp className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, value, badge }: { to: string, icon: any, label: string, value?: number | string, badge?: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-4 glass bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 rounded-2xl transition-all duration-300 group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 glass bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="bg-primary text-[8px] font-black text-white px-1.5 py-0.5 rounded italic animate-pulse">{badge}</span>}
        {value !== undefined && <span className="text-sm font-black italic opacity-40">{value}</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
