import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeToConversations } from '../lib/supabase-realtime';
import { useAuth } from '@/hooks/useAuth';
import type { ConversationWithParticipants } from '../types/messaging';
import { getConversationsWithDetails, getUserConversationIds } from '../lib/supabase-messaging';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchConversations = async () => {
    if (!user) throw new Error('User not authenticated');

    // Step 1: Get conversation IDs from participants table
    const conversationIds = await getUserConversationIds(user.id);

    if (conversationIds.length === 0) {
      return [];
    }

    // Step 2: Get full conversation details
    const conversations = await getConversationsWithDetails(user.id, conversationIds);

    // Transform: calculate unread count, extract other user
    return conversations.map((conv: any) => {
      const otherParticipant = conv.conversation_participants?.find(
        (p: any) => p.user_id !== user.id
      );

      const unreadCount = conv.messages?.filter(
        (m: any) => m.sender_id !== user.id && !m.is_read
      ).length || 0;

      return {
        ...conv,
        otherUser: otherParticipant?.users || null,
        unreadCount,
        last_message: conv.last_message,
      } as ConversationWithParticipants;
    });
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
