// ChatWindow Component for Aurora Chat System
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
import type { ConversationListItem } from "@/lib/chat-types";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/chatConfig";
import { toast } from "sonner";

interface ChatWindowProps {
  conversation: ConversationListItem;
  onBack: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationContext =
    conversation.context === "service" ? "services" : conversation.context;

  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    deleteMessage,
    refresh,
  } = useMessages({
    conversationId: conversation.id,
    context: conversationContext,
    currentUserId: user?.id || "",
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (
    content: string,
    type: "text" | "image" | "file",
    attachmentUrl?: string,
    attachmentName?: string,
  ) => {
    await sendMessage(content, type, attachmentUrl, attachmentName);
    scrollToBottom();
  };

  const handleDelete = async (messageId: string) => {
    if (confirm("Delete this message?")) {
      await deleteMessage(messageId);
      toast.success("Message deleted");
    }
  };

  const getOtherUserName = () => {
    if (conversation.other_user?.full_name) {
      return conversation.other_user.full_name;
    }

    const contextNames: Record<string, string> = {
      trading: "Trading Partner",
      health:
        conversation.other_user?.account_type === "doctor"
          ? "Patient"
          : "Doctor",
      services:
        conversation.other_user?.account_type === "service_provider"
          ? "Client"
          : "Provider",
      general: "User",
      product: "User",
    };

    return contextNames[conversation.context] || "User";
  };

  const getOtherUserAccountType = () => {
    return conversation.other_user?.account_type || "user";
  };

  const accountTypeConfig = ACCOUNT_TYPE_CONFIG[getOtherUserAccountType()];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar
            name={getOtherUserName()}
            src={conversation.other_user?.avatar_url}
            size="md"
            className={accountTypeConfig?.color || "bg-muted"}
          />

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">
              {getOtherUserName()}
            </h2>
            <div className="flex items-center gap-2">
              {accountTypeConfig && (
                <p className="text-xs text-muted-foreground">
                  {accountTypeConfig.label}
                </p>
              )}
              {conversation.product && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.product.title}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Voice Call (Coming Soon)"
            disabled
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Video Call (Coming Soon)"
            disabled
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="More Options"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              <p>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="h-8 w-8 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const prevMessage = messages[index - 1];
                const showAvatar =
                  !isOwn &&
                  (index === messages.length - 1 ||
                    messages[index + 1]?.sender_id !== message.sender_id);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    onDelete={handleDelete}
                    showAvatar={showAvatar}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onSend={handleSend}
        disabled={sending}
      />
    </div>
  );
}
