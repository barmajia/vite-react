import { supabase } from '@/lib/supabase';

/**
 * Get user's conversation IDs from conversation_participants table
 * This avoids the complex or() filter that causes 400 errors
 */
export const getUserConversationIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((p) => p.conversation_id) || [];
};

/**
 * Get conversations with full details using conversation IDs
 */
export const getConversationsWithDetails = async (
  _userId: string,
  conversationIds: string[]
) => {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      product_id,
      last_message,
      last_message_at,
      created_at,
      is_archived,
      conversation_participants!inner (
        user_id,
        role,
        users!inner (
          id,
          full_name,
          avatar_url
        )
      ),
      messages (
        id,
        content,
        sender_id,
        is_read,
        created_at
      )
    `)
    .in('id', conversationIds)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
  fromUserId: string,
  toUserId: string,
  productId?: string
): Promise<string | null> => {
  try {
    // Check if conversation already exists
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select('id, product_id')
      .eq('product_id', productId || null);

    if (existingConversations && existingConversations.length > 0) {
      // Find mutual conversation
      for (const conv of existingConversations) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id);

        const participantIds = participants?.map((p) => p.user_id) || [];
        if (participantIds.includes(fromUserId) && participantIds.includes(toUserId)) {
          return conv.id;
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        product_id: productId || null,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    await supabase.from('conversation_participants').insert([
      {
        conversation_id: conversation.id,
        user_id: fromUserId,
        role: 'buyer',
      },
      {
        conversation_id: conversation.id,
        user_id: toUserId,
        role: 'seller',
      },
    ]);

    return conversation.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};
