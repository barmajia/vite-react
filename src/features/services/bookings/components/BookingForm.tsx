import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookingFormProps {
  notes: string;
  setNotes: (notes: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
}

export function BookingForm({
  notes,
  setNotes,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
}: BookingFormProps) {
  return (
    <div className="space-y-4">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        <div className="space-y-2">
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            placeholder="John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone Number *</Label>
          <Input
            id="customerPhone"
            type="tel"
            placeholder="+20 123 456 7890"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email Address</Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="john@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2 pt-4">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Tell the provider about your project requirements, preferences, or any questions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Provide details about your project to help the provider understand
          your needs.
        </p>
      </div>
    </div>
  );
}
