import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { QuoteRequest, QuoteStatus } from '../types/factory';
import { toast } from 'sonner';

export const useQuoteRequests = (view: 'received' | 'sent' = 'received') => {
  const { user } = useAuth();

  const fetchQuotes = async (): Promise<QuoteRequest[]> => {
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('quote_requests')
      .select(`
        *,
        product (
          id,
          title,
          images
        ),
        buyer:users!quote_requests_buyer_id_fkey (
          id,
          full_name,
          email
        )
      `);

    if (view === 'received') {
      query = query.eq('factory_id', user.id);
    } else {
      query = query.eq('buyer_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Transform product images (JSON array) to image_url
    return (data || []).map((quote) => ({
      ...quote,
      product: quote.product
        ? {
            id: quote.product.id,
            title: quote.product.title,
            image_url: Array.isArray(quote.product.images)
              ? quote.product.images[0]
              : quote.product.images,
          }
        : null,
    }));
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quoteRequests', view],
    queryFn: fetchQuotes,
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });

  return {
    quotes: data || [],
    isLoading,
    error,
    refetch,
  };
};

export const useUpdateQuoteRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      quoteId,
      updates,
    }: {
      quoteId: string;
      updates: {
        status?: QuoteStatus;
        quoted_price?: number;
        expires_at?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('quote_requests')
        .update({
          ...updates,
          quoted_at: updates.status === 'quoted' ? new Date().toISOString() : undefined,
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteRequests'] });
      toast.success('Quote updated successfully');
    },
    onError: (error) => {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote');
    },
  });

  return mutation;
};

export const useCreateQuoteRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      factory_id,
      product_id,
      quantity,
      target_price,
      notes,
    }: {
      factory_id: string;
      product_id?: string;
      quantity: number;
      target_price?: number;
      notes?: string;
    }) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) throw authError;

      const { data, error } = await supabase
        .from('quote_requests')
        .insert({
          factory_id,
          buyer_id: user.id,
          product_id: product_id || null,
          quantity,
          target_price: target_price || null,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteRequests'] });
      toast.success('Quote request sent successfully');
    },
    onError: (error) => {
      console.error('Error creating quote request:', error);
      toast.error('Failed to send quote request');
    },
  });

  return mutation;
};
