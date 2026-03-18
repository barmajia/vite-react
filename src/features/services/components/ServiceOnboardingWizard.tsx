import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Briefcase,
  Building2,
  Stethoscope,
  Hospital,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

type ProviderType =
  | "individual"
  | "company"
  | "health_provider"
  | "hospital";

interface FormData {
  business_name: string;
  tagline: string;
  description: string;
  license_number: string;
  tax_id: string;
  specialization: string;
  phone: string;
  website: string;
  city: string;
  hourly_rate?: number;
  skills?: string;
}

export const ServiceOnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [providerType, setProviderType] = useState<ProviderType | "">("");
  const [formData, setFormData] = useState<FormData>({
    business_name: "",
    tagline: "",
    description: "",
    license_number: "",
    tax_id: "",
    specialization: "",
    phone: "",
    website: "",
    city: "",
    hourly_rate: 0,
    skills: "",
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare metadata based on provider type
      const metadata: any = {};

      if (providerType === "health_provider" || providerType === "hospital") {
        metadata.license_number = formData.license_number;
        metadata.specialization = formData.specialization;
      } else if (providerType === "company") {
        metadata.tax_id = formData.tax_id;
      } else if (providerType === "individual") {
        metadata.skills = formData.skills?.split(",").map((s) => s.trim());
        metadata.hourly_rate = formData.hourly_rate;
      }

      // 1. Create Service Provider Profile
      const { error: providerError } = await supabase
        .from("service_providers")
        .insert({
          user_id: user.id,
          provider_type: providerType,
          business_name: formData.business_name,
          tagline: formData.tagline,
          description: formData.description,
          license_number: formData.license_number || null,
          tax_id: formData.tax_id || null,
          specialization: formData.specialization || null,
          phone: formData.phone,
          website: formData.website,
          city: formData.city,
          status: "pending",
          is_verified: false,
          metadata,
        });

      if (providerError) throw providerError;

      toast.success("Profile created successfully!");

      // Redirect to create first listing
      navigate("/services/dashboard/create-listing");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to create profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isStep2Valid = () => {
    if (!formData.business_name || !formData.description) return false;
    if (providerType === "health_provider" || providerType === "hospital") {
      return !!formData.license_number && !!formData.specialization;
    }
    if (providerType === "company") {
      return !!formData.tax_id;
    }
    return true;
  };

  // Step 1: Select Type
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">
              Become a Service Provider
            </h2>
            <p className="text-muted-foreground">
              Choose the type of account that best describes you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual Freelancer */}
            <Card
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
                providerType === "individual"
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setProviderType("individual")}
            >
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Briefcase className="h-12 w-12 mb-4 text-primary" />
                <h3 className="font-bold text-lg">Individual Freelancer</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Developers, Designers, Consultants, Tutors.
                </p>
              </CardContent>
            </Card>

            {/* Company / Agency */}
            <Card
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
                providerType === "company"
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setProviderType("company")}
            >
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Building2 className="h-12 w-12 mb-4 text-primary" />
                <h3 className="font-bold text-lg">Company / Agency</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Marketing agencies, Software houses, Firms.
                </p>
              </CardContent>
            </Card>

            {/* Doctor / Clinic */}
            <Card
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
                providerType === "health_provider"
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setProviderType("health_provider")}
            >
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Stethoscope className="h-12 w-12 mb-4 text-primary" />
                <h3 className="font-bold text-lg">Doctor / Clinic</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Medical practitioners, Private clinics, Therapists.
                </p>
              </CardContent>
            </Card>

            {/* Hospital */}
            <Card
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
                providerType === "hospital"
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setProviderType("hospital")}
            >
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Hospital className="h-12 w-12 mb-4 text-primary" />
                <h3 className="font-bold text-lg">Hospital / Medical Center</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Large medical facilities and multi-specialty centers.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              disabled={!providerType}
              onClick={handleNext}
              className="w-full md:w-auto"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Dynamic Form Based on Type
  if (step === 2) {
    const getTypeLabel = () => {
      switch (providerType) {
        case "individual":
          return "Freelancer";
        case "company":
          return "Company";
        case "health_provider":
          return "Healthcare Provider";
        case "hospital":
          return "Hospital";
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Complete Your {getTypeLabel()} Profile
            </h2>
            <p className="text-muted-foreground">
              {providerType === "health_provider" || providerType === "hospital"
                ? "We require verification documents for medical providers."
                : "Help customers find and trust your services."}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Provide details about your services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  {providerType === "individual"
                    ? "Full Name / Brand"
                    : "Business Name"}
                </Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) =>
                    updateFormData("business_name", e.target.value)
                  }
                  placeholder={
                    providerType === "individual"
                      ? "e.g. Ahmed Ali"
                      : "e.g. Aurora Tech"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => updateFormData("tagline", e.target.value)}
                  placeholder="e.g. Expert Web Developer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  placeholder="Describe your services, expertise, and what makes you unique..."
                  rows={5}
                />
              </div>

              {/* Conditional Fields: Health */}
              {(providerType === "health_provider" ||
                providerType === "hospital") && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Medical Verification
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="license_number">
                        Medical License Number *
                      </Label>
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) =>
                          updateFormData("license_number", e.target.value)
                        }
                        placeholder="Your official medical license number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">
                        Specialization / Department *
                      </Label>
                      <Input
                        id="specialization"
                        value={formData.specialization}
                        onChange={(e) =>
                          updateFormData("specialization", e.target.value)
                        }
                        placeholder="e.g. Cardiology, Dentistry, Pediatrics"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: Company */}
              {providerType === "company" && (
                <div className="space-y-2">
                  <Label htmlFor="tax_id">
                    Tax ID / Registration Number *
                  </Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => updateFormData("tax_id", e.target.value)}
                    placeholder="Your business registration number"
                  />
                </div>
              )}

              {/* Conditional Fields: Individual Freelancer */}
              {providerType === "individual" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) =>
                        updateFormData("skills", e.target.value)
                      }
                      placeholder="e.g. React, TypeScript, UI Design"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (EGP)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) =>
                        updateFormData("hourly_rate", parseFloat(e.target.value))
                      }
                      placeholder="e.g. 200"
                    />
                  </div>
                </>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder="e.g. Cairo, Alexandria"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateFormData("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !isStep2Valid()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating...
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};
