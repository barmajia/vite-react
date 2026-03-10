import { useState } from 'react';
import { getOrCreateConversation } from '../lib/messaging-utils';
import { toast } from 'sonner';

export const useConversationCreate = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createConversation = async (
    toUserId: string,
    productId?: string
  ): Promise<string | null> => {
    setIsCreating(true);

    try {
      const conversationId = await getOrCreateConversation(toUserId, productId);

      if (!conversationId) {
        toast.error('Cannot start conversation');
        return null;
      }

      toast.success('Conversation started');
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createConversation, isCreating };
};
