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
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
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
            className={accountTypeConfig?.color}
          />
          <div>
            <h3 className="font-semibold">{getOtherUserName()}</h3>
            <p className="text-xs text-muted-foreground">
              {accountTypeConfig?.label || "User"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading messages</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm mt-2">
                Start the conversation with a greeting!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                onDelete={handleDelete}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput onSend={handleSend} disabled={sending || loading} />
    </div>
  );
}
