import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { UserRole, DeliverySignupData, MiddlemanSignupData } from "@/types/signup";
import { CustomerSignupForm } from "@/components/signup/CustomerSignupForm";
import { SellerSignupForm } from "@/components/signup/SellerSignupForm";
import { FactorySignupForm } from "@/components/signup/FactorySignupForm";
import { DeliverySignupForm } from "@/components/signup/DeliverySignupForm";
import { MiddlemanSignupForm } from "@/components/signup/MiddlemanSignupForm";
import { RoleSelection } from "@/components/signup/RoleSelection";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Mail,
  ArrowRight,
  Moon,
  Sun,
  Sparkles,
  Users,
  Store,
  Building2,
  Truck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export function SignupPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signUp, signUpWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string>("");

  // Handle tab query parameter from login page
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "products") {
      // Products = Seller role
      setSelectedRole("seller");
    } else if (tab === "services") {
      // Services = Customer role
      setSelectedRole("customer");
    }
  }, [searchParams]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError(null);
  };

  const handleSignupComplete = (email?: string) => {
    if (email) setCreatedEmail(email);
    setSuccess(true);
  };

  const handleGoogleSignup = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const roleMap: Record<
        UserRole,
        "customer" | "seller" | "factory" | "delivery_driver" | "middleman"
      > = {
        customer: "customer",
        seller: "seller",
        factory: "factory",
        delivery: "delivery_driver",
        middleman: "middleman",
      };
      const { error } = await signUpWithGoogle(roleMap[selectedRole]);
      if (error) setError(error.message);
      // OAuth redirects, so we don't need to handle success here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roleIcons: Record<UserRole | "admin", React.ElementType> = {
    customer: Users,
    seller: Store,
    factory: Building2,
    delivery: Truck,
    middleman: Sparkles,
    admin: Users,
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-400/20 dark:bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 flex gap-2 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-yellow-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-violet-600" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </Button>
        </div>

        {/* Success Card */}
        <Card className="max-w-lg w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 rounded-3xl overflow-hidden relative z-10">
          {/* Animated Checkmark Header */}
          <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
            <div className="relative">
              <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 animate-[bounce_2s_infinite]">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Account Created! 🎉
              </CardTitle>
              <CardDescription className="text-violet-100 mt-2">
                One last step to activate your account
              </CardDescription>
            </div>
          </div>

          <CardContent className="space-y-6 p-8">
            {createdEmail && (
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
                <p className="text-sm text-violet-900 dark:text-violet-200 text-center">
                  Verification sent to{" "}
                  <strong className="font-semibold">{createdEmail}</strong>
                </p>
              </div>
            )}

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                    Can't find the email?
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 py-6 rounded-xl transition-all"
              >
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Left Panel - Visual Area (Desktop) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 dark:from-violet-900 dark:via-indigo-900 dark:to-slate-900 overflow-hidden shadow-2xl z-10">
        <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] mix-blend-overlay"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <Sparkles className="h-7 w-7 text-indigo-100" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-100">
              AURORA
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] mb-12">
            Join the future of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-200 drop-shadow-sm">
              commerce
            </span>
          </h1>

          {/* Role Preview Cards */}
          <div className="space-y-4 max-w-sm">
            {[
              {
                role: "customer" as UserRole,
                label: "Shop & Discover",
                icon: Users,
              },
              {
                role: "seller" as UserRole,
                label: "Sell Products",
                icon: Store,
              },
              {
                role: "factory" as UserRole,
                label: "Manufacturing",
                icon: Building2,
              },
              { role: "delivery" as UserRole, label: "Logistics", icon: Truck },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                  selectedRole === item.role
                    ? "bg-white/20 border-white/40 scale-[1.02] shadow-lg shadow-black/10"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition-colors ${selectedRole === item.role ? "bg-white/20" : "bg-white/10"}`}
                >
                  <item.icon className="h-5 w-5 text-indigo-50" />
                </div>
                <span className="font-semibold text-indigo-50 text-base">
                  {item.label}
                </span>
                {selectedRole === item.role && (
                  <CheckCircle className="ml-auto h-5 w-5 text-emerald-400" />
                )}
              </div>
            ))}
          </div>

          <div className="absolute bottom-8 left-12 xl:left-16 flex items-center gap-4 text-sm text-indigo-200/60 font-medium">
            <span>© {new Date().getFullYear()} Aurora</span>
            <div className="w-1 h-1 rounded-full bg-indigo-200/40" />
            <a href="#" className="hover:text-indigo-100 transition-colors">
              Privacy
            </a>
            <div className="w-1 h-1 rounded-full bg-indigo-200/40" />
            <a href="#" className="hover:text-indigo-100 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 xl:px-20 relative z-10 overflow-y-auto">
        {/* Top Bar Navigation */}
        <div className="flex justify-between items-center w-full mb-8 lg:mb-12">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
              AURORA
            </span>
          </div>

          {/* Empty div for spacing on desktop when no back button */}
          <div className="hidden lg:block">
            {selectedRole && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Role
              </Button>
            )}
          </div>

          {/* Login Link & Theme Toggle */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              Already have an account?
            </span>
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all font-semibold"
              >
                Sign in
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-xl mx-auto w-full my-auto pb-12">
          <div className="mb-10 lg:text-left text-center">
            {!selectedRole ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 rounded-full mb-4 lg:mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    Get Started
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                  Choose your path
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base lg:text-lg">
                  Select how you want to use Aurora to begin.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-full mb-4 lg:mb-6">
                  {(() => {
                    const Icon = roleIcons[selectedRole];
                    return Icon ? (
                      <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    ) : null;
                  })()}
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    {selectedRole} Account
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Complete your profile
                </h2>
              </>
            )}
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="mb-8 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 rounded-2xl shadow-sm"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <AlertDescription className="text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!selectedRole ? (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-2 sm:p-4">
                <RoleSelection onSelect={handleRoleSelect} />
              </div>
            ) : selectedRole === "middleman" ? (
              <MiddlemanSignupForm
                loading={loading}
                onBack={handleBack}
                onGoogleSignup={handleGoogleSignup}
                onSubmit={async (formData: MiddlemanSignupData) => {
                  setLoading(true);
                  try {
                    const { error } = await signUp(
                      formData.email,
                      formData.password,
                      formData.full_name,
                      "middleman",
                      {
                        phone: formData.phone,
                        company_name: formData.company_name,
                        location: formData.location,
                        currency: formData.currency,
                        commission_rate: formData.commission_rate,
                        specialization: formData.specialization,
                        years_of_experience: formData.years_of_experience,
                        tax_id: formData.tax_id,
                      },
                    );
                    if (error) setError(error.message);
                    else handleSignupComplete(formData.email);
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : "Unknown error";
                    setError(errorMessage);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            ) : (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="p-6 sm:p-8">
                  {selectedRole === "customer" && (
                    <CustomerSignupForm
                      onSubmit={async (formData: {
                        email: string;
                        password: string;
                        full_name: string;
                        phone?: string;
                      }) => {
                        setLoading(true);
                        try {
                          const { error } = await signUp(
                            formData.email,
                            formData.password,
                            formData.full_name,
                            "customer",
                            {
                              phone: formData.phone,
                            },
                          );
                          if (error) setError(error.message);
                          else handleSignupComplete(formData.email);
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : "Unknown error";
                          setError(errorMessage);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onBack={handleBack}
                      onGoogleSignup={handleGoogleSignup}
                      loading={loading}
                    />
                  )}
                  {selectedRole === "seller" && (
                    <SellerSignupForm
                      onSubmit={async (formData: {
                        email: string;
                        password: string;
                        full_name: string;
                        phone?: string;
                        location?: string;
                        currency?: string;
                      }) => {
                        setLoading(true);
                        try {
                          const { error } = await signUp(
                            formData.email,
                            formData.password,
                            formData.full_name,
                            "seller",
                            {
                              phone: formData.phone,
                              location: formData.location,
                              currency: formData.currency,
                            },
                          );
                          if (error) setError(error.message);
                          else handleSignupComplete(formData.email);
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : "Unknown error";
                          setError(errorMessage);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onBack={handleBack}
                      onGoogleSignup={handleGoogleSignup}
                      loading={loading}
                    />
                  )}
                  {selectedRole === "factory" && (
                    <FactorySignupForm
                      onSubmit={async (formData: {
                        email: string;
                        password: string;
                        full_name: string;
                        phone?: string;
                        location?: string;
                        currency?: string;
                        production_capacity?: string;
                        min_order_quantity?: number;
                      }) => {
                        setLoading(true);
                        try {
                          const { error } = await signUp(
                            formData.email,
                            formData.password,
                            formData.full_name,
                            "factory",
                            {
                              phone: formData.phone,
                              location: formData.location,
                              currency: formData.currency,
                              production_capacity: formData.production_capacity,
                              min_order_quantity: formData.min_order_quantity,
                            },
                          );
                          if (error) setError(error.message);
                          else handleSignupComplete(formData.email);
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : "Unknown error";
                          setError(errorMessage);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onBack={handleBack}
                      onGoogleSignup={handleGoogleSignup}
                      loading={loading}
                    />
                  )}
                  {selectedRole === "delivery" && (
                    <DeliverySignupForm
                      onSubmit={async (formData: DeliverySignupData) => {
                        setLoading(true);
                        try {
                          const { error } = await signUp(
                            formData.email,
                            formData.password,
                            formData.full_name,
                            "delivery_driver",
                            {
                              phone: formData.phone,
                              vehicle_type: formData.vehicle_type,
                              vehicle_number: formData.vehicle_number,
                            },
                          );
                          if (error) setError(error.message);
                          else handleSignupComplete(formData.email);
                        } catch (err) {
                          const errorMessage =
                            err instanceof Error
                              ? err.message
                              : "Unknown error";
                          setError(errorMessage);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onBack={handleBack}
                      onGoogleSignup={handleGoogleSignup}
                      loading={loading}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
