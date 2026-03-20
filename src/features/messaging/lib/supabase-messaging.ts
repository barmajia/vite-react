import { supabase } from "@/lib/supabase";

/**
 * Legacy messaging library - DEPRECATED
 * Use trading_conversations for product messaging
 * Use services_conversations for service messaging
 */

// These functions are deprecated and should not be used
// The old conversation_participants table has been removed

/**
 * Get user's trading conversations
 */
export const getTradingConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from("trading_conversations")
    .select(
      `
      id,
      initiator_id,
      receiver_id,
      product_id,
      deal_id,
      conversation_type,
      last_message,
      last_message_at,
      updated_at,
      is_archived,
      initiator:users!initiator_id(id, full_name, avatar_url),
      receiver:users!receiver_id(id, full_name, avatar_url)
    `,
    )
    .or(`initiator_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get user's services conversations
 */
export const getServiceConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from("services_conversations")
    .select(
      `
      id,
      provider_id,
      client_id,
      listing_id,
      last_message,
      last_message_at,
      updated_at,
      is_read_by_provider,
      is_read_by_client,
      provider:users!provider_id(id, full_name, avatar_url),
      client:users!client_id(id, full_name, avatar_url),
      listing:svc_listings(id, title, price)
    `,
    )
    .or(`provider_id.eq.${userId},client_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Create or get service conversation
 */
export const getOrCreateServiceConversation = async (
  providerId: string,
  listingId: string,
) => {
  const { data, error } = await supabase.rpc(
    "get_or_create_service_conversation",
    {
      p_provider_id: providerId,
      p_listing_id: listingId,
    },
  );

  if (error) throw error;
  return data;
};
