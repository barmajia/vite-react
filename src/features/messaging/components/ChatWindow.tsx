import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { useTypingStatus } from '../hooks/useTypingStatus';
import { markMessagesAsRead } from '../lib/messaging-utils';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const ChatWindow = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { messages, isLoading } = useMessages(conversationId || null);
  const { sendMessage, isSending } = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const { user } = useAuth();
  const { setIsTyping, otherUserTyping, sendTypingStatus } = useTypingStatus(
    conversationId || null,
    user?.id || ''
  );

  // Fetch other user info
  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchParticipants = async () => {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('user_id, seller_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      const otherUserId = conversation.user_id === user.id 
        ? conversation.seller_id 
        : conversation.user_id;

      const { data } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      setOtherUser(data);
    };

    fetchParticipants();
  }, [conversationId, user]);

  // Mark messages as read
  useEffect(() => {
    if (conversationId && user) {
      markMessagesAsRead(conversationId, user.id);
    }
  }, [conversationId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;

    const success = await sendMessage({
      conversationId,
      content,
    });

    if (success) {
      setIsTyping(false);
      sendTypingStatus(false);
    }
  };

  const handleTypingChange = (typing: boolean) => {
    setIsTyping(typing);
    sendTypingStatus(typing);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-10 w-10">
          <img
            src={otherUser?.avatar_url || '/default-avatar.png'}
            alt={otherUser?.full_name || 'User'}
          />
        </Avatar>
        <div>
          <h2 className="font-semibold">{otherUser?.full_name || 'Unknown'}</h2>
          <p className="text-xs text-muted-foreground">
            {otherUserTyping ? 'Typing...' : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === user?.id}
              otherUser={otherUser}
            />
          ))}
          {otherUserTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <MessageInput
          onSend={handleSendMessage}
          onTypingChange={handleTypingChange}
          isSending={isSending}
        />
      </div>
    </div>
  );
};
