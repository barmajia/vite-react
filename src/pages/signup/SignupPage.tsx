import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/types/signup";
import { CustomerSignupForm } from "@/components/signup/CustomerSignupForm";
import { SellerSignupForm } from "@/components/signup/SellerSignupForm";
import { FactorySignupForm } from "@/components/signup/FactorySignupForm";
import { DeliverySignupForm } from "@/components/signup/DeliverySignupForm";
import { RoleSelection } from "@/components/signup/RoleSelection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function SignupPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signUp, resendVerification } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string>("");
  const [resending, setResending] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError(null);
  };

  const handleSignupComplete = (email?: string) => {
    if (email) {
      setCreatedEmail(email);
    }
    setSuccess(true);
  };

  const handleResendVerification = async () => {
    if (!createdEmail) return;

    setResending(true);
    try {
      const { error } = await resendVerification(createdEmail);
      if (error) {
        toast.error(error.message || "Failed to resend verification email");
      } else {
        toast.success(
          "Verification email sent! Please check your inbox and spam folder.",
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[hsl(226.15deg_68.42%_3.73%)] p-4">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 flex gap-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-yellow-400 hover:bg-white dark:hover:bg-gray-800"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-indigo-600" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </Button>
        </div>

        <Card className="max-w-md w-full bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              Account Created!
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Verify your email to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {createdEmail && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-300 text-center">
                  We've sent a verification email to{" "}
                  <strong className="text-blue-900 dark:text-blue-200">
                    {createdEmail}
                  </strong>
                </p>
              </div>
            )}

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-900 dark:text-yellow-300 font-medium">
                    Check your spam folder
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                    If you don't see the email within 5 minutes, check your
                    spam/junk folder. Business accounts may also require admin
                    approval after verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                {resending ? (
                  <>
                    <Mail className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
    <div className="min-h-screen bg-white dark:bg-[hsl(226.15deg_66.42%_4.73%)] py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle & Back Button */}
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        {selectedRole && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-yellow-400 hover:bg-white dark:hover:bg-gray-800"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-indigo-600" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-12">
          <h1 className="text-4 font-bold text-dark dark-white text-xl">
            A U R O R A
          </h1>
          <div className="pt-5"></div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {selectedRole
              ? `Sign Up as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              : "Create Your Account"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {selectedRole
              ? "Complete your profile to get started"
              : "Choose your account type to begin"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {!selectedRole ? (
          <RoleSelection onSelect={handleRoleSelect} />
        ) : selectedRole === "middleman" ? (
          // Redirect to dedicated middleman signup
          <Card className="bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-800">
            <CardContent className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Middleman signup has a dedicated multi-step form.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => navigate("/signup/middleman")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to Middleman Signup
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="capitalize text-gray-900 dark:text-white">
                {selectedRole} Registration
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Fill in the form below to create your {selectedRole} account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRole === "customer" && (
                <CustomerSignupForm
                  onSubmit={async (formData: any) => {
                    setLoading(true);
                    try {
                      const { error } = await signUp(
                        formData.email,
                        formData.password,
                        formData.full_name,
                        "buyer",
                      );
                      if (error) {
                        setError(error.message);
                      } else {
                        handleSignupComplete(formData.email);
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {selectedRole === "seller" && (
                <SellerSignupForm
                  onSubmit={async (formData: any) => {
                    setLoading(true);
                    try {
                      const { error } = await signUp(
                        formData.email,
                        formData.password,
                        formData.full_name,
                        "seller",
                      );
                      if (error) {
                        setError(error.message);
                      } else {
                        handleSignupComplete(formData.email);
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {selectedRole === "factory" && (
                <FactorySignupForm
                  onSubmit={async (formData: any) => {
                    setLoading(true);
                    try {
                      const { error } = await signUp(
                        formData.email,
                        formData.password,
                        formData.full_name,
                        "seller",
                      );
                      if (error) {
                        setError(error.message);
                      } else {
                        handleSignupComplete(formData.email);
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {selectedRole === "delivery" && (
                <DeliverySignupForm
                  onSubmit={async (formData: any) => {
                    setLoading(true);
                    try {
                      const { error } = await signUp(
                        formData.email,
                        formData.password,
                        formData.full_name,
                        "seller",
                      );
                      if (error) {
                        setError(error.message);
                      } else {
                        handleSignupComplete(formData.email);
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Sign In
            </a>
          </p>
        </div>

        {/* Info Boxes */}
        {!selectedRole && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  ✓ Instant Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create your account in minutes and get instant access to the
                  platform.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900/90 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  🔒 Secure & Private
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your data is protected with enterprise-grade security and
                  encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
