// ConversationItem Component for Aurora Chat System
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMessageTime, getContextBadgeColor, getContextLabel } from "@/lib/chat-utils";
import type { ConversationListItem } from "@/lib/chat-types";
import { Clock, Check, CheckCheck } from "lucide-react";

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const getOtherUserName = () => {
    if (conversation.other_user?.full_name) {
      return conversation.other_user.full_name;
    }
    
    // Fallback names based on context
    const contextNames: Record<string, string> = {
      trading: "Trading Partner",
      health: conversation.other_user?.account_type === "doctor" ? "Patient" : "Doctor",
      services: conversation.other_user?.account_type === "service_provider" ? "Client" : "Provider",
      general: "User",
      product: "User",
    };
    
    return contextNames[conversation.context] || "User";
  };

  const getAvatarUrl = () => {
    return conversation.other_user?.avatar_url;
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message) {
      return "No messages yet";
    }
    
    if (conversation.last_message.startsWith("📷")) {
      return conversation.last_message;
    }
    
    if (conversation.last_message.startsWith("📎")) {
      return conversation.last_message;
    }
    
    return conversation.last_message.length > 50
      ? conversation.last_message.substring(0, 50) + "..."
      : conversation.last_message;
  };

  const hasUnreadMessages = conversation.unread_count && conversation.unread_count > 0;

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive
          ? "bg-muted/80 border-primary shadow-md"
          : "hover:bg-muted/50 border-transparent hover:border-muted"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          name={getOtherUserName()}
          src={getAvatarUrl()}
          size="md"
          className={conversation.other_user?.account_type ? "" : "bg-muted"}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm truncate flex-1">
              {getOtherUserName()}
            </h3>
            {conversation.last_message_at && (
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {formatMessageTime(conversation.last_message_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-xs ${getContextBadgeColor(conversation.context)}`}
            >
              {getContextLabel(conversation.context)}
            </Badge>
            
            {conversation.product && (
              <Badge variant="outline" className="text-xs">
                📦 Product
              </Badge>
            )}
            
            {conversation.appointment && (
              <Badge variant="outline" className="text-xs">
                🏥 Appointment
              </Badge>
            )}
            
            {conversation.listing && (
              <Badge variant="outline" className="text-xs">
                🛠️ Service
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate flex-1">
              {getLastMessagePreview()}
            </p>
            {hasUnreadMessages && (
              <Badge className="bg-primary text-primary-foreground text-xs ml-2 flex-shrink-0">
                {conversation.unread_count}
              </Badge>
            )}
          </div>

          {/* Product/Service Info if available */}
          {conversation.product && (
            <div className="mt-2 p-2 bg-muted/50 rounded-md">
              <p className="text-xs font-medium truncate">
                {conversation.product.title}
              </p>
              {conversation.product.price && (
                <p className="text-xs text-muted-foreground">
                  {conversation.product.price.toFixed(2)} EGP
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
