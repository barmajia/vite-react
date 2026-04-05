import { Input, Label, Checkbox } from '@/components/ui';

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
    <div className="glass-card p-8 border-slate-200/50 dark:border-slate-800/50">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Shipping Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="fullName" className="text-sm font-semibold mb-2 block">Full Name *</Label>
          <Input
            id="fullName"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary focus:border-primary transition-all"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="addressLine1" className="text-sm font-semibold mb-2 block">Address Line 1 *</Label>
          <Input
            id="addressLine1"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.addressLine1}
            onChange={(e) => updateFormData({ addressLine1: e.target.value })}
            placeholder="123 Main St"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="addressLine2" className="text-sm font-semibold mb-2 block">Address Line 2 (Optional)</Label>
          <Input
            id="addressLine2"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.addressLine2}
            onChange={(e) => updateFormData({ addressLine2: e.target.value })}
            placeholder="Apt 4B"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-sm font-semibold mb-2 block">City *</Label>
          <Input
            id="city"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder="New York"
          />
        </div>

        <div>
          <Label htmlFor="state" className="text-sm font-semibold mb-2 block">State *</Label>
          <Input
            id="state"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.state}
            onChange={(e) => updateFormData({ state: e.target.value })}
            placeholder="NY"
          />
        </div>

        <div>
          <Label htmlFor="postalCode" className="text-sm font-semibold mb-2 block">Postal Code *</Label>
          <Input
            id="postalCode"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.postalCode}
            onChange={(e) => updateFormData({ postalCode: e.target.value })}
            placeholder="10001"
          />
        </div>

        <div>
          <Label htmlFor="country" className="text-sm font-semibold mb-2 block">Country *</Label>
          <Input
            id="country"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.country}
            onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="United States"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="phone" className="text-sm font-semibold mb-2 block">Phone Number *</Label>
          <Input
            id="phone"
            className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="md:col-span-2 flex items-center space-x-3 pt-4">
          <Checkbox
            id="saveAddress"
            className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary transition-colors"
            checked={formData.saveAddress}
            onCheckedChange={(checked: boolean | 'indeterminate') =>
              updateFormData({ saveAddress: checked === true })
            }
          />
          <Label htmlFor="saveAddress" className="text-sm font-medium cursor-pointer select-none">
            Save this address as my primary shipping address
          </Label>
        </div>
      </div>
    </div>
  );
}
