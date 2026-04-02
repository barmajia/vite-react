import { useState } from "react";
import { CustomerSignupData } from "@/types/signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface CustomerSignupFormProps {
  onSubmit: (data: CustomerSignupData) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

export function CustomerSignupForm({
  onSubmit,
  onBack,
  loading,
}: CustomerSignupFormProps) {
  const [formData, setFormData] = useState<CustomerSignupData>({
    account_type: "customer",
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = {
      ...formData,
      email: (formData.email ?? "").trim().toLowerCase(),
      full_name: (formData.full_name ?? "").trim(),
      phone: (formData.phone ?? "").trim(),
      password: formData.password, // keep as-is
    };

    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name" className="text-gray-700 dark:text-gray-200">
          Customer Name
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
          placeholder="you@example.com"
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

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
