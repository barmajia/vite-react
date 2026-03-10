import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export const useTypingStatus = (conversationId: string | null, userId: string) => {
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: typing },
    });
  }, [conversationId, userId, supabase]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId !== userId) {
        setOtherUserTyping(payload.payload.isTyping);
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, supabase]);

  return {
    isTyping,
    setIsTyping,
    otherUserTyping,
    sendTypingStatus,
  };
};
