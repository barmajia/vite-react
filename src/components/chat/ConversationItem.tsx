// WhatsApp-style Conversation Item Component
import { Avatar } from "@/components/ui/avatar";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/chatConfig";
import type { ConversationListItem } from "@/lib/chat-types";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck } from "lucide-react";

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive = false,
  onClick,
}: ConversationItemProps) {
  const otherUser = conversation.other_user;
  const accountType = otherUser?.account_type;
  const accountTypeConfig =
    accountType && accountType in ACCOUNT_TYPE_CONFIG
      ? ACCOUNT_TYPE_CONFIG[accountType as keyof typeof ACCOUNT_TYPE_CONFIG]
      : ACCOUNT_TYPE_CONFIG.user;

  const getTimeAgo = () => {
    if (!conversation.last_message_at) return "";
    try {
      const date = new Date(conversation.last_message_at);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getName = () => {
    return otherUser?.full_name || "Unknown User";
  };

  const getLastMessage = () => {
    if (conversation.context === "product" && conversation.product) {
      return `Product: ${conversation.product.title}`;
    }
    return conversation.last_message || "No messages yet";
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 flex items-center gap-3 transition-colors text-left border-b border-muted/50
        ${isActive ? "bg-primary/10" : "hover:bg-muted/50"}
      `}
    >
      {/* Profile Picture */}
      <Avatar
        name={getName()}
        src={otherUser?.avatar_url}
        size="lg"
        className={accountTypeConfig?.color || "bg-muted"}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {/* Name and Time */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate flex-1">{getName()}</h3>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            {getTimeAgo()}
          </span>
        </div>

        {/* Account Type and Last Message */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Account Type Badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 bg-secondary text-secondary-foreground font-medium`}
            >
              {accountTypeConfig.label}
            </span>
            {/* Last Message */}
            <p className="text-xs text-muted-foreground truncate flex-1">
              {getLastMessage()}
            </p>
          </div>

          {/* Unread Badge or Read Receipt */}
          {conversation.unread_count && conversation.unread_count > 0 ? (
            <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">
              {conversation.unread_count}
            </div>
          ) : (
            <div className="text-muted-foreground shrink-0">
              <CheckCheck className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
