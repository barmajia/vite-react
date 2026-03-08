import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckoutFormData {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  saveAddress: boolean;
}

interface CheckoutFormProps {
  formData: CheckoutFormData;
  updateFormData: (updates: Partial<CheckoutFormData>) => void;
}

export function CheckoutForm({ formData, updateFormData }: CheckoutFormProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input
            id="addressLine1"
            value={formData.addressLine1}
            onChange={(e) => updateFormData({ addressLine1: e.target.value })}
            placeholder="123 Main St"
          />
        </div>

        <div>
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            id="addressLine2"
            value={formData.addressLine2}
            onChange={(e) => updateFormData({ addressLine2: e.target.value })}
            placeholder="Apt 4B (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="New York"
            />
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="NY"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => updateFormData({ postalCode: e.target.value })}
              placeholder="10001"
            />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => updateFormData({ country: e.target.value })}
              placeholder="United States"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="saveAddress"
            checked={formData.saveAddress}
            onCheckedChange={(checked: boolean | 'indeterminate') =>
              updateFormData({ saveAddress: checked === true })
            }
          />
          <Label htmlFor="saveAddress" className="text-sm">
            Save this address for future orders
          </Label>
        </div>
      </div>
    </div>
  );
}
