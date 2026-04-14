import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Upload } from "lucide-react";

type SignupStep =
  | "account"
  | "personal"
  | "business"
  | "verification"
  | "preferences";

interface FormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  company_name: string;
  location: string;
  currency: string;
  commission_rate: number;
  specialization: string;
  website_url: string;
  description: string;
  tax_id: string;
  years_of_experience: string;
  preferred_language: string;
  theme_preference: string;
}

export function MiddlemanSignup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SignupStep>("account");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    company_name: "",
    location: "",
    currency: "USD",
    commission_rate: 5,
    specialization: "",
    website_url: "",
    description: "",
    tax_id: "",
    years_of_experience: "",
    preferred_language: "en",
    theme_preference: "system",
  });

  const [businessLicenseUrl, setBusinessLicenseUrl] = useState<string | null>(
    null,
  );

  const steps: SignupStep[] = [
    "account",
    "personal",
    "business",
    "verification",
    "preferences",
  ];
  const currentStepIndex = steps.indexOf(currentStep);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `license-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(`business-licenses/${fileName}`, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("documents")
        .getPublicUrl(`business-licenses/${fileName}`);

      setBusinessLicenseUrl(publicUrl);
      toast.success("License uploaded successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create Auth Account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            account_type: "middleman",
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // Step 2: Insert into users table
      const { error: userError } = await supabase.from("users").insert({
        user_id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        account_type: "middleman",
        preferred_language: formData.preferred_language,
        theme_preference: formData.theme_preference,
      });

      if (userError) throw userError;

      // Step 3: Insert into middleman_profiles using RPC function
      // This uses the handle_middleman_signup trigger and updates the profile
      const { error: middlemanError } = await supabase.rpc('update_middleman_profile', {
        p_user_id: authData.user.id,
        p_full_name: formData.full_name,
        p_company_name: formData.company_name,
        p_specialization: formData.specialization,
        p_website_url: formData.website_url,
        p_description: formData.description,
        p_tax_id: formData.tax_id,
        p_business_license_url: businessLicenseUrl,
        p_years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
        p_location: formData.location,
        p_currency: formData.currency,
        p_commission_rate: formData.commission_rate,
      });

      if (middlemanError) {
        // Fallback to direct insert if RPC doesn't exist
        console.log("RPC not found, using direct insert:", middlemanError);
        const { error: directError } = await supabase
          .from("middleman_profiles")
          .upsert({
            user_id: authData.user.id,
            full_name: formData.full_name,
            company_name: formData.company_name,
            specialization: formData.specialization,
            website_url: formData.website_url,
            description: formData.description,
            tax_id: formData.tax_id,
            business_license_url: businessLicenseUrl,
            years_of_experience: formData.years_of_experience
              ? parseInt(formData.years_of_experience)
              : null,
            location: formData.location,
            currency: formData.currency,
            commission_rate: formData.commission_rate,
            is_verified: false,
            verification_status: 'pending',
          }, { onConflict: 'user_id' });
        
        if (directError) throw directError;
      }

      toast.success(
        "Account created successfully! Please check your email to verify.",
      );
      navigate("/login");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Signup error:", errorMessage);
      setError(errorMessage || "Signup failed. Please try again.");
      toast.error(errorMessage || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "account":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData({ password: e.target.value })}
                placeholder="Min 8 characters"
                minLength={8}
              />
            </div>
            <Button onClick={handleNext} className="w-full">
              Next
            </Button>
          </div>
        );

      case "personal":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => updateFormData({ full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  updateFormData({ company_name: e.target.value })
                }
                placeholder="Your Company Ltd."
              />
            </div>
            <div>
              <Label htmlFor="location">Business Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData({ location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => updateFormData({ currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    updateFormData({
                      commission_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) =>
                  updateFormData({ specialization: e.target.value })
                }
                placeholder="e.g., Electronics, Textiles"
              />
            </div>
            <div>
              <Label htmlFor="description">Business Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  updateFormData({ description: e.target.value })
                }
                placeholder="Brief description of your business"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Your account will be <strong>pending verification</strong>{" "}
                until admin approves your documents (1-3 business days).
              </p>
            </div>
            <div>
              <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => updateFormData({ tax_id: e.target.value })}
                placeholder="Required for verification"
              />
            </div>
            <div>
              <Label htmlFor="years_of_experience">Years of Experience</Label>
              <Input
                id="years_of_experience"
                type="number"
                value={formData.years_of_experience}
                onChange={(e) =>
                  updateFormData({ years_of_experience: e.target.value })
                }
                min="0"
                max="50"
              />
            </div>
            <div>
              <Label>Business License</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {businessLicenseUrl ? (
                    <div className="text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>License uploaded successfully</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG up to 10MB
                      </p>
                      {uploading && (
                        <p className="text-sm text-blue-600">Uploading...</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="preferred_language">Preferred Language</Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(v) => updateFormData({ preferred_language: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="theme_preference">Theme Preference</Label>
              <Select
                value={formData.theme_preference}
                onValueChange={(v) => updateFormData({ theme_preference: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Complete Signup"}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Become a Middleman
          </h1>
          <p className="mt-2 text-gray-600">
            Connect factories with sellers and earn commissions
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Signup Progress</CardTitle>
            <CardDescription>
              Step {currentStepIndex + 1} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center ${
                    index <= currentStepIndex
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStepIndex
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            <Progress
              value={((currentStepIndex + 1) / steps.length) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              {currentStep} Information
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Your account will be created instantly</li>
            <li>✓ Profile will be pending verification (1-3 business days)</li>
            <li>✓ You can start browsing deals while waiting</li>
            <li>✓ Once verified, you can create and manage deals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
