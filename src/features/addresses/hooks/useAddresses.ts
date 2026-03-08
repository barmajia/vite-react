import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ShippingAddress } from '@/types/database';

export function useAddresses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShippingAddress[];
    },
    enabled: !!user,
  });

  const createAddressMutation = useMutation({
    mutationFn: async (address: {
      full_name: string;
      address_line1: string;
      address_line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      phone: string;
      is_default: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert({
          ...address,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShippingAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ShippingAddress> }) => {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ShippingAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const setDefaultAddress = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user?.id);

    // Then set the new default
    await updateAddressMutation.mutateAsync({ id, updates: { is_default: true } });
  };

  return {
    addresses: addresses || [],
    isLoading,
    createAddress: createAddressMutation.mutateAsync,
    updateAddress: updateAddressMutation.mutateAsync,
    deleteAddress: deleteAddressMutation.mutateAsync,
    setDefaultAddress,
    isCreating: createAddressMutation.isPending,
    isUpdating: updateAddressMutation.isPending,
    isDeleting: deleteAddressMutation.isPending,
  };
}
