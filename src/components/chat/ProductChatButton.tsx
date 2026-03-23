import React, { useState } from "react";
import { useChatPermission } from "../../hooks/useChatPermission";
import { useCreateTradingConversation } from "../../hooks/useCreateTradingConversation";
import { TRADING_ACCOUNT_CONFIG } from "../../lib/tradingConfig";
import { TradingAccountType } from "../../types/trading-chat";
import { MessageCircle, Lock, AlertCircle } from "lucide-react";

interface ProductChatButtonProps {
  currentUserId: string;
  currentUserType: TradingAccountType;
  productId: string;
  sellerId: string;
  sellerUserType: TradingAccountType;
}

export const ProductChatButton: React.FC<ProductChatButtonProps> = ({
  currentUserId,
  currentUserType,
  productId,
  sellerId,
  sellerUserType,
}) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const { permission, loading } = useChatPermission(
    currentUserId,
    currentUserType,
    sellerId,
    sellerUserType,
    productId,
  );

  const { createConversation } = useCreateTradingConversation();

  const handleStartChat = async () => {
    if (!permission.allowed) return;

    const convId = await createConversation(
      sellerId,
      currentUserType,
      sellerUserType,
      productId,
      "product_inquiry",
    );

    if (convId) {
      setConversationId(convId);
      setShowChat(true);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (!permission.allowed) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2"
        title={permission.reason}
      >
        <Lock size={16} />
        <span>Chat Disabled</span>
      </button>
    );
  }

  if (showChat && conversationId) {
    return null; // Parent should render TradingChatBox
  }

  return (
    <button
      onClick={handleStartChat}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <MessageCircle size={18} />
      <span>Contact {TRADING_ACCOUNT_CONFIG[sellerUserType].label}</span>
    </button>
  );
};

// Product Chat Status Indicator Component
export const ProductChatStatus: React.FC<{ allowChat: boolean }> = ({
  allowChat,
}) => {
  if (!allowChat) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <AlertCircle size={16} />
        <span>Chat is disabled for this product</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <MessageCircle size={16} />
      <span>Seller accepts chat inquiries</span>
    </div>
  );
};
