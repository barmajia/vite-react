import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Briefcase, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function OnboardingWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "individual";
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    provider_name: "",
    tagline: "",
    description: "",
    location_city: "",
    location_country: "",
    specialties: "",
    registration_number: "",
    website: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }

    try {
      const specialtiesArray = formData.specialties
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      // Determine if auto-approve or pending review
      const status = role === "hospital" ? "pending_review" : "active";
      const isVerified = role !== "hospital";

      const { data, error } = await supabase
        .from("svc_providers")
        .insert({
          user_id: user.id,
          provider_name: formData.provider_name || user.user_metadata.full_name,
          provider_type: role,
          tagline: formData.tagline,
          description: formData.description,
          location_city: formData.location_city,
          location_country: formData.location_country,
          specialties: specialtiesArray,
          registration_number: formData.registration_number || null,
          website: formData.website,
          phone: formData.phone || user.user_metadata.phone,
          status,
          is_verified: isVerified,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Profile created successfully!");

      if (status === "pending_review") {
        toast.info("Your profile is pending admin approval");
        navigate("/services/dashboard/pending");
      } else {
        navigate(`/services/provider/${data.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const isCompanyOrHospital = role === "company" || role === "hospital";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step >= 1 ? <CheckCircle size={16} /> : "1"}
              </div>
              <span className="text-sm font-medium">Business Info</span>
            </div>
            <div className="flex-1 mx-4 h-px bg-muted" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step >= 2 ? <CheckCircle size={16} /> : "2"}
              </div>
              <span className="text-sm font-medium">Location</span>
            </div>
            <div className="flex-1 mx-4 h-px bg-muted" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step >= 3 ? <CheckCircle size={16} /> : "3"}
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  Step {step} of 3 -{" "}
                  {step === 1
                    ? "Tell us about your services"
                    : step === 2
                      ? "Where are you located?"
                      : "Review and submit"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="provider_name">
                      {role === "individual"
                        ? "Professional Name"
                        : "Organization Name"}{" "}
                      *
                    </Label>
                    <Input
                      id="provider_name"
                      value={formData.provider_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          provider_name: e.target.value,
                        })
                      }
                      placeholder={
                        role === "individual"
                          ? "e.g. John Doe"
                          : role === "company"
                            ? "e.g. Tech Solutions Inc."
                            : "e.g. Cairo Medical Center"
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline *</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) =>
                        setFormData({ ...formData, tagline: e.target.value })
                      }
                      placeholder="e.g. Expert React Developer | 5 Years Experience"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your services, expertise, and what makes you unique..."
                      rows={5}
                      required
                    />
                  </div>

                  {isCompanyOrHospital && (
                    <div className="space-y-2">
                      <Label htmlFor="registration_number">
                        {role === "company"
                          ? "Business Registration"
                          : "Medical License"}{" "}
                        Number
                      </Label>
                      <Input
                        id="registration_number"
                        value={formData.registration_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registration_number: e.target.value,
                          })
                        }
                        placeholder="Official registration/license number"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="specialties">Skills / Specialties</Label>
                    <Input
                      id="specialties"
                      value={formData.specialties}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialties: e.target.value,
                        })
                      }
                      placeholder="e.g. Web Development, Mobile Apps, UI Design (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple skills with commas
                    </p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location_city">City *</Label>
                      <Input
                        id="location_city"
                        value={formData.location_city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location_city: e.target.value,
                          })
                        }
                        placeholder="e.g. Cairo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location_country">Country *</Label>
                      <Input
                        id="location_country"
                        value={formData.location_country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location_country: e.target.value,
                          })
                        }
                        placeholder="e.g. Egypt"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+20 1XX XXX XXXX"
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Business Name:
                      </span>
                      <span className="text-sm font-medium">
                        {formData.provider_name || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Tagline:
                      </span>
                      <span className="text-sm font-medium">
                        {formData.tagline || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Location:
                      </span>
                      <span className="text-sm font-medium">
                        {formData.location_city && formData.location_country
                          ? `${formData.location_city}, ${formData.location_country}`
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Role:
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {role}
                      </span>
                    </div>
                    {formData.specialties && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Skills:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.specialties
                            .split(",")
                            .map((s: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                              >
                                {s.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {role === "hospital" && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        <strong>Note:</strong> Hospital/Clinic profiles require
                        admin approval before going live. You'll receive an
                        email once your profile is verified.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="flex-1"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Creating Profile..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By completing this setup, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
