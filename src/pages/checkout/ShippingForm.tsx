import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, Building } from 'lucide-react';
import { toast } from 'sonner';

interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

interface ShippingFormProps {
  onSubmit: (address: ShippingAddress) => void;
  onBack: () => void;
}

export default function ShippingForm({ onSubmit, onBack }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const updateFormData = (data: Partial<ShippingAddress>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear error when user starts typing
    if (errors[data as keyof ShippingAddress]) {
      setErrors((prev) => ({ ...prev, [data as keyof ShippingAddress]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State/Province is required';
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const inputClass = (field: keyof ShippingAddress) =>
    `w-full ${errors[field] ? 'border-red-500 focus:border-red-500' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData({ full_name: e.target.value })}
            placeholder="John Doe"
            className={inputClass('full_name')}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="+20 123 456 7890"
            className={inputClass('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Address Line 1 */}
        <div>
          <Label htmlFor="address_line1">Street Address *</Label>
          <Input
            id="address_line1"
            value={formData.address_line1}
            onChange={(e) => updateFormData({ address_line1: e.target.value })}
            placeholder="123 Main Street"
            className={inputClass('address_line1')}
          />
          {errors.address_line1 && (
            <p className="text-sm text-red-500 mt-1">{errors.address_line1}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <Label htmlFor="address_line2">Apartment, Suite, etc. (optional)</Label>
          <Input
            id="address_line2"
            value={formData.address_line2}
            onChange={(e) => updateFormData({ address_line2: e.target.value })}
            placeholder="Apt 4B"
          />
        </div>

        {/* City, State, Postal Code */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="Cairo"
              className={inputClass('city')}
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">State/Province *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="Cairo Governorate"
              className={inputClass('state')}
            />
            {errors.state && (
              <p className="text-sm text-red-500 mt-1">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => updateFormData({ postal_code: e.target.value })}
              placeholder="11511"
              className={inputClass('postal_code')}
            />
            {errors.postal_code && (
              <p className="text-sm text-red-500 mt-1">{errors.postal_code}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => updateFormData({ country: e.target.value })}
              placeholder="Egypt"
              className={inputClass('country')}
            />
            {errors.country && (
              <p className="text-sm text-red-500 mt-1">{errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Type Quick Select */}
      <div>
        <Label>Address Type (optional)</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            type="button"
            onClick={() => updateFormData({
              address_line1: '',
              city: '',
              state: '',
              postal_code: '',
            })}
            className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </button>
          <button
            type="button"
            onClick={() => updateFormData({
              address_line1: '',
              city: '',
              state: '',
              postal_code: '',
            })}
            className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building className="h-5 w-5 mb-1" />
            <span className="text-xs">Work</span>
          </button>
          <button
            type="button"
            onClick={() => updateFormData({
              address_line1: '',
              city: '',
              state: '',
              postal_code: '',
            })}
            className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPin className="h-5 w-5 mb-1" />
            <span className="text-xs">Other</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue to Payment
        </Button>
      </div>
    </form>
  );
}
