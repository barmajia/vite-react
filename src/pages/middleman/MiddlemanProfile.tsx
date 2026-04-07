import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Shield,
  Briefcase,
  TrendingUp,
  Calendar,
  Percent,
  Target,
} from "lucide-react";
import { toast } from "sonner";

type MiddlemanProfile = {
  user_id: string;
  company_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  commission_rate: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // From user_metadata
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  specialization: string | null;
};

type Stats = {
  totalDeals: number;
  successRate: number;
  memberSince: string;
};

export function MiddlemanProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MiddlemanProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalDeals: 0,
    successRate: 0,
    memberSince: "",
  });

  // Edit form state
  const [formData, setFormData] = useState({
    company_name: "",
    location: "",
    commission_rate: "",
    phone: "",
    bio: "",
    specialization: "",
  });

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch middleman profile
      const { data: mProfile, error: mError } = await supabase
        .from("middleman_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mError && mError.code !== "PGRST116") {
        console.warn("Middleman profile error:", mError);
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name, account_type, location, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userError) {
        console.warn("User data error:", userError);
      }

      const profileData: MiddlemanProfile = {
        user_id: user.id,
        company_name: mProfile?.company_name || null,
        location: mProfile?.location || userData?.location || null,
        latitude: mProfile?.latitude || null,
        longitude: mProfile?.longitude || null,
        currency: mProfile?.currency || "USD",
        commission_rate: mProfile?.commission_rate || null,
        is_verified: mProfile?.is_verified ?? false,
        created_at: mProfile?.created_at || user.created_at,
        updated_at: mProfile?.updated_at || "",
        full_name:
          userData?.full_name || user.user_metadata?.full_name || "Middleman",
        email: user.email || "",
        phone: userData?.phone || user.user_metadata?.phone || null,
        bio: user.user_metadata?.bio || null,
        specialization: user.user_metadata?.specialization || null,
      };

      setProfile(profileData);

      // Populate form data
      setFormData({
        company_name: profileData.company_name || "",
        location: profileData.location || "",
        commission_rate: profileData.commission_rate?.toString() || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        specialization: profileData.specialization || "",
      });

      // Fetch stats
      const { data: deals } = await supabase
        .from("middle_man_deals")
        .select("id, is_active, conversions, clicks")
        .eq("middle_man_id", user.id);

      const totalDeals = deals?.length ?? 0;
      const dealsWithConversions =
        deals?.filter((d) => d.conversions > 0).length ?? 0;
      const successRate =
        totalDeals > 0 ? (dealsWithConversions / totalDeals) * 100 : 0;

      setStats({
        totalDeals,
        successRate,
        memberSince: new Date(profileData.created_at).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
          },
        ),
      });
    } catch (err) {
      console.error("Error fetching middleman profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = useCallback(async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      // Update middleman_profiles
      const profileUpdate: Record<string, unknown> = {};
      if (formData.company_name !== profile.company_name) {
        profileUpdate.company_name = formData.company_name || null;
      }
      if (formData.location !== profile.location) {
        profileUpdate.location = formData.location || null;
      }
      if (
        formData.commission_rate &&
        parseFloat(formData.commission_rate) !== profile.commission_rate
      ) {
        profileUpdate.commission_rate = parseFloat(formData.commission_rate);
      }

      if (Object.keys(profileUpdate).length > 0) {
        const { error: updateError } = await supabase
          .from("middleman_profiles")
          .update(profileUpdate)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      // Update user_metadata via updateUser
      const metadataUpdate: Record<string, unknown> = {};
      if (formData.phone !== profile.phone) {
        metadataUpdate.phone = formData.phone || null;
      }
      if (formData.bio !== profile.bio) {
        metadataUpdate.bio = formData.bio || null;
      }
      if (formData.specialization !== profile.specialization) {
        metadataUpdate.specialization = formData.specialization || null;
      }

      if (Object.keys(metadataUpdate).length > 0) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: metadataUpdate,
        });

        if (metaError) throw metaError;
      }

      // Update users table if location changed
      if (formData.location !== profile.location) {
        const { error: userTableError } = await supabase
          .from("users")
          .update({ location: formData.location || null })
          .eq("user_id", user.id);

        if (userTableError) {
          console.warn(
            "Failed to update users table location:",
            userTableError,
          );
        }
      }

      toast.success("Profile updated successfully");
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [user, profile, formData, fetchProfile]);

  const handleCancel = useCallback(() => {
    if (!profile) return;
    setFormData({
      company_name: profile.company_name || "",
      location: profile.location || "",
      commission_rate: profile.commission_rate?.toString() || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
      specialization: profile.specialization || "",
    });
    setEditing(false);
  }, [profile]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        {/* Profile header skeleton */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="h-24 w-24 bg-white/5 rounded-3xl animate-pulse" />
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="h-7 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card p-5 rounded-[2rem] border-white/5 bg-white/5 animate-pulse text-center"
            >
              <div className="h-10 w-10 mx-auto bg-white/5 rounded-2xl mb-3" />
              <div className="h-7 w-12 mx-auto bg-white/5 rounded mb-2" />
              <div className="h-3 w-20 mx-auto bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Details skeleton */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-white/5 rounded" />
                <div className="h-4 w-24 bg-white/5 rounded" />
                <div className="h-4 flex-1 bg-white/5 rounded" />
              </div>
            ))}
          </div>
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
          Unable to Load Profile
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchProfile()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-white/10 bg-white/5 flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Profile Not Found
        </h2>
        <p className="text-sm text-muted-foreground">
          Your middleman profile could not be found. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 pb-32">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Profile
          </h1>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-xl border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* ===== PROFILE CARD ===== */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-3xl glass border bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-violet-500/20 flex items-center justify-center text-3xl font-bold text-violet-400 shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {profile.full_name}
              </h2>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                  <Shield className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
            {profile.company_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                <Building2 className="h-4 w-4 shrink-0" />
                {profile.company_name}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground/80 max-w-md">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Deals */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 text-center">
          <div className="p-2.5 rounded-2xl glass border bg-blue-500/10 border-blue-500/20 w-fit mx-auto mb-3">
            <Briefcase className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            {stats.totalDeals}
          </p>
          <p className="text-xs text-muted-foreground">Total Deals</p>
        </div>

        {/* Success Rate */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 text-center">
          <div className="p-2.5 rounded-2xl glass border bg-emerald-500/10 border-emerald-500/20 w-fit mx-auto mb-3">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            {stats.successRate.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>

        {/* Member Since */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-violet-500/10 to-purple-500/5 text-center">
          <div className="p-2.5 rounded-2xl glass border bg-violet-500/10 border-violet-500/20 w-fit mx-auto mb-3">
            <Calendar className="h-5 w-5 text-violet-400" />
          </div>
          <p className="text-sm font-bold text-foreground mb-0.5">
            {stats.memberSince}
          </p>
          <p className="text-xs text-muted-foreground">Member Since</p>
        </div>
      </div>

      {/* ===== DETAILS / EDIT FORM ===== */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          {editing ? "Edit Profile" : "Profile Details"}
        </h3>

        {editing ? (
          <div className="space-y-5">
            {/* Company Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground/50" />
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
                placeholder="Your company name"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground/50" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="City, Country"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Commission Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground/50" />
                Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commission_rate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    commission_rate: e.target.value,
                  }))
                }
                placeholder="e.g., 5.0"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground/50" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Specialization */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground/50" />
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    specialization: e.target.value,
                  }))
                }
                placeholder="e.g., Electronics, Textiles"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground/50" />
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell buyers and sellers about yourself..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass-card border-white/10 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border border-blue-500/20 text-sm font-semibold text-blue-400 hover:from-blue-500/30 transition-all disabled:opacity-40"
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
        ) : (
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <Mail className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Email
                </p>
                <p className="text-sm text-foreground truncate">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <Phone className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Phone
                </p>
                <p className="text-sm text-foreground">
                  {profile.phone || "\u2014"}
                </p>
              </div>
            </div>

            {/* Company */}
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <Building2 className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Company
                </p>
                <p className="text-sm text-foreground">
                  {profile.company_name || "\u2014"}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <MapPin className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Location
                </p>
                <p className="text-sm text-foreground">
                  {profile.location || "\u2014"}
                </p>
              </div>
            </div>

            {/* Commission Rate */}
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <Percent className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Commission Rate
                </p>
                <p className="text-sm text-foreground">
                  {profile.commission_rate
                    ? `${profile.commission_rate}%`
                    : "\u2014"}
                </p>
              </div>
            </div>

            {/* Specialization */}
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <Target className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Specialization
                </p>
                <p className="text-sm text-foreground">
                  {profile.specialization || "\u2014"}
                </p>
              </div>
            </div>

            {/* Verification */}
            <div className="flex items-center gap-3 py-3">
              <Shield className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Verification Status
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {profile.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                      <Shield className="h-3.5 w-3.5" />
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
