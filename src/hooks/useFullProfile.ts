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

      if (userError || !coreUser) {
        // Fallback to auth metadata
        return {
          core: {
            id: authUser?.id || "",
            user_id: authUser?.id || "",
            email: authUser?.email || "",
            full_name: authUser?.user_metadata?.full_name || null,
            phone: authUser?.phone || null,
            avatar_url: authUser?.user_metadata?.avatar_url || null,
            account_type: authUser?.user_metadata?.account_type || "customer",
            created_at: authUser?.created_at || "",
            updated_at: "",
          },
          addresses: [],
          stats: {
            orders: {
              totalOrders: 0,
              pendingOrders: 0,
              completedOrders: 0,
              totalSpent: 0,
              totalEarned: 0,
            },
            notifications: { total: 0, unread: 0 },
            wishlist: { totalItems: 0, count: 0 },
            conversations: { activeChats: 0, unreadMessages: 0, total: 0, unread: 0 },
            analytics: null,
          },
        } as FullUserProfile;
      }

      const userProfile = coreUser as FullUserProfile["core"];

      // 2. Fetch role-specific data
      let sellerData = null;
      let middlemanData = null;
      let customerData = null;
      let deliveryData = null;
      let businessData = null;

      if (
        userProfile.account_type === "seller" ||
        userProfile.account_type === "factory"
      ) {
        const { data: seller, error: sellerError } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle();
        sellerData = seller;
        if (sellerError && sellerError.code !== "PGRST116") {
          console.warn("Could not fetch seller data:", sellerError.message);
        }
      }

      if ((userProfile.account_type as string) === "middleman") {
        const [{ data: middleman, error: middlemanError }, { data: business }] =
          await Promise.all([
            supabase
              .from("middleman_profiles")
              .select("*")
              .eq("user_id", targetUserId)
              .maybeSingle(),
            supabase
              .from("business_profiles")
              .select("*")
              .eq("user_id", targetUserId)
              .maybeSingle(),
          ]);
        middlemanData = middleman;
        businessData = business;
        if (middlemanError && middlemanError.code !== "PGRST116") {
          console.warn(
            "Could not fetch middleman data:",
            middlemanError.message,
          );
        }
      }

      if ((userProfile.account_type as string) === "user") {
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle();
        customerData = customer;
        if (customerError && customerError.code !== "PGRST116") {
          console.warn("Could not fetch customer data:", customerError.message);
        }
      }

      if ((userProfile.account_type as string) === "delivery_driver") {
        const { data: delivery, error: deliveryError } = await supabase
          .from("delivery_profiles")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle();
        deliveryData = delivery;
        if (deliveryError && deliveryError.code !== "PGRST116") {
          console.warn("Could not fetch delivery data:", deliveryError.message);
        }
      }

      // 3. Fetch addresses
      const { data: addresses = [] } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", targetUserId)
        .order("is_default", { ascending: false });

      // 4. Fetch stats (parallel queries)
      const [ordersRes, salesRes, notificationsRes, wishlistRes] =
        await Promise.all([
          supabase
            .from("orders")
            .select("status, total")
            .eq("user_id", targetUserId),
          supabase.from("orders").select("total").eq("seller_id", targetUserId),
          supabase
            .from("notifications")
            .select("is_read")
            .eq("user_id", targetUserId),
          supabase.from("wishlist").select("id").eq("user_id", targetUserId),
        ]);

      const ordersData = ordersRes.data || [];
      const salesData = salesRes.data || [];

      // 5. Build unified profile
      return {
        core: userProfile,
        seller: sellerData,
        middleman: middlemanData,
        customer: customerData,
        delivery: deliveryData,
        business: businessData,
        addresses: addresses,
        stats: {
          orders: {
            totalOrders: ordersData.length,
            pendingOrders: ordersData.filter((o: any) => o.status === "pending")
              .length,
            completedOrders: ordersData.filter(
              (o: any) => o.status === "delivered",
            ).length,
            totalSpent: ordersData.reduce(
              (sum: number, o: any) => sum + (o.total || 0),
              0,
            ),
            totalEarned: salesData.reduce(
              (sum: number, o: any) => sum + (o.total || 0),
              0,
            ),
          },
          notifications: {
            total: notificationsRes.data?.length || 0,
            unread:
              notificationsRes.data?.filter((n: any) => !n.is_read).length || 0,
          },
          wishlist: {
            totalItems: wishlistRes.data?.length || 0,
            count: wishlistRes.data?.length || 0,
          },
          conversations: {
            total: 0,
            unread: 0,
            activeChats: 0,
            unreadMessages: 0,
          },
          analytics: null,
        },
      } as FullUserProfile;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  });
}
