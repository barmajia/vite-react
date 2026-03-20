import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailabilityData {
  date: string;
  slots: TimeSlot[];
}

/**
 * Hook to fetch provider availability for a specific date
 */
export const useAvailability = (
  providerId: string | undefined,
  date: Date | undefined,
) => {
  return useQuery({
    queryKey: [
      "availability",
      providerId,
      date ? format(date, "yyyy-MM-dd") : null,
    ],
    queryFn: async (): Promise<AvailabilityData | null> => {
      if (!providerId || !date) return null;

      const dateStr = format(date, "yyyy-MM-dd");

      // Fetch provider's availability settings
      const { data: availability } = await supabase
        .from("service_availability")
        .select("*")
        .eq("provider_id", providerId)
        .eq("day_of_week", date.getDay())
        .eq("is_active", true);

      // Fetch existing bookings for the date
      const { data: bookings } = await supabase
        .from("service_bookings")
        .select("id, start_date, status")
        .eq("provider_id", providerId)
        .gte("start_date", dateStr)
        .lt(
          "start_date",
          new Date(new Date(dateStr).getTime() + 86400000)
            .toISOString()
            .split("T")[0],
        )
        .in("status", ["pending", "confirmed"]);

      // Generate time slots based on availability
      const slots: TimeSlot[] = [];

      if (availability && availability.length > 0) {
        availability.forEach((avail) => {
          const startHour = parseInt(avail.start_time.split(":")[0]);
          const endHour = parseInt(avail.end_time.split(":")[0]);
          const duration = avail.slot_duration_minutes || 30;

          for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += duration) {
              const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
              const isBooked = bookings?.some((b) => {
                const bookingTime = b.start_date
                  ? new Date(b.start_date).toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return bookingTime === time;
              });

              slots.push({
                time,
                available: !isBooked,
              });
            }
          }
        });
      } else {
        // Default availability: 9 AM - 5 PM, 30 min slots
        for (let hour = 9; hour < 17; hour++) {
          slots.push({
            time: `${hour.toString().padStart(2, "0")}:00`,
            available: true,
          });
          slots.push({
            time: `${hour.toString().padStart(2, "0")}:30`,
            available: true,
          });
        }

        // Mark booked slots as unavailable
        bookings?.forEach((booking) => {
          const bookingTime = booking.start_date
            ? new Date(booking.start_date).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          const slot = slots.find((s) => s.time === bookingTime);
          if (slot) slot.available = false;
        });
      }

      return {
        date: dateStr,
        slots: slots.sort((a, b) => a.time.localeCompare(b.time)),
      };
    },
    enabled: !!providerId && !!date,
  });
};
