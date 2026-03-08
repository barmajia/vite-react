import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUnreadNotifications() {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return unreadCount;
}
