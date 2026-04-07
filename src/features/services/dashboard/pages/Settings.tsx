import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings as SettingsIcon,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Clock,
  Bell,
  CreditCard,
  Shield,
  Save,
  MapPin,
  Image as ImageIcon,
  Plus,
  X,
  LogOut,
  Smartphone,
  Mail,
  Monitor,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  Calendar as CalendarIcon,
  DollarSign as DollarSignIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProviderProfile {
  id: string;
  user_id: string;
  name: string;
  tagline: string;
  bio: string;
  location: string;
  avatar_url: string;
  provider_type: string;
  vacation_mode: boolean;
  created_at: string;
}

interface NotificationSettings {
  email_bookings: boolean;
  push_bookings: boolean;
  email_messages: boolean;
  push_messages: boolean;
  email_reviews: boolean;
  push_reviews: boolean;
}

interface BusinessHours {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

const defaultBusinessHours: BusinessHours[] = [
  { day: "Monday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Tuesday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Wednesday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Thursday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Friday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Saturday", enabled: false, start: "10:00", end: "14:00" },
  { day: "Sunday", enabled: false, start: "10:00", end: "14:00" },
];

const blockedDates = {
  id: "",
  provider_id: "",
  date: "",
  reason: "",
};

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profile, setProfile] = useState<Partial<ProviderProfile>>({
    name: "",
    tagline: "",
    bio: "",
    location: "",
    avatar_url: "",
  });

  // Availability state
  const [businessHours, setBusinessHours] =
    useState<BusinessHours[]>(defaultBusinessHours);
  const [vacationMode, setVacationMode] = useState(false);
  const [blockedDates, setBlockedDates] = useState<
    { id: string; date: string; reason: string }[]
  >([]);
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: "",
    reason: "",
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_bookings: true,
    push_bookings: true,
    email_messages: true,
    push_messages: true,
    email_reviews: true,
    push_reviews: false,
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Fetch provider profile
  const {
    data: providerData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["provider-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: provider } = await supabase
        .from("svc_providers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (provider) {
        setProfile({
          name: provider.name || "",
          tagline: provider.tagline || "",
          bio: provider.bio || "",
          location: provider.location || "",
          avatar_url: provider.avatar_url || "",
          vacation_mode: provider.vacation_mode || false,
        });
        setVacationMode(provider.vacation_mode || false);

        if (provider.business_hours) {
          setBusinessHours(provider.business_hours);
        }
        if (provider.blocked_dates) {
          setBlockedDates(provider.blocked_dates);
        }
        if (provider.notification_settings) {
          setNotifications(provider.notification_settings);
        }
      }

      return provider;
    },
    enabled: !!user,
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProviderProfile>) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("svc_providers")
        .update(data)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile settings saved successfully.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  // Save notifications mutation
  const saveNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("svc_providers")
        .update({ notification_settings: data })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification preferences updated.");
    },
    onError: (err: any) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  // Save availability mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data: {
      business_hours: BusinessHours[];
      vacation_mode: boolean;
      blocked_dates: { id: string; date: string; reason: string }[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("svc_providers")
        .update(data)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability settings saved.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      if (currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user!.email!,
          password: currentPassword,
        });
        if (signInError) throw signInError;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err: any) => {
      toast.error(`Failed to change password: ${err.message}`);
    },
  });

  const handleSaveProfile = () => {
    saveProfileMutation.mutate(profile);
  };

  const handleSaveAvailability = () => {
    saveAvailabilityMutation.mutate({
      business_hours: businessHours,
      vacation_mode: vacationMode,
      blocked_dates: blockedDates,
    });
  };

  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate(notifications);
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleAddBlockedDate = () => {
    if (!newBlockedDate.date) {
      toast.error("Please select a date.");
      return;
    }
    setBlockedDates([
      ...blockedDates,
      {
        id: `blocked_${Date.now()}`,
        date: newBlockedDate.date,
        reason: newBlockedDate.reason,
      },
    ]);
    setNewBlockedDate({ date: "", reason: "" });
  };

  const handleRemoveBlockedDate = (id: string) => {
    setBlockedDates(blockedDates.filter((d) => d.id !== id));
  };

  const updateBusinessHour = (
    index: number,
    field: keyof BusinessHours,
    value: string | boolean,
  ) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Loading Configuration Matrix...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
        <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto" />
        <h3 className="text-3xl font-black italic tracking-tighter uppercase">
          Error <span className="text-rose-500">Detected</span>
        </h3>
        <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
          {(error as Error).message || "Failed to load settings."}
        </p>
        <Button
          onClick={() => refetch()}
          className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Retry Protocol
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header Matrix */}
      <div className="relative overflow-hidden rounded-[4rem] p-16 bg-white/[0.03] border border-white/5 shadow-2xl group">
        <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
          <SettingsIcon className="w-60 h-60 text-primary" />
        </div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
              Configuration Matrix v4.0
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">
            Settings <br />
            <span className="text-foreground/40 italic">Control Panel</span>
          </h1>
          <p className="text-foreground/40 text-lg font-medium italic max-w-xl leading-relaxed">
            Configure your provider profile, manage availability schedules,
            customize notifications, and secure your account infrastructure.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="glass-card rounded-[2rem] border-white/5 bg-white/5 p-2 flex flex-wrap gap-2 h-auto">
          {[
            { value: "profile", label: "Profile", icon: User },
            { value: "availability", label: "Availability", icon: Clock },
            { value: "notifications", label: "Notifications", icon: Bell },
            { value: "payments", label: "Payments", icon: CreditCard },
            { value: "security", label: "Security", icon: Shield },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                  Provider Profile
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-black text-3xl italic">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "P"}
                </div>
                <div className="flex-1">
                  <div className="relative group">
                    <Input
                      value={profile.avatar_url || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, avatar_url: e.target.value })
                      }
                      placeholder="Avatar URL (optional)"
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-[10px] font-medium placeholder:text-white/20 focus:border-primary/40 transition-all"
                    />
                    <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  Provider Name
                </label>
                <Input
                  value={profile.name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Your professional name"
                  className="h-14 bg-white/5 border-white/10 rounded-xl text-sm font-medium placeholder:text-white/20 focus:border-primary/40 transition-all"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  Tagline
                </label>
                <Input
                  value={profile.tagline || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, tagline: e.target.value })
                  }
                  placeholder="A short professional tagline"
                  className="h-14 bg-white/5 border-white/10 rounded-xl text-sm font-medium placeholder:text-white/20 focus:border-primary/40 transition-all"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  Bio
                </label>
                <textarea
                  value={profile.bio || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Describe your professional background and expertise..."
                  rows={4}
                  className="w-full h-auto p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium placeholder:text-white/20 focus:border-primary/40 transition-all resize-none text-white"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  Location
                </label>
                <div className="relative">
                  <Input
                    value={profile.location || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-sm font-medium placeholder:text-white/20 focus:border-primary/40 transition-all pl-12"
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saveProfileMutation.isPending}
                  className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Save className="h-4 w-4" />
                  {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          {/* Vacation Mode */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                    Vacation Mode
                  </CardTitle>
                </div>
                <Switch
                  checked={vacationMode}
                  onCheckedChange={setVacationMode}
                />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <p className="text-sm text-white/40 italic">
                When enabled, clients will see that you are currently
                unavailable. New bookings will be paused until you return.
              </p>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                    Business Hours
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {businessHours.map((day, index) => (
                <div
                  key={day.day}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-4 md:w-40">
                    <Switch
                      checked={day.enabled}
                      onCheckedChange={(checked) =>
                        updateBusinessHour(index, "enabled", checked)
                      }
                    />
                    <span className="text-sm font-black italic uppercase text-white/70">
                      {day.day}
                    </span>
                  </div>
                  {day.enabled && (
                    <div className="flex items-center gap-4 flex-1">
                      <Input
                        type="time"
                        value={day.start}
                        onChange={(e) =>
                          updateBusinessHour(index, "start", e.target.value)
                        }
                        className="h-10 bg-white/5 border-white/10 rounded-xl text-sm text-white focus:border-primary/40 transition-all"
                      />
                      <span className="text-white/20">to</span>
                      <Input
                        type="time"
                        value={day.end}
                        onChange={(e) =>
                          updateBusinessHour(index, "end", e.target.value)
                        }
                        className="h-10 bg-white/5 border-white/10 rounded-xl text-sm text-white focus:border-primary/40 transition-all"
                      />
                    </div>
                  )}
                  {!day.enabled && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                      Unavailable
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Blocked Dates */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                    Blocked Dates
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {/* Add new blocked date */}
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="date"
                  value={newBlockedDate.date}
                  onChange={(e) =>
                    setNewBlockedDate({
                      ...newBlockedDate,
                      date: e.target.value,
                    })
                  }
                  className="h-12 bg-white/5 border-white/10 rounded-xl text-sm text-white focus:border-primary/40 transition-all"
                />
                <Input
                  value={newBlockedDate.reason}
                  onChange={(e) =>
                    setNewBlockedDate({
                      ...newBlockedDate,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Reason (optional)"
                  className="h-12 bg-white/5 border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-primary/40 transition-all flex-1"
                />
                <Button
                  onClick={handleAddBlockedDate}
                  className="h-12 px-6 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Block
                </Button>
              </div>

              {/* Blocked dates list */}
              {blockedDates.length > 0 && (
                <div className="space-y-2">
                  {blockedDates.map((bd) => (
                    <div
                      key={bd.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <CalendarIcon className="h-4 w-4 text-rose-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black italic text-white/70">
                            {bd.date}
                          </p>
                          {bd.reason && (
                            <p className="text-[9px] font-medium text-white/30">
                              {bd.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlockedDate(bd.id)}
                        className="h-8 w-8 p-0 text-white/30 hover:text-rose-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAvailability}
              disabled={saveAvailabilityMutation.isPending}
              className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <Save className="h-4 w-4" />
              {saveAvailabilityMutation.isPending
                ? "Saving..."
                : "Save Availability"}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                    Notification Preferences
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              {/* Bookings */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                  Bookings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">
                        Email Notifications
                      </span>
                    </div>
                    <Switch
                      checked={notifications.email_bookings}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email_bookings: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">
                        Push Notifications
                      </span>
                    </div>
                    <Switch
                      checked={notifications.push_bookings}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          push_bookings: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                  Messages
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">
                        Email Notifications
                      </span>
                    </div>
                    <Switch
                      checked={notifications.email_messages}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email_messages: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">
                        Push Notifications
                      </span>
                    </div>
                    <Switch
                      checked={notifications.push_messages}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          push_messages: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                  Reviews
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">
                        Email Notifications
                      </span>
                    </div>
                    <Switch
                      checked={notifications.email_reviews}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email_reviews: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">
                        Push Notifications
                      </span>
                    </div>
                    <Switch
                      checked={notifications.push_reviews}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          push_reviews: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saveNotificationsMutation.isPending}
                  className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Save className="h-4 w-4" />
                  {saveNotificationsMutation.isPending
                    ? "Saving..."
                    : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                    Connected Payout Methods
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 text-[9px] font-black uppercase tracking-widest"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Method
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black italic uppercase text-white/80">
                      Bank Transfer
                    </p>
                    <p className="text-[9px] font-medium text-white/30 uppercase tracking-wider">
                      Configure your bank account for payouts
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/40 hover:text-primary text-[9px] font-black uppercase tracking-widest"
                >
                  Configure
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout History Summary */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center gap-4">
                <DollarSignIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                  Payout History Summary
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Earned",
                    value: "$0",
                    color: "text-emerald-400",
                  },
                  {
                    label: "Total Withdrawn",
                    value: "$0",
                    color: "text-blue-400",
                  },
                  { label: "Pending", value: "$0", color: "text-amber-400" },
                  {
                    label: "Last Payout",
                    value: "N/A",
                    color: "text-white/60",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-2"
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                      {item.label}
                    </p>
                    <p className={cn("text-xl font-black italic", item.color)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center gap-4">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                  Change Password
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-sm font-medium placeholder:text-white/20 focus:border-primary/40 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-sm font-medium placeholder:text-white/20 focus:border-primary/40 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending || !newPassword}
                  className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Key className="h-4 w-4" />
                  {changePasswordMutation.isPending
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                    Two-Factor Authentication
                  </CardTitle>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <p className="text-sm text-white/40 italic">
                {twoFactorEnabled
                  ? "2FA is currently enabled. Your account has an additional layer of security."
                  : "Enable 2FA to add an extra layer of security to your account. You will need to enter a code from your authenticator app when signing in."}
              </p>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center gap-4">
                <Monitor className="h-5 w-5 text-primary" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                  Active Sessions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-3">
              {[
                {
                  device: "Current Session",
                  browser: "Chrome on Windows",
                  location: "Current",
                  active: true,
                },
              ].map((session, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Monitor className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black italic text-white/70">
                          {session.device}
                        </p>
                        {session.active && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[7px] font-black uppercase italic tracking-widest">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-[9px] font-medium text-white/30">
                        {session.browser} • {session.location}
                      </p>
                    </div>
                  </div>
                  {!session.active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400/60 hover:text-rose-400 text-[9px] font-black uppercase tracking-widest"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
