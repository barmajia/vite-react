import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  Building2,
  Store,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

interface ProfileFormData {
  phone: string;
  location: string;
  company_name?: string;
  bio?: string;
  // Factory fields
  production_capacity?: string;
  specialization?: string;
  // Middleman fields
  commission_rate?: string;
  // Delivery fields
  vehicle_type?: string;
  vehicle_number?: string;
}

export function CompleteProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({
    phone: "",
    location: "",
    company_name: "",
    bio: "",
    production_capacity: "",
    specialization: "",
    commission_rate: "",
    vehicle_type: "",
    vehicle_number: "",
  });

  const accountType = user?.user_metadata?.account_type || "customer";
  const fullName = user?.user_metadata?.full_name || "";
  const email = user?.email || "";

  // Redirect if not Google signup or profile already complete
  useEffect(() => {
    if (!authLoading && user) {
      const hasPhone = user.user_metadata?.phone;
      const hasAccountType = user.user_metadata?.account_type;

      // If profile is already complete, redirect to dashboard
      if (hasPhone && hasAccountType) {
        redirectToDashboard(accountType);
      }
    }
  }, [user, authLoading, accountType]);

  const redirectToDashboard = (type: string) => {
    switch (type) {
      case "middleman":
        navigate("/middleman");
        break;
      case "factory":
        navigate("/factory/dashboard");
        break;
      case "delivery":
        navigate("/delivery");
        break;
      case "seller":
        navigate("/products");
        break;
      default:
        navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          phone: formData.phone,
          location: formData.location,
          company_name: formData.company_name,
          bio: formData.bio,
        },
      });

      if (userError) throw userError;

      // 2. Insert into role-specific table
      await insertRoleSpecificProfile();

      toast.success("Profile completed successfully!", {
        description: "Welcome to Aurora!",
      });

      redirectToDashboard(accountType);
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("Failed to complete profile", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const insertRoleSpecificProfile = async () => {
    if (!user) throw new Error("User not authenticated");

    const baseProfile = {
      user_id: user.id,
      phone: formData.phone,
      location: formData.location,
      company_name: formData.company_name,
      bio: formData.bio,
    };

    switch (accountType) {
      case "seller":
        await supabase.from("sellers").insert({
          user_id: user.id,
          full_name: fullName,
          email: email,
          phone: formData.phone,
          location: formData.location,
          company_name: formData.company_name,
          bio: formData.bio,
          account_type: "seller",
          is_verified: false,
        });
        break;

      case "factory":
        await supabase.from("factories").insert({
          user_id: user.id,
          full_name: fullName,
          email: email,
          phone: formData.phone,
          location: formData.location,
          company_name: formData.company_name,
          bio: formData.bio,
          production_capacity: formData.production_capacity,
          specialization: formData.specialization,
          account_type: "factory",
          is_verified: false,
        });
        break;

      case "middleman":
        await supabase.from("middleman_profiles").insert({
          user_id: user.id,
          company_name: formData.company_name,
          location: formData.location,
          commission_rate: formData.commission_rate
            ? parseFloat(formData.commission_rate)
            : 5.0,
          is_verified: false,
        });
        break;

      case "delivery":
        await supabase.from("delivery_profiles").insert({
          user_id: user.id,
          full_name: fullName,
          phone: formData.phone,
          location: formData.location,
          vehicle_type: formData.vehicle_type,
          vehicle_number: formData.vehicle_number,
          is_verified: false,
        });
        break;

      case "customer":
        // Customers don't need a separate profile table
        break;

      default:
        console.warn(`Unknown account type: ${accountType}`);
    }
  };

  const getRoleConfig = () => {
    const configs: Record<string, { title: string; icon: any; color: string }> =
      {
        customer: {
          title: "Complete Your Profile",
          icon: User,
          color: "from-blue-500 to-cyan-500",
        },
        seller: {
          title: "Complete Seller Profile",
          icon: Store,
          color: "from-emerald-500 to-green-500",
        },
        factory: {
          title: "Complete Factory Profile",
          icon: Building2,
          color: "from-purple-500 to-violet-500",
        },
        middleman: {
          title: "Complete Middleman Profile",
          icon: Sparkles,
          color: "from-amber-500 to-orange-500",
        },
        delivery: {
          title: "Complete Delivery Profile",
          icon: Truck,
          color: "from-rose-500 to-pink-500",
        },
      };
    return configs[accountType] || configs.customer;
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} mb-4 shadow-lg`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            {config.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome, {fullName}! Just a few more details to complete your{" "}
            {accountType} account.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Contact Information</CardTitle>
            <CardDescription>
              We need a few more details to set up your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Company Name (except customer) */}
              {accountType !== "customer" && accountType !== "delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value,
                        })
                      }
                      placeholder="Your Company Name"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself or your business..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Factory-specific fields */}
              {accountType === "factory" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      placeholder="e.g., Electronics, Textiles, Furniture"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="production_capacity">
                      Production Capacity
                    </Label>
                    <Input
                      id="production_capacity"
                      type="text"
                      value={formData.production_capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          production_capacity: e.target.value,
                        })
                      }
                      placeholder="e.g., 1000 units/month"
                    />
                  </div>
                </>
              )}

              {/* Middleman-specific fields */}
              {accountType === "middleman" && (
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission_rate: e.target.value,
                      })
                    }
                    placeholder="5.0"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Default: 5%. This is your standard commission on deals.
                  </p>
                </div>
              )}

              {/* Delivery-specific fields */}
              {accountType === "delivery" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Input
                      id="vehicle_type"
                      type="text"
                      value={formData.vehicle_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_type: e.target.value,
                        })
                      }
                      placeholder="e.g., Motorcycle, Van, Truck"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Vehicle Number/Plate</Label>
                    <Input
                      id="vehicle_number"
                      type="text"
                      value={formData.vehicle_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_number: e.target.value,
                        })
                      }
                      placeholder="e.g., ABC-1234"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-14 bg-gradient-to-r ${config.color} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </Button>

              {/* Skip for now */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => redirectToDashboard(accountType)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Skip for now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
