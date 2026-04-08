// Message Input Component for Aurora Chat System
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Image as ImageIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageInputProps {
  conversationId: string;
  onSend: (
    content: string,
    type: "text" | "image" | "file",
    attachmentUrl?: string,
    attachmentName?: string,
  ) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() || disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend(message.trim(), "text");
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = async () => {
    if (!previewImage || disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend("Shared an image", "image", previewImage, "image.jpg");
      setPreviewImage(null);
    } catch (error) {
      console.error("Failed to send image:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled || isSending) return;

    setIsSending(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSend(
          `Shared a file: ${file.name}`,
          "file",
          event.target?.result as string,
          file.name,
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to send file:", error);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="border-t bg-card p-3">
      {/* Image Preview */}
      {previewImage && (
        <div className="mb-3 relative inline-block">
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-48 rounded-lg border shadow-sm"
          />
          <Button
            variant="danger"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full px-0"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="absolute -bottom-2 -right-2 h-8 rounded-full"
            onClick={handleSendImage}
            disabled={isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-10 w-10 px-0"
              disabled={disabled || isSending}
              aria-label="Open attachment options"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  imageInputRef.current?.click();
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Document
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            aria-label="Type your chat message"
            disabled={disabled || isSending}
            className="min-h-[44px] resize-none pr-12"
          />
        </div>

        {/* Send Button */}
        <Button
          variant="primary"
          size="sm"
          className="shrink-0 h-10 w-10 px-0"
          onClick={handleSend}
          disabled={disabled || isSending || !message.trim()}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
