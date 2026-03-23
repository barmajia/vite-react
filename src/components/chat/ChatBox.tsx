import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import { ACCOUNT_TYPE_CONFIG } from "../../lib/chatConfig";
import { supabase } from "../../lib/supabase";
import { Message } from "../../types/chat";
import {
  Send,
  Paperclip,
  Phone,
  Video,
  X,
  MoreVertical,
  Image,
  File,
  Mic,
  Check,
  CheckCheck,
  User,
  Shield,
  Store,
  Factory,
  Handshake,
  Laptop,
  Briefcase,
  Truck,
  Stethoscope,
  Heart,
  Pill,
} from "lucide-react";

interface ChatBoxProps {
  currentUserId: string;
  targetUserId?: string;
  conversationId?: string;
  context?:
    | "general"
    | "ecommerce"
    | "health"
    | "service"
    | "trading"
    | "logistics";
  onClose?: () => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Shield,
  Store,
  Factory,
  Handshake,
  Laptop,
  Briefcase,
  Truck,
  Stethoscope,
  Heart,
  Pill,
};

export const ChatBox: React.FC<ChatBoxProps> = ({
  currentUserId,
  targetUserId,
  conversationId: propConversationId,
  context = "general",
  onClose,
  className = "",
}) => {
  const [conversationId, setConversationId] = useState<string | null>(
    propConversationId || null,
  );
  const [messageInput, setMessageInput] = useState("");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, participants, loading, sendMessage } = useChat(
    conversationId,
    currentUserId,
  );

  // Get other participant (for 1-on-1 chat)
  const otherParticipant = participants.find(
    (p) => p.user_id !== currentUserId,
  )?.user;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize conversation if targetUserId provided
  useEffect(() => {
    if (targetUserId && !conversationId) {
      initializeConversation(targetUserId);
    }
  }, [targetUserId]);

  const initializeConversation = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase.rpc("create_direct_conversation", {
        p_target_user_id: targetUserId,
        p_context: context,
      });

      if (error) throw error;
      setConversationId(data);
    } catch (err) {
      console.error("Failed to initialize conversation:", err);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(`/${conversationId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(data.path);

      // Send message with attachment
      await sendMessage(file.name, "file");

      if (file.type.startsWith("image/")) {
        await sendMessage(urlData.publicUrl, "image");
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleStartCall = (type: "voice" | "video") => {
    setCallType(type);
    setIsCallModalOpen(true);
  };

  const getAccountTypeIcon = (accountType: string) => {
    const IconComponent = ICON_MAP[accountType] || User;
    return <IconComponent size={20} />;
  };

  const getMessageStatus = (message: Message) => {
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
              otherParticipant
                ? ACCOUNT_TYPE_CONFIG[otherParticipant.account_type]?.color
                : "bg-gray-500"
            }`}
          >
            {otherParticipant ? (
              getAccountTypeIcon(otherParticipant.account_type)
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {otherParticipant?.full_name || "Unknown User"}
            </h3>
            <p className="text-sm text-gray-500">
              {otherParticipant
                ? ACCOUNT_TYPE_CONFIG[otherParticipant.account_type]?.label
                : ""}
              {otherParticipant?.is_verified && (
                <Shield size={12} className="inline ml-1 text-blue-500" />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStartCall("voice")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone size={20} className="text-green-600" />
          </button>
          <button
            onClick={() => handleStartCall("video")}
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
                  {message.message_type === "image" &&
                    message.attachment_url && (
                      <img
                        src={message.attachment_url}
                        alt="Attachment"
                        className="rounded mb-2 max-w-full"
                      />
                    )}
                  {message.message_type === "file" && (
                    <div className="flex items-center gap-2 mb-2">
                      <File size={20} />
                      <span className="text-sm">
                        {message.attachment_name || "File"}
                      </span>
                    </div>
                  )}
                  {message.message_type === "call_invite" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={20} />
                      <span className="text-sm">Call Invitation</span>
                    </div>
                  )}
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Attach File"
          >
            <Paperclip size={20} className="text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Send Image"
          >
            <Image size={20} className="text-gray-600" />
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Voice Message"
          >
            <Mic size={20} className="text-gray-600" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Call Modal (Placeholder for Agora/Twilio integration) */}
      {isCallModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {callType === "video" ? "Video Call" : "Voice Call"}
            </h3>
            <p className="text-gray-600 mb-4">
              Connecting to {otherParticipant?.full_name}...
            </p>
            <div className="flex justify-center gap-4">
              <button className="p-4 bg-green-500 text-white rounded-full">
                <Phone size={24} />
              </button>
              <button
                onClick={() => setIsCallModalOpen(false)}
                className="p-4 bg-red-500 text-white rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Integrate with Agora, Twilio, or LiveKit for actual calls
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
