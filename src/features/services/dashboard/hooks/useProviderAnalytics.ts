import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const useProviderAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-analytics", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // 1. Get Provider Profile to determine type
      const { data: profile } = await supabase
        .from("service_providers")
        .select("provider_type, rating_avg, total_jobs")
        .eq("user_id", user.id)
        .single();

      if (!profile) return null;

      // 2. Fetch Bookings Stats
      const { data: bookingsStats } = await supabase
        .from("service_bookings")
        .select("status, total_price", { count: "exact" })
        .eq("provider_id", user.id);

      // 3. Calculate Revenue (Sum of completed bookings)
      const revenueData = bookingsStats
        ?.filter((b: any) => b.status === "completed")
        .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);

      const pendingCount =
        bookingsStats?.filter((b: any) => b.status === "pending").length || 0;
      const completedCount =
        bookingsStats?.filter((b: any) => b.status === "completed").length || 0;

      return {
        profile,
        stats: {
          pendingBookings: pendingCount,
          completedJobs: completedCount,
          totalRevenue: revenueData || 0,
          rating: profile.rating_avg || 0,
        },
      };
    },
    enabled: !!user,
  });
};
