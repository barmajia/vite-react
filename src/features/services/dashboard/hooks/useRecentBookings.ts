import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const useRecentBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['provider-recent-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Join with service_listings to get provider_id
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          total_price,
          created_at,
          customer:users!service_bookings_customer_id (
            full_name,
            avatar_url
          ),
          listing:service_listings (
            id,
            title
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
