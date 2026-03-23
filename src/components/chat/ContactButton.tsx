import React, { useState } from 'react';
import { useCreateConversation } from '../../hooks/useCreateConversation';
import { ACCOUNT_TYPE_CONFIG } from '../../lib/chatConfig';
import { AccountType, ChatContext } from '../../types/chat';
import { MessageCircle, Phone, Video } from 'lucide-react';

interface ContactButtonProps {
  targetUserId: string;
  targetAccountType: AccountType;
  context?: ChatContext;
  showCallButtons?: boolean;
}

export const ContactButton: React.FC<ContactButtonProps> = ({
  targetUserId,
  targetAccountType,
  context = 'general',
  showCallButtons = true,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { createConversation, loading } = useCreateConversation();
  const config = ACCOUNT_TYPE_CONFIG[targetAccountType];

  const handleStartChat = async () => {
    const convId = await createConversation(targetUserId, context);
    if (convId) {
      setConversationId(convId);
      setIsChatOpen(true);
    }
  };

  if (isChatOpen && conversationId) {
    return null; // ChatBox will be rendered by parent
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={handleStartChat}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${config.color} hover:opacity-90 transition-opacity disabled:opacity-50`}
      >
        <MessageCircle size={18} />
        <span>Contact {config.label}</span>
      </button>
      
      {showCallButtons && (
        <>
          <button className="p-2 border rounded-lg hover:bg-gray-100 transition-colors" title="Voice Call">
            <Phone size={18} className="text-green-600" />
          </button>
          <button className="p-2 border rounded-lg hover:bg-gray-100 transition-colors" title="Video Call">
            <Video size={18} className="text-blue-600" />
          </button>
        </>
      )}
    </div>
  );
};
