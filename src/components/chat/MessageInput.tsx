// MessageInput Component for Aurora Chat System
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Paperclip,
  Send,
  X,
  Smile,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import { uploadChatAttachment, getMessageTypeFromFile, validateFile } from "@/lib/chat-utils";
import { toast } from "sonner";

interface MessageInputProps {
  conversationId: string;
  onSend: (
    content: string,
    type: "text" | "image" | "file",
    attachmentUrl?: string,
    attachmentName?: string
  ) => Promise<void>;
  disabled?: boolean;
}

const EMOJIS = [
  "😀",
  "😂",
  "🥰",
  "😎",
  "👍",
  "❤️",
  "🎉",
  "🔥",
  "👏",
  "🙏",
  "💯",
  "✨",
  "👋",
  "🤔",
  "😅",
  "😢",
  "😍",
  "🤣",
  "🙌",
  "💪",
  "🎊",
  "🌟",
  "✅",
  "❌",
];

export function MessageInput({
  conversationId,
  onSend,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() && !preview) return;

    if (preview) {
      await onSend(preview.name, preview.type as "image" | "file", preview.url);
      setPreview(null);
    } else {
      await onSend(message, "text");
    }

    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setUploading(true);

    try {
      const publicUrl = await uploadChatAttachment(file, conversationId);
      const messageType = getMessageTypeFromFile(file);

      setPreview({
        url: publicUrl,
        name: file.name,
        type: messageType,
      });

      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setUploading(true);

    try {
      const publicUrl = await uploadChatAttachment(file, conversationId);

      await onSend(file.name, "image", publicUrl);
      toast.success("Image sent successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to send image");
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const removePreview = () => {
    setPreview(null);
  };

  return (
    <div className="border-t p-4 bg-background">
      {/* Preview */}
      {preview && (
        <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preview.type === "image" ? (
              <img
                src={preview.url}
                alt="Preview"
                className="h-16 w-16 object-cover rounded"
              />
            ) : (
              <div className="h-16 w-16 bg-primary/10 rounded flex items-center justify-center">
                <span className="text-2xl">📎</span>
              </div>
            )}
            <div className="max-w-[200px]">
              <p className="text-sm font-medium truncate">{preview.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {preview.type}
              </p>
            </div>
          </div>
          <button
            onClick={removePreview}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-card border border-border rounded-lg shadow-lg grid grid-cols-8 gap-2 animate-in slide-in-from-bottom-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="text-xl hover:bg-muted rounded p-1 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Attach File */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          title="Attach File"
        >
          {uploading ? (
            <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>

        {/* Send Image */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading || disabled}
          title="Send Image"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        {/* Emoji */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          title="Emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-muted/30 border-transparent focus:bg-background"
            disabled={disabled || uploading}
            rows={1}
          />
          {/* Send Button */}
          <div className="absolute right-2 bottom-2">
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md"
              disabled={(!message.trim() && !preview) || disabled || uploading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Voice Message (Coming Soon) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled
          title="Voice Message (Coming Soon)"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
