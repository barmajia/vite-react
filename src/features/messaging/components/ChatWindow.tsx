import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { useTypingStatus } from '../hooks/useTypingStatus';
import { useConversationDeals } from '../hooks/useConversationDeals';
import { markMessagesAsRead } from '../lib/messaging-utils';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { DealProposalCard } from './DealProposalCard';
import { DealProposalDialog } from './DealProposalDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const ChatWindow = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { messages } = useMessages(conversationId || null);
  const { sendMessage, isSending } = useSendMessage();
  const { deals, createDealProposal, respondToDeal } = useConversationDeals(conversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    account_type?: string;
  } | null>(null);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [userAccountType, setUserAccountType] = useState<string>('');

  const { user } = useAuth();
  const { otherUserTyping, sendTypingStatus } = useTypingStatus(
    conversationId || null,
    user?.id || ''
  );

  // Fetch user account type
  useEffect(() => {
    if (!user) return;

    const fetchAccountType = async () => {
      const { data } = await supabase
        .from('users')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserAccountType(data.account_type || '');
      }
    };

    fetchAccountType();
  }, [user]);

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
        .select('id, full_name, avatar_url, account_type')
        .eq('id', otherUserId)
        .single();

      if (data) {
        setOtherUser(data as any);
      }
    };

    fetchParticipants();
  }, [conversationId, user]);

  // Mark messages as read
  useEffect(() => {
    if (!conversationId || !user) return;
    markMessagesAsRead(conversationId, user.id);
  }, [conversationId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !user) return;
    await sendMessage({ conversationId, content });
  };

  const handleSendTyping = () => {
    if (!conversationId || !user) return;
    sendTypingStatus(true);
  };

  const handleDealResponse = (dealId: string, accepted: boolean) => {
    respondToDeal.mutate({
      dealProposalId: dealId,
      response: accepted ? 'accepted' : 'rejected',
    });
  };

  const canProposeDeal = userAccountType === 'factory' || userAccountType === 'seller';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt={otherUser.full_name || ''} />
            ) : (
              <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {otherUser?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </Avatar>
          <div>
            <h2 className="font-semibold">{otherUser?.full_name || 'User'}</h2>
            {otherUser?.account_type && (
              <p className="text-xs text-muted-foreground capitalize">{otherUser.account_type}</p>
            )}
          </div>
        </div>

        {/* Deal Proposal Button - Factory/Seller Only */}
        {canProposeDeal && (
          <Button
            variant="outline"
            onClick={() => setShowDealDialog(true)}
            size="sm"
          >
            🤝 Propose Deal
          </Button>
        )}
      </div>

      {/* Messages + Deals */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Display Deals */}
          {deals?.map((deal) => (
            <DealProposalCard
              key={deal.id}
              proposal={deal}
              isProposer={deal.proposer_id === user?.id}
              onAccept={() => handleDealResponse(deal.id, true)}
              onReject={() => handleDealResponse(deal.id, false)}
            />
          ))}

          {/* Display Messages */}
          {messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === user?.id}
            />
          ))}

          {/* Typing Indicator */}
          {otherUserTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSendMessage}
          onTypingChange={(typing) => typing && handleSendTyping()}
          isSending={isSending}
        />
      </div>

      {/* Deal Proposal Dialog */}
      <DealProposalDialog
        open={showDealDialog}
        onOpenChange={setShowDealDialog}
        onSubmit={(proposalData) => {
          if (!conversationId || !otherUser) return;
          createDealProposal.mutate({
            conversationId,
            recipientId: otherUser.id,
            proposalData,
          });
          setShowDealDialog(false);
        }}
      />
    </div>
  );
};
