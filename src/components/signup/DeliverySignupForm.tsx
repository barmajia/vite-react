import { useState } from "react";
import { DeliverySignupData } from "@/types/signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeliverySignupFormProps {
  onSubmit: (data: DeliverySignupData) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

export function DeliverySignupForm({
  onSubmit,
  onBack,
  loading,
}: DeliverySignupFormProps) {
  const [formData, setFormData] = useState<DeliverySignupData>({
    account_type: "delivery",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    vehicle_type: "motorcycle",
    vehicle_number: "",
    location: "",
    currency: "USD",
    commission_rate: 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h3>

        <div>
          <Label
            htmlFor="full_name"
            className="text-gray-700 dark:text-gray-200"
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
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
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
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+1 234 567 8900"
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label
            htmlFor="password"
            className="text-gray-700 dark:text-gray-200"
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
            placeholder="Min 8 characters"
            minLength={8}
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Vehicle Information
        </h3>

        <div>
          <Label
            htmlFor="vehicle_type"
            className="text-gray-700 dark:text-gray-200"
          >
            Vehicle Type
          </Label>
          <Select
            value={formData.vehicle_type}
            onValueChange={(v: string) =>
              setFormData({ ...formData, vehicle_type: v })
            }
          >
            <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem
                value="motorcycle"
                className="text-gray-900 dark:text-white"
              >
                Motorcycle
              </SelectItem>
              <SelectItem value="car" className="text-gray-900 dark:text-white">
                Car
              </SelectItem>
              <SelectItem
                value="bicycle"
                className="text-gray-900 dark:text-white"
              >
                Bicycle
              </SelectItem>
              <SelectItem value="van" className="text-gray-900 dark:text-white">
                Van
              </SelectItem>
              <SelectItem
                value="truck"
                className="text-gray-900 dark:text-white"
              >
                Truck
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="vehicle_number"
            className="text-gray-700 dark:text-gray-200"
          >
            Vehicle Number / License Plate
          </Label>
          <Input
            id="vehicle_number"
            value={formData.vehicle_number}
            onChange={(e) =>
              setFormData({ ...formData, vehicle_number: e.target.value })
            }
            placeholder="ABC-123"
            required
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label
            htmlFor="location"
            className="text-gray-700 dark:text-gray-200"
          >
            Service Area / Location
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

        <div>
          <Label
            htmlFor="currency"
            className="text-gray-700 dark:text-gray-200"
          >
            Currency
          </Label>
          <Select
            value={formData.currency}
            onValueChange={(v) => setFormData({ ...formData, currency: v })}
          >
            <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="USD" className="text-gray-900 dark:text-white">
                USD ($)
              </SelectItem>
              <SelectItem value="EUR" className="text-gray-900 dark:text-white">
                EUR (€)
              </SelectItem>
              <SelectItem value="EGP" className="text-gray-900 dark:text-white">
                EGP (ج.م)
              </SelectItem>
              <SelectItem value="GBP" className="text-gray-900 dark:text-white">
                GBP (£)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="commission_rate"
            className="text-gray-700 dark:text-gray-200"
          >
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
