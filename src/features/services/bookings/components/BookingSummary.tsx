import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface BookingSummaryProps {
  serviceTitle: string;
  providerName: string;
  price: number;
  currency: string;
  selectedDate?: Date;
  selectedTime?: string | null;
  bookingType?: 'appointment' | 'project';
}

export const BookingSummary = ({ 
  serviceTitle, 
  providerName, 
  price, 
  currency,
  selectedDate,
  selectedTime,
  bookingType = 'appointment'
}: BookingSummaryProps) => {
  const subtotal = price;
  const serviceFee = subtotal * 0.05; // 5% platform fee
  const total = subtotal + serviceFee;

  return (
    <Card className="sticky top-24 border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-base">{serviceTitle}</h4>
          <p className="text-sm text-muted-foreground">with {providerName}</p>
          <Badge variant="secondary" className="mt-2 capitalize">{bookingType}</Badge>
        </div>

        <Separator />

        {selectedDate && selectedTime && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service Price</span>
            <span>{subtotal.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform Fee</span>
            <span>{serviceFee.toFixed(2)} {currency}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base pt-2">
            <span>Total</span>
            <span>{total.toFixed(2)} {currency}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
