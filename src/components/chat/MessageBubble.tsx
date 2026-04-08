// Message Bubble Component for Aurora Chat System
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  onDelete,
  showAvatar = false,
}: MessageBubbleProps) {
  const getTimeAgo = () => {
    try {
      const date = new Date(message.created_at);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const formatTime = () => {
    try {
      const date = new Date(message.created_at);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const isDeleted = message.is_deleted;
  const isSystemNotification = message.message_type === "system_notification";

  if (isSystemNotification) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted/50 text-muted-foreground text-xs px-4 py-2 rounded-lg max-w-md text-center">
          {message.content || "System notification"}
        </div>
      </div>
    );
  }

  if (isOwn) {
    return (
      <div className={cn("flex justify-end mb-4", showAvatar ? "mb-2" : "")}>
        <div className="max-w-[70%] md:max-w-[60%]">
          <div
            className={cn(
              "rounded-2xl px-4 py-2 shadow-sm",
              "bg-primary text-primary-foreground",
              isDeleted && "opacity-50"
            )}
          >
            {isDeleted ? (
              <p className="text-sm italic">Message deleted</p>
            ) : (
              <>
                {message.message_type === "image" && message.attachment_url && (
                  <img
                    src={message.attachment_url}
                    alt="Shared image"
                    className="rounded-lg mb-2 max-w-full"
                  />
                )}
                {message.message_type === "file" && message.attachment_url && (
                  <a
                    href={message.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary-foreground/20 rounded-lg p-2 mb-2"
                  >
                    <span className="text-sm truncate">
                      {message.attachment_name || "Download File"}
                    </span>
                  </a>
                )}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </>
            )}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] opacity-70">{formatTime()}</span>
            </div>
          </div>
          {!isDeleted && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 px-0 opacity-0 hover:opacity-100 transition-opacity"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-2 mb-4", showAvatar ? "mb-2" : "")}>
      {showAvatar ? (
        <Avatar
          name={message.sender?.full_name}
          src={message.sender?.avatar_url}
          size="sm"
          className="shrink-0"
        />
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className="max-w-[70%] md:max-w-[60%]">
        {!showAvatar && message.sender && (
          <p className="text-xs text-muted-foreground mb-1 ml-1">
            {message.sender.full_name}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 shadow-sm",
            "bg-card text-card-foreground border",
            isDeleted && "opacity-50"
          )}
        >
          {isDeleted ? (
            <p className="text-sm italic">Message deleted</p>
          ) : (
            <>
              {message.message_type === "image" && message.attachment_url && (
                <img
                  src={message.attachment_url}
                  alt="Shared image"
                  className="rounded-lg mb-2 max-w-full"
                />
              )}
              {message.message_type === "file" && message.attachment_url && (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-muted rounded-lg p-2 mb-2"
                >
                  <span className="text-sm truncate">
                    {message.attachment_name || "Download File"}
                  </span>
                </a>
              )}
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </>
          )}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground">{formatTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
