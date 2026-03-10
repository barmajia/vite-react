// Messaging Feature Exports

// Components
export { ConversationList } from './components/ConversationList';
export { ChatWindow } from './components/ChatWindow';
export { MessageBubble } from './components/MessageBubble';
export { MessageInput } from './components/MessageInput';
export { TypingIndicator } from './components/TypingIndicator';

// Hooks
export { useConversations } from './hooks/useConversations';
export { useMessages } from './hooks/useMessages';
export { useSendMessage } from './hooks/useSendMessage';
export { useConversationCreate } from './hooks/useConversationCreate';
export { useTypingStatus } from './hooks/useTypingStatus';

// Utils
export {
  canStartConversation,
  getOrCreateConversation,
  markMessagesAsRead,
  formatMessageTime,
  formatLastMessagePreview,
} from './lib/messaging-utils';

export {
  subscribeToMessages,
  subscribeToConversations,
  subscribeToConversationUpdates,
} from './lib/supabase-realtime';

// Types
export type {
  Conversation,
  Message,
  ConversationWithParticipants,
  SendMessageInput,
  CreateConversationInput,
} from './types/messaging';
