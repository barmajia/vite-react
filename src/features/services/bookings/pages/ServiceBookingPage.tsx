import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

// Import Components
import { BookingCalendar } from "../components/BookingCalendar";
import { BookingForm } from "../components/BookingForm";
import { BookingSummary } from "../components/BookingSummary";

export const ServiceBookingPage = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();

  // Form State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Service Details
  const { data: listing, isLoading } = useQuery({
    queryKey: ["service-listing", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select(
          `
          *,
          provider:service_providers (
            id,
            provider_name,
            user_id
          )
        `,
        )
        .eq("id", listingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !customerName || !customerPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get provider's user_id from service_providers
      const { data: providerData } = await supabase
        .from("service_providers")
        .select("user_id")
        .eq("id", listing.provider?.id)
        .single();

      if (!providerData?.user_id) {
        throw new Error("Provider not found");
      }

      // Insert Booking
      const { error } = await supabase.from("service_bookings").insert({
        listing_id: listingId,
        customer_id: user.id,
        provider_id: providerData.user_id,
        booking_date: selectedDate.toISOString().split("T")[0],
        booking_time: selectedTime,
        status: "pending",
        total_price: listing?.price_numeric || 0,
        currency: listing?.currency || "EGP",
        booking_type: "appointment",
      });

      if (error) throw error;

      toast.success("Booking request sent successfully!");
      navigate("/services/dashboard/bookings");
    } catch (error: any) {
      toast.error("Failed to create booking: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return <div className="p-8 text-center">Loading service details...</div>;
  if (!listing)
    return <div className="p-8 text-center">Service not found.</div>;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/services/listing/${listingId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Service
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Book {listing.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete the form below to request an appointment.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Calendar & Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Date & Time */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">
              1. Select Date & Time
            </h2>
            <BookingCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              durationMinutes={listing.duration_minutes}
            />
          </section>

          {/* Step 2: Your Details */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">2. Your Details</h2>
            <BookingForm
              notes={notes}
              setNotes={setNotes}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
            />
          </section>
        </div>

        {/* Right Column: Summary & Action */}
        <div className="lg:col-span-1">
          <BookingSummary
            serviceTitle={listing.title}
            providerName={listing.provider?.provider_name || "Provider"}
            price={listing.price_numeric || 0}
            currency={listing.currency || "EGP"}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            bookingType="appointment"
          />

          <Button
            className="w-full mt-6 h-12 text-lg"
            onClick={handleSubmit}
            disabled={
              !selectedDate || !selectedTime || !customerName || isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              `Confirm Booking (${listing.price_numeric} ${listing.currency || "EGP"})`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            You won't be charged yet. The provider will confirm your request.
          </p>
        </div>
      </div>
    </div>
  );
};
