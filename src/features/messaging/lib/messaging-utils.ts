import { supabase } from '@/lib/supabase';

export const canStartConversation = async (
  fromUserId: string,
  toUserId: string,
  productId?: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_start_conversation', {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      product_id: productId || null,
    });

    if (error) throw error;
    return data ?? false;
  } catch (error) {
    console.error('Error checking conversation permission:', error);
    return false;
  }
};

export const getOrCreateConversation = async (
  toUserId: string,
  productId?: string
): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw authError;

    // Check if conversation already exists with this user
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select('id, user_id, seller_id')
      .or(`user_id.eq.${toUserId},seller_id.eq.${toUserId}`);

    if (existingConversations && existingConversations.length > 0) {
      // Find mutual conversation
      for (const conv of existingConversations) {
        if ((conv.user_id === user.id || conv.seller_id === user.id)) {
          return conv.id;
        }
      }
    }

    // Check permission
    const allowed = await canStartConversation(user.id, toUserId, productId);
    if (!allowed) {
      throw new Error('Cannot start conversation with this user');
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ 
        user_id: user.id,
        seller_id: toUserId,
      })
      .select()
      .single();

    if (convError) throw convError;

    return conversation.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', userId);

    if (unreadMessages && unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m) => m.id);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const formatLastMessagePreview = (content: string | null, maxLength: number = 50): string => {
  if (!content) return 'No messages yet';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};
