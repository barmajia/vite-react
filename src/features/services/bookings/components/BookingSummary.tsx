import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface BookingSummaryProps {
  serviceTitle: string;
  providerName: string;
  price: number;
  currency: string;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  bookingType: string;
}

export function BookingSummary({
  serviceTitle,
  providerName,
  price,
  currency,
  selectedDate,
  selectedTime,
  bookingType,
}: BookingSummaryProps) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Not selected";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="sticky top-4">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Booking Summary</h3>

        {/* Service Info */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Service</p>
          <p className="font-semibold">{serviceTitle}</p>
          <p className="text-sm text-muted-foreground">by {providerName}</p>
        </div>

        <Separator />

        {/* Booking Type */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Type</p>
          <Badge variant="secondary" className="capitalize">
            {bookingType}
          </Badge>
        </div>

        <Separator />

        {/* Date & Time */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Date & Time
          </p>
          <p className="font-medium">{formatDate(selectedDate)}</p>
          <p className="text-sm text-muted-foreground">
            {selectedTime || "Not selected"}
          </p>
        </div>

        <Separator />

        {/* Price */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Price</p>
          <p className="text-2xl font-bold text-primary">
            {currency === "EGP" ? "EGP " : "$"}
            {price.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Payment will be collected after provider confirmation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
