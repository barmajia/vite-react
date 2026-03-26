import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const useRecentBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-recent-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch recent bookings with customer info
      const { data, error } = await supabase
        .from("svc_orders")
        .select(
          `
          id,
          ordered_at,
          status,
          agreed_price,
          created_at,
          listing_id,
          user_id
        `,
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch listing details separately if we have bookings
      if (data && data.length > 0) {
        const listingIds = data.map((b) => b.listing_id).filter(Boolean);
        if (listingIds.length > 0) {
          const { data: listings } = await supabase
            .from("svc_listings")
            .select("id, title")
            .in("id", listingIds);

          // Fetch customer names
          const customerIds = data.map((b) => b.user_id).filter(Boolean);
          const { data: customers } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", customerIds);

          // Merge listings and customers with bookings
          return data.map((booking) => ({
            ...booking,
            listing: listings?.find((l) => l.id === booking.listing_id),
            customer_name: customers?.find((c) => c.id === booking.user_id)
              ?.full_name,
          }));
        }
      }

      return data;
    },
    enabled: !!user,
  });
};
