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
        .from("svc_providers")
        .select(
          "provider_type, average_rating, total_jobs_completed, total_earnings",
        )
        .eq("user_id", user.id)
        .single();

      if (!profile) return null;

      // 2. Fetch Bookings Stats
      const { data: bookingsStats } = await supabase
        .from("svc_orders")
        .select("id, ordered_at, status, agreed_price")
        .eq("provider_id", user.id);

      // 3. Calculate Revenue (Sum of completed bookings)
      const revenueData = bookingsStats
        ?.filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.agreed_price || 0), 0);

      const pendingCount =
        bookingsStats?.filter((b) => b.status === "pending").length || 0;
      const completedCount =
        bookingsStats?.filter((b) => b.status === "completed").length || 0;

      return {
        profile: {
          provider_type: profile.provider_type,
          rating_avg: profile.average_rating,
          total_jobs: profile.total_jobs_completed,
        },
        stats: {
          pendingBookings: pendingCount,
          completedJobs: completedCount,
          totalRevenue: revenueData || 0,
          rating: profile.average_rating || 0,
        },
      };
    },
    enabled: !!user,
  });
};
