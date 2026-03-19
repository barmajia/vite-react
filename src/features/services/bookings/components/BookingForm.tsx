import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

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

export const BookingForm = ({ 
  notes, setNotes, 
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  customerEmail, setCustomerEmail
}: BookingFormProps) => {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
          <Input 
            id="name" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
          <Input 
            id="email" 
            type="email"
            value={customerEmail} 
            onChange={(e) => setCustomerEmail(e.target.value)} 
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
          <Input 
            id="phone" 
            value={customerPhone} 
            onChange={(e) => setCustomerPhone(e.target.value)} 
            placeholder="+20 123 456 7890"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes / Requirements</Label>
          <Textarea 
            id="notes" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Describe any specific details or requirements..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};
