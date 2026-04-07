import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  User,
  Bell,
  Shield,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Globe,
  Key,
  Monitor,
  Clock,
  LogOut,
  X,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "account" | "notifications" | "security";

type NotificationSettings = {
  email_notifications: boolean;
  push_notifications: boolean;
  deal_notifications: boolean;
  order_notifications: boolean;
  commission_notifications: boolean;
  product_notifications: boolean;
  system_notifications: boolean;
  payment_notifications: boolean;
  shipping_notifications: boolean;
  review_notifications: boolean;
};

type UserProfile = {
  full_name: string;
  company_name: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
};

type Session = {
  id: string;
  device: string;
  location: string;
  last_active: string;
  is_current: boolean;
};

export function MiddlemanSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Account state
  const [accountData, setAccountData] = useState<UserProfile>({
    full_name: "",
    company_name: null,
    phone: null,
    bio: null,
    location: null,
  });

  // Notification state
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    deal_notifications: true,
    order_notifications: true,
    commission_notifications: true,
    product_notifications: false,
    system_notifications: true,
    payment_notifications: true,
    shipping_notifications: true,
    review_notifications: false,
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const { data: userData } = await supabase
        .from("users")
        .select("full_name, phone, location")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch middleman profile
      const { data: mProfile } = await supabase
        .from("middleman_profiles")
        .select("company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      setAccountData({
        full_name: userData?.full_name || user.user_metadata?.full_name || "",
        company_name: mProfile?.company_name || null,
        phone: userData?.phone || user.user_metadata?.phone || null,
        bio: user.user_metadata?.bio || null,
        location: userData?.location || user.user_metadata?.location || null,
      });

      // Fetch notification settings
      const { data: notifData } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (notifData) {
        setNotifSettings({
          email_notifications: notifData.email_notifications ?? true,
          push_notifications: notifData.push_notifications ?? true,
          deal_notifications: notifData.deal_notifications ?? true,
          order_notifications: notifData.order_notifications ?? true,
          commission_notifications: notifData.commission_notifications ?? true,
          product_notifications: notifData.product_notifications ?? false,
          system_notifications: notifData.system_notifications ?? true,
          payment_notifications: notifData.payment_notifications ?? true,
          shipping_notifications: notifData.shipping_notifications ?? true,
          review_notifications: notifData.review_notifications ?? false,
        });
      }

      // Mock sessions (no dedicated sessions table in schema)
      setSessions([
        {
          id: "1",
          device: "Chrome on Windows",
          location: "Current session",
          last_active: "Now",
          is_current: true,
        },
      ]);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save account settings
  const saveAccount = useCallback(async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: accountData.full_name,
          phone: accountData.phone || null,
          location: accountData.location || null,
        })
        .eq("user_id", user.id);

      if (userError) throw userError;

      // Update middleman_profiles company_name
      if (accountData.company_name !== null) {
        const { error: mError } = await supabase
          .from("middleman_profiles")
          .update({ company_name: accountData.company_name })
          .eq("user_id", user.id);

        if (mError && mError.code !== "PGRST116") {
          console.warn("Failed to update middleman_profiles:", mError);
        }
      }

      // Update user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: accountData.full_name,
          phone: accountData.phone || null,
          bio: accountData.bio || null,
          location: accountData.location || null,
        },
      });

      if (metaError) throw metaError;

      toast.success("Account settings saved");
    } catch (err) {
      console.error("Error saving account:", err);
      toast.error("Failed to save account settings");
    } finally {
      setSaving(false);
    }
  }, [user, accountData]);

  // Save notification settings
  const saveNotifications = useCallback(async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Check if notification_settings row exists
      const { data: existing } = await supabase
        .from("notification_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("notification_settings")
          .update({
            email_notifications: notifSettings.email_notifications,
            push_notifications: notifSettings.push_notifications,
            deal_notifications: notifSettings.deal_notifications,
            order_notifications: notifSettings.order_notifications,
            commission_notifications: notifSettings.commission_notifications,
            product_notifications: notifSettings.product_notifications,
            system_notifications: notifSettings.system_notifications,
            payment_notifications: notifSettings.payment_notifications,
            shipping_notifications: notifSettings.shipping_notifications,
            review_notifications: notifSettings.review_notifications,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("notification_settings").insert({
          user_id: user.id,
          email_notifications: notifSettings.email_notifications,
          push_notifications: notifSettings.push_notifications,
          deal_notifications: notifSettings.deal_notifications,
          order_notifications: notifSettings.order_notifications,
          commission_notifications: notifSettings.commission_notifications,
          product_notifications: notifSettings.product_notifications,
          system_notifications: notifSettings.system_notifications,
          payment_notifications: notifSettings.payment_notifications,
          shipping_notifications: notifSettings.shipping_notifications,
          review_notifications: notifSettings.review_notifications,
        });

        if (error) throw error;
      }

      toast.success("Notification settings saved");
    } catch (err) {
      console.error("Error saving notifications:", err);
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  }, [user, notifSettings]);

  // Change password
  const handleChangePassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  const toggleNotif = useCallback((key: keyof NotificationSettings) => {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
          <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
        </div>

        {/* Tab skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-32 bg-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3 mb-6 last:mb-0">
              <div className="h-4 w-32 bg-white/5 rounded" />
              <div className="h-11 w-full bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-rose-500/20 bg-rose-500/5 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Unable to Load Settings
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchSettings()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: "account", label: "Account", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 pb-32">
      {/* ===== HEADER ===== */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Preferences
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
              activeTab === tab.key
                ? "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                : "glass-card border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== ACCOUNT TAB ===== */}
      {activeTab === "account" && (
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl glass border bg-blue-500/10 border-blue-500/20">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Account Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your personal information
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={accountData.full_name}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Company Name
              </label>
              <input
                type="text"
                value={accountData.company_name || ""}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                type="tel"
                value={accountData.phone || ""}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Location
              </label>
              <input
                type="text"
                value={accountData.location || ""}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="City, Country"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <textarea
                value={accountData.bio || ""}
                onChange={(e) =>
                  setAccountData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell others about yourself..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
              />
            </div>

            {/* Save button */}
            <button
              onClick={saveAccount}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border border-blue-500/20 text-sm font-semibold text-blue-400 hover:from-blue-500/30 transition-all disabled:opacity-40"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATIONS TAB ===== */}
      {activeTab === "notifications" && (
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl glass border bg-amber-500/10 border-amber-500/20">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Notification Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose what notifications you receive
              </p>
            </div>
          </div>

          {/* Channel toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleNotif("email_notifications")}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                notifSettings.email_notifications
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-white/5 border-white/5"
              }`}
            >
              <Mail
                className={`h-5 w-5 ${notifSettings.email_notifications ? "text-blue-400" : "text-muted-foreground/40"}`}
              />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">
                  {notifSettings.email_notifications ? "Enabled" : "Disabled"}
                </p>
              </div>
            </button>

            <button
              onClick={() => toggleNotif("push_notifications")}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                notifSettings.push_notifications
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-white/5 border-white/5"
              }`}
            >
              <Smartphone
                className={`h-5 w-5 ${notifSettings.push_notifications ? "text-blue-400" : "text-muted-foreground/40"}`}
              />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Push</p>
                <p className="text-xs text-muted-foreground">
                  {notifSettings.push_notifications ? "Enabled" : "Disabled"}
                </p>
              </div>
            </button>
          </div>

          {/* Notification types */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
              Notification Types
            </p>

            {(
              [
                {
                  key: "deal_notifications" as const,
                  label: "Deal Updates",
                  icon: Globe,
                },
                {
                  key: "order_notifications" as const,
                  label: "Order Updates",
                  icon: Globe,
                },
                {
                  key: "commission_notifications" as const,
                  label: "Commission Alerts",
                  icon: Globe,
                },
                {
                  key: "payment_notifications" as const,
                  label: "Payment Notifications",
                  icon: Globe,
                },
                {
                  key: "shipping_notifications" as const,
                  label: "Shipping Updates",
                  icon: Globe,
                },
                {
                  key: "product_notifications" as const,
                  label: "Product Updates",
                  icon: Globe,
                },
                {
                  key: "review_notifications" as const,
                  label: "Review Alerts",
                  icon: Globe,
                },
                {
                  key: "system_notifications" as const,
                  label: "System Messages",
                  icon: Globe,
                },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleNotif(key)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  notifSettings[key]
                    ? "bg-white/5 border-white/10"
                    : "bg-white/5 border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      notifSettings[key] ? "bg-blue-500/30" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                        notifSettings[key]
                          ? "left-5 bg-blue-400"
                          : "left-1 bg-muted-foreground/40"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={saveNotifications}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 text-sm font-semibold text-amber-400 hover:from-amber-500/30 transition-all disabled:opacity-40"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )}

      {/* ===== SECURITY TAB ===== */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl glass border bg-violet-500/10 border-violet-500/20">
                <Key className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Change Password
                </h3>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </button>
                </div>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-rose-400">Passwords do not match</p>
              )}

              <button
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-500/20 text-sm font-semibold text-violet-400 hover:from-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl glass border bg-emerald-500/10 border-emerald-500/20">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  toast.info(
                    twoFactorEnabled
                      ? "2FA disabled (placeholder)"
                      : "2FA setup coming soon",
                  );
                }}
                className={`w-12 h-7 rounded-full relative transition-colors ${
                  twoFactorEnabled ? "bg-emerald-500/30" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                    twoFactorEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl glass border bg-blue-500/10 border-blue-500/20">
                <Monitor className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Sessions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Devices recently logged into your account
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.device}
                        {session.is_current && (
                          <span className="ml-2 text-xs text-emerald-400 font-normal">
                            (Current)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                        <span className="text-muted-foreground/30">
                          {"\u2022"}
                        </span>
                        <Clock className="h-3 w-3" />
                        <span>{session.last_active}</span>
                      </div>
                    </div>
                  </div>
                  {!session.is_current && (
                    <button
                      onClick={() => {
                        toast.info("Session revocation coming soon");
                      }}
                      className="p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground/50 hover:text-rose-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
