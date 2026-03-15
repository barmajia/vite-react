import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Building2, Hospital, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function ServicesSignup() {
  const navigate = useNavigate();
  const { signUpWithRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "client" as "client" | "individual" | "company" | "hospital",
  });
  const [error, setError] = useState("");

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.password && formData.full_name) {
      setStep(2);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await signUpWithRole(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone,
        formData.role,
      );

      if (error) throw error;

      toast.success("Account created successfully!");

      // Redirect to onboarding to complete provider profile
      if (formData.role !== "client") {
        navigate("/services/onboarding", { state: { role: formData.role } });
      } else {
        navigate("/services");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Basic Info
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Aurora Services - Your gateway to expert professionals
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="full_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  Next Step
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Looking for products?
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      type="button"
                      onClick={() => navigate("/products")}
                    >
                      Go to Aurora Products
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Role Selection
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Choose your path
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          How will you use Aurora Services?
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    id: "client",
                    label: "Hire Talent",
                    desc: "I need services (Dev, Design, Medical)",
                    icon: User,
                  },
                  {
                    id: "individual",
                    label: "Freelancer",
                    desc: "I offer my personal skills",
                    icon: User,
                  },
                  {
                    id: "company",
                    label: "Company / Agency",
                    desc: "We offer team-based services",
                    icon: Building2,
                  },
                  {
                    id: "hospital",
                    label: "Hospital / Clinic",
                    desc: "We offer medical appointments",
                    icon: Hospital,
                  },
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() =>
                      setFormData({ ...formData, role: option.id as any })
                    }
                    className={`cursor-pointer border-2 rounded-lg p-4 flex items-center gap-4 transition-all ${
                      formData.role === option.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        formData.role === option.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <option.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {option.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
