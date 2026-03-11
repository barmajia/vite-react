import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { FactoryAnalytics } from '../types/factory';

export const useFactoryAnalytics = (periodDays: number = 30) => {
  const { user } = useAuth();

  const fetchAnalytics = async (): Promise<FactoryAnalytics> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('get_seller_kpis', {
      p_seller_id: user.id,
      p_period_days: periodDays,
    });

    if (error) throw error;

    const kpi = data[0];
    return {
      totalRevenue: parseFloat(kpi.total_revenue) || 0,
      totalOrders: parseInt(kpi.total_orders) || 0,
      completedOrders: parseInt(kpi.completed_orders) || 0,
      pendingOrders: parseInt(kpi.pending_orders) || 0,
      averageRating: parseFloat(kpi.average_rating) || 0,
      totalReviews: parseInt(kpi.total_reviews) || 0,
      totalProducts: parseInt(kpi.total_products) || 0,
      activeProducts: parseInt(kpi.active_products) || 0,
      revenueGrowth: parseFloat(kpi.revenue_growth) || 0,
      orderGrowth: parseFloat(kpi.order_growth) || 0,
    };
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['factoryAnalytics', periodDays],
    queryFn: fetchAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });

  return {
    analytics: data,
    isLoading,
    error,
    refetch,
  };
};
