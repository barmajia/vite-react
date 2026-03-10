import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { subscribeToMessages } from '../lib/supabase-realtime';
import type { Message } from '../types/messaging';

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const [newMessages, setNewMessages] = useState<Message[]>([]);

  const fetchMessages = async () => {
    if (!conversationId) return [];

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        created_at,
        users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((msg: any) => ({
      ...msg,
      sender: msg.users,
    })) as Message[];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: fetchMessages,
    enabled: !!conversationId,
    staleTime: 0,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      setNewMessages((prev) => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, queryClient]);

  const allMessages = [...(data || []), ...newMessages];

  return { messages: allMessages, isLoading, error, refetch };
};
