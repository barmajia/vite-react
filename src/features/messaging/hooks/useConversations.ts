import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { subscribeToConversations } from '../lib/supabase-realtime';
import { useAuth } from '@/hooks/useAuth';
import type { ConversationWithParticipants } from '../types/messaging';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchConversations = async () => {
    if (!user) throw new Error('User not authenticated');

    // Get conversations where user is either the buyer or seller
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        user_id,
        seller_id,
        last_message_at,
        created_at,
        messages (
          id,
          content,
          sender_id,
          is_read,
          created_at
        )
      `)
      .or(`user_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convError) throw convError;

    // Fetch participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const otherUserId = conv.user_id === user.id ? conv.seller_id : conv.user_id;
        
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        const unreadCount = (conv.messages || []).filter(
          (m: any) => m.sender_id !== user.id && !m.is_read
        ).length;

        const lastMessage = conv.messages && conv.messages.length > 0 
          ? conv.messages[0].content 
          : null;

        return {
          ...conv,
          otherUser,
          unreadCount,
          last_message: lastMessage,
        } as ConversationWithParticipants;
      })
    );

    return conversationsWithDetails;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    staleTime: 30000,
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      unsubscribe();
    };
  }, [user, queryClient]);

  return { conversations: data || [], isLoading, error, refetch };
};
