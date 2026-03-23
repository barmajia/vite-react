import React, { useState, useRef, useEffect } from "react";
import { useTradingChat } from "../../hooks/useTradingChat";
import { TRADING_ACCOUNT_CONFIG } from "../../lib/tradingConfig";
import { TradingMessage, TradingAccountType } from "../../types/trading-chat";
import {
  Send,
  Paperclip,
  Phone,
  Video,
  X,
  MoreVertical,
  Check,
  CheckCheck,
  User,
  Shield,
  Store,
  Factory,
  Handshake,
  MessageCircle,
  Package,
} from "lucide-react";

interface TradingChatBoxProps {
  currentUserId: string;
  conversationId?: string;
  onClose?: () => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Store,
  Factory,
  Handshake,
  Shield,
};

export const TradingChatBox: React.FC<TradingChatBoxProps> = ({
  currentUserId,
  conversationId: propConversationId,
  onClose,
  className = "",
}) => {
  const [conversationId] = useState<string | null>(propConversationId || null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, participants, product, loading, sendMessage } =
    useTradingChat(conversationId, currentUserId);

  // Get other participant
  const otherParticipant = participants.find(
    (p) => p.user_id !== currentUserId,
  )?.user;
  const otherUserType = otherParticipant?.account_type as TradingAccountType;
  const otherConfig = otherUserType
    ? TRADING_ACCOUNT_CONFIG[otherUserType]
    : null;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId) return;
    await sendMessage(messageInput.trim(), "text");
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAccountTypeIcon = (accountType: string) => {
    const IconComponent = ICON_MAP[accountType] || User;
    return <IconComponent size={20} />;
  };

  const getMessageStatus = (message: TradingMessage) => {
    if (message.sender_id !== currentUserId) return null;
    if (message.read_at) {
      return <CheckCheck size={14} className="text-blue-500" />;
    }
    return <Check size={14} className="text-gray-400" />;
  };

  if (!conversationId) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Starting conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-[600px] bg-white rounded-lg shadow-xl border ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
              otherConfig?.color || "bg-gray-500"
            }`}
          >
            {otherUserType ? (
              getAccountTypeIcon(otherUserType)
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {otherParticipant?.full_name || "Unknown User"}
            </h3>
            <p className="text-sm text-gray-500">
              {otherConfig?.label || "User"}
              {otherParticipant?.is_verified && (
                <Shield size={12} className="inline ml-1 text-blue-500" />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone size={20} className="text-green-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Video Call"
          >
            <Video size={20} className="text-blue-600" />
          </button>
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Product Info Banner (if product-linked conversation) */}
      {product && (
        <div className="p-3 border-b bg-blue-50 flex items-center gap-3">
          <Package size={20} className="text-blue-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {product.title}
            </p>
            <p className="text-xs text-gray-500">${product.price}</p>
          </div>
          <MessageCircle size={16} className="text-green-600" />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow"
                  }`}
                >
                  {message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs opacity-70">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && getMessageStatus(message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Attach File"
          >
            <Paperclip size={20} className="text-gray-600" />
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
