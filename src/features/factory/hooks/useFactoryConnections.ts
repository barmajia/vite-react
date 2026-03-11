import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { FactoryConnection } from '../types/factory';
import { toast } from 'sonner';

export const useFactoryConnections = (status?: 'pending' | 'accepted' | 'rejected') => {
  const { user } = useAuth();

  const fetchConnections = async (): Promise<FactoryConnection[]> => {
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('factory_connections')
      .select(`
        *,
        seller:users!factory_connections_seller_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('factory_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['factoryConnections', status],
    queryFn: fetchConnections,
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });

  return {
    connections: data || [],
    isLoading,
    error,
    refetch,
  };
};

export const useUpdateConnectionStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      connectionId,
      status,
    }: {
      connectionId: string;
      status: 'accepted' | 'rejected' | 'blocked';
    }) => {
      const { data, error } = await supabase
        .from('factory_connections')
        .update({ status })
        .eq('id', connectionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['factoryConnections'] });
      toast.success(
        `Connection ${variables.status === 'accepted' ? 'accepted' : 'rejected'}`
      );
    },
    onError: (error) => {
      console.error('Error updating connection:', error);
      toast.error('Failed to update connection');
    },
  });

  return mutation;
};

export const useCreateFactoryConnection = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      factory_id,
    }: {
      factory_id: string;
    }) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) throw authError;

      // Check if connection already exists
      const { data: existing } = await supabase
        .from('factory_connections')
        .select('id')
        .eq('factory_id', factory_id)
        .eq('seller_id', user.id)
        .single();

      if (existing) {
        throw new Error('Connection request already exists');
      }

      const { data, error } = await supabase
        .from('factory_connections')
        .insert({
          factory_id,
          seller_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factoryConnections'] });
      toast.success('Connection request sent');
    },
    onError: (error) => {
      console.error('Error creating connection:', error);
      toast.error(
        (error as Error).message.includes('already exists')
          ? 'Connection request already exists'
          : 'Failed to send connection request'
      );
    },
  });

  return mutation;
};
