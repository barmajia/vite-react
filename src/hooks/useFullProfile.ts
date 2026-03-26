import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { FullUserProfile } from "@/types/profile";

export function useFullProfile(userId?: string) {
  const { user: authUser } = useAuth();
  const targetUserId = userId || authUser?.id;

  return useQuery<FullUserProfile>({
    queryKey: ["full-profile", targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User not authenticated");

      // 1. Fetch core user data
      const { data: coreUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      // Fallback to auth metadata if user not found in public.users
      if (userError || !coreUser) {
        return {
          core: {
            id: authUser?.id || "",
            user_id: authUser?.id || "",
            email: authUser?.email || "",
            full_name: authUser?.user_metadata?.full_name || null,
            phone: authUser?.phone || null,
            avatar_url: authUser?.user_metadata?.avatar_url || null,
            account_type:
              (authUser?.user_metadata?.account_type as any) || "user",
            created_at: authUser?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            location: null,
            currency: "EGP",
            is_verified: false,
            is_factory: false,
          },
          addresses: [],
          stats: getDefaultStats(),
        } as FullUserProfile;
      }

      const userProfile = coreUser;
      const accountType = userProfile.account_type;

      // 2. Fetch role-specific data (parallel where possible)
      const results = await Promise.all([
        // Seller/Factory
        accountType === "seller" || accountType === "factory"
          ? supabase
              .from("sellers")
              .select("*")
              .eq("user_id", targetUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        // Middleman
        accountType === "middleman"
          ? supabase
              .from("middleman_profiles")
              .select("*")
              .eq("user_id", targetUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        // Business profile (for middleman/seller)
        accountType === "middleman" ||
        accountType === "seller" ||
        accountType === "factory"
          ? supabase
              .from("business_profiles")
              .select("*")
              .eq("user_id", targetUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        // Customer record (any user might have one)
        supabase
          .from("customers")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle(),

        // Delivery driver
        accountType === "delivery_driver"
          ? supabase
              .from("delivery_profiles")
              .select("*")
              .eq("user_id", targetUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const [sellerRes, middlemanRes, businessRes, customerRes, deliveryRes] =
        results;

      // 3. Fetch addresses
      const { data: addresses = [] } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", targetUserId)
        .order("is_default", { ascending: false });

      // 4. Fetch stats (parallel queries)
      const statsResults = await Promise.all([
        // Orders as customer
        supabase
          .from("orders")
          .select("status, total, payment_status")
          .eq("user_id", targetUserId),

        // Sales as seller
        supabase
          .from("orders")
          .select("total, payment_status")
          .eq("seller_id", targetUserId),

        // Notifications
        supabase
          .from("notifications")
          .select("is_read")
          .eq("user_id", targetUserId),

        // Wishlist
        supabase.from("wishlist").select("id").eq("user_id", targetUserId),

        // Conversations count - use conversation_participants instead
        supabase
          .from("conversation_participants")
          .select("conversation_id", { count: "exact" })
          .eq("user_id", targetUserId),
      ]);

      const [
        ordersRes,
        salesRes,
        notificationsRes,
        wishlistRes,
        conversationsRes,
      ] = statsResults;

      // 5. Fetch analytics for sellers/factories
      let analyticsData: any = null;
      if (accountType === "seller" || accountType === "factory") {
        try {
          const { data: kpis } = await supabase.rpc("get_seller_kpis", {
            p_seller_id: targetUserId,
            p_period: "30d",
          });
          analyticsData = kpis;
        } catch (e) {
          console.warn("Could not fetch seller analytics:", e);
        }
      }

      // 6. Build unified profile
      const ordersData = ordersRes.data || [];
      const salesData = salesRes.data || [];

      return {
        core: userProfile,
        seller: sellerRes.data,
        middleman: middlemanRes.data,
        customer: customerRes.data,
        delivery: deliveryRes.data,
        business: businessRes.data,
        addresses: addresses,
        stats: {
          orders: {
            totalOrders: ordersData.length,
            pendingOrders:
              ordersData.filter((o: any) => o.status === "pending").length || 0,
            completedOrders:
              ordersData.filter((o: any) => o.status === "delivered").length ||
              0,
            totalSpent:
              ordersData.reduce(
                (sum: number, o: any) => sum + (o.total || 0),
                0,
              ) || 0,
            totalEarned:
              salesData
                .filter((o: any) => o.payment_status === "completed")
                .reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0,
          },
          notifications: {
            total: notificationsRes.data?.length || 0,
            unread:
              notificationsRes.data?.filter((n: any) => !n.is_read).length || 0,
          },
          wishlist: {
            totalItems: wishlistRes.data?.length || 0,
          },
          conversations: {
            total: conversationsRes.count || 0,
            unread: 0,
          },
          analytics: analyticsData,
        },
      } as FullUserProfile;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

// Helper: Default stats structure
function getDefaultStats(): FullUserProfile["stats"] {
  return {
    orders: {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      totalEarned: 0,
    },
    notifications: { total: 0, unread: 0 },
    wishlist: { totalItems: 0 },
    conversations: {
      total: 0,
      unread: 0,
    },
    analytics: null,
  };
}
