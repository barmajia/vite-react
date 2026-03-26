// MessageBubble Component for Aurora Chat System
import { Avatar } from "@/components/ui/avatar";
import { formatMessageTime } from "@/lib/chat-utils";
import type { Message } from "@/lib/chat-types";
import { Check, CheckCheck, File, Trash2 } from "lucide-react";
import { useState } from "react";

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
  showAvatar = true,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="px-4 py-2 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground italic">
            This message was deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 mb-4 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar
            name={message.sender?.full_name}
            src={message.sender?.avatar_url}
            size="sm"
          />
        </div>
      )}

      <div
        className={`flex flex-col max-w-[75%] md:max-w-[65%] ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border rounded-bl-sm"
          }`}
        >
          {/* Image Attachment */}
          {message.message_type === "image" && message.attachment_url && (
            <div className="mb-2 overflow-hidden rounded-lg">
              <img
                src={message.attachment_url}
                alt="Attachment"
                className="w-full h-auto max-w-md object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}

          {/* File Attachment */}
          {message.message_type === "file" && message.attachment_url && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                isOwn
                  ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isOwn ? "bg-primary-foreground/30" : "bg-primary/10"
                }`}
              >
                <File className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.attachment_name || "File"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Click to download
                </p>
              </div>
            </a>
          )}

          {/* Message Content */}
          {message.content && message.message_type !== "file" && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-end gap-1.5 mt-1.5">
            <span className="text-xs opacity-70">
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && (
              <>
                {message.read_at ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-70" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Delete Action */}
        {showActions && isOwn && onDelete && (
          <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
            <button
              onClick={() => onDelete(message.id)}
              className="text-xs text-destructive hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
