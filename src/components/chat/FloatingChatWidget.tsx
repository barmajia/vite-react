import React, { useState } from "react";
import { ChatBox } from "./ChatBox";
import { MessageCircle } from "lucide-react";

interface FloatingChatWidgetProps {
  currentUserId: string;
  targetUserId?: string;
  conversationId?: string;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  currentUserId,
  targetUserId,
  conversationId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
        title="Open Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <ChatBox
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        conversationId={conversationId}
        onClose={() => setIsOpen(false)}
        className="w-[380px]"
      />
    </div>
  );
};
