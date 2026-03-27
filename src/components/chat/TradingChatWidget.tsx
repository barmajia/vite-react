import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TradingChatBox } from "./TradingChatBox";
import { ChatBox } from "./ChatBox";
import { MessageCircle, Handshake, Store, Phone, X } from "lucide-react";
import { ChatContext } from "@/types/chat";

interface TradingChatWidgetProps {
  currentUserId: string;
  conversationId?: string;
  targetUserId?: string;
}

export const TradingChatWidget: React.FC<TradingChatWidgetProps> = ({
  currentUserId,
  conversationId,
  targetUserId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<ChatContext>("general");
  const location = useLocation();

  // Auto-detect context from current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/services/health") || path.includes("/health")) {
      setContext("health");
    } else if (path.includes("/services")) {
      setContext("service");
    } else if (
      path.includes("/products") ||
      path.includes("/factory") ||
      path.includes("/middleman")
    ) {
      setContext("trading");
    } else {
      setContext("general");
    }
  }, [location.pathname]);

  // Get context-specific config
  const getContextConfig = () => {
    switch (context) {
      case "trading":
        return {
          icon: <Handshake size={24} />,
          color: "bg-purple-600 hover:bg-purple-700",
          title: "Open Trading Chat",
          component: TradingChatBox,
        };
      case "health":
        return {
          icon: <Phone size={24} />,
          color: "bg-red-600 hover:bg-red-700",
          title: "Open Health Consultation",
          component: ChatBox,
        };
      case "service":
        return {
          icon: <Store size={24} />,
          color: "bg-green-600 hover:bg-green-700",
          title: "Open Service Chat",
          component: ChatBox,
        };
      default:
        return {
          icon: <MessageCircle size={24} />,
          color: "bg-blue-600 hover:bg-blue-700",
          title: "Open Chat",
          component: ChatBox,
        };
    }
  };

  const config = getContextConfig();
  const ChatComponent = config.component;

  // Debug: Log when component changes
  useEffect(() => {
    console.log("🔵 ChatWidget: Context changed to", context);
    console.log("   ChatComponent:", ChatComponent?.name || ChatComponent);
  }, [context, ChatComponent]);

  // 🔵 UNIVERSAL FLOATING BUTTON
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          console.log("🖱️ ChatWidget: Button clicked - opening chat");
          setIsOpen(true);
        }}
        className={`fixed bottom-6 right-6 z-50 p-4 ${config.color} text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center`}
        title={config.title}
      >
        {config.icon}
      </button>
    );
  }

  // 💬 CONTEXT-SPECIFIC CHAT BOX
  console.log("💬 ChatWidget: Rendering chat box for context:", context);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-[380px] md:w-[420px]">
        {/* Header with context selector */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b flex items-center justify-between">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as ChatContext)}
            className="text-sm border dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">💬 General Chat</option>
            <option value="trading">🤝 Trading</option>
            <option value="service">🏪 Services</option>
            <option value="health">🩺 Health</option>
          </select>
          <button
            onClick={() => {
              console.log("❌ ChatWidget: Close button clicked");
              setIsOpen(false);
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Chat Component */}
        <ChatComponent
          currentUserId={currentUserId}
          conversationId={conversationId}
          context={context}
          onClose={() => setIsOpen(false)}
          className="w-full"
        />
      </div>
    </div>
  );
};
