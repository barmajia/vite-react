import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ProductionOrder, ProductionStatus, ProductionLog } from '../types/factory';
import { toast } from 'sonner';

export const useProductionOrders = (status?: ProductionStatus) => {
  const { user } = useAuth();

  const fetchProductionOrders = async (): Promise<ProductionOrder[]> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('get_production_orders', {
      p_seller_id: user.id,
      p_status: status || null,
    });

    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productionOrders', status],
    queryFn: fetchProductionOrders,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user,
  });

  return {
    orders: data || [],
    isLoading,
    error,
    refetch,
  };
};

export const useUpdateProductionStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      notes,
    }: {
      orderId: string;
      status: ProductionStatus;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('update_production_status', {
        p_order_id: orderId,
        p_status: status,
        p_notes: notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      toast.success('Production status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating production status:', error);
      toast.error('Failed to update production status');
    },
  });

  return mutation;
};

export const useProductionLogs = (orderId: string) => {
  const { user } = useAuth();

  const fetchLogs = async (): Promise<ProductionLog[]> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('factory_production_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['productionLogs', orderId],
    queryFn: fetchLogs,
    enabled: !!user && !!orderId,
  });

  return {
    logs: data || [],
    isLoading,
    error,
  };
};
