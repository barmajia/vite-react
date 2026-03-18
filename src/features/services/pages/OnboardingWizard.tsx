import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Stethoscope,
  Code,
  Scale,
  Wrench,
  GraduationCap,
  CheckCircle,
  MapPin,
  DollarSign,
  Clock,
} from "lucide-react";

type ProviderCategory =
  | "health"
  | "freelance"
  | "home_service"
  | "professional"
  | "education";

type EngagementModel =
  | "online_only"
  | "offline_only"
  | "hybrid"
  | "project_based"
  | "hourly";

interface FormData {
  // Core
  provider_type: ProviderCategory;
  business_name: string;
  tagline: string;
  description: string;
  engagement_models: EngagementModel[];

  // Health-specific
  license_number?: string;
  specialization?: string;
  years_of_experience?: number;

  // Freelance-specific
  skills?: string;
  hourly_rate?: number;
  portfolio_url?: string;

  // Location
  latitude?: number;
  longitude?: number;
  address_line1?: string;
  city?: string;
  country?: string;

  // Verification
  verification_documents?: string[];
}

const CATEGORIES = [
  {
    id: "health",
    label: "Healthcare",
    icon: Stethoscope,
    description: "Doctor, Clinic, Hospital",
  },
  {
    id: "freelance",
    label: "Freelance",
    icon: Code,
    description: "Developer, Designer, Translator",
  },
  {
    id: "professional",
    label: "Professional",
    icon: Scale,
    description: "Lawyer, Consultant, Accountant",
  },
  {
    id: "home_service",
    label: "Home Services",
    icon: Wrench,
    description: "Plumber, Electrician, Cleaner",
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    description: "Tutor, Trainer, Courses",
  },
];

const ENGAGEMENT_MODELS = {
  health: [
    { id: "offline_only", label: "In-Person Only", icon: MapPin },
    { id: "online_only", label: "Online Only", icon: Clock },
    { id: "hybrid", label: "Both", icon: CheckCircle },
  ],
  freelance: [
    { id: "hourly", label: "Hourly Rate", icon: DollarSign },
    { id: "project_based", label: "Fixed Price", icon: CheckCircle },
    { id: "online_only", label: "Remote Only", icon: Clock },
    { id: "hybrid", label: "Hybrid", icon: MapPin },
  ],
  professional: [
    { id: "offline_only", label: "In-Person", icon: MapPin },
    { id: "online_only", label: "Online", icon: Clock },
    { id: "hybrid", label: "Both", icon: CheckCircle },
  ],
  home_service: [{ id: "offline_only", label: "On-Site Only", icon: MapPin }],
  education: [
    { id: "online_only", label: "Online Classes", icon: Clock },
    { id: "offline_only", label: "In-Person", icon: MapPin },
    { id: "hybrid", label: "Both", icon: CheckCircle },
  ],
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    provider_type: "freelance",
    business_name: "",
    tagline: "",
    description: "",
    engagement_models: [],
    skills: "",
    hourly_rate: 0,
    city: "",
    country: "EG",
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleCategorySelect = (category: ProviderCategory) => {
    updateFormData({ provider_type: category });
  };

  const handleEngagementToggle = (model: EngagementModel) => {
    const current = formData.engagement_models || [];
    const updated = current.includes(model)
      ? current.filter((m) => m !== model)
      : [...current, model];
    updateFormData({ engagement_models: updated });
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.provider_type && formData.business_name;
      case 2:
        return formData.description && formData.engagement_models?.length > 0;
      case 3:
        if (formData.provider_type === "health") {
          return formData.license_number && formData.specialization;
        }
        if (formData.provider_type === "freelance") {
          return formData.skills && formData.hourly_rate;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Prepare metadata based on provider type
      const metadata: any = {};

      if (formData.provider_type === "health") {
        metadata.license_number = formData.license_number;
        metadata.specialization = formData.specialization;
        metadata.years_of_experience = formData.years_of_experience;
      } else if (formData.provider_type === "freelance") {
        metadata.skills = formData.skills?.split(",").map((s) => s.trim());
        metadata.hourly_rate = formData.hourly_rate;
        metadata.portfolio_url = formData.portfolio_url;
      }

      const { data, error } = await supabase
        .from("service_providers")
        .insert({
          user_id: user.id,
          provider_type: formData.provider_type,
          business_name: formData.business_name,
          tagline: formData.tagline,
          description: formData.description,
          engagement_models: formData.engagement_models,
          metadata,
          city: formData.city,
          country: formData.country,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Profile created successfully!");
      navigate(`/services/provider/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Choose Your Provider Type
        </h3>
        <p className="text-sm text-muted-foreground">
          What type of services will you offer?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = formData.provider_type === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id as ProviderCategory)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="font-semibold">{cat.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name *</Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => updateFormData({ business_name: e.target.value })}
          placeholder="e.g., Dr. Ahmed Clinic or Ahmed Dev Studio"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={formData.tagline}
          onChange={(e) => updateFormData({ tagline: e.target.value })}
          placeholder="A short, catchy description"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Describe Your Services</h3>
        <p className="text-sm text-muted-foreground">
          Tell potential clients about what you offer
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe your services, expertise, and what makes you unique..."
          rows={6}
        />
      </div>

      <div>
        <Label className="mb-3 block">Engagement Models *</Label>
        <p className="text-sm text-muted-foreground mb-3">
          How do you want to work with clients?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(ENGAGEMENT_MODELS[formData.provider_type] || []).map((model) => {
            const Icon = model.icon;
            const isSelected = formData.engagement_models?.includes(
              model.id as EngagementModel,
            );

            return (
              <button
                key={model.id}
                onClick={() =>
                  handleEngagementToggle(model.id as EngagementModel)
                }
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{model.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Professional Details</h3>
        <p className="text-sm text-muted-foreground">
          Specific information based on your provider type
        </p>
      </div>

      {formData.provider_type === "health" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="license_number">Medical License Number *</Label>
            <Input
              id="license_number"
              value={formData.license_number || ""}
              onChange={(e) =>
                updateFormData({ license_number: e.target.value })
              }
              placeholder="Your official medical license number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization *</Label>
            <Input
              id="specialization"
              value={formData.specialization || ""}
              onChange={(e) =>
                updateFormData({ specialization: e.target.value })
              }
              placeholder="e.g., Cardiology, Dentistry, Pediatrics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of Experience</Label>
            <Input
              id="years_of_experience"
              type="number"
              value={formData.years_of_experience || ""}
              onChange={(e) =>
                updateFormData({
                  years_of_experience: parseInt(e.target.value),
                })
              }
              placeholder="e.g., 10"
            />
          </div>
        </>
      )}

      {formData.provider_type === "freelance" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills *</Label>
            <Input
              id="skills"
              value={formData.skills || ""}
              onChange={(e) => updateFormData({ skills: e.target.value })}
              placeholder="e.g., React, TypeScript, UI Design (comma-separated)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Hourly Rate (EGP) *</Label>
            <Input
              id="hourly_rate"
              type="number"
              value={formData.hourly_rate || ""}
              onChange={(e) =>
                updateFormData({ hourly_rate: parseFloat(e.target.value) })
              }
              placeholder="e.g., 200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio URL</Label>
            <Input
              id="portfolio_url"
              value={formData.portfolio_url || ""}
              onChange={(e) =>
                updateFormData({ portfolio_url: e.target.value })
              }
              placeholder="https://behance.net/yourprofile"
            />
          </div>
        </>
      )}

      {(formData.provider_type === "professional" ||
        formData.provider_type === "education") && (
        <>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization || ""}
              onChange={(e) =>
                updateFormData({ specialization: e.target.value })
              }
              placeholder="e.g., Corporate Law, Math Tutoring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of Experience</Label>
            <Input
              id="years_of_experience"
              type="number"
              value={formData.years_of_experience || ""}
              onChange={(e) =>
                updateFormData({
                  years_of_experience: parseInt(e.target.value),
                })
              }
              placeholder="e.g., 15"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Location & Contact</h3>
        <p className="text-sm text-muted-foreground">
          Where are you located? (Optional for online-only providers)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={formData.city || ""}
          onChange={(e) => updateFormData({ city: e.target.value })}
          placeholder="e.g., Cairo, Alexandria"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={formData.country || "EG"}
          onChange={(e) => updateFormData({ country: e.target.value })}
          placeholder="e.g., EG, SA, AE"
        />
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Preview</h4>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Type:</strong> {formData.provider_type}
          </p>
          <p>
            <strong>Business:</strong> {formData.business_name}
          </p>
          <p>
            <strong>Tagline:</strong> {formData.tagline || "N/A"}
          </p>
          <p>
            <strong>Engagement:</strong>{" "}
            {formData.engagement_models?.join(", ")}
          </p>
          {formData.specialization && (
            <p>
              <strong>Specialization:</strong> {formData.specialization}
            </p>
          )}
          {formData.hourly_rate && (
            <p>
              <strong>Hourly Rate:</strong> {formData.hourly_rate} EGP
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Service Provider</h1>
          <p className="text-muted-foreground">
            Join Aurora and start offering your professional services
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={(step / 4) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}% Complete</span>
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Provider Type"}
              {step === 2 && "Service Details"}
              {step === 3 && "Professional Information"}
              {step === 4 && "Location & Review"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Choose what best describes your services"}
              {step === 2 && "Tell us how you want to work"}
              {step === 3 && "Share your expertise and qualifications"}
              {step === 4 && "Final details before submission"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                Previous
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  disabled={!validateStep()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep()}
                >
                  {loading ? "Creating Profile..." : "Submit Profile"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
