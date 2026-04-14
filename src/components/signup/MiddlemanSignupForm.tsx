import { useState } from "react";
import { MiddlemanSignupData } from "@/types/signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MiddlemanSignupFormProps {
  onSubmit?: (data: MiddlemanSignupData) => Promise<void>;
  onBack: () => void;
  onGoogleSignup?: () => void;
  loading: boolean;
}

export function MiddlemanSignupForm({
  onBack,
  onGoogleSignup,
  loading: externalLoading,
}: MiddlemanSignupFormProps) {
  const { signUpMiddleman } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<MiddlemanSignupData, "account_type"> & { bio?: string }>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    company_name: "",
    location: "",
    currency: "USD",
    commission_rate: 5,
    specialization: "",
    years_of_experience: undefined,
    tax_id: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUpMiddleman(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone,
        formData.company_name,
        formData.location,
        formData.currency,
        formData.commission_rate,
        formData.specialization || undefined,
        formData.years_of_experience || undefined,
        formData.tax_id || undefined,
        formData.bio || undefined,
      );

      if (result.error) {
        toast.error(result.error.message || "Failed to create middleman account");
        setLoading(false);
        return;
      }

      // Success!
      toast.success("Middleman account created successfully! Please check your email for verification.");
      
      // Optionally redirect or handle success state
      setTimeout(() => {
        window.location.href = "/auth/verify-email";
      }, 2000);
      
    } catch (err) {
      console.error("Middleman signup error:", err);
      toast.error("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const isLoading = externalLoading || loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h3>
        <div>
          <Label htmlFor="full_name" className="text-gray-700 dark:text-gray-200">
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
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@company.com"
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-gray-700 dark:text-gray-200">
            Phone Number
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 8900"
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Min 8 characters"
            minLength={8}
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <Separator className="bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Business Information
        </h3>
        <div>
          <Label htmlFor="company_name" className="text-gray-700 dark:text-gray-200">
            Company Name
          </Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) =>
              setFormData({ ...formData, company_name: e.target.value })
            }
            placeholder="Your Company Ltd."
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="location" className="text-gray-700 dark:text-gray-200">
            Business Location
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="City, Country"
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currency" className="text-gray-700 dark:text-gray-200">
              Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(v) =>
                setFormData({ ...formData, currency: v })
              }
            >
              <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
            <Label htmlFor="commission_rate" className="text-gray-700 dark:text-gray-200">
              Commission Rate (%)
            </Label>
            <Input
              id="commission_rate"
              type="number"
              value={formData.commission_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_rate: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              max="100"
              step="0.1"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="specialization" className="text-gray-700 dark:text-gray-200">
            Specialization
          </Label>
          <Input
            id="specialization"
            value={formData.specialization}
            onChange={(e) =>
              setFormData({ ...formData, specialization: e.target.value })
            }
            placeholder="e.g., Electronics, Textiles"
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="years_of_experience" className="text-gray-700 dark:text-gray-200">
              Years of Experience
            </Label>
            <Input
              id="years_of_experience"
              type="number"
              value={formData.years_of_experience || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  years_of_experience: parseInt(e.target.value) || undefined,
                })
              }
              min="0"
              max="50"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <div>
            <Label htmlFor="tax_id" className="text-gray-700 dark:text-gray-200">
              Tax ID / VAT Number
            </Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) =>
                setFormData({ ...formData, tax_id: e.target.value })
              }
              placeholder="Required for verification"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>

      {onGoogleSignup && (
        <>
          <div className="relative py-2">
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-3 text-xs text-gray-400 dark:text-gray-500">
              or
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onGoogleSignup}
            disabled={isLoading}
            className="w-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ⚠️ Your account will be <strong>pending verification</strong> until admin approves your documents (1-3 business days).
        </p>
      </div>
    </form>
  );
}
