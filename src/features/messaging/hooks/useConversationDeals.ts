import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface DealProposal {
  commission_rate: number;
  products?: string[];
  min_order_quantity?: number;
  terms?: string;
  expires_at?: string;
}

export interface ConversationDeal {
  id: string;
  conversation_id: string;
  deal_id: string | null;
  proposer_id: string;
  recipient_id: string;
  proposal_data: DealProposal;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  deals?: {
    id: string;
    commission_rate: number;
    party_a_id: string;
    party_b_id: string;
    middleman_id: string | null;
  };
}

export const useConversationDeals = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch deals for this conversation
  const { data: deals, isLoading } = useQuery({
    queryKey: ['conversation_deals', conversationId],
    queryFn: async (): Promise<ConversationDeal[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('conversation_deals')
        .select(`
          id,
          conversation_id,
          deal_id,
          proposer_id,
          recipient_id,
          proposal_data,
          status,
          expires_at,
          created_at,
          updated_at,
          deals (
            id,
            commission_rate,
            party_a_id,
            party_b_id,
            middleman_id
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match type
      return (data || []).map((deal: any) => ({
        ...deal,
        deals: deal.deals?.[0] || null,
      }));
    },
    enabled: !!conversationId,
    staleTime: 30000,
  });

  // Create deal proposal mutation
  const createDealProposal = useMutation({
    mutationFn: async ({
      conversationId,
      recipientId,
      proposalData,
    }: {
      conversationId: string;
      recipientId: string;
      proposalData: DealProposal;
    }) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw authError;

      // Create deal record first
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          middleman_id: user.id,
          party_a_id: user.id,
          party_b_id: recipientId,
          commission_rate: proposalData.commission_rate,
          status: 'pending',
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Create conversation_deal proposal
      const { error: proposalError } = await supabase.from('conversation_deals').insert({
        conversation_id: conversationId,
        deal_id: deal.id,
        proposer_id: user.id,
        recipient_id: recipientId,
        proposal_data: proposalData,
        expires_at: proposalData.expires_at || null,
      });

      if (proposalError) throw proposalError;

      // Send message notification
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `🤝 Deal proposal: ${proposalData.commission_rate}% commission`,
        message_type: 'text',
        message_subtype: 'deal_proposal',
      });

      return deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation_deals'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Deal proposal sent');
    },
    onError: (error) => {
      console.error('Error creating deal proposal:', error);
      toast.error('Failed to create deal proposal');
    },
  });

  // Accept/reject deal mutation
  const respondToDeal = useMutation({
    mutationFn: async ({
      dealProposalId,
      response,
    }: {
      dealProposalId: string;
      response: 'accepted' | 'rejected';
    }) => {
      const { error } = await supabase
        .from('conversation_deals')
        .update({
          status: response,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealProposalId);

      if (error) throw error;

      // Update deal status
      const { data: proposal } = await supabase
        .from('conversation_deals')
        .select('deal_id')
        .eq('id', dealProposalId)
        .single();

      if (proposal?.deal_id) {
        await supabase
          .from('deals')
          .update({
            status: response === 'accepted' ? 'active' : 'cancelled',
          })
          .eq('id', proposal.deal_id);
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation_deals'] });
      toast.success(`Deal ${variables.response === 'accepted' ? 'accepted' : 'rejected'}`);
    },
    onError: () => {
      toast.error('Failed to respond to deal');
    },
  });

  return {
    deals,
    isLoading,
    createDealProposal,
    respondToDeal,
  };
};
