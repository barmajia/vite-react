// ═══════════════════════════════════════════════════════════════════════
// AuroraChat useConversation Hook
// React hook for managing conversation state and actions
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { ConversationService } from "@/services/conversation.service";
import type {
  ConversationWithParticipants,
  StartConversationResult,
} from "@/types/chat";

/**
 * Hook for managing a single conversation
 * Provides methods to start, join, and manage conversation state
 * 
 * @example
 * ```tsx
 * const { loading, error, currentConversation, startConversation } = useConversation();
 * 
 * const handleStartChat = async () => {
 *   const result = await startConversation(userId, otherUserId);
 *   if (result.success) {
 *     // Navigate to chat
 *   }
 * };
 * ```
 */
export function useConversation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<ConversationWithParticipants | null>(null);

  /**
   * Start a new conversation or get existing one
   * 
   * @param currentUserId - The ID of the current logged-in user
   * @param otherUserId - The ID of the user to chat with
   * @returns Promise with conversation result
   */
  const startConversation = useCallback(
    async (
      currentUserId: string,
      otherUserId: string
    ): Promise<StartConversationResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await ConversationService.startConversation(
          currentUserId,
          otherUserId
        );

        if (result.success && result.conversation) {
          setCurrentConversation(result.conversation);
        } else {
          setError(result.error);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start conversation";
        setError(errorMessage);
        return {
          success: false,
          conversation: null,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Join an existing room by ID
   * Useful for joining aurora_room or group chats
   * 
   * @param conversationId - The room/conversation ID to join
   * @param userId - The user ID joining the room
   * @returns True if successfully joined
   */
  const joinRoom = useCallback(
    async (
      conversationId: string,
      userId: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const success = await ConversationService.joinRoom(
          conversationId,
          userId
        );

        if (success) {
          const conversation =
            await ConversationService.getConversationWithParticipants(
              conversationId
            );
          if (conversation) {
            setCurrentConversation(conversation);
          }
        } else {
          setError("Failed to join room");
        }

        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join room";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Clear the current conversation state
   * Useful when navigating away or starting fresh
   */
  const clearConversation = useCallback(() => {
    setCurrentConversation(null);
    setError(null);
  }, []);

  /**
   * Manually set error state
   * Useful for custom error handling
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    currentConversation,

    // Actions
    startConversation,
    joinRoom,
    clearConversation,
    clearError,

    // Computed
    hasConversation: !!currentConversation,
    participantCount: currentConversation?.participants.length ?? 0,
  };
}
